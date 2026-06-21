-- ============================================
-- 在线备忘录 (Online Memo) 数据库初始化脚本
-- 使用方法：在 MySQL 中执行此文件
--   mysql -u root -p < schema.sql
-- 或在 phpMyAdmin 中导入
-- ============================================

CREATE DATABASE IF NOT EXISTS online_memo
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE online_memo;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 备忘录表
CREATE TABLE IF NOT EXISTS memos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    title        VARCHAR(200) NOT NULL,
    content      TEXT,
    is_completed TINYINT(1) DEFAULT 0 COMMENT '0=未完成, 1=已完成',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
