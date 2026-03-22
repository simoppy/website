import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import Database from "better-sqlite3";
import * as xlsx from "xlsx";
import { QUESTIONS_BANK } from "./src/constants";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// инициализация базы данных sqlite
const db = new Database("quiz.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS results (
    email TEXT PRIMARY KEY,
    last_result TEXT,
    history TEXT,
    achievements TEXT
  );
  
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    text TEXT,
    options TEXT,
    correctAnswer INTEGER,
    explanation TEXT,
    distractorLogic TEXT
  );
`);

// заполнение вопросов, если они отсутствуют или появились новые
const existingQuestions = db.prepare("SELECT text FROM questions").all() as any[];
const existingTexts = new Set(existingQuestions.map(q => q.text));

const newQuestions = QUESTIONS_BANK.filter(q => !existingTexts.has(q.text));

if (newQuestions.length > 0) {
  const insert = db.prepare(`
    INSERT INTO questions (category, text, options, correctAnswer, explanation, distractorLogic)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((questions) => {
    for (const q of questions) {
      insert.run(
        q.category,
        q.text,
        JSON.stringify(q.options),
        q.correctAnswer,
        q.explanation,
        JSON.stringify(q.distractorLogic || [])
      );
    }
  });
  
  transaction(newQuestions);
  console.log(`Added ${newQuestions.length} new questions to the database.`);
}

// Добавляем колонку achievements если её нет (для существующих БД)
try {
  db.prepare("ALTER TABLE results ADD COLUMN achievements TEXT").run();
} catch (e) {
  // Колонка уже существует
}

const ADMIN_EMAIL = "18simonmakeev164@gmail.com";

// настройка транспорта nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // не выдавать ошибку при невалидных сертификатах
    rejectUnauthorized: false,
  },
});

// хранилище кодов верификации в памяти
const codes = new Map<string, { code: string; expires: number }>();

// маршруты api
app.post("/api/results/save", (req, res) => {
  const { email, result, history, achievements } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  
  try {
    const stmt = db.prepare(`
      INSERT INTO results (email, last_result, history, achievements)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        last_result = excluded.last_result,
        history = excluded.history,
        achievements = excluded.achievements
    `);
    stmt.run(email, JSON.stringify(result), JSON.stringify(history || []), JSON.stringify(achievements || []));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save results" });
  }
});

app.get("/api/results/get/:email", (req, res) => {
  const { email } = req.params;
  try {
    const row = db.prepare("SELECT * FROM results WHERE email = ?").get(email) as any;
    if (row) {
      res.json({
        lastResult: JSON.parse(row.last_result),
        history: JSON.parse(row.history),
        achievements: row.achievements ? JSON.parse(row.achievements) : []
      });
    } else {
      res.json({ lastResult: null, history: [], achievements: [] });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

app.post("/api/auth/send-code", async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // генерация 6-значного кода
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // сохранение кода со сроком действия 5 минут
  codes.set(email, {
    code,
    expires: Date.now() + 5 * 60 * 1000,
  });

  // попытка отправить письмо, если smtp настроен
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      // использование smtp_user в качестве отправителя по умолчанию, если smtp_from не указан
      const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;
      
      await transporter.sendMail({
        from: `"Quiz System" <${fromAddress}>`,
        to: email,
        subject: "Ваш код подтверждения",
        text: `Ваш код подтверждения: ${code}. Он действителен в течение 5 минут.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
            <h2 style="color: #333;">Подтверждение входа</h2>
            <p>Используйте следующий код для входа в систему тестирования:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1; padding: 20px 0; text-align: center;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px;">Код действителен в течение 5 минут. Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
          </div>
        `,
      });
    } catch (error: any) {
      // подробная ошибка для отладки
    }
  } else {
  }
  
  res.json({ success: true, message: "Code sent successfully" });
});

app.post("/api/auth/verify-code", (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required" });
  }

  const storedData = codes.get(email);
  
  if (!storedData) {
    return res.status(400).json({ error: "No code found for this email" });
  }

  if (Date.now() > storedData.expires) {
    codes.delete(email);
    return res.status(400).json({ error: "Code has expired" });
  }

  if (storedData.code !== code) {
    return res.status(400).json({ error: "Invalid verification code" });
  }

  // код валиден, очищаем его
  codes.delete(email);

  // возвращаем объект "пользователь"
  res.json({
    success: true,
    user: {
      email,
      isGuest: false,
      id: Math.random().toString(36).substring(7),
      isAdmin: email === ADMIN_EMAIL
    }
  });
});

// api для вопросов
app.get("/api/questions", (req, res) => {
  try {
    const questions = db.prepare("SELECT * FROM questions").all() as any[];
    res.json(questions.map(q => ({
      ...q,
      options: JSON.parse(q.options),
      distractorLogic: JSON.parse(q.distractorLogic)
    })));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// промежуточное ПО для админа
const isAdmin = (req: any, res: any, next: any) => {
  const userEmail = req.headers["x-user-email"] || req.query.email;
  if (userEmail === ADMIN_EMAIL) {
    next();
  } else {
    res.status(403).json({ error: "Access denied. Admin only." });
  }
};

app.post("/api/admin/questions", isAdmin, (req, res) => {
  const { id, category, text, options, correctAnswer, explanation, distractorLogic } = req.body;
  
  try {
    if (id) {
      const stmt = db.prepare(`
        UPDATE questions 
        SET category = ?, text = ?, options = ?, correctAnswer = ?, explanation = ?, distractorLogic = ?
        WHERE id = ?
      `);
      stmt.run(category, text, JSON.stringify(options), correctAnswer, explanation, JSON.stringify(distractorLogic), id);
    } else {
      const stmt = db.prepare(`
        INSERT INTO questions (category, text, options, correctAnswer, explanation, distractorLogic)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(category, text, JSON.stringify(options), correctAnswer, explanation, JSON.stringify(distractorLogic));
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save question" });
  }
});

app.delete("/api/admin/questions/:id", isAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM questions WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete question" });
  }
});

app.get("/api/admin/stats", isAdmin, (req, res) => {
  try {
    const results = db.prepare("SELECT * FROM results").all() as any[];
    const stats = results.map(r => {
      const lastResult = JSON.parse(r.last_result);
      return {
        email: r.email,
        lastScore: lastResult?.score || 0,
        lastTotal: lastResult?.total || 0,
        testsTaken: JSON.parse(r.history).length + (lastResult ? 1 : 0)
      };
    });
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get("/api/admin/export", isAdmin, (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM results").all() as any[];
    const data = rows.flatMap(row => {
      const history = JSON.parse(row.history);
      const last = JSON.parse(row.last_result);
      const all = [...history];
      if (last) all.push(last);
      
      return all.map(res => ({
        Email: row.email,
        Score: res.score,
        Total: res.total,
        Percentage: ((res.score / res.total) * 100).toFixed(2) + "%",
        Date: new Date(res.timestamp || Date.now()).toLocaleString("ru-RU")
      }));
    });

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Results");
    
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    res.setHeader("Content-Disposition", "attachment; filename=quiz_results.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to export data" });
  }
});

// промежуточное ПО vite для разработки
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  // раздача статических файлов в продакшене
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
});
