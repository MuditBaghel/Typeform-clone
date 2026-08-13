export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'dropdown'
  | 'email'
  | 'number'
  | 'yes_no'
  | 'rating';

export interface LogicRule {
  ifValue: string;
  goToQuestionId: string;
}

export interface Question {
  id: string;
  form_id?: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[];
  logic?: LogicRule[];
}

export interface FormTheme {
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  questionTextColor: string;
  answerTextColor: string;
  fontFamily: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  slug: string;
  theme: FormTheme;
  welcome_enabled?: boolean;
  welcome_title?: string;
  welcome_description?: string;
  welcome_button_text?: string;
  thank_you_title: string;
  thank_you_description?: string;
  thank_you_button_text?: string;
  thank_you_button_url?: string;
  created_at: string;
  updated_at: string;
  response_count: number;
  questions: Question[];
}

export interface Response {
  id: string;
  form_id: string;
  answers: Record<string, any>;
  submitted_at: string;
}

export interface QuestionStat {
  question_id: string;
  title: string;
  type: QuestionType;
  total_answers: number;
  option_counts?: Record<string, number>;
  text_samples?: string[];
  average_rating?: number;
}

export interface FormStats {
  total_responses: number;
  question_stats: QuestionStat[];
}
