-- Create companies table for frontend-managed company metadata
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo TEXT NOT NULL,
    description TEXT NOT NULL,
    website TEXT,
    industry TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND policyname = 'Allow all operations on companies'
  ) THEN
    CREATE POLICY "Allow all operations on companies" ON companies
      FOR ALL USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Public bucket used by the admin frontend logo uploader.
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read company logos'
  ) THEN
    CREATE POLICY "Public read company logos" ON storage.objects
      FOR SELECT USING (bucket_id = 'company-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow company logo uploads'
  ) THEN
    CREATE POLICY "Allow company logo uploads" ON storage.objects
      FOR INSERT TO anon, authenticated
      WITH CHECK (bucket_id = 'company-logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow company logo updates'
  ) THEN
    CREATE POLICY "Allow company logo updates" ON storage.objects
      FOR UPDATE TO anon, authenticated
      USING (bucket_id = 'company-logos')
      WITH CHECK (bucket_id = 'company-logos');
  END IF;
END $$;

-- Ensure AIML 27 exists for the new batch.
INSERT INTO batches (year, name, description, is_active)
VALUES (2027, 'AIML 27', 'AI & ML Batch 2027', true)
ON CONFLICT (year) DO NOTHING;
