-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS experiences;

-- Create the experiences table
CREATE TABLE experiences (
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

-- Create indexes for better performance
CREATE INDEX idx_experiences_company_id ON experiences(company_id);
CREATE INDEX idx_experiences_created_at ON experiences(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
CREATE POLICY "Allow all operations on experiences" ON experiences
  FOR ALL USING (true);

-- Insert a sample experience for testing
INSERT INTO experiences (company_id, title, role, duration, author, content, tags) VALUES (
  'wissen-technologies',
  'My Software Engineer Interview Experience at Wissen Technologies',
  'Software Engineer',
  'March 2024',
  'Sample Student',
  '<h2>Overview</h2><p>I had the opportunity to interview for the Software Development Engineer position at Wissen Technologies. The process was well-structured and challenging.</p><h3>Online Assessment</h3><p>The online test consisted of aptitude, DSA, and SQL questions. It was conducted for 90 minutes.</p><h3>Technical Interview</h3><p>The technical round focused on data structures, algorithms, and system design concepts.</p><h3>Key Takeaways</h3><ul><li>Strong preparation in DSA is essential</li><li>System design knowledge is valuable</li><li>Communication skills matter a lot</li></ul>',
  ARRAY['Technical Round', 'Online Test']
);
