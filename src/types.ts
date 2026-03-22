export interface User {
  email?: string;
  isGuest: boolean;
  isAdmin?: boolean;
  achievements?: string[]; // IDs of earned achievements
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  category: string;
  explanation: string;
  distractorLogic?: string[]; // массив объяснений для каждого варианта ответа
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  grade: string;
  date: string;
  topicStats?: Record<string, { total: number; errors: number }>;
  newAchievements?: string[]; // Achievements earned in this specific run
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  color: string;
  condition: (result: QuizResult, history: QuizResult[], allQuestions: Question[]) => boolean;
}

export type Theme = 'light' | 'dark';
