<?php
require_once __DIR__ . '/session.php';
require_once __DIR__ . '/auth.php';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>在线备忘录</title>
    <link rel="stylesheet" href="css/style.css?v=7">
</head>
<body>

<aside class="sidebar">
    <a href="index.php" class="sidebar-logo">M<span>.</span></a>
    <nav class="sidebar-nav">
        <a href="index.php" class="sidebar-link active">备忘录</a>
        <?php if (is_logged_in()): ?>
            <a href="logout.php" class="sidebar-link logout">退出</a>
            <div class="sidebar-user"><?php $u=current_user(); echo htmlspecialchars($u['username']??'', ENT_QUOTES,'UTF-8'); ?></div>
        <?php else: ?>
            <a href="login.php" class="sidebar-link">登录</a>
            <a href="register.php" class="sidebar-link">注册</a>
        <?php endif; ?>
    </nav>
</aside>

<div class="layout">
