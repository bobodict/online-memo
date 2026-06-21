<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';
require_login();
$user = current_user();
require_once __DIR__ . '/includes/header.php';
?>

<div class="app-shell">

    <!-- ===== LEFT BAR: memo list ===== -->
    <aside class="left-bar">
        <div class="bar-top">
            <span class="bar-logo">备忘录</span>
            <div class="bar-nav">
                <span><?php echo htmlspecialchars($user['username']??'', ENT_QUOTES,'UTF-8'); ?></span>
                <a href="logout.php" class="logout-link">退出</a>
            </div>
        </div>
        <div class="bar-section-title" id="bar-section-title">所有备忘录</div>
        <div class="bar-list" id="bar-list">
            <div class="bar-item-empty" id="bar-loading">加载中...</div>
            <div class="bar-item-empty" id="bar-empty" style="display:none">没有备忘录</div>
        </div>
        <div class="bar-footer" id="bar-footer"></div>
    </aside>

    <!-- ===== RIGHT PANEL: form / detail ===== -->
    <main class="right-panel" id="right-panel">
        <div class="right-empty" id="right-placeholder">
            <div class="right-empty-icon">+</div>
            <p>选择或创建备忘录</p>
            <p class="sub">在下方表单新建，或从左侧列表选择</p>
        </div>

        <div class="form-area" id="form-area">
            <h2 id="form-heading">新建备忘录</h2>
            <div class="form-card">
                <div class="form-row">
                    <div class="form-field">
                        <label for="memo-title">标题</label>
                        <input type="text" id="memo-title" class="input" maxlength="200" placeholder="输入标题...">
                        <span class="field-error" id="title-error"></span>
                    </div>
                    <div class="form-field">
                        <label for="memo-content">内容</label>
                        <textarea id="memo-content" class="input" maxlength="5000" placeholder="输入内容..."></textarea>
                        <span class="char-count" id="content-count">0 / 5000</span>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" id="submit-btn">添加备忘录</button>
                        <button class="btn btn-secondary" id="cancel-edit-btn" style="display:none">取消</button>
                        <button class="btn btn-danger btn-sm" id="delete-edit-btn" style="display:none;margin-left:auto">删除</button>
                    </div>
                </div>
            </div>
        </div>
    </main>

</div>

<meta name="csrf-token" content="<?php echo csrf_token(); ?>">

<?php require_once __DIR__ . '/includes/footer.php'; ?>
