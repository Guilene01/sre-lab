-- Demo-only auth: plaintext password compare, no hashing (see docs/architecture.md).

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  major TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  instructor TEXT NOT NULL,
  credits INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  title TEXT NOT NULL,
  due_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  student_id INTEGER NOT NULL REFERENCES students(id),
  content TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  assignment_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO students (username, password, full_name, major) VALUES
  ('maya.torres', 'demo123', 'Maya Torres', 'Cloud Infrastructure'),
  ('jonas.eklund', 'demo123', 'Jonas Eklund', 'Site Reliability Engineering'),
  ('fatima.al-rashid', 'demo123', 'Fatima Al-Rashid', 'DevOps Engineering')
ON CONFLICT DO NOTHING;

INSERT INTO courses (code, title, instructor, credits) VALUES
  ('DVOP-101', 'Linux Fundamentals', 'Dr. Ellen Marsh', 3),
  ('DVOP-210', 'Introduction to Kubernetes', 'Prof. Ravi Nadar', 4),
  ('DVOP-220', 'CI/CD Pipelines', 'Prof. Sofia Bianchi', 3),
  ('DVOP-310', 'Site Reliability Engineering', 'Dr. Marcus Webb', 4),
  ('DVOP-330', 'Cloud Networking', 'Prof. Aisha Bello', 3)
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (student_id, course_id) VALUES
  ((SELECT id FROM students WHERE username = 'maya.torres'), (SELECT id FROM courses WHERE code = 'DVOP-101')),
  ((SELECT id FROM students WHERE username = 'maya.torres'), (SELECT id FROM courses WHERE code = 'DVOP-210'))
ON CONFLICT DO NOTHING;

INSERT INTO assignments (course_id, title, due_date) VALUES
  ((SELECT id FROM courses WHERE code = 'DVOP-101'), 'Shell Scripting Lab', '2026-08-01'),
  ((SELECT id FROM courses WHERE code = 'DVOP-210'), 'Deploy a Multi-Tier App', '2026-08-15')
ON CONFLICT DO NOTHING;

INSERT INTO grades (student_id, course_id, assignment_name, grade) VALUES
  ((SELECT id FROM students WHERE username = 'maya.torres'), (SELECT id FROM courses WHERE code = 'DVOP-101'), 'Filesystem Permissions Quiz', 'A-'),
  ((SELECT id FROM students WHERE username = 'maya.torres'), (SELECT id FROM courses WHERE code = 'DVOP-101'), 'Shell Scripting Lab', 'B+'),
  ((SELECT id FROM students WHERE username = 'maya.torres'), (SELECT id FROM courses WHERE code = 'DVOP-210'), 'Pod Scheduling Exercise', 'A')
ON CONFLICT DO NOTHING;
