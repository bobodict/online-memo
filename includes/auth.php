<?php
/**
 * 用户认证相关函数
 */

require_once __DIR__ . '/../config/database.php';

/**
 * 检查用户是否已登录
 */
function is_logged_in(): bool
{
    return isset($_SESSION['user_id']);
}

/**
 * 要求登录，否则重定向到登录页
 */
function require_login(): void
{
    if (!is_logged_in()) {
        header('Location: login.php');
        exit;
    }
}

/**
 * 获取当前登录用户信息
 */
function current_user(): ?array
{
    if (!is_logged_in()) {
        return null;
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, username, email, created_at FROM users WHERE id = :id');
    $stmt->execute(['id' => $_SESSION['user_id']]);
    return $stmt->fetch() ?: null;
}

/**
 * 用户注册
 * @return array [success: bool, errors: array, user_id: int|null]
 */
function register_user(string $username, string $email, string $password, string $confirm_password): array
{
    $errors = [];

    // 验证用户名
    $username = trim($username);
    if (strlen($username) < 3 || strlen($username) > 50) {
        $errors['username'] = '用户名长度需在 3-50 个字符之间';
    } elseif (!preg_match('/^[a-zA-Z0-9_\x{4e00}-\x{9fa5}]+$/u', $username)) {
        $errors['username'] = '用户名只能包含字母、数字、下划线和中文';
    }

    // 验证邮箱
    $email = trim($email);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = '请输入有效的邮箱地址';
    }

    // 验证密码
    if (strlen($password) < 6) {
        $errors['password'] = '密码长度不能少于 6 位';
    }
    if ($password !== $confirm_password) {
        $errors['confirm_password'] = '两次输入的密码不一致';
    }

    if (!empty($errors)) {
        return ['success' => false, 'errors' => $errors, 'user_id' => null];
    }

    $db = getDB();

    // 检查用户名唯一性
    $stmt = $db->prepare('SELECT id FROM users WHERE username = :username');
    $stmt->execute(['username' => $username]);
    if ($stmt->fetch()) {
        $errors['username'] = '该用户名已被注册';
        return ['success' => false, 'errors' => $errors, 'user_id' => null];
    }

    // 检查邮箱唯一性
    $stmt = $db->prepare('SELECT id FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        $errors['email'] = '该邮箱已被注册';
        return ['success' => false, 'errors' => $errors, 'user_id' => null];
    }

    // 创建用户
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (username, email, password) VALUES (:username, :email, :password)');
    $stmt->execute([
        'username' => $username,
        'email'    => $email,
        'password' => $hashed_password,
    ]);

    $user_id = (int) $db->lastInsertId();

    // 自动登录
    $_SESSION['user_id'] = $user_id;
    session_regenerate_id(true);

    return ['success' => true, 'errors' => [], 'user_id' => $user_id];
}

/**
 * 用户登录
 * @return array [success: bool, error: string]
 */
function login_user(string $username, string $password): array
{
    $username = trim($username);

    if ($username === '' || $password === '') {
        return ['success' => false, 'error' => '请输入用户名和密码'];
    }

    $db = getDB();
    $stmt = $db->prepare('SELECT id, password FROM users WHERE username = :username');
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        return ['success' => false, 'error' => '用户名或密码错误'];
    }

    $_SESSION['user_id'] = (int) $user['id'];
    session_regenerate_id(true);

    return ['success' => true, 'error' => null];
}

/**
 * 退出登录
 */
function logout_user(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();
}
