import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Subject {
  id: string;
  name: string;
  category: string;
  scaling_factor: number;
  has_bonus: boolean;
}

export interface SubjectScore {
  subject: Subject;
  rawScore: number;
  scaledScore: number;
}

export interface Calculation {
  id: string;
  student_name: string | null;
  year_level: string;
  predicted_atar: number;
  created_at: string;
}
