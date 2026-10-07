-- ============================================================
-- Database: crc_mbstu_db
-- Come for Road Child (CRC), MBSTU
-- Volunteer & Activity Management System
-- ============================================================

CREATE DATABASE IF NOT EXISTS crc_mbstu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crc_mbstu_db;

-- ------------------------------------------------------------
-- 1. Table structure for table: users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    batch VARCHAR(20),
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    status ENUM('pending', 'active', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Table structure for table: activities
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    location VARCHAR(200),
    image VARCHAR(255),
    status ENUM('upcoming', 'ongoing', 'completed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Table structure for table: registrations
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_activity (user_id, activity_id),
    CONSTRAINT fk_registrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_registrations_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Table structure for table: committee
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS committee (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    student_id VARCHAR(50),
    batch VARCHAR(20),
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. Table structure for table: gallery
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200),
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INITIAL SAMPLE DATA (Idempotent - safe to run multiple times)
-- ============================================================

-- Seed Demo Admin Account
-- Email: admin@crcmbstu.com
-- Password: Admin@12345 (bcrypt hashed)
INSERT INTO users (name, student_id, department, batch, email, password, role, status)
VALUES (
    'CRC Administrator',
    'ADMIN-001',
    'ICT',
    '15th',
    'admin@crcmbstu.com',
    '$2a$10$MJdZjlyCEuFyxoUPng4QvuRFh7rvFQV31bxcIo7r7hu540JdJPUa.',
    'admin',
    'active'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed Demo Active Member
-- Email: member@crcmbstu.com
-- Password: Admin@12345 (bcrypt hashed)
INSERT INTO users (name, student_id, department, batch, email, password, role, status)
VALUES (
    'Tanvir Ahmed',
    'IT-20045',
    'CSE',
    '18th',
    'member@crcmbstu.com',
    '$2a$10$MJdZjlyCEuFyxoUPng4QvuRFh7rvFQV31bxcIo7r7hu540JdJPUa.',
    'member',
    'active'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed Demo Pending Member
-- Email: pending@crcmbstu.com
-- Password: Admin@12345 (bcrypt hashed)
INSERT INTO users (name, student_id, department, batch, email, password, role, status)
VALUES (
    'Sadia Rahman',
    'TE-21019',
    'Textile Engineering',
    '19th',
    'pending@crcmbstu.com',
    '$2a$10$MJdZjlyCEuFyxoUPng4QvuRFh7rvFQV31bxcIo7r7hu540JdJPUa.',
    'member',
    'pending'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed Sample Activities
INSERT INTO activities (id, title, description, date, location, image, status)
VALUES
(
    1,
    'Winter Warmth Clothes Distribution 2026',
    'Distributing warm clothes, blankets, and essential winter accessories to underprivileged street children around Tangail city.',
    '2026-11-15',
    'Santosh & Tangail Railway Station',
    'winter-drive.jpg',
    'upcoming'
),
(
    2,
    'Free Street Children Education & Book Fair',
    'A weekend educational campaign providing free textbooks, notebooks, drawing supplies, and basic literacy training.',
    '2026-10-25',
    'CRC Open Pathshala, Santosh',
    'education-drive.jpg',
    'ongoing'
),
(
    3,
    'Free Health Checkup and Medicine Camp',
    'Collaborative healthcare camp providing general medical checkups, hygiene kits, and medicines for street children.',
    '2026-09-10',
    'MBSTU Campus Gate',
    'health-camp.jpg',
    'completed'
),
(
    4,
    'Eid-ul-Fitr Clothes & Joy Sharing Program',
    'Gifting brand new Eid festive garments and festive snacks to street children across Tangail.',
    '2026-12-05',
    'Tangail Town Hall Ground',
    'eid-gift.jpg',
    'upcoming'
)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Seed Sample Committee Members
INSERT INTO committee (id, name, position, department, student_id, batch, photo)
VALUES
(
    1,
    'Md. Rafiul Islam',
    'President',
    'Computer Science & Engineering',
    'IT-19001',
    '17th',
    'president.jpg'
),
(
    2,
    'Nusrat Jahan',
    'General Secretary',
    'Information & Communication Technology',
    'TE-19015',
    '17th',
    'gs.jpg'
),
(
    3,
    'Sakib Al Hasan',
    'Organizing Secretary',
    'Textile Engineering',
    'TT-20030',
    '18th',
    'organizing-sec.jpg'
),
(
    4,
    'Fariha Tabassum',
    'Volunteer Coordinator',
    'Environmental Science & Resource Management',
    'ES-21012',
    '19th',
    'coordinator.jpg'
)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed Sample Gallery Images
INSERT INTO gallery (id, title, image)
VALUES
(
    1,
    'Warm Clothes Distribution in Santosh Area',
    'gallery-1.jpg'
),
(
    2,
    'Open Sky Pathshala Literacy Session',
    'gallery-2.jpg'
),
(
    3,
    'CRC Volunteer Family Group Photo at MBSTU',
    'gallery-3.jpg'
),
(
    4,
    'Free Health Screening and Dental Camp',
    'gallery-4.jpg'
),
(
    5,
    'Art & Drawing Fun Workshop with Children',
    'gallery-5.jpg'
),
(
    6,
    'Gift and Food Packets Distribution',
    'gallery-6.jpg'
)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Seed Sample Activity Registration
-- Member (user_id=2) registered for Activity (activity_id=1)
INSERT INTO registrations (user_id, activity_id)
VALUES (2, 1)
ON DUPLICATE KEY UPDATE registered_at = VALUES(registered_at);
