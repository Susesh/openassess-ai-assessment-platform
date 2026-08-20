-- Migration: Remove legacy admin tables (student-only platform)
-- Date: 2026-06-19

DROP TABLE IF EXISTS admin_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

UPDATE users SET role = 'student' WHERE role = 'admin';
UPDATE users SET role = 'student' WHERE role IS NULL OR role = '';
