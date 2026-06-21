<?php
/**
 * 注册页面
 * 支持 GET（显示表单）和 POST（处理注册）
 */

require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';

// 已登录则重定向
if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$errors = [];
$old = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old = [
        'username' => $_POST['username'] ?? '',
        'email'    => $_POST['email'] ?? '',
    ];

    // CSRF 验证
    if (!csrf_verify($_POST['csrf_token'] ?? '')) {
        $errors['general'] = '请求无效，请刷新页面后重试';
    } else {
        $result = register_user(
            $_POST['username'] ?? '',
            $_POST['email'] ?? '',
            $_POST['password'] ?? '',
            $_POST['confirm_password'] ?? ''
        );

        if ($result['success']) {
            header('Location: index.php');
            exit;
        }

        $errors = $result['errors'];
    }
}

$page_title = '注册 - 在线备忘录';
require_once __DIR__ . '/includes/header.php';
?>

<div class="auth-page">
    <div class="auth-card">
        <h1 class="auth-title">注册</h1>
        <p class="auth-subtitle">创建一个新的备忘录账号</p>

        <?php if (!empty($errors['general'])): ?>
            <div class="alert alert-error"><?php echo htmlspecialchars($errors['general'], ENT_QUOTES, 'UTF-8'); ?></div>
        <?php endif; ?>

        <form method="POST" action="register.php" class="auth-form" novalidate id="register-form">
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">

            <div class="form-group">
                <label for="username">用户名</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    class="form-input<?php echo isset($errors['username']) ? ' form-input-error' : ''; ?>"
                    required
                    pattern="[a-zA-Z0-9_一-龥]{3,50}"
                    maxlength="50"
                    autocomplete="username"
                    placeholder="3-50位字母、数字、下划线或中文"
                    value="<?php echo htmlspecialchars($old['username'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"
                >
                <?php if (!empty($errors['username'])): ?>
                    <span class="form-error"><?php echo htmlspecialchars($errors['username'], ENT_QUOTES, 'UTF-8'); ?></span>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="email">邮箱</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    class="form-input<?php echo isset($errors['email']) ? ' form-input-error' : ''; ?>"
                    required
                    autocomplete="email"
                    placeholder="请输入邮箱地址"
                    value="<?php echo htmlspecialchars($old['email'] ?? '', ENT_QUOTES, 'UTF-8'); ?>"
                >
                <?php if (!empty($errors['email'])): ?>
                    <span class="form-error"><?php echo htmlspecialchars($errors['email'], ENT_QUOTES, 'UTF-8'); ?></span>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="password">密码</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    class="form-input<?php echo isset($errors['password']) ? ' form-input-error' : ''; ?>"
                    required
                    minlength="6"
                    autocomplete="new-password"
                    placeholder="至少6位密码"
                >
                <?php if (!empty($errors['password'])): ?>
                    <span class="form-error"><?php echo htmlspecialchars($errors['password'], ENT_QUOTES, 'UTF-8'); ?></span>
                <?php endif; ?>
            </div>

            <div class="form-group">
                <label for="confirm_password">确认密码</label>
                <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    class="form-input<?php echo isset($errors['confirm_password']) ? ' form-input-error' : ''; ?>"
                    required
                    minlength="6"
                    autocomplete="new-password"
                    placeholder="请再次输入密码"
                >
                <?php if (!empty($errors['confirm_password'])): ?>
                    <span class="form-error"><?php echo htmlspecialchars($errors['confirm_password'], ENT_QUOTES, 'UTF-8'); ?></span>
                <?php endif; ?>
            </div>

            <button type="submit" class="btn btn-primary btn-block">注 册</button>
        </form>

        <p class="auth-footer-text">
            已有账号？<a href="login.php">去登录 →</a>
        </p>
    </div>
</div>

<?php
require_once __DIR__ . '/includes/footer.php';
