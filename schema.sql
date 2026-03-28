-- ============================================================
-- StudyAI Platform - Database Schema (JWT Auth + Clerk mapping)
-- Run: mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS studyfetch3;
USE studyfetch3;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255)  NOT NULL,
  email            VARCHAR(255)  UNIQUE NOT NULL,
  password         VARCHAR(255)  NOT NULL,
  university       VARCHAR(255)  NULL,
  year_of_study    VARCHAR(50)   NULL,
  daily_study_hours DECIMAL(4,1) DEFAULT 4,
  study_preference ENUM('morning','afternoon','evening','night') DEFAULT 'morning',
  google_id        VARCHAR(255)  NULL UNIQUE,
  clerk_id         VARCHAR(255)  NULL UNIQUE,
  avatar_url       VARCHAR(500)  NULL,
  xp_points        INT           DEFAULT 0,
  level            INT           DEFAULT 1,
  difficulty_level ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  composite_score  INT           DEFAULT 0,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Subjects ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT          NOT NULL,
  subject_name   VARCHAR(255) NOT NULL,
  priority_level ENUM('low','medium','high') DEFAULT 'medium',
  color          VARCHAR(20)  DEFAULT '#7b68ee',
  mastery_score  DECIMAL(5,2) DEFAULT 0,
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  subject_id      INT          NULL,
  title           VARCHAR(255) NOT NULL,
  description     TEXT         NULL,
  deadline        DATE         NULL,
  difficulty      ENUM('easy','medium','hard') DEFAULT 'medium',
  estimated_hours DECIMAL(4,1) DEFAULT 2,
  status          ENUM('pending','in_progress','completed') DEFAULT 'pending',
  priority_score  DECIMAL(5,2) DEFAULT 50,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- ── Study Materials ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT          NOT NULL,
  subject_id     INT          NULL,
  title          VARCHAR(255) NOT NULL,
  file_type      ENUM('pdf','image','audio','video','youtube','text') NOT NULL,
  file_path      VARCHAR(500) NULL,
  youtube_url    VARCHAR(500) NULL,
  extracted_text LONGTEXT     NULL,
  file_size      INT          NULL,
  status         ENUM('processing','ready','failed') DEFAULT 'processing',
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- ── Flashcards ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT       NOT NULL,
  material_id    INT       NULL,
  subject_id     INT       NULL,
  question       TEXT      NOT NULL,
  answer         TEXT      NOT NULL,
  topic          VARCHAR(255) NULL,
  difficulty     ENUM('easy','medium','hard') DEFAULT 'medium',
  times_reviewed INT       DEFAULT 0,
  correct_count  INT       DEFAULT 0,
  next_review_at TIMESTAMP NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id)  REFERENCES subjects(id)  ON DELETE SET NULL
);

-- ── Quiz Questions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_questions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  material_id     INT          NULL,
  subject_id      INT          NULL,
  quiz_session_id VARCHAR(100) NULL,
  question        TEXT         NOT NULL,
  option_a        TEXT         NOT NULL,
  option_b        TEXT         NOT NULL,
  option_c        TEXT         NOT NULL,
  option_d        TEXT         NOT NULL,
  answer          ENUM('A','B','C','D') NOT NULL,
  explanation     TEXT         NULL,
  topic           VARCHAR(255) NULL,
  difficulty      ENUM('easy','medium','hard') DEFAULT 'medium',
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_id)  REFERENCES subjects(id)  ON DELETE SET NULL
);

-- ── Quiz Attempts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT          NOT NULL,
  quiz_session_id    VARCHAR(100) NOT NULL,
  question_id        INT          NOT NULL,
  selected_answer    ENUM('A','B','C','D') NULL,
  is_correct         BOOLEAN      NULL,
  time_taken_seconds INT          NULL,
  created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (question_id)  REFERENCES quiz_questions(id) ON DELETE CASCADE
);

-- ── Progress Tracking ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  subject_id      INT          NULL,
  date            DATE         NOT NULL,
  topics_studied  TEXT         NULL,
  quiz_score      DECIMAL(5,2) NULL,
  study_hours     DECIMAL(4,1) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  mastery_delta   DECIMAL(5,2) DEFAULT 0,
  notes           TEXT         NULL,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- ── Spark.E Chat History ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  material_id INT          NULL,
  session_id  VARCHAR(100) NOT NULL,
  role        ENUM('user','assistant') NOT NULL,
  content     TEXT         NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
);

-- ── Study Groups ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_groups (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT         NULL,
  subject     VARCHAR(255) NULL,
  owner_id    INT          NOT NULL,
  invite_code VARCHAR(20)  UNIQUE,
  is_public   BOOLEAN      DEFAULT FALSE,
  max_members INT          DEFAULT 10,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Group Members ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  group_id   INT NOT NULL,
  user_id    INT NOT NULL,
  role       ENUM('owner','admin','member') DEFAULT 'member',
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE
);

-- ── Group Discussions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_discussions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  group_id   INT  NOT NULL,
  user_id    INT  NOT NULL,
  content    TEXT NOT NULL,
  parent_id  INT  NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE
);

-- ── Shared Flashcards ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_flashcards (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  group_id     INT NOT NULL,
  flashcard_id INT NOT NULL,
  shared_by    INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id)     REFERENCES study_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (flashcard_id) REFERENCES flashcards(id)   ON DELETE CASCADE,
  FOREIGN KEY (shared_by)    REFERENCES users(id)        ON DELETE CASCADE
);

-- ── Calendar Events ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT          NOT NULL,
  subject_id       INT          NULL,
  task_id          INT          NULL,
  title            VARCHAR(255) NOT NULL,
  start_time       DATETIME     NOT NULL,
  end_time         DATETIME     NOT NULL,
  event_type       ENUM('study','exam','assignment','revision','break') DEFAULT 'study',
  is_ai_generated  BOOLEAN      DEFAULT FALSE,
  color            VARCHAR(20)  NULL,
  completed        BOOLEAN      DEFAULT FALSE,
  notes            TEXT         NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (task_id)    REFERENCES tasks(id)    ON DELETE SET NULL
);

-- ── Exam Predictions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_predictions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT  NOT NULL,
  subject_id        INT  NULL,
  predicted_topics  TEXT NULL,
  confidence_scores TEXT NULL,
  generated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

-- ── AI Timetable Slots ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_slots (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT          NOT NULL,
  date             DATE         NOT NULL,
  start_time       VARCHAR(10)  NOT NULL,
  end_time         VARCHAR(10)  NOT NULL,
  subject          VARCHAR(255) NULL,
  task_title       VARCHAR(255) NULL,
  activity         ENUM('Study','Revision','Practice','Break','Exam') DEFAULT 'Study',
  duration_minutes INT          DEFAULT 60,
  difficulty       ENUM('easy','medium','hard') DEFAULT 'medium',
  notes            TEXT         NULL,
  color            VARCHAR(20)  DEFAULT '#7b68ee',
  completed        BOOLEAN      DEFAULT FALSE,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── User Feedback ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  rating     ENUM('helpful','not_helpful') NOT NULL,
  comment    TEXT         NULL,
  plan_type  VARCHAR(50)  DEFAULT 'general',
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Performance Log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_log (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT           NOT NULL,
  subject_id   INT           NULL,
  metric_type  VARCHAR(100)  NULL,
  metric_value DECIMAL(8,2)  NULL,
  logged_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
