<?php
/**
 * 登录页面
 * 支持 GET（显示表单）和 POST（处理登录）
 */

require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';

// 已登录则重定向
if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF 验证
    if (!csrf_verify($_POST['csrf_token'] ?? '')) {
        $error = '请求无效，请刷新页面后重试';
    } else {
        $result = login_user($_POST['username'] ?? '', $_POST['password'] ?? '');
        if ($result['success']) {
            header('Location: index.php');
            exit;
        }
        $error = $result['error'];
    }
}

$page_title = '登录 - 在线备忘录';
require_once __DIR__ . '/includes/header.php';
?>

<div class="auth-page">
    <div class="auth-card">
        <h1 class="auth-title">登录</h1>
        <p class="auth-subtitle">登录你的备忘录账号</p>

        <?php if ($error): ?>
            <div class="alert alert-error"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></div>
        <?php endif; ?>

        <form method="POST" action="login.php" class="auth-form" novalidate>
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

            <div class="form-group">
                <label for="username">用户名</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    class="form-input"
                    required
                    autocomplete="username"
                    placeholder="请输入用户名"
                    value="<?php echo htmlspecialchars($_POST['username'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"
                >
            </div>

            <div class="form-group">
                <label for="password">密码</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    class="form-input"
                    required
                    autocomplete="current-password"
                    placeholder="请输入密码"
                >
            </div>

            <button type="submit" class="btn btn-primary btn-block">登 录</button>
        </form>

        <p class="auth-footer-text">
            还没有账号？<a href="register.php">去注册 →</a>
        </p>
    </div>
</div>

<?php
require_once __DIR__ . '/includes/footer.php';
