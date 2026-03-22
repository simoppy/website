import React, { useState, useEffect, FormEvent, useMemo } from 'react';
// импорт библиотек для анимаций, иконок и графиков
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, ChevronRight, ChevronLeft, LogOut, RotateCcw, User, Zap, Shield, Terminal, Mail, Github, Send, ExternalLink, X, Copy, Check, Settings2, Plus, Minus, Play, Download, FileText, BarChart3, Trash2, Edit3, PlusCircle, Save, ChevronDown, Home, Star, Trophy, Target, CheckCircle2, Binary, GitMerge, Cpu, Workflow, Globe, Database, ShieldCheck, Braces, Crown, Activity, BookOpen, HeartPulse, RefreshCw, Clover, AlertCircle, Cloud, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
// импорт типов данных для квиза
import { QuizResult, Theme, Question, User as UserType, Achievement } from './types';
import { ACHIEVEMENTS, QUESTIONS_BANK } from './constants';

// Маппинг строковых имен иконок в компоненты Lucide
const ICON_MAP: Record<string, any> = {
  Zap,
  Star,
  Trophy,
  Target,
  CheckCircle2,
  Terminal,
  Binary,
  GitMerge,
  Cpu,
  Workflow,
  Globe,
  Database,
  ShieldCheck,
  Braces,
  Crown,
  Activity,
  BookOpen,
  HeartPulse,
  RefreshCw,
  Clover,
  AlertCircle
};

// компонент панели администратора для управления вопросами и просмотра статистики
function AdminPanel({ user, onBack, onQuestionsUpdate, allQuestions, showToast, theme }: { user: UserType, onBack: () => void, onQuestionsUpdate: () => void, allQuestions: Question[], showToast: (m: string, t?: 'success' | 'error') => void, theme: Theme }) {
  // состояние для переключения вкладок (вопросы или статистика)
  const [activeTab, setActiveTab] = useState<'questions' | 'stats'>('questions');
  // состояние для данных статистики
  const [stats, setStats] = useState<any[]>([]);
  // состояние для редактируемого вопроса
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);
  // состояние загрузки данных
  const [isLoading, setIsLoading] = useState(false);
  // состояние для выпадающего списка выбора темы
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // эффект для загрузки статистики при переключении на вкладку статистики
  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  // функция для получения статистики с сервера
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { 'x-user-email': user.email || '' }
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      showToast('Ошибка при загрузке статистики', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // сохранение или обновление вопроса
  const handleSaveQuestion = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;
    
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': user.email || ''
        },
        body: JSON.stringify(editingQuestion)
      });
      if (res.ok) {
        setEditingQuestion(null);
        onQuestionsUpdate();
        showToast('Вопрос сохранен');
      }
    } catch (err) {
      showToast('Ошибка при сохранении', 'error');
    }
  };

  // удаление вопроса по id
  const handleDeleteQuestion = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': user.email || '' }
      });
      if (res.ok) {
        onQuestionsUpdate();
        showToast('Вопрос удален');
      }
    } catch (err) {
      showToast('Ошибка при удалении', 'error');
    }
  };

  // экспорт ведомости в формате excel
  const handleExport = async () => {
    try {
      const res = await fetch(`/api/admin/export?email=${user.email}`, {
        headers: { 'x-user-email': user.email || '' }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'quiz_results.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Ведомость скачана');
    } catch (err) {
      showToast('Ошибка при экспорте', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all hover:scale-110">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-display font-bold">Панель учителя</h1>
              <p className="text-sm opacity-50">Управление контентом и статистика</p>
            </div>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-5 h-5" />
            СКАЧАТЬ ВЕДОМОСТЬ (EXCEL)
          </button>
        </div>

        <div className="flex gap-6 mb-8 border-b border-black/10 dark:border-white/10">
          <button 
            onClick={() => setActiveTab('questions')}
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative ${activeTab === 'questions' ? 'text-[var(--accent)]' : 'text-slate-400 opacity-70 hover:opacity-100'}`}
          >
            Вопросы
            {activeTab === 'questions' && <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent)] rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`pb-4 px-2 font-bold text-sm uppercase tracking-widest transition-all relative ${activeTab === 'stats' ? 'text-[var(--accent)]' : 'text-slate-400 opacity-70 hover:opacity-100'}`}
          >
            Статистика
            {activeTab === 'stats' && <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent)] rounded-t-full" />}
          </button>
        </div>

        {activeTab === 'questions' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold uppercase tracking-wider opacity-90">Все вопросы ({allQuestions.length})</h2>
              <button 
                onClick={() => setEditingQuestion({ category: '', text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', distractorLogic: ['', '', '', ''] })}
                className="btn-primary flex items-center gap-2 px-5 py-2.5"
              >
                <PlusCircle className="w-5 h-5" />
                ДОБАВИТЬ
              </button>
            </div>

            <div className="grid gap-4">
              {allQuestions.map(q => (
                <motion.div 
                   layout
                   key={q.id} 
                   className="bento-card p-6 flex flex-col md:flex-row justify-between items-start gap-6 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-[var(--accent-glow)] text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[var(--card-border)]">
                        {q.category}
                      </span>
                      <span className="text-xs opacity-30 font-mono">#ID_{q.id}</span>
                    </div>
                    <h3 className="text-lg font-medium mb-4 leading-relaxed">{q.text}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`p-3 rounded-xl border text-sm transition-all ${i === q.correctAnswer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold' : 'bg-black/5 dark:bg-white/5 border-transparent opacity-70'}`}>
                          <span className="mr-2 opacity-60">{i + 1}.</span> {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => setEditingQuestion(q)}
                      className="p-3 bg-[var(--accent-glow)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--text-on-accent)] rounded-xl transition-all"
                      title="Редактировать"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                      title="Удалить"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bento-card overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/5 dark:bg-white/5">
                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold opacity-80">Ученик</th>
                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold opacity-80 text-center">Тестов</th>
                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold opacity-80 text-center">Последний балл</th>
                    <th className="p-6 text-[10px] uppercase tracking-widest font-bold opacity-80 text-center">Успеваемость</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {stats.map((s, i) => (
                    <tr key={i} className="hover:bg-[var(--accent-glow)] transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform">
                            <User className="w-5 h-5" />
                          </div>
                          <span className="font-medium">{s.email}</span>
                        </div>
                      </td>
                      <td className="p-6 text-center font-mono opacity-60">{s.testsTaken}</td>
                      <td className="p-6 text-center">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg font-bold font-mono">
                          {s.lastScore}/{s.lastTotal}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[var(--accent)]" 
                              style={{ width: `${Math.round((s.lastScore / s.lastTotal) * 100) || 0}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[var(--accent)]">
                            {Math.round((s.lastScore / s.lastTotal) * 100) || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center opacity-40 italic">Данных пока нет</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AnimatePresence>
          {editingQuestion && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingQuestion(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-[var(--bg-primary)] w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden border border-white/10"
              >
                <form onSubmit={handleSaveQuestion} className="p-8 sm:p-10">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-3xl font-display font-bold">{editingQuestion.id ? 'Редактирование' : 'Новый вопрос'}</h3>
                      <p className="text-sm opacity-50">Заполните все поля внимательно</p>
                    </div>
                    <button type="button" onClick={() => setEditingQuestion(null)} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold opacity-60 tracking-widest ml-1">Категория</label>
                        <input 
                          required
                          placeholder="Напр: Системы счисления"
                          value={editingQuestion.category}
                          onChange={e => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                          style={{ backgroundColor: theme === 'light' ? '#ffffff' : undefined }}
                          className="w-full p-4 bg-white dark:bg-white/5 border border-transparent focus:border-[var(--accent)]/50 rounded-2xl outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold opacity-60 tracking-widest ml-1">Верный ответ (индекс 0-3)</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setIsSelectOpen(!isSelectOpen)}
                            style={{ backgroundColor: theme === 'light' ? '#ffffff' : undefined }}
                            className="w-full p-4 bg-white dark:bg-white/5 border border-transparent focus:border-[var(--accent)]/50 rounded-2xl outline-none transition-all text-left flex justify-between items-center"
                          >
                            <span className="font-medium">Вариант {(editingQuestion.correctAnswer ?? 0) + 1}</span>
                            <ChevronDown size={18} className={`transition-transform opacity-60 ${isSelectOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isSelectOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[190]" 
                                  onClick={() => setIsSelectOpen(false)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden"
                                >
                                  {[0, 1, 2, 3].map(i => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => {
                                        setEditingQuestion({ ...editingQuestion, correctAnswer: i });
                                        setIsSelectOpen(false);
                                      }}
                                      className={`w-full p-4 text-left text-sm font-bold transition-all hover:bg-[var(--accent-glow)] ${editingQuestion.correctAnswer === i ? 'bg-[var(--accent)] text-[var(--text-on-accent)]' : 'opacity-70 hover:opacity-100'}`}
                                    >
                                      Вариант {i + 1}
                                    </button>
                                  ))}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold opacity-60 tracking-widest ml-1">Текст вопроса</label>
                      <textarea 
                        required
                        placeholder="Введите условие задачи..."
                        value={editingQuestion.text}
                        onChange={e => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                        style={{ backgroundColor: theme === 'light' ? '#ffffff' : undefined }}
                        className="w-full p-4 bg-white dark:bg-white/5 border border-transparent focus:border-[var(--accent)]/50 rounded-2xl outline-none transition-all h-28 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {editingQuestion.options?.map((opt, i) => (
                        <div key={i} className="space-y-2">
                          <label className={`text-[10px] uppercase font-bold tracking-widest ml-1 ${i === editingQuestion.correctAnswer ? 'text-emerald-500' : 'opacity-60'}`}>
                            Вариант {i + 1} {i === editingQuestion.correctAnswer && '✓'}
                          </label>
                          <input 
                            required
                            placeholder={`Вариант ответа ${i + 1}`}
                            value={opt}
                            onChange={e => {
                              const newOpts = [...(editingQuestion.options || [])];
                              newOpts[i] = e.target.value;
                              setEditingQuestion({ ...editingQuestion, options: newOpts });
                            }}
                            style={{ backgroundColor: theme === 'light' ? '#ffffff' : undefined }}
                            className={`w-full p-4 bg-white dark:bg-white/5 border-2 rounded-2xl outline-none transition-all ${i === editingQuestion.correctAnswer ? 'border-emerald-500/30' : 'border-transparent focus:border-[var(--accent)]/50'}`}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold opacity-60 tracking-widest ml-1">Объяснение (правильный ответ)</label>
                      <textarea 
                        required
                        placeholder="Почему этот ответ верный?"
                        value={editingQuestion.explanation}
                        onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                        style={{ backgroundColor: theme === 'light' ? '#ffffff' : undefined }}
                        className="w-full p-4 bg-white dark:bg-white/5 border border-transparent focus:border-[var(--accent)]/50 rounded-2xl outline-none transition-all h-24 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold opacity-60 tracking-widest ml-1">Логика ошибок (дистракторы)</label>
                      <div className="space-y-3">
                        {editingQuestion.distractorLogic?.map((logic, i) => (
                          <div key={i} className="flex gap-3 items-center">
                            <span className="w-6 h-6 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                            <input 
                              placeholder={`Почему вариант ${i + 1} неверный?`}
                              value={logic}
                              onChange={e => {
                                const newLogic = [...(editingQuestion.distractorLogic || [])];
                                newLogic[i] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, distractorLogic: newLogic });
                              }}
                              style={{ backgroundColor: theme === 'light' ? '#ffffff' : undefined }}
                              className="flex-1 p-3 bg-white dark:bg-white/5 border border-transparent focus:border-[var(--accent)]/50 rounded-xl outline-none transition-all text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button 
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="flex-1 py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-2xl font-bold transition-all"
                    >
                      ОТМЕНА
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-4 bg-[var(--accent)] text-[var(--text-on-accent)] rounded-2xl font-bold shadow-xl shadow-[var(--accent-glow)] transition-all hover:scale-[1.02]"
                    >
                      СОХРАНИТЬ
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// основной компонент приложения
export default function App() {
  // состояние текущего экрана (старт, тест, результат, настройки, админка, достижения)
  const [view, setView] = useState<'start' | 'quiz' | 'result' | 'config' | 'admin' | 'achievements'>('start');
  // состояние авторизованного пользователя
  const [user, setUser] = useState<UserType | null>(null);
  // текущий шаг авторизации (ввод почты или кода)
  const [authStep, setAuthStep] = useState<'email' | 'code'>('email');
  // вводные данные для авторизации
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  // состояния загрузки и ошибок авторизации
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // все вопросы из базы
  const [questions, setQuestions] = useState<Question[]>([]);
  // вопросы, выбранные для текущего теста
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  // индекс текущего вопроса в тесте
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // ответы пользователя (индекс вопроса -> индекс ответа)
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // системные настройки
  const [theme, setTheme] = useState<Theme>('dark');
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // функция для показа уведомлений
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // состояние для копирования (id элемента)
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // выбранные темы для кастомного теста
  const [selectedTopics, setSelectedTopics] = useState<Record<string, number>>({});

  // список уникальных категорий вопросов
  const categories = useMemo(() => Array.from(new Set(questions.map(q => q.category))), [questions]);
  // статистика количества вопросов по категориям
  const categoryStats = useMemo(() => categories.reduce((acc, cat) => {
    acc[cat] = questions.filter(q => q.category === cat).length;
    return acc;
  }, {} as Record<string, number>), [categories, questions]);

  // загрузка вопросов с сервера
  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
    }
  };

  // инициализация приложения
  useEffect(() => {
    fetchQuestions();
    
    try {
      // загрузка темы из локального хранилища
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) setTheme(savedTheme);
      
      // загрузка пользователя из локального хранилища
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // если пользователь не гость, загружаем его историю результатов
        if (!parsedUser.isGuest && parsedUser.email) {
          fetch(`/api/results/get/${parsedUser.email}`)
            .then(res => {
              if (!res.ok) throw new Error('Server error');
              return res.json();
            })
            .then(data => {
              if (data.lastResult) setLastResult(data.lastResult);
              if (data.history) setHistory(data.history);
              if (data.achievements) {
                setUser(prev => prev ? { ...prev, achievements: data.achievements } : null);
              }
            })
            .catch(err => {});
        }
      }
    } catch (err) {
    }
  }, []);

  // инициализация выбранных тем при загрузке категорий
  useEffect(() => {
    if (categories.length > 0 && Object.keys(selectedTopics).length === 0) {
      const initialTopics: Record<string, number> = {};
      categories.forEach(cat => initialTopics[cat] = 0);
      setSelectedTopics(initialTopics);
    }
  }, [categories]);

  // применение темы к документу
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // переключение темы
  const handleToggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  // отправка кода на email
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code');
      }
      
      setAuthStep('code');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // проверка кода верификации
  const verifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, code: codeInput }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }
      
      const newUser = data.user;
      setUser(newUser);
      setLastResult(null);
      setHistory([]);
      localStorage.setItem('user', JSON.stringify(newUser));

      // получение результатов с сервера при входе
      fetch(`/api/results/get/${newUser.email}`)
        .then(res => {
          if (!res.ok) throw new Error('Server error');
          return res.json();
        })
        .then(data => {
          if (data.lastResult) setLastResult(data.lastResult);
          if (data.history) setHistory(data.history);
        })
        .catch(err => {});
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // вход в качестве гостя
  const loginAsGuest = () => {
    const newUser = { isGuest: true };
    setUser(newUser);
    setLastResult(null);
    setHistory([]);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // выход из аккаунта
  const handleLogout = () => {
    setUser(null);
    setHistory([]);
    setLastResult(null);
    setAuthStep('email');
    setEmailInput('');
    setCodeInput('');
    setView('start');
    localStorage.removeItem('user');
  };

  // запуск теста (обычного или кастомного)
  const startQuiz = (isCustom = false) => {
    let selected: Question[] = [];
    const bank = questions;

    if (isCustom) {
      // проверка, выбрана ли хотя бы одна тема
      const hasSelection = Object.values(selectedTopics).some(count => (count as number) > 0);
      if (!hasSelection) {
        showToast('Выберите хотя бы одну тему', 'error');
        return;
      }

      // выбор вопросов по каждой теме
      Object.entries(selectedTopics).forEach(([category, count]) => {
        const numCount = count as number;
        if (numCount > 0) {
          const categoryQuestions = bank.filter(q => q.category === category);
          const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
          selected.push(...shuffled.slice(0, numCount));
        }
      });
      
      // перемешивание итогового списка
      selected = selected.sort(() => 0.5 - Math.random());
    } else {
      // выбираем 10 случайных вопросов из общего банка
      const shuffled = [...bank].sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, 10);
    }
    
    setCurrentQuestions(selected);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setView('quiz');
  };

  // сохранение ответа пользователя
  const handleAnswer = (optionIdx: number) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      newAnswers[currentQuestionIndex] = optionIdx;
      return newAnswers;
    });
  };

  // копирование текста в буфер обмена
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // генерация сертификата в формате pdf
  const generateCertificate = () => {
    if (!lastResult || !user) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 4; // высокое разрешение для печати
    canvas.width = 297 * scale;
    canvas.height = 210 * scale;

    // отрисовка фонового градиента
    const bgGradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // декоративный узор из точек
    ctx.fillStyle = '#e2e8f0';
    for (let i = 0; i < canvas.width; i += 20 * scale) {
      for (let j = 0; j < canvas.height; j += 20 * scale) {
        ctx.beginPath();
        ctx.arc(i, j, 0.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const primaryColor = '#4f46e5'; // основной цвет (индиго)
    const secondaryColor = '#fbbf24'; // акцентный цвет (янтарный)
    const textColor = '#1e293b'; // цвет текста

    // отрисовка рамок сертификата
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 4 * scale;
    ctx.strokeRect(15 * scale, 15 * scale, 267 * scale, 180 * scale);
    
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(18 * scale, 18 * scale, 261 * scale, 174 * scale);

    // отрисовка уголков
    const cornerSize = 15 * scale;
    ctx.fillStyle = primaryColor;
    ctx.fillRect(15 * scale, 15 * scale, cornerSize, cornerSize);
    ctx.fillRect(canvas.width - 15 * scale - cornerSize, 15 * scale, cornerSize, cornerSize);
    ctx.fillRect(15 * scale, canvas.height - 15 * scale - cornerSize, cornerSize, cornerSize);
    ctx.fillRect(canvas.width - 15 * scale - cornerSize, canvas.height - 15 * scale - cornerSize, cornerSize, cornerSize);

    // добавление текстового контента
    ctx.textAlign = 'center';
    
    // заголовок сертификата
    ctx.fillStyle = primaryColor;
    ctx.font = `bold ${12 * scale}px "Inter", sans-serif`;
    ctx.fillText('СЕРТИФИКАТ ДОСТИЖЕНИЙ', canvas.width / 2, 50 * scale);

    // подзаголовок
    ctx.fillStyle = textColor;
    ctx.font = `bold ${5 * scale}px "Inter", sans-serif`;
    ctx.fillText('В ОБЛАСТИ ИНФОРМАЦИОННЫХ ТЕХНОЛОГИЙ', canvas.width / 2, 65 * scale);

    // декоративный разделитель
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 0.5 * scale;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 40 * scale, 75 * scale);
    ctx.lineTo(canvas.width / 2 + 40 * scale, 75 * scale);
    ctx.stroke();

    // основной текст
    ctx.fillStyle = textColor;
    ctx.font = `${4 * scale}px "Inter", sans-serif`;
    ctx.fillText('Настоящим документом официально подтверждается, что', canvas.width / 2, 95 * scale);

    // имя пользователя
    ctx.fillStyle = primaryColor;
    ctx.font = `bold ${10 * scale}px "Inter", sans-serif`;
    ctx.fillText(user.isGuest ? 'Гость' : user.email || 'Пользователь', canvas.width / 2, 115 * scale);

    // описание достижений
    ctx.fillStyle = textColor;
    ctx.font = `${4 * scale}px "Inter", sans-serif`;
    const lines = [
    'продемонстрировал(а) отличные знания в ходе комплексного тестирования',
    'по дисциплине "Информатика", показав высокий уровень подготовки при',
    'выполнении практических кейсов и решении профильных задач.'
      ];
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, 135 * scale + (i * 6 * scale));
    });

    // блок со статистикой и оценкой
    const boxY = 165 * scale;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(canvas.width / 2 - 60 * scale, boxY - 10 * scale, 120 * scale, 20 * scale);
    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(canvas.width / 2 - 60 * scale, boxY - 10 * scale, 120 * scale, 20 * scale);

    ctx.fillStyle = textColor;
    ctx.font = `bold ${4 * scale}px "Inter", sans-serif`;
    ctx.fillText(`Результат: ${lastResult.score} / ${lastResult.total} (${lastResult.percentage}%)`, canvas.width / 2, boxY);
    ctx.font = `bold ${5 * scale}px "Inter", sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText(`ИТОГОВАЯ ОЦЕНКА: ${lastResult.grade}`, canvas.width / 2, boxY + 8 * scale);

    // декоративная печать автора
    const sealX = 240 * scale;
    const sealY = 160 * scale;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 15 * scale, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${4 * scale}px "Inter", sans-serif`;
    
    ctx.fillText('SIMOPPY', sealX, sealY - 2 * scale);
    ctx.fillText('VERIFIED', sealX, sealY + 3 * scale);

    // подвал сертификата
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748b';
    ctx.font = `${2.8 * scale}px "Inter", sans-serif`;
    ctx.fillText(`Дата выдачи: ${lastResult.date}`, 33 * scale, 182 * scale);
    ctx.fillText(`ID сертификата: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 33 * scale, 189 * scale);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'blue';
    ctx.font = `${3.5 * scale}px "Inter", sans-serif`;
    ctx.fillText('http://simoppy.ru/', 265 * scale, 185 * scale);

    // добавление изображения холста в pdf
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, 297, 210);
    doc.save(`certificate_${user.email || 'guest'}.pdf`);
  };

  const topicChartData = useMemo(() => {
    if (!lastResult?.topicStats) return [];
    return Object.entries(lastResult.topicStats).map(([name, stats]: [string, any]) => ({
      name,
      errorPercentage: Math.round((stats.errors / stats.total) * 100),
      errorCount: stats.errors,
      total: stats.total
    }));
  }, [lastResult]);

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = () => {
    if (currentQuestions.length === 0) {
      setView('start');
      return;
    }

    let score = 0;
    currentQuestions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / currentQuestions.length) * 100);
    let grade = '';
    if (percentage >= 90) grade = '5';
    else if (percentage >= 75) grade = '4';
    else if (percentage >= 60) grade = '3';
    else grade = '2';

    // расчет статистики по темам для этого запуска
    const topicStats: Record<string, { total: number; errors: number }> = {};
    currentQuestions.forEach((q, index) => {
      if (!topicStats[q.category]) {
        topicStats[q.category] = { total: 0, errors: 0 };
      }
      topicStats[q.category].total++;
      if (answers[index] !== q.correctAnswer) {
        topicStats[q.category].errors++;
      }
    });

    const result: QuizResult = {
      score,
      total: currentQuestions.length,
      percentage,
      grade,
      date: new Date().toLocaleString(),
      topicStats
    };

    // Проверка достижений
    const newAchievements: string[] = [];
    const currentAchievements = user?.achievements || [];
    
    if (user && !user.isGuest) {
      ACHIEVEMENTS.forEach(achievement => {
        if (!currentAchievements.includes(achievement.id)) {
          if (achievement.condition(result, history, currentQuestions)) {
            newAchievements.push(achievement.id);
          }
        }
      });
    }

    const updatedResult = { ...result, newAchievements };
    setLastResult(updatedResult);
    
    if (user && !user.isGuest && user.email) {
      const newHistory = [result, ...history].slice(0, 10);
      setHistory(newHistory);
      
      const updatedAchievements = [...currentAchievements, ...newAchievements];
      if (newAchievements.length > 0) {
        setUser(prev => prev ? { ...prev, achievements: updatedAchievements } : null);
        localStorage.setItem('quiz_user', JSON.stringify({ ...user, achievements: updatedAchievements }));
        
        // Показываем уведомление о первом новом достижении (или всех по очереди)
        newAchievements.forEach((id, idx) => {
          const ach = ACHIEVEMENTS.find(a => a.id === id);
          setTimeout(() => {
            showToast(`Получено достижение: ${ach?.title}`, 'success');
          }, 1000 + idx * 2000);
        });
      }

      // сохранение на сервер
      fetch('/api/results/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          result: updatedResult, 
          history: newHistory,
          achievements: updatedAchievements
        }),
      }).catch(err => {});
    }

    setView('result');

    if (grade === '5') {
      const confettiColors = theme === 'dark' ? ['#FFDE00', '#000000', '#ffffff'] : ['#059669', '#ffffff', '#064E3B'];
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: confettiColors
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 min-h-screen flex flex-col">
      {/* заголовок приложения с логотипом и кнопками управления */}
      <header className="flex justify-between items-center mb-16 animate-fade-up">
        <div className="flex items-center gap-4">
          {/* логотип-кнопка для возврата на главную */}
          <button
            onClick={() => setView('start')}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-on-accent)] font-bold text-2xl shadow-lg hover:opacity-80 transition-all"
            style={{ backgroundColor: 'var(--accent)' }}
            title="На главную"
          >
            <Terminal size={28} />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight leading-none uppercase">ИНФОРМАТИКА</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-bold mt-1">Макеев Семён, ИСиП-1-25</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* кнопка админки (только для учителей) */}
          {user?.isAdmin && (
            <button
              onClick={() => {
                setView('admin');
              }}
              className="w-12 h-12 rounded-xl bento-card hover:opacity-80 transition-all flex items-center justify-center !p-0 text-[var(--accent)]"
              title="Панель учителя"
            >
              <Shield size={20} />
            </button>
          )}
          {/* блок информации о пользователе и кнопка выхода */}
          {user && (
            <div className="flex items-center gap-3 mr-2 h-12 px-3 rounded-xl bento-card !p-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--text-on-accent)] shadow-lg ml-3">
                <User size={16} />
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] uppercase font-bold opacity-40 leading-none mb-0.5">Пользователь</p>
                <p className="text-[11px] font-bold truncate max-w-[100px]">
                  {user.isGuest ? 'Гость' : user.email}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="ml-1 p-2 sm:p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors mr-2"
                title="Выйти"
              >
                <LogOut size={18} className="sm:size-[14px]" />
              </button>
            </div>
          )}
          {/* кнопка переключения темы */}
          <button
            onClick={handleToggleTheme}
            className="w-12 h-12 rounded-xl bento-card hover:opacity-80 transition-all flex items-center justify-center !p-0"
            title={theme === 'light' ? 'Переключить на темную тему' : 'Переключить на светлую тему'}
          >
            {theme === 'light' ? (
              <Moon size={20} className="text-[var(--accent)]" />
            ) : (
              <Sun size={20} className="text-[var(--accent)]" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* экран авторизации */}
          {!user ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-md"
            >
              <div className="bento-card flex flex-col gap-8 p-10">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-3xl bg-[var(--accent)] text-[var(--text-on-accent)] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[var(--accent-glow)]">
                    <Shield size={40} />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-2">Авторизация</h2>
                  <p className="opacity-50 text-sm mb-6">Войдите, чтобы получить доступ ко всем функциям системы</p>
                </div>

                <div className="flex flex-col gap-4">
                  {authError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
                      {authError}
                    </div>
                  )}
                  {/* шаг 1: ввод email */}
                  {authStep === 'email' ? (
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="Ваша почта"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-[var(--accent)] outline-none transition-all font-medium"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isAuthLoading ? 'ОТПРАВКА...' : 'ПОЛУЧИТЬ КОД'}
                        {!isAuthLoading && <ChevronRight size={20} />}
                      </button>
                    </form>
                  ) : (
                    /* шаг 2: ввод кода */
                    <form onSubmit={verifyCode} className="flex flex-col gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Код из письма"
                          value={codeInput}
                          onChange={(e) => setCodeInput(e.target.value)}
                          className="w-full px-4 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-[var(--accent)] outline-none transition-all font-medium placeholder:tracking-normal tracking-[0.5em] text-center"
                        />
                      </div>
                      
                      <div className="text-center space-y-2">
                        <p className="text-[10px] opacity-40 font-medium">
                          Если не приходит письмо, проверьте папку <span className="font-bold">Спам</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => handleLogin(e as any)}
                          disabled={isAuthLoading}
                          className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest hover:underline disabled:opacity-30"
                        >
                          Отправить снова
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setAuthStep('email')}
                          className="flex-1 px-4 py-4 rounded-2xl border-2 border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
                        >
                          Назад
                        </button>
                        <button
                          type="submit"
                          disabled={isAuthLoading}
                          className="flex-[2] btn-primary flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {isAuthLoading ? 'ПРОВЕРКА...' : 'ВОЙТИ'}
                          {!isAuthLoading && <Check size={20} />}
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-black/5 dark:border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold opacity-60">
                      <span className="bg-[var(--card-bg)] px-4">ИЛИ</span>
                    </div>
                  </div>

                  {/* кнопка гостевого входа */}
                  <button
                    onClick={loginAsGuest}
                    className="w-full py-4 px-6 rounded-2xl border-2 border-dashed border-black/20 dark:border-white/40 hover:border-[var(--accent)] hover:bg-[var(--accent-glow)] transition-all font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 group text-center"
                  >
                    <span>Продолжить как гость</span>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform shrink-0" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : view === 'admin' && user?.isAdmin ? (
            /* экран панели администратора */
            <AdminPanel 
              user={user as UserType} 
              onBack={() => setView('start')} 
              onQuestionsUpdate={fetchQuestions}
              allQuestions={questions}
              showToast={showToast}
              theme={theme}
            />
          ) : view === 'start' ? (
            /* главный экран (старт) */
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-6 gap-6 w-full"
            >
              {/* основной блок с приветствием */}
              <div className="md:col-span-4 bento-card flex flex-col justify-center py-20 relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-all duration-700 pointer-events-none" style={{ backgroundColor: 'var(--accent)' }}></div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 tracking-tight leading-[1.1]">
                  Интеллектуальная <br /> <span style={{ color: 'var(--accent)' }}>система</span> тестирования
                </h2>
                <p className="text-xl opacity-60 mb-10 max-w-xl leading-relaxed">
                  Профессиональная среда для проверки знаний. Bento Grid интерфейс, мгновенная аналитика и безупречная эстетика.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-fit">
                  <button
                    onClick={() => startQuiz(false)}
                    className="btn-primary w-full sm:w-fit flex items-center justify-center gap-3 px-8"
                  >
                    БЫСТРЫЙ ТЕСТ <ChevronRight size={24} />
                  </button>
                  <button
                    onClick={() => setView('config')}
                    className="w-full sm:w-fit flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border-2 border-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all font-bold uppercase tracking-widest text-sm"
                  >
                    НАСТРОИТЬ ТЕМЫ <Settings2 size={22} />
                  </button>
                </div>
              </div>

              {/* боковые блоки с информацией */}
              <div className="md:col-span-2 flex flex-col gap-6">
                {/* блок достижений (информационный) */}
                <button 
                  onClick={() => setView('achievements')}
                  className="bento-card flex-grow flex flex-col animate-fade-up group cursor-pointer hover:border-[var(--accent)] transition-all text-left" 
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-[var(--accent-glow)] text-[var(--accent)] group-hover:scale-110 transition-transform">
                      <Trophy size={20} />
                    </div>
                    <h3 className="font-bold text-sm uppercase tracking-widest">Достижения</h3>
                  </div>
                  <p className="text-sm opacity-50 mb-4 flex-grow">
                    {user?.isGuest 
                      ? 'Для достижений войдите в аккаунт' 
                      : 'Отслеживайте свои успехи и получайте награды за прохождение тестов.'}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex gap-2">
                      {ACHIEVEMENTS.slice(0, 3).map((a, i) => {
                        const Icon = ICON_MAP[a.icon] || Zap;
                        const isEarned = user?.achievements?.includes(a.id);
                        return (
                          <div 
                            key={i} 
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEarned ? '' : 'grayscale opacity-40'}`}
                            style={{ backgroundColor: a.color, color: 'white' }}
                          >
                            <Icon size={14} />
                          </div>
                        );
                      })}
                      {ACHIEVEMENTS.length > 3 && (
                        <div className="w-8 h-8 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold">
                          +{ACHIEVEMENTS.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest group-hover:underline">Смотреть все</span>
                  </div>
                </button>
                
                {/* блок истории (если есть результаты) */}
                {user && !user.isGuest && history.length > 0 ? (
                  <div className="bento-card flex-grow flex flex-col justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-4 rounded-2xl w-fit" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        <RotateCcw size={28} />
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">{history.length}</span>
                        <p className="text-[10px] uppercase font-bold opacity-30">Тестов</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">История</h3>
                    <div className="flex flex-col gap-2">
                      {history.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-black/5 dark:bg-white/5">
                          <span className="opacity-50">{item.date.split(',')[0]}</span>
                          <span className={`font-bold ${item.grade === '5' ? 'text-emerald-500' : item.grade === '2' ? 'text-red-500' : 'text-[var(--accent)]'}`}>
                            Оценка: {item.grade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* блок безопасности (если истории нет) */
                  <div className="bento-card flex-grow flex flex-col justify-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <div className="p-4 rounded-2xl w-fit mb-4" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent)' }}>
                      <Cloud size={28} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Cloud Sync</h3>
                    <p className="text-sm opacity-50">Надежное облачное хранение данных и доступ с любого устройства.</p>
                  </div>
                )}
              </div>

              {/* блок с информацией об авторе */}
              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="md:col-span-3 bento-card flex items-center gap-4 animate-fade-up cursor-pointer group hover:border-[var(--accent)] transition-all text-left w-full" 
                style={{ animationDelay: '0.3s' }}
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-0.5">Автор проекта</p>
                  <p className="font-bold text-2xl group-hover:text-[var(--accent)] transition-colors leading-tight">Макеев Семён</p>
                  <p className="text-[11px] opacity-50 font-medium">Группа ИСиП-1-25</p>
                </div>
              </button>

              {/* блок с последним результатом */}
              <div className="md:col-span-3 bento-card flex items-center justify-between animate-fade-up group hover:border-[var(--accent)] transition-all" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-0.5">Последний результат</p>
                    <p className="font-bold text-2xl">
                      {lastResult ? `${lastResult.percentage}%` : '---'}
                    </p>
                  </div>
                </div>
                {lastResult && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-0.5">Оценка</p>
                    <p className="text-4xl font-display font-bold" style={{ color: 'var(--accent)' }}>{lastResult.grade}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : view === 'config' ? (
            /* экран настройки кастомного теста */
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-5xl flex flex-col gap-8"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">Настройка теста</h2>
                  <p className="opacity-60">Выберите темы и количество вопросов для каждой из них</p>
                </div>
                <button
                  onClick={() => setView('start')}
                  className="p-4 rounded-2xl bento-card hover:opacity-80 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* сетка категорий для выбора количества вопросов */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div key={cat} className="bento-card h-full flex flex-col gap-6 group hover:border-[var(--accent)]/30 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="p-3 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)]">
                        <Terminal size={20} />
                      </div>
                      <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                        Доступно: {categoryStats[cat]}
                      </span>
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold mb-1 leading-tight">{cat}</h3>
                      <p className="text-xs opacity-40">Вопросы по данной категории</p>
                    </div>

                    {/* контроллер количества вопросов */}
                    <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-2xl border border-black/5 dark:border-white/5">
                      <button
                        onClick={() => setSelectedTopics(prev => ({ ...prev, [cat]: Math.max(0, (prev[cat] || 0) - 1) }))}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={categoryStats[cat]}
                        value={selectedTopics[cat] || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setSelectedTopics(prev => ({ 
                            ...prev, 
                            [cat]: Math.min(categoryStats[cat], Math.max(0, val)) 
                          }));
                        }}
                        className="text-xl font-mono font-bold w-16 text-center bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setSelectedTopics(prev => ({ ...prev, [cat]: Math.min(categoryStats[cat], (prev[cat] || 0) + 1) }))}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* итоговая панель запуска */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-8 p-8 bento-card border-2 border-[var(--accent)]/20">
                <div className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-widest opacity-40 font-bold">Итого выбрано</p>
                  <p className="text-3xl font-display font-bold">
                    {Object.values(selectedTopics).reduce((a, b) => (a as number) + (b as number), 0) as number} <span className="text-lg opacity-40 font-sans">вопросов</span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      const reset: Record<string, number> = {};
                      categories.forEach(c => reset[c] = 0);
                      setSelectedTopics(reset);
                    }}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all font-bold uppercase tracking-widest text-sm sm:text-xs"
                  >
                    Сбросить
                  </button>
                  <button
                    onClick={() => startQuiz(true)}
                    className="w-full sm:w-auto btn-primary flex items-center justify-center gap-3 px-8 sm:px-12"
                  >
                    ЗАПУСТИТЬ <Play size={20} fill="currentColor" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : view === 'quiz' ? (
            /* экран прохождения теста */
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-4xl flex flex-col gap-8"
            >
              {/* прогресс-бар прохождения */}
              <div className="w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap" style={{ backgroundColor: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {currentQuestions[currentQuestionIndex].category}
                </span>
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6">
                  <p className="text-[10px] sm:text-sm font-mono opacity-60 whitespace-nowrap">Вопрос {currentQuestionIndex + 1} / {currentQuestions.length}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      finishQuiz();
                    }}
                    className="relative z-[70] flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-red-500/40 text-red-500 hover:bg-red-500/10 transition-all font-bold uppercase tracking-widest text-[9px] sm:text-[10px] active:scale-95 cursor-pointer shadow-sm shrink-0"
                  >
                    <RotateCcw size={14} /> Завершить
                  </button>
                </div>
              </div>

              {/* блок вопроса */}
              <div className="bento-card min-h-[160px] sm:min-h-[200px] flex items-center relative overflow-hidden p-6 sm:p-10">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: 'var(--accent)' }}></div>
                <p className="text-xl sm:text-3xl md:text-4xl font-display font-bold leading-tight">
                  {currentQuestions[currentQuestionIndex].text}
                </p>
              </div>

              {/* варианты ответов */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {currentQuestions[currentQuestionIndex].options.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`answer-btn p-5 sm:p-8 ${answers[currentQuestionIndex] === idx ? 'selected' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${
                      answers[currentQuestionIndex] === idx ? 'text-[var(--text-on-accent)]' : 'bg-black/5 dark:bg-white/5 opacity-40'
                    }`} style={answers[currentQuestionIndex] === idx ? { backgroundColor: 'var(--accent)' } : {}}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-xl font-medium">{option}</span>
                  </div>
                ))}
              </div>

              {/* навигация по вопросам */}
              <div className="flex justify-between items-center mt-10">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center gap-2 px-8 py-4 rounded-2xl bento-card transition-all ${
                    currentQuestionIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-80'
                  }`}
                >
                  <ChevronLeft size={22} /> Назад
                </button>

                <button
                  onClick={nextQuestion}
                  disabled={answers[currentQuestionIndex] === undefined}
                  className={`flex items-center gap-2 px-10 py-4 btn-primary ${
                    answers[currentQuestionIndex] === undefined ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  {currentQuestionIndex === currentQuestions.length - 1 ? 'ЗАВЕРШИТЬ' : 'ДАЛЕЕ'} <ChevronRight size={22} />
                </button>
              </div>
            </motion.div>
          ) : view === 'result' && lastResult ? (
            /* экран результатов теста */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-5xl"
            >
              {/* левая колонка: основной результат и прогресс-круг */}
              <div className="md:col-span-7 bento-card flex flex-col items-center justify-center py-16 text-center">
                <h2 className="text-4xl font-display font-bold mb-12">Результаты теста</h2>
                
                <div className="relative w-64 h-64 mb-12">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="128"
                      cy="128"
                      r="110"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="transparent"
                      className="opacity-5"
                    />
                    <motion.circle
                      cx="128"
                      cy="128"
                      r="110"
                      stroke="var(--accent)"
                      strokeWidth="16"
                      fill="transparent"
                      strokeDasharray={691.15}
                      initial={{ strokeDashoffset: 691.15 }}
                      animate={{ strokeDashoffset: 691.15 - (691.15 * lastResult.percentage) / 100 }}
                      transition={{ duration: 2, ease: "circOut" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-display font-bold">{lastResult.percentage}%</span>
                    <span className="text-xs uppercase tracking-widest opacity-60 font-bold">Accuracy</span>
                  </div>
                </div>

                <div className="flex gap-8 sm:gap-12">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold">{lastResult.score}</p>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-60 font-bold">Правильно</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold">{lastResult.total - lastResult.score}</p>
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-60 font-bold">Ошибки</p>
                  </div>
                </div>
              </div>

              {/* правая колонка: статистика по темам и оценка */}
              <div className="md:col-span-5 flex flex-col gap-6">
                {/* график ошибок по темам */}
                {topicChartData.length > 0 && (
                  <div className="bento-card p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-[var(--accent-glow)] text-[var(--accent)]">
                        <BarChart3 size={18} />
                      </div>
                      <h3 className="font-bold text-sm uppercase tracking-widest">Ошибки по темам (%)</h3>
                    </div>
                    <div className="w-full" style={{ height: Math.max(100, topicChartData.length * 45) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topicChartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const isZero = data.errorCount === 0;
                                return (
                                  <div className="bg-[var(--card-bg)] border border-white/10 p-3 rounded-xl shadow-2xl text-xs">
                                    <p className="font-bold mb-1">{label}</p>
                                    <p style={{ color: isZero ? '#10b981' : 'var(--accent)' }}>
                                      Ошибок: {data.errorCount}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="errorPercentage" radius={[0, 4, 4, 0]}>
                            {topicChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.errorPercentage > 50 ? '#ef4444' : entry.errorPercentage > 0 ? '#f59e0b' : '#10b981'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* блок итоговой оценки */}
                <div className="bento-card flex-grow flex flex-col items-center justify-center text-center py-12">
                  <p className="text-xs uppercase tracking-widest opacity-60 font-bold mb-4">Итоговая оценка</p>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                    className="text-9xl font-display font-bold mb-4"
                    style={{ color: 'var(--accent)' }}
                  >
                    {lastResult.grade}
                  </motion.div>
                  <p className="text-xl font-medium opacity-60">
                    {lastResult.grade === '5' ? 'Превосходно!' : 
                     lastResult.grade === '4' ? 'Хороший результат' : 
                     lastResult.grade === '3' ? 'Удовлетворительно' : 'Нужно повторить'}
                  </p>
                  
                  {/* кнопка скачивания сертификата (если оценка >= 3) */}
                  {lastResult.percentage >= 60 && (
                    <button
                      onClick={generateCertificate}
                      className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-all"
                    >
                      <FileText size={18} /> СКАЧАТЬ СЕРТИФИКАТ
                    </button>
                  )}
                </div>

                {/* кнопки управления после теста */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={startQuiz}
                    className="flex-1 btn-primary flex items-center justify-center gap-3 py-4 sm:py-5 text-sm sm:text-base"
                  >
                    <RotateCcw size={20} className="sm:size-6" /> ПРОЙТИ ЗАНОВО
                  </button>
                  <button
                    onClick={() => setView('start')}
                    className="flex-1 rounded-2xl bento-card font-bold text-sm sm:text-base flex items-center justify-center hover:opacity-80 py-4 sm:py-5"
                  >
                    ВЫХОД
                  </button>
                </div>
              </div>

              {/* новые достижения */}
              {lastResult.newAchievements && lastResult.newAchievements.length > 0 && (
                <div className="md:col-span-12 bento-card border-[var(--accent)]/30 p-8 flex flex-col items-center text-center gap-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] blur-[80px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent)] blur-[80px]"></div>
                  </div>
                  
                  <div className="relative">
                    <Trophy size={48} className="animate-bounce text-[var(--accent)]" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--accent)] text-[var(--text-on-accent)] rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                      +{lastResult.newAchievements.length}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-display font-bold mb-2 text-[var(--text-primary)]">Новые достижения!</h3>
                    <p className="opacity-60 text-sm text-[var(--text-primary)]">Вы открыли новые награды за этот тест</p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4 relative z-10">
                    {lastResult.newAchievements.map(id => {
                      const achievement = ACHIEVEMENTS.find(a => a.id === id);
                      if (!achievement) return null;
                      const Icon = ICON_MAP[achievement.icon] || Zap;
                      return (
                        <motion.div 
                          key={id}
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="bento-card !p-4 rounded-2xl flex items-center gap-3 border-white/10"
                        >
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
                            style={{ backgroundColor: achievement.color }}
                          >
                            <Icon size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold uppercase tracking-tight text-[var(--text-primary)]">{achievement.title}</p>
                            <p className="text-[10px] opacity-60 leading-tight max-w-[120px] text-[var(--text-primary)]">{achievement.description}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* раздел детального разбора ответов */}
              <div className="md:col-span-12 mt-12">
                <h3 className="text-3xl font-display font-bold mb-8 px-2">Разбор вопросов</h3>
                <div className="grid grid-cols-1 gap-6">
                  {currentQuestions.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="bento-card relative overflow-hidden"
                    >
                      {/* индикатор правильности (зеленый/красный) */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${answers[idx] === q.correctAnswer ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-xl font-bold leading-tight">{q.text}</p>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            answers[idx] === q.correctAnswer ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {answers[idx] === q.correctAnswer ? 'Верно' : 'Ошибка'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                            <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1">Ваш ответ</p>
                            <p className={`font-medium ${answers[idx] === q.correctAnswer ? 'text-emerald-500' : 'text-red-500'}`}>
                              {answers[idx] !== undefined ? q.options[answers[idx]] : 'Нет ответа'}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold mb-1 text-emerald-500/60">Правильный ответ</p>
                            <p className="font-medium text-emerald-500">{q.options[q.correctAnswer]}</p>
                          </div>
                        </div>

                        {/* блок объяснения правильного ответа */}
                        <div className="mt-2 p-5 rounded-2xl bg-[var(--accent-glow)] border-2 border-[var(--accent)]/20">
                          <div className="flex items-center gap-2 mb-2 opacity-60">
                            <Zap size={14} className="text-[var(--accent)]" />
                            <p className="text-[10px] uppercase tracking-widest font-bold">Объяснение</p>
                          </div>
                          <p className="text-sm leading-relaxed opacity-80 mb-4">{q.explanation}</p>
                          
                          {/* логика дистрактора (почему выбранный неверный ответ был неверным) */}
                          {answers[idx] !== undefined && answers[idx] !== q.correctAnswer && q.distractorLogic && q.distractorLogic[answers[idx]] && (
                            <div className="pt-4 border-t border-[var(--accent)]/10">
                              <div className="flex items-center gap-2 mb-2 text-red-500/80">
                                <Shield size={14} />
                                <p className="text-[10px] uppercase tracking-widest font-bold">Почему ваш ответ неверный</p>
                              </div>
                              <p className="text-sm leading-relaxed text-red-500/70 italic">
                                "{q.options[answers[idx]]}": {q.distractorLogic[answers[idx]]}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : view === 'achievements' ? (
            /* экран достижений */
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-5xl flex flex-col gap-8"
            >
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-4xl font-display font-bold mb-2">Ваши достижения</h2>
                  <p className="opacity-60">Прогресс: {user?.achievements?.length || 0} из {ACHIEVEMENTS.length}</p>
                </div>
                <button
                  onClick={() => setView('start')}
                  className="p-4 rounded-2xl bento-card hover:opacity-80 transition-all flex items-center gap-2"
                >
                  <ChevronLeft size={24} /> НАЗАД
                </button>
              </div>

              {user?.isGuest && (
                <div className="bento-card bg-amber-500/10 border-amber-500/30 flex items-center gap-4 p-6 animate-fade-up">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-amber-500">Режим гостя</h4>
                    <p className="text-sm opacity-70">В этом режиме достижения не сохраняются. Пожалуйста, войдите в аккаунт, чтобы разблокировать награды.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ACHIEVEMENTS.map(achievement => {
                  const isEarned = user?.achievements?.includes(achievement.id);
                  const Icon = ICON_MAP[achievement.icon] || Zap;
                  return (
                    <div 
                      key={achievement.id}
                      className={`bento-card flex flex-col items-center text-center p-8 transition-all relative overflow-hidden group ${
                        isEarned 
                          ? 'border-[var(--accent)]/40' 
                          : 'hover:border-[var(--accent)]/30'
                      }`}
                    >
                      {isEarned && (
                        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none" style={{ backgroundColor: achievement.color }}></div>
                      )}
                      
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-105"
                        style={{ 
                          backgroundColor: isEarned ? achievement.color : 'var(--accent-glow)', 
                          color: isEarned ? 'white' : 'var(--accent)',
                        }}
                      >
                        <Icon size={40} className={!isEarned ? 'opacity-40' : ''} />
                      </div>
                      
                      <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">{achievement.title}</h3>
                      <p className="text-sm opacity-60 mb-6 flex-grow text-gray-700 dark:text-white/70">{achievement.description}</p>
                      
                      <div className="mt-auto w-full pt-4 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-3">
                        {!isEarned ? (
                          <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">Не получено</p>
                        ) : (
                          <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 flex items-center justify-center gap-1">
                            <Check size={12} /> Получено
                          </p>
                        )}
                        
                        {/* Квадраты по цвету очивки */}
                        <div className="flex gap-1">
                          {[1, 2, 3].map(i => (
                            <div 
                              key={i} 
                              className="w-3 h-3 rounded-sm shadow-sm" 
                              style={{ 
                                backgroundColor: isEarned ? achievement.color : 'var(--accent-glow)',
                                opacity: isEarned ? 1 : 0.5
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* всплывающее уведомление (toast) */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm tracking-widest uppercase flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* модальное окно с контактами автора */}
        <AnimatePresence>
          {isContactModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsContactModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg bento-card p-6 sm:p-10 overflow-hidden z-[101] pointer-events-auto bg-[var(--bg-primary)]"
              >
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ backgroundColor: 'var(--accent)' }}></div>
                
                <div className="flex justify-between items-start mb-6 sm:mb-8">
                  <div>
                    <h2 className="text-2xl sm:text-4xl font-display font-bold mb-1 sm:mb-2">Связь с автором</h2>
                    <p className="opacity-60 text-sm sm:text-base">Есть вопросы или предложения? Напишите мне!</p>
                  </div>
                  <button 
                    onClick={() => setIsContactModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* список контактов */}
                <div className="space-y-4">
                  {/* Telegram */}
                  <div className="relative z-[110] p-4 sm:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between group hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all">
                    <a 
                      href="https://t.me/Smakeev" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform shrink-0">
                        <Send size={20} className="sm:size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Telegram</p>
                        <p className="text-base sm:text-lg font-medium select-all truncate">@Smakeev</p>
                      </div>
                    </a>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard('@Smakeev', 'tg');
                      }}
                      className="p-3 rounded-xl hover:bg-[var(--accent)]/10 text-[var(--accent)] transition-colors cursor-pointer"
                      title="Копировать"
                    >
                      {copiedId === 'tg' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="relative z-[110] p-4 sm:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between group hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all">
                    <a 
                      href="mailto:18simonmskeev@gmail.com"
                      className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform shrink-0">
                        <Mail size={20} className="sm:size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Email</p>
                        <p className="text-sm sm:text-lg font-medium select-all truncate">18simonmakeev@gmail.com</p>
                      </div>
                    </a>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard('18simonmakeev@gmail.com', 'email');
                      }}
                      className="p-3 rounded-xl hover:bg-[var(--accent)]/10 text-[var(--accent)] transition-colors cursor-pointer"
                      title="Копировать"
                    >
                      {copiedId === 'email' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>

                  {/* GitHub */}
                  <div className="relative z-[110] p-4 sm:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between group hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/5 transition-all">
                    <a 
                      href="https://github.com/simoppy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] group-hover:scale-110 transition-transform shrink-0">
                        <Github size={20} className="sm:size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">GitHub</p>
                        <p className="text-base sm:text-lg font-medium select-all truncate">github.com/simoppy</p>
                      </div>
                    </a>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard('github.com/simoppy', 'gh');
                      }}
                      className="p-3 rounded-xl hover:bg-[var(--accent)]/10 text-[var(--accent)] transition-colors cursor-pointer"
                      title="Копировать"
                    >
                      {copiedId === 'gh' ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsContactModalOpen(false)}
                  className="w-full mt-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300"
                  style={{ backgroundColor: 'var(--accent)', color: 'black' }}
                >
                  ЗАКРЫТЬ
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-16 flex justify-between items-center opacity-60 text-[10px] uppercase tracking-[0.3em] font-bold">
        <p>© 2026 МПТ | ИНФОРМАТИКА</p>
        <p>МАКЕЕВ СЕМЁН АНДРЕЕВИЧ</p>
      </footer>
    </div>
  );
}
