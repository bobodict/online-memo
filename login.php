<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';
if (is_logged_in()) { header('Location: index.php'); exit; }
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!csrf_verify($_POST['csrf_token'] ?? '')) {
        $error = '请求无效，请刷新后重试';
    } else {
        $result = login_user($_POST['username'] ?? '', $_POST['password'] ?? '');
        if ($result['success']) { header('Location: index.php'); exit; }
        $error = $result['error'];
    }
}
require_once __DIR__ . '/includes/header.php';
?>

<div class="auth-centered">
    <div class="auth-box">
        <h1>登录</h1>
        <p class="sub">登录你的备忘录账号</p>
        <?php if ($error): ?>
            <p style="color:var(--red);font-family:var(--mono);font-size:0.72rem;margin-bottom:16px"><?php echo htmlspecialchars($error, ENT_QUOTES, 'UTF-8'); ?></p>
        <?php endif; ?>
        <form method="POST" class="form-block" style="border-bottom:0;padding-bottom:0;margin-bottom:20px">
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
            <div class="form-row" style="flex-direction:column;gap:18px">
                <div class="form-field">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" class="input" required autocomplete="username" placeholder="用户名" value="<?php echo htmlspecialchars($_POST['username'] ?? '', ENT_QUOTES, 'UTF-8'); ?>">
                </div>
                <div class="form-field">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" class="input" required autocomplete="current-password" placeholder="密码">
                </div>
                <button type="submit" class="btn btn-primary btn-block">登 录</button>
            </div>
        </form>
        <p style="font-family:var(--mono);font-size:0.68rem;color:var(--gray-mid)">还没有账号？<a href="register.php" style="color:var(--black);font-weight:600">注册</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
