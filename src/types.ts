export type InteractionType =
  | 'quiz'            // Trắc nghiệm 1 đáp án đúng
  | 'multi_choice'    // Trắc nghiệm nhiều đáp án đúng
  | 'true_false'       // Câu hỏi Đúng / Sai
  | 'drag_drop'        // Kéo thả phân loại hoặc ghép đôi
  | 'fill_blank'       // Điền từ vào chỗ trống
  | 'checkpoint_note'; // Thẻ ghi chú tóm tắt phân đoạn (Flashcard)

// 1. Trắc nghiệm đơn
export interface QuizInteraction {
  type: 'quiz';
  question: string;
  options: string[];
  correctAnswer: number; // index 0..n
  explanation?: string;
  hint?: string;
}

// 2. Trắc nghiệm nhiều đáp án đúng
export interface MultiChoiceInteraction {
  type: 'multi_choice';
  question: string;
  options: string[];
  correctAnswers: number[]; // array of indices
  explanation?: string;
  hint?: string;
}

// 3. Đúng / Sai
export interface TrueFalseInteraction {
  type: 'true_false';
  statement: string;
  isCorrect: boolean; // true = Đúng, false = Sai
  explanation?: string;
  hint?: string;
}

// 4. Kéo thả phân loại
export interface DragDropItem {
  id: string;
  text: string;
  targetCategory: string; // e.g. 'Pha Sáng' vs 'Pha Tối'
}

export interface DragDropInteraction {
  type: 'drag_drop';
  instruction: string;
  categories: string[];
  items: DragDropItem[];
  explanation?: string;
  hint?: string;
}

// 5. Điền từ vào chỗ trống
export interface FillBlankInteraction {
  type: 'fill_blank';
  sentence: string; // "Phương trình quang hợp: 6CO2 + 6H2O -> {...} + 6O2"
  blankAnswer: string;
  hint?: string;
  explanation?: string;
}

// 6. Ghi chú tóm tắt phân đoạn (Checkpoint Note / Flashcard)
export interface CheckpointNoteInteraction {
  type: 'checkpoint_note';
  title: string;
  summary: string;
  keyTakeaways: string[];
  reflectionQuestion?: string;
}

export type InteractionData =
  | QuizInteraction
  | MultiChoiceInteraction
  | TrueFalseInteraction
  | DragDropInteraction
  | FillBlankInteraction
  | CheckpointNoteInteraction;

export interface InteractionPoint {
  id: string;
  timestamp: number; // seconds
  title: string;
  data: InteractionData;
  completed?: boolean;
}

export interface LessonMaterial {
  name: string;
  type: 'pdf' | 'image' | 'text' | 'docx';
  content?: string; // extracted text
  previewUrl?: string;
}

export type AiProvider = 'gemini' | 'agent-platform';

export interface AppSettings {
  geminiApiKey: string;
  agentPlatformApiKey: string;
  provider: AiProvider;
  selectedModel: string;
  authorName: string;
  authorZalo: string;
  allowSeekingPastUnanswered: boolean;
  passingScorePercent: number;
}

export interface ProjectData {
  version: string;
  videoTitle: string;
  videoUrl: string;
  videoFileName: string;
  videoDuration: number;
  subject: string;
  grade: string;
  lessonMaterial: LessonMaterial | null;
  lessonText: string;
  interactions: InteractionPoint[];
  settings: AppSettings;
  lastUpdated: string;
}
