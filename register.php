<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';
if (is_logged_in()) { header('Location: index.php'); exit; }
$errors = []; $old = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $old = ['username' => $_POST['username'] ?? '', 'email' => $_POST['email'] ?? ''];
    if (!csrf_verify($_POST['csrf_token'] ?? '')) { $errors['general'] = '请求无效'; }
    else { $r = register_user($_POST['username'] ?? '', $_POST['email'] ?? '', $_POST['password'] ?? '', $_POST['confirm_password'] ?? ''); if ($r['success']) { header('Location: index.php'); exit; } $errors = $r['errors']; }
}
require_once __DIR__ . '/includes/header.php';
?>
<div class="auth-page">
    <div class="auth-box">
        <h1>注册</h1>
        <p class="sub">创建新账号</p>
        <?php if (!empty($errors['general'])): ?><p style="color:var(--red);font-size:0.8rem;margin-bottom:16px"><?php echo htmlspecialchars($errors['general'], ENT_QUOTES, 'UTF-8'); ?></p><?php endif; ?>
        <form method="POST" style="display:flex;flex-direction:column;gap:16px">
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
            <div class="form-field"><label for="username">用户名</label><input type="text" id="username" name="username" class="input-auth<?php echo isset($errors['username'])?' input-auth-error':''; ?>" required maxlength="50" placeholder="3-50位" value="<?php echo htmlspecialchars($old['username']??'', ENT_QUOTES,'UTF-8'); ?>"><?php if(!empty($errors['username'])) echo '<span class="field-error">'.htmlspecialchars($errors['username']).'</span>'; ?></div>
            <div class="form-field"><label for="email">邮箱</label><input type="email" id="email" name="email" class="input-auth<?php echo isset($errors['email'])?' input-auth-error':''; ?>" required placeholder="your@email.com" value="<?php echo htmlspecialchars($old['email']??'', ENT_QUOTES,'UTF-8'); ?>"><?php if(!empty($errors['email'])) echo '<span class="field-error">'.htmlspecialchars($errors['email']).'</span>'; ?></div>
            <div class="form-field"><label for="password">密码</label><input type="password" id="password" name="password" class="input-auth<?php echo isset($errors['password'])?' input-auth-error':''; ?>" required minlength="6" placeholder="至少6位"><?php if(!empty($errors['password'])) echo '<span class="field-error">'.htmlspecialchars($errors['password']).'</span>'; ?></div>
            <div class="form-field"><label for="confirm_password">确认密码</label><input type="password" id="confirm_password" name="confirm_password" class="input-auth<?php echo isset($errors['confirm_password'])?' input-auth-error':''; ?>" required minlength="6" placeholder="再次输入"><?php if(!empty($errors['confirm_password'])) echo '<span class="field-error">'.htmlspecialchars($errors['confirm_password']).'</span>'; ?></div>
            <button type="submit" class="btn btn-primary btn-block">注册</button>
        </form>
        <p class="auth-link">已有账号？<a href="login.php">登录</a></p>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
