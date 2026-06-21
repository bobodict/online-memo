<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';
if (is_logged_in()) { header('Location: index.php'); exit; }
$errors = []; $old = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old = ['username' => $_POST['username'] ?? '', 'email' => $_POST['email'] ?? ''];
    if (!csrf_verify($_POST['csrf_token'] ?? '')) {
        $errors['general'] = '请求无效，请刷新后重试';
    } else {
        $result = register_user($_POST['username'] ?? '', $_POST['email'] ?? '', $_POST['password'] ?? '', $_POST['confirm_password'] ?? '');
        if ($result['success']) { header('Location: index.php'); exit; }
        $errors = $result['errors'];
    }
}
require_once __DIR__ . '/includes/header.php';
?>

<div class="auth-centered">
    <div class="auth-box">
        <h1>注册</h1>
        <p class="sub">创建一个新账号</p>
        <?php if (!empty($errors['general'])): ?>
            <p style="color:var(--red);font-family:var(--mono);font-size:0.72rem;margin-bottom:16px"><?php echo htmlspecialchars($errors['general'], ENT_QUOTES, 'UTF-8'); ?></p>
        <?php endif; ?>
        <form method="POST" class="form-block" style="border-bottom:0;padding-bottom:0;margin-bottom:20px">
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
            <div class="form-row" style="flex-direction:column;gap:18px">
                <div class="form-field">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" class="input<?php echo isset($errors['username'])?' input-error':''; ?>" required maxlength="50" placeholder="3-50位" value="<?php echo htmlspecialchars($old['username']??'', ENT_QUOTES, 'UTF-8'); ?>">
                    <?php if (!empty($errors['username'])): ?><span class="field-error"><?php echo htmlspecialchars($errors['username'], ENT_QUOTES, 'UTF-8'); ?></span><?php endif; ?>
                </div>
                <div class="form-field">
                    <label for="email">邮箱</label>
                    <input type="email" id="email" name="email" class="input<?php echo isset($errors['email'])?' input-error':''; ?>" required placeholder="your@email.com" value="<?php echo htmlspecialchars($old['email']??'', ENT_QUOTES, 'UTF-8'); ?>">
                    <?php if (!empty($errors['email'])): ?><span class="field-error"><?php echo htmlspecialchars($errors['email'], ENT_QUOTES, 'UTF-8'); ?></span><?php endif; ?>
                </div>
                <div class="form-field">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" class="input<?php echo isset($errors['password'])?' input-error':''; ?>" required minlength="6" placeholder="至少6位">
                    <?php if (!empty($errors['password'])): ?><span class="field-error"><?php echo htmlspecialchars($errors['password'], ENT_QUOTES, 'UTF-8'); ?></span><?php endif; ?>
                </div>
                <div class="form-field">
                    <label for="confirm_password">确认密码</label>
                    <input type="password" id="confirm_password" name="confirm_password" class="input<?php echo isset($errors['confirm_password'])?' input-error':''; ?>" required minlength="6" placeholder="再次输入">
                    <?php if (!empty($errors['confirm_password'])): ?><span class="field-error"><?php echo htmlspecialchars($errors['confirm_password'], ENT_QUOTES, 'UTF-8'); ?></span><?php endif; ?>
                </div>
                <button type="submit" class="btn btn-primary btn-block">注 册</button>
            </div>
        </form>
        <p style="font-family:var(--mono);font-size:0.68rem;color:var(--gray-mid)">已有账号？<a href="login.php" style="color:var(--black);font-weight:600">登录</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
