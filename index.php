<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';
require_login();
$user = current_user();
require_once __DIR__ . '/includes/header.php';
?>

<div class="main-content">
    <div class="dashboard-header">
        <h2>你好，<?php echo htmlspecialchars($user['username'] ?? '', ENT_QUOTES, 'UTF-8'); ?></h2>
        <p class="text-secondary">管理你的备忘录</p>
    </div>

    <!-- 新建表单 -->
    <div class="form-block">
        <h3>新备忘录</h3>
        <div class="form-row">
            <div class="form-field" style="flex:2">
                <label for="memo-title">标题</label>
                <input type="text" id="memo-title" class="input" maxlength="200" placeholder="输入标题...">
                <span class="field-error" id="title-error"></span>
            </div>
            <div class="form-field" style="flex:3">
                <label for="memo-content">内容 <span style="color:var(--gray-mid)">(可选)</span></label>
                <input type="text" id="memo-content" class="input" maxlength="5000" placeholder="输入内容...">
                <span class="char-count" id="content-count">0 / 5000</span>
            </div>
            <button type="submit" class="btn btn-primary" id="submit-btn" style="margin-bottom:0;align-self:flex-end">添加</button>
            <button type="button" class="btn" id="cancel-edit-btn" style="display:none;align-self:flex-end">取消</button>
        </div>
    </div>

    <!-- 消息 -->
    <div id="message-container"></div>

    <!-- 备忘录列表 -->
    <div class="memo-section">
        <h3>所有备忘录 <span class="memo-count" id="memo-count"></span></h3>
        <div id="loading-state" class="empty-state"><div class="spinner"></div><p>加载中</p></div>
        <div id="memo-list" class="memo-list" style="display:none"></div>
        <div id="empty-state" class="empty-state" style="display:none"><p>还没有备忘录</p></div>
    </div>
</div>

<meta name="csrf-token" content="<?php echo csrf_token(); ?>">

<?php require_once __DIR__ . '/includes/footer.php'; ?>
