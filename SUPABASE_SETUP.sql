-- ============================================
-- Supabase Setup for Knowledge Base Feature
-- ============================================
-- Run these SQL commands in your Supabase SQL Editor
-- ============================================

-- 1. Create the knowledge_base storage bucket
-- This bucket will store uploaded files (PDF, DOCX, TXT, XLSX)
insert into storage.buckets (id, name, public)
values ('knowledge-base', 'knowledge-base', true)
on conflict (id) do update set public = true;

-- 2. Create the knowledge_base table
-- This table stores metadata about uploaded files
create table if not exists knowledge_base (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  file_type text not null,
  file_url text not null,
  extracted_text text not null,
  source text not null check (source in ('upload', 'google_drive')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Row Level Security (RLS) on the knowledge_base table
alter table knowledge_base enable row level security;

-- 4. Create RLS policies for knowledge_base
-- Allow public read access (for bot to search knowledge base)
create policy "Allow public read access to knowledge_base"
  on knowledge_base for select
  using (true);

-- Allow authenticated users to insert files
create policy "Allow authenticated users to insert files"
  on knowledge_base for insert
  with check (auth.role() = 'authenticated');

-- Allow authenticated users to delete files
create policy "Allow authenticated users to delete files"
  on knowledge_base for delete
  using (auth.role() = 'authenticated');

-- 5. Create RLS policies for storage bucket
-- Allow public read access to files in the bucket
create policy "Allow public read access to knowledge-base bucket"
  on storage.objects for select
  using (bucket_id = 'knowledge-base');

-- Allow authenticated users to upload files
create policy "Allow authenticated users to upload to knowledge-base bucket"
  on storage.objects for insert
  with check (
    bucket_id = 'knowledge-base' 
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete files from bucket
create policy "Allow authenticated users to delete from knowledge-base bucket"
  on storage.objects for delete
  using (
    bucket_id = 'knowledge-base' 
    and auth.role() = 'authenticated'
  );

-- 6. Create indexes for better search performance
create index if not exists knowledge_base_filename_idx on knowledge_base(filename);
create index if not exists knowledge_base_extracted_text_idx on knowledge_base using gin(to_tsvector('arabic', extracted_text));
create index if not exists knowledge_base_created_at_idx on knowledge_base(created_at desc);

-- 7. Create token_usage table for daily budget tracking
create table if not exists token_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('quick', 'thoughtful', 'programming')),
  tokens_used integer not null default 0,
  date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Enable RLS on token_usage table
alter table token_usage enable row level security;

-- 9. Create RLS policies for token_usage
-- Allow users to read their own token usage
create policy "Allow users to read own token usage"
  on token_usage for select
  using (auth.uid() = user_id);

-- Allow service role to insert token usage (for server-side tracking)
create policy "Allow service role to insert token usage"
  on token_usage for insert
  with check (auth.role() = 'service_role');

-- 10. Create indexes for token_usage
create index if not exists token_usage_user_date_idx on token_usage(user_id, date);
create index if not exists token_usage_mode_idx on token_usage(mode);

-- ============================================
-- Notes:
-- - The bucket is set to public so files are accessible via URL
-- - Files are stored at path: /files/{timestamp}_{filename}
-- - The extracted_text column stores the full text content from files
-- - The source column indicates whether file was uploaded directly or from Google Drive
-- - RLS policies allow the bot to search the knowledge base while requiring auth for uploads/deletes
-- - token_usage table tracks daily token usage per user per mode
-- - Quick mode has unlimited budget, thoughtful and programming modes have 400,000 tokens/day
-- ============================================
