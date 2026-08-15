-- ─────────────────────────────────────────────────────────────────────────
-- Placement Portal — MySQL schema
-- This is generated for reference only. The app itself auto-creates these
-- tables via SQLAlchemy (see app/main.py -> Base.metadata.create_all).
-- Run this manually only if you want to provision the schema by hand.
-- ─────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS placement_portal
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE placement_portal;

-- ── Users (auth) ───────────────────────────────────────────────────────
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('placement_officer','placement_coordinator','department_coordinator','student','recruiter') NOT NULL,
  institution VARCHAR(190),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Students ───────────────────────────────────────────────────────────
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  name VARCHAR(120) NOT NULL,
  initials VARCHAR(6),
  avatar_color VARCHAR(20),
  avatar_bg VARCHAR(20),
  roll VARCHAR(30) NOT NULL UNIQUE,
  department VARCHAR(80) NOT NULL,
  batch VARCHAR(10) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  cgpa FLOAT NOT NULL DEFAULT 0,
  status ENUM('Eligible','Applied','Interviewing','Offered','Placed') NOT NULL DEFAULT 'Eligible',
  company VARCHAR(120),
  resume_url VARCHAR(255),
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(30),
  hometown VARCHAR(120),
  github VARCHAR(190),
  linkedin VARCHAR(190),
  portfolio VARCHAR(190),
  bio TEXT,
  skills JSON,
  graduation_year INT,
  total_backlogs INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ── Certifications ─────────────────────────────────────────────────────
CREATE TABLE certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  name VARCHAR(190) NOT NULL,
  issuer VARCHAR(190),
  year INT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ── Semester records ───────────────────────────────────────────────────
CREATE TABLE semester_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  sem INT NOT NULL,
  gpa FLOAT NOT NULL,
  backlogs INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_student_sem (student_id, sem),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ── Companies (CRM) ────────────────────────────────────────────────────
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL UNIQUE,
  logo VARCHAR(10),
  logo_color VARCHAR(20),
  logo_bg VARCHAR(20),
  industry VARCHAR(120),
  location VARCHAR(190),
  hr_name VARCHAR(120),
  hr_email VARCHAR(190),
  hr_phone VARCHAR(30),
  past_visits INT NOT NULL DEFAULT 0,
  students_hired INT NOT NULL DEFAULT 0,
  avg_package_lpa FLOAT,
  highest_package_lpa FLOAT,
  last_visit VARCHAR(30),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Company job history ────────────────────────────────────────────────
CREATE TABLE company_job_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  year VARCHAR(10) NOT NULL,
  role VARCHAR(190) NOT NULL,
  hired INT NOT NULL DEFAULT 0,
  package VARCHAR(30),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ── Placement drives ───────────────────────────────────────────────────
CREATE TABLE placement_drives (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  position VARCHAR(190) NOT NULL,
  package VARCHAR(30),
  package_lpa FLOAT,
  type ENUM('FTE','Internship','FTE + Internship') NOT NULL DEFAULT 'FTE',
  eligibility VARCHAR(255),
  skills JSON,
  registration_deadline DATE,
  interview_date DATE,
  venue VARCHAR(190),
  status ENUM('Open','Upcoming','Completed','Closed') NOT NULL DEFAULT 'Upcoming',
  applications_count INT NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- ── Applications (student pipeline, also used for admin Placements page) ─
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  drive_id INT,
  company VARCHAR(190) NOT NULL,
  role VARCHAR(190) NOT NULL,
  applied_date DATE,
  stage ENUM('Applied','Shortlisted','Written Test','Technical Interview','HR Round',
             'Interviewing','Offered','Joined','Rejected') NOT NULL DEFAULT 'Applied',
  package VARCHAR(30),
  offer_date DATE,
  joining_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id) REFERENCES placement_drives(id) ON DELETE SET NULL
);

-- ── Internships ────────────────────────────────────────────────────────
CREATE TABLE internships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  company VARCHAR(190) NOT NULL,
  role VARCHAR(190) NOT NULL,
  duration VARCHAR(30),
  start_date DATE,
  end_date DATE,
  mentor VARCHAR(120),
  stipend VARCHAR(30),
  ppo_eligible BOOLEAN DEFAULT FALSE,
  ppo_converted BOOLEAN DEFAULT FALSE,
  status ENUM('Ongoing','Completed','Withdrawn') NOT NULL DEFAULT 'Ongoing',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ── Communication ──────────────────────────────────────────────────────
CREATE TABLE sent_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel ENUM('Email','SMS','WhatsApp','In-App') NOT NULL,
  audience VARCHAR(190) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recipients INT NOT NULL DEFAULT 0,
  status ENUM('Delivered','Partial','Scheduled') NOT NULL DEFAULT 'Scheduled',
  created_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  text VARCHAR(255) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
