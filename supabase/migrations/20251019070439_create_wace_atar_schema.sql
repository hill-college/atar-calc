/*
  # WACE ATAR Calculator Schema

  1. New Tables
    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text) - Subject name (e.g., "Mathematics Methods")
      - `category` (text) - Category (Mathematics, Science, English, etc.)
      - `scaling_factor` (numeric) - Base scaling factor for ATAR calculation
      - `has_bonus` (boolean) - Whether subject qualifies for bonus points
      - `created_at` (timestamptz)
    
    - `calculations`
      - `id` (uuid, primary key)
      - `student_name` (text, optional) - Student name for reference
      - `year_level` (text) - Year 10, 11, or 12
      - `predicted_atar` (numeric) - Calculated ATAR score
      - `created_at` (timestamptz)
    
    - `calculation_subjects`
      - `id` (uuid, primary key)
      - `calculation_id` (uuid, foreign key to calculations)
      - `subject_id` (uuid, foreign key to subjects)
      - `raw_score` (numeric) - Student's raw score (0-100)
      - `scaled_score` (numeric) - Calculated scaled score
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Allow public read access to subjects table
    - Allow public insert/read access to calculations and calculation_subjects
*/

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  scaling_factor numeric NOT NULL DEFAULT 1.0,
  has_bonus boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create calculations table
CREATE TABLE IF NOT EXISTS calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text,
  year_level text NOT NULL,
  predicted_atar numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create calculation_subjects table
CREATE TABLE IF NOT EXISTS calculation_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id uuid NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  raw_score numeric NOT NULL,
  scaled_score numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_subjects ENABLE ROW LEVEL SECURITY;

-- Policies for subjects (public read)
CREATE POLICY "Anyone can read subjects"
  ON subjects FOR SELECT
  USING (true);

-- Policies for calculations (public insert and read own)
CREATE POLICY "Anyone can insert calculations"
  ON calculations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read calculations"
  ON calculations FOR SELECT
  USING (true);

-- Policies for calculation_subjects (public insert and read)
CREATE POLICY "Anyone can insert calculation subjects"
  ON calculation_subjects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read calculation subjects"
  ON calculation_subjects FOR SELECT
  USING (true);

-- Insert common WACE subjects with approximate scaling factors
INSERT INTO subjects (name, category, scaling_factor, has_bonus) VALUES
  -- Mathematics (with bonus)
  ('Mathematics Specialist', 'Mathematics', 1.15, true),
  ('Mathematics Methods', 'Mathematics', 1.10, true),
  ('Mathematics Applications', 'Mathematics', 0.95, false),
  
  -- Sciences
  ('Physics', 'Science', 1.08, false),
  ('Chemistry', 'Science', 1.07, false),
  ('Biology', 'Science', 1.02, false),
  ('Human Biology', 'Science', 0.98, false),
  ('Psychology', 'Science', 1.00, false),
  
  -- English
  ('English ATAR', 'English', 1.00, false),
  ('Literature', 'English', 1.05, false),
  
  -- Humanities
  ('Modern History', 'Humanities', 1.02, false),
  ('Ancient History', 'Humanities', 1.01, false),
  ('Geography', 'Humanities', 0.99, false),
  ('Politics and Law', 'Humanities', 1.03, false),
  ('Economics', 'Humanities', 1.04, false),
  
  -- Languages (with bonus)
  ('French', 'Languages', 1.06, true),
  ('Italian', 'Languages', 1.06, true),
  ('Japanese', 'Languages', 1.07, true),
  ('Mandarin', 'Languages', 1.08, true),
  ('German', 'Languages', 1.06, true),
  ('Indonesian', 'Languages', 1.05, true),
  
  -- Arts
  ('Visual Arts', 'Arts', 0.97, false),
  ('Drama', 'Arts', 0.98, false),
  ('Music', 'Arts', 1.00, false),
  
  -- Business & Technology
  ('Accounting and Finance', 'Business', 1.01, false),
  ('Computer Science', 'Technology', 1.03, false),
  ('Design', 'Technology', 0.96, false),
  ('Engineering Studies', 'Technology', 1.02, false),
  
  -- Health & PE
  ('Physical Education Studies', 'Health & PE', 0.97, false),
  ('Health Studies', 'Health & PE', 0.96, false)
ON CONFLICT DO NOTHING;