<?php
/**
 * 会话管理
 * 启动会话并初始化 CSRF Token
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 为每个会话生成唯一的 CSRF Token
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

/**
 * 获取当前 CSRF Token
 */
function csrf_token(): string
{
    return $_SESSION['csrf_token'] ?? '';
}

/**
 * 验证 CSRF Token
 */
function csrf_verify(string $token): bool
{
    return isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $token);
}
