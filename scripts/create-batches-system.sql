-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add batch_id to experiences table
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_experiences_batch_id ON experiences(batch_id);
CREATE INDEX IF NOT EXISTS idx_experiences_batch_company ON experiences(batch_id, company_id);
CREATE INDEX IF NOT EXISTS idx_batches_year ON batches(year);
CREATE INDEX IF NOT EXISTS idx_batches_active ON batches(is_active);

-- Insert default batches
INSERT INTO batches (year, name, description, is_active) VALUES
(2026, 'AIML 26', 'AI & ML Batch 2026', true),
(2025, 'AIML 25', 'AI & ML Batch 2025', true),
(2024, 'AIML 24', 'AI & ML Batch 2024', true)
ON CONFLICT (year) DO NOTHING;

-- Update existing experiences to use the default batch (2026)
UPDATE experiences 
SET batch_id = (SELECT id FROM batches WHERE year = 2026 LIMIT 1)
WHERE batch_id IS NULL;

-- Make batch_id required after updating existing records
ALTER TABLE experiences 
ALTER COLUMN batch_id SET NOT NULL;
