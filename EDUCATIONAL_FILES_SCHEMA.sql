-- Educational Files Table Schema
-- Create table for storing educational files from Google Drive

CREATE TABLE IF NOT EXISTS educational_files (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  drive_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE educational_files ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
-- This policy allows authenticated users with admin role to perform all operations
CREATE POLICY "Allow admin full access to educational_files"
  ON educational_files
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Create index on drive_id for faster lookups
CREATE INDEX IF NOT EXISTS educational_files_drive_id_idx ON educational_files(drive_id);

-- Create index on title for search
CREATE INDEX IF NOT EXISTS educational_files_title_idx ON educational_files(title);

-- Create index on description for search
CREATE INDEX IF NOT EXISTS educational_files_description_idx ON educational_files(description);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS educational_files_created_at_idx ON educational_files(created_at DESC);
