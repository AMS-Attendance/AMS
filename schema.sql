-- Attendance Management System - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to create all tables
-- IMPORTANT: Run this entire script at once, not line by line

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS lectures CASCADE;
DROP TABLE IF EXISTS module_students CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ================== USERS TABLE ==================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')) DEFAULT 'student',
  
  -- Student-specific fields
  rfid VARCHAR(255) UNIQUE,
  index_number VARCHAR(255) UNIQUE,
  degree VARCHAR(255),
  batch INTEGER CHECK (batch >= 20 AND batch <= 30),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_rfid ON users(rfid) WHERE rfid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_index_number ON users(index_number) WHERE index_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_batch ON users(batch);

-- ================== MODULES TABLE ==================
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits INTEGER CHECK (credits >= 1 AND credits <= 10),
  semester INTEGER CHECK (semester >= 1 AND semester <= 8),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for modules table
CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);
CREATE INDEX IF NOT EXISTS idx_modules_lecturer_id ON modules(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_modules_is_active ON modules(is_active);

-- ================== MODULE_STUDENTS (Junction Table) ==================
CREATE TABLE IF NOT EXISTS module_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, student_id)
);

-- Indexes for module_students table
CREATE INDEX IF NOT EXISTS idx_module_students_module_id ON module_students(module_id);
CREATE INDEX IF NOT EXISTS idx_module_students_student_id ON module_students(student_id);

-- ================== LECTURES TABLE ==================
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL DEFAULT 'Untitled Lecture',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_hours INTERVAL CHECK (duration_hours > '0 hours') DEFAULT '2 hours', -- duration in hours
  location VARCHAR(255),
  type VARCHAR(50) CHECK (type IN ('Lecture', 'Lab', 'Tutorial', 'Seminar')) DEFAULT 'Lecture',
  description TEXT,
  status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')) DEFAULT 'SCHEDULED',
  is_completed BOOLEAN DEFAULT FALSE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for lectures table
CREATE INDEX IF NOT EXISTS idx_lectures_module_id ON lectures(module_id);
CREATE INDEX IF NOT EXISTS idx_lectures_scheduled_at ON lectures(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_lectures_is_completed ON lectures(is_completed);

-- ================== ATTENDANCE TABLE ==================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')) DEFAULT 'PRESENT',
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  method VARCHAR(20) CHECK (method IN ('manual', 'rfid')) DEFAULT 'manual',
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lecture_id, student_id)
);

-- Indexes for attendance table
CREATE INDEX IF NOT EXISTS idx_attendance_lecture_id ON attendance(lecture_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);

-- ================== TRIGGERS FOR UPDATED_AT ==================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================== ROW LEVEL SECURITY (Optional - Enable if needed) ==================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE module_students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- ================== VIEWS FOR COMMON QUERIES ==================
-- Note: Views are optional and can be created after tables are working

-- View: Module with student count
-- CREATE OR REPLACE VIEW modules_with_stats AS
-- SELECT 
--   m.*,
--   COUNT(DISTINCT ms.student_id) as student_count
-- FROM modules m
-- LEFT JOIN module_students ms ON m.id = ms.module_id
-- GROUP BY m.id;

-- View: Lecture with attendance stats
-- CREATE OR REPLACE VIEW lectures_with_stats AS
-- SELECT 
--   l.*,
--   COUNT(DISTINCT a.student_id) as attendance_count,
--   COUNT(DISTINCT CASE WHEN a.status = 'PRESENT' THEN a.student_id END) as present_count,
--   COUNT(DISTINCT CASE WHEN a.status = 'LATE' THEN a.student_id END) as late_count,
--   COUNT(DISTINCT CASE WHEN a.status = 'ABSENT' THEN a.student_id END) as absent_count
-- FROM lectures l
-- LEFT JOIN attendance a ON l.id = a.lecture_id
-- GROUP BY l.id;

-- ================== SCHEMA CREATION COMPLETE ==================
-- All tables and triggers have been created successfully!
-- You can now run: node utils/createAdmin.js
