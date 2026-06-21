<?php
/**
 * 公共 HTML 头部
 * 包含 DOCTYPE、meta 标签、CSS 引入、导航栏
 */

require_once __DIR__ . '/session.php';
require_once __DIR__ . '/auth.php';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>在线备忘录</title>
    <link rel="stylesheet" href="css/style.css?v=3">
</head>
<body>
    <header class="header">
        <div class="header-inner">
            <a href="index.php" class="logo">📝 在线备忘录</a>
            <nav class="nav">
                <?php if (is_logged_in()): ?>
                    <?php $user = current_user(); ?>
                    <span class="nav-user">👤 <?php echo htmlspecialchars($user['username'] ?? '', ENT_QUOTES, 'UTF-8'); ?></span>
                    <a href="logout.php" class="nav-link nav-logout">退出登录</a>
                <?php else: ?>
                    <a href="login.php" class="nav-link">登录</a>
                    <a href="register.php" class="nav-link">注册</a>
                <?php endif; ?>
            </nav>
        </div>
    </header>
    <main class="main">
