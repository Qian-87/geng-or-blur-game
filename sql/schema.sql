-- Create database and table
CREATE DATABASE IF NOT EXISTS geng_or_blur CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE geng_or_blur;

CREATE TABLE IF NOT EXISTS scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(200) NOT NULL,
  total_score INT NOT NULL,
  total_duration_ms INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 兼容索引（旧版 MySQL 不支持 DESC 索引的就用这个）
DROP INDEX idx_scores_order ON scores;
CREATE INDEX idx_scores_order ON scores (total_score, total_duration_ms, created_at);
