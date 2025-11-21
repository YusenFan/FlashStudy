export enum QuestionType {
  TRUE_FALSE = 'TRUE_FALSE',
  MCQ = 'MCQ',
  MULTI_SELECT = 'MULTI_SELECT',
  FILL_BLANK = 'FILL_BLANK',
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For MCQ and Multi-select
  correctAnswers: string[]; // Array of correct answer strings
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudySet {
  id: string;
  title: string;
  subject: string;
  icon: string;
  questions: Question[];
  highScore: number;
  masteryLevel: number; // 0-100%
  color: string; // Tailwind color class for UI
}

export interface UserProfile {
  totalXp: number;
  level: number;
  streakDays: number;
}

export interface GameState {
  activeSetId: string | null;
  currentQuestionIndex: number;
  score: number;
  streak: number;
  isGameOver: boolean;
  answers: Record<number, boolean>; // index -> correct/incorrect
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface UploadData {
  subject: string;
  topic: string;
  text: string;
  attachments: FileAttachment[]; 
}