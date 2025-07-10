-- Create the experiences table
CREATE TABLE IF NOT EXISTS experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  duration TEXT,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on company_id for faster queries
CREATE INDEX IF NOT EXISTS idx_experiences_company_id ON experiences(company_id);

-- Create an index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_experiences_created_at ON experiences(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on experiences" ON experiences
  FOR ALL USING (true);
