-- ============================================
-- Unified MariaDB 10.11+ Schema
-- Converted from PostgreSQL/Supabase schemas
-- ============================================

-- Set delimiter for stored procedures and triggers
DELIMITER //

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL,
  bot_name VARCHAR(255) DEFAULT 'aylnor',
  bot_personality TEXT DEFAULT 'مساعد مفيد ودقيق وأكاديمي',
  theme VARCHAR(50) DEFAULT 'dark',
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Conversations Table
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title TEXT NOT NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('quick', 'thoughtful', 'programming')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Messages Table
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'bot')),
  content TEXT NOT NULL,
  mode VARCHAR(50) CHECK (mode IN ('quick', 'thoughtful', 'programming')),
  code_block JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Educational Files Table
-- ============================================
CREATE TABLE IF NOT EXISTS educational_files (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  drive_id TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Knowledge Base Table
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('upload', 'google_drive')),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Token Usage Table
-- ============================================
CREATE TABLE IF NOT EXISTS token_usage (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('quick', 'thoughtful', 'programming')),
  tokens_used INT NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Conversations table indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_mode ON conversations(mode);

-- Messages table indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_role ON messages(role);

-- Educational files indexes
CREATE INDEX idx_educational_files_drive_id ON educational_files(drive_id);
CREATE INDEX idx_educational_files_title ON educational_files(title);
CREATE INDEX idx_educational_files_description ON educational_files(description);
CREATE INDEX idx_educational_files_created_at ON educational_files(created_at DESC);

-- Knowledge base indexes
CREATE INDEX idx_knowledge_base_filename ON knowledge_base(filename);
CREATE FULLTEXT INDEX idx_knowledge_base_extracted_text ON knowledge_base(extracted_text);
CREATE INDEX idx_knowledge_base_created_at ON knowledge_base(created_at DESC);
CREATE INDEX idx_knowledge_base_source ON knowledge_base(source);

-- Token usage indexes
CREATE INDEX idx_token_usage_user_date ON token_usage(user_id, date);
CREATE INDEX idx_token_usage_mode ON token_usage(mode);

-- ============================================
-- Triggers and Stored Procedures
-- ============================================

-- Trigger to auto-update conversation title based on first message
DROP TRIGGER IF EXISTS update_conversation_title_trigger//

CREATE TRIGGER update_conversation_title_trigger
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
  -- Only update title if it's still "محادثة جديدة" and this is the first user message
  IF EXISTS (
    SELECT 1 FROM conversations 
    WHERE id = NEW.conversation_id 
    AND title = 'محادثة جديدة'
  ) AND NEW.role = 'user' THEN
    UPDATE conversations
    SET title = LEFT(NEW.content, 40)
    WHERE id = NEW.conversation_id;
  END IF;
END//

-- ============================================
-- Notes for Migration
-- ============================================
-- 
-- UUID Handling:
-- - Application layer should generate UUIDs and pass them as VARCHAR(36)
-- - Or use UUID() function in MariaDB 10.11+ for default values
-- 
-- Removed Supabase-specific features:
-- - storage.buckets and storage.objects (use file system or external storage)
-- - Row Level Security (RLS) policies (implement at application layer)
-- - auth.users and auth.jwt() references (implement auth separately)
-- 
-- Data type conversions:
-- - UUID -> VARCHAR(36)
-- - JSONB -> JSON
-- - TIMESTAMP WITH TIME ZONE -> DATETIME
-- - BIGSERIAL -> BIGINT AUTO_INCREMENT
-- - TEXT types kept as TEXT
-- 
-- Index conversions:
-- - GIN/TSVector -> FULLTEXT indexes for text search
-- - All standard indexes preserved
-- 
-- Triggers:
-- - updated_at automatic handling using ON UPDATE CURRENT_TIMESTAMP
-- - Conversation title trigger converted to MariaDB syntax
-- - Removed handle_new_user trigger (auth handled separately)
-- 
-- Engine and charset:
-- - All tables use InnoDB engine
-- - UTF8MB4 with Unicode collation for full Unicode support
-- 
-- Foreign keys:
-- - All foreign key constraints preserved
-- - CASCADE DELETE maintained
-- 
-- CHECK constraints:
-- - All CHECK constraints preserved for enum-like validation
-- ============================================

-- Reset delimiter
DELIMITER ;