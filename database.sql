-- SITC Meeting Room Booking System Database
-- MySQL Database Schema

-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS sitc_meeting_booking 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE sitc_meeting_booking;

-- ตาราง users (ผู้ใช้งาน)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department ENUM('IT', 'HR&Admin', 'Sales&Marketing', 'DocInbound', 'DocOutbound', 'Accounting', 'CS', 'ECD', 'Operation') NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_department (department),
    INDEX idx_active (is_active)
);

-- ตาราง meeting_rooms (ห้องประชุม)
CREATE TABLE meeting_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity INT NOT NULL,
    location VARCHAR(255),
    equipment JSON, -- เก็บอุปกรณ์ในรูปแบบ JSON เช่น ["projector", "whiteboard", "video_conference"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_capacity (capacity),
    INDEX idx_active (is_active)
);

-- ตาราง bookings (การจอง)
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    attendees_count INT DEFAULT 1,
    status ENUM('pending', 'approved', 'rejected', 'cancelled', 'completed') DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_datetime_range (start_time, end_time),
    
    -- ป้องกันการจองซ้อนทับ
    CONSTRAINT chk_booking_time CHECK (end_time > start_time)
);

-- ตาราง booking_attendees (ผู้เข้าร่วม)
CREATE TABLE booking_attendees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    status ENUM('invited', 'accepted', 'declined') DEFAULT 'invited',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_email (email),
    
    UNIQUE KEY unique_booking_attendee (booking_id, email)
);

-- ตาราง email_verifications (การยืนยันอีเมล)
CREATE TABLE email_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- ตาราง notifications (การแจ้งเตือน)
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('booking_created', 'booking_approved', 'booking_rejected', 'booking_cancelled', 'booking_reminder') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_booking_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ตาราง settings (การตั้งค่าระบบ)
CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ข้อมูลเริ่มต้น
-- ข้อมูลผู้ดูแลระบบ (password: admin123)
INSERT INTO users (email, password, first_name, last_name, phone, department, role, email_verified) VALUES
('admin@sitcthai.com', '$2b$10$vE8.rBmvE2YxBmJ7YEGzEOxKzCbYz4gBqW0jBqHlXqvM9YWvFtKsK', 'Admin', 'System', '02-xxx-xxxx', 'IT', 'admin', TRUE);

-- ข้อมูลห้องประชุมตัวอย่าง
INSERT INTO meeting_rooms (name, description, capacity, location, equipment) VALUES
('Conference Room A', 'ห้องประชุมใหญ่สำหรับการประชุมระดับผู้บริหาร', 20, 'ชั้น 1', '["projector", "whiteboard", "video_conference", "sound_system"]'),
('Meeting Room B', 'ห้องประชุมขนาดกลางสำหรับทีมงาน', 10, 'ชั้น 2', '["projector", "whiteboard", "flip_chart"]'),
('Small Meeting Room C', 'ห้องประชุมเล็กสำหรับการประชุมแบบส่วนตัว', 6, 'ชั้น 2', '["whiteboard", "tv_screen"]'),
('Training Room D', 'ห้องอบรมสำหรับการฝึกอบรม', 30, 'ชั้น 3', '["projector", "sound_system", "microphone", "flip_chart"]');

-- การตั้งค่าระบบ
INSERT INTO settings (key_name, value, description) VALUES
('booking_advance_days', '30', 'จำนวนวันที่สามารถจองล่วงหน้าได้'),
('max_booking_duration', '8', 'ระยะเวลาการจองสูงสุด (ชั่วโมง)'),
('booking_reminder_minutes', '30', 'เวลาแจ้งเตือนก่อนการประชุม (นาที)'),
('office_start_time', '08:00', 'เวลาเริ่มต้นของสำนักงาน'),
('office_end_time', '18:00', 'เวลาสิ้นสุดของสำนักงาน');

-- สร้าง index เพิ่มเติมเพื่อประสิทธิภาพ
CREATE INDEX idx_bookings_room_datetime ON bookings(room_id, start_time, end_time);
CREATE INDEX idx_users_email_active ON users(email, is_active);
