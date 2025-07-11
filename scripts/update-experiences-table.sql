-- Add new columns to experiences table
ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS selection_status VARCHAR(20) CHECK (selection_status IN ('selected', 'not-selected')),
ADD COLUMN IF NOT EXISTS ctc DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS offer_type VARCHAR(100);

-- Update existing records to have a default selection status
UPDATE experiences 
SET selection_status = 'selected' 
WHERE selection_status IS NULL;

-- Make selection_status required after updating existing records
ALTER TABLE experiences 
ALTER COLUMN selection_status SET NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_experiences_selection_status ON experiences(selection_status);
