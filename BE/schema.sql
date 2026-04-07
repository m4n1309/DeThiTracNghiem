-- Online Examination System - MySQL Database Schema
-- Last updated to reflect actual database structure

-- 1. Users: Admin & Giảng viên
CREATE TABLE Users (
    user_id      INT PRIMARY KEY AUTO_INCREMENT,
    username     VARCHAR(50) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(100) NOT NULL UNIQUE,
    phone        VARCHAR(20),
    role         ENUM('admin', 'teacher') NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Subjects: Môn học
CREATE TABLE Subjects (
    subject_id   INT PRIMARY KEY AUTO_INCREMENT,
    subject_code VARCHAR(20) NOT NULL UNIQUE,
    subject_name VARCHAR(100) NOT NULL,
    description  TEXT,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Subject_Teachers: Phân công giảng viên phụ trách môn học
CREATE TABLE Subject_Teachers (
    subject_id   INT NOT NULL,
    teacher_id   INT NOT NULL,
    PRIMARY KEY (subject_id, teacher_id),
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 4. Questions: Ngân hàng câu hỏi
CREATE TABLE Questions (
    question_id    INT PRIMARY KEY AUTO_INCREMENT,
    subject_id     INT NOT NULL,
    content        TEXT NOT NULL,
    options        JSON NOT NULL, -- [{"label":"A","text":"..."},...] or string array
    correct_answer JSON NOT NULL, -- ["A"] hoặc ["A","C"] etc.
    difficulty     ENUM('easy','medium','hard') NOT NULL,
    question_type  ENUM('single', 'multiple') DEFAULT 'single',
    points         DECIMAL(5,2) DEFAULT 1.0,
    image_url      VARCHAR(255),
    is_active      BOOLEAN DEFAULT TRUE,
    created_by     INT NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 5. Exams: Kỳ thi và cấu hình đề thi
CREATE TABLE Exams (
    exam_id           INT PRIMARY KEY AUTO_INCREMENT,
    exam_name         VARCHAR(100) NOT NULL,
    subject_id        INT NOT NULL,
    created_by        INT NOT NULL,
    start_time        DATETIME,
    end_time          DATETIME,
    duration_minutes  INT NOT NULL,
    total_questions   INT NOT NULL,
    easy_percent      INT DEFAULT 0,
    medium_percent    INT DEFAULT 0,
    hard_percent      INT DEFAULT 0,
    total_points      DECIMAL(6,2) DEFAULT 0,
    passing_score     DECIMAL(6,2) DEFAULT 0,
    allow_practice    BOOLEAN DEFAULT FALSE,
    practice_limit    INT DEFAULT 0,
    is_active         BOOLEAN DEFAULT TRUE,
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options   BOOLEAN DEFAULT TRUE,
    show_results      BOOLEAN DEFAULT TRUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES Subjects(subject_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);

-- 6. Exam_Participants: Danh sách học viên tham gia kỳ thi
CREATE TABLE Exam_Participants (
    participant_id INT PRIMARY KEY AUTO_INCREMENT,
    exam_id        INT NOT NULL,
    exam_code      VARCHAR(20) NOT NULL, -- Số báo danh
    full_name      VARCHAR(100) NOT NULL,
    student_code   VARCHAR(30),
    class_name     VARCHAR(50),
    email          VARCHAR(100),
    practice_used  INT DEFAULT 0,
    official_done  BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES Exams(exam_id),
    UNIQUE KEY uq_exam_participant_code (exam_id, exam_code),
    UNIQUE KEY uq_exam_student_code (exam_id, student_code),
    INDEX idx_exam_id (exam_id)
);

-- 7. Attempts: Lượt thi của học viên
CREATE TABLE Attempts (
    attempt_id     INT PRIMARY KEY AUTO_INCREMENT,
    exam_id        INT NOT NULL,
    participant_id INT NOT NULL,
    is_practice    BOOLEAN DEFAULT FALSE,
    start_time     DATETIME NOT NULL,
    end_time       DATETIME,
    status         ENUM('doing','submitted','timeout') DEFAULT 'doing',
    attempt_type   ENUM('mock', 'official') DEFAULT 'official',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES Exams(exam_id),
    FOREIGN KEY (participant_id) REFERENCES Exam_Participants(participant_id)
);

-- 8. Attempt_Details: Chi tiết câu hỏi và đáp án trong từng lượt thi
CREATE TABLE Attempt_Details (
    detail_id        INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id       INT NOT NULL,
    question_id      INT NOT NULL,
    selected_answer  JSON NOT NULL,
    is_correct       BOOLEAN,
    points_earned    DECIMAL(5,2) DEFAULT 0,
    shuffled_options JSON DEFAULT NULL,
    FOREIGN KEY (attempt_id) REFERENCES Attempts(attempt_id),
    FOREIGN KEY (question_id) REFERENCES Questions(question_id),
    UNIQUE KEY uq_attempt_question (attempt_id, question_id)
);

-- 9. Results: Kết quả thi tổng hợp
CREATE TABLE Results (
    result_id      INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    exam_id        INT NOT NULL,
    attempt_id     INT NOT NULL,
    total_score    DECIMAL(6,2) DEFAULT 0,
    passed         BOOLEAN,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES Exam_Participants(participant_id),
    FOREIGN KEY (exam_id) REFERENCES Exams(exam_id),
    FOREIGN KEY (attempt_id) REFERENCES Attempts(attempt_id)
);

-- 10. Default Data (Runs on initial setup)
-- Account: admin / admin123
INSERT INTO Users (username, password, full_name, email, role, is_active) 
VALUES ('admin', '$2b$10$sl0FQ.0b6zRD5CYyXKgiBeeRgA.5r5Sbh7gLUlVLVcFcU09W6GxRS', 'Quản trị viên', 'admin@system.com', 'admin', 1);
