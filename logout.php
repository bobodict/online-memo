<?php
/**
 * 退出登录
 * 销毁会话并重定向到登录页
 */

require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';

logout_user();
header('Location: login.php');
exit;
