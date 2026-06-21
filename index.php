<?php
require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';
require_login();
$user = current_user();
require_once __DIR__ . '/includes/header.php';
?>

<div class="app-shell">

    <!-- ===== LEFT BAR ===== -->
    <aside class="left-bar">
        <div class="bar-top">
            <span class="bar-logo">备忘录</span>
            <div class="bar-nav">
                <span><?php echo htmlspecialchars($user['username']??'', ENT_QUOTES,'UTF-8'); ?></span>
                <a href="logout.php" class="logout-link">退出</a>
            </div>
        </div>
        <button class="btn-new-memo" id="btn-new-memo">+ 新建备忘录</button>
        <div class="bar-section-title" id="bar-section-title">全部</div>
        <div class="bar-list" id="bar-list">
            <div class="bar-item-empty" id="bar-loading">加载中...</div>
            <div class="bar-item-empty" id="bar-empty" style="display:none">没有备忘录</div>
        </div>
        <div class="bar-footer" id="bar-footer"></div>
    </aside>

    <!-- ===== RIGHT PANEL ===== -->
    <main class="right-panel" id="right-panel">

        <!-- 空状态：什么都没选 -->
        <div class="right-placeholder" id="right-placeholder">
            <span class="placeholder-icon">&#9998;</span>
            <p>选择一条备忘录</p>
            <p class="sub">或点击左边「+ 新建备忘录」</p>
        </div>

        <!-- 编辑器：新建 or 编辑 -->
        <div class="editor" id="editor" style="display:none">
            <div class="editor-toolbar">
                <span class="editor-mode" id="editor-mode">新建</span>
                <div class="editor-actions">
                    <button class="btn btn-sm" id="btn-toggle" style="display:none">标记完成</button>
                    <button class="btn btn-sm btn-danger" id="btn-delete" style="display:none">删除</button>
                    <button class="btn btn-primary btn-sm" id="btn-save">保存</button>
                </div>
            </div>
            <div class="editor-body">
                <input type="text" class="editor-title" id="editor-title" placeholder="标题" maxlength="200">
                <textarea class="editor-content" id="editor-content" placeholder="开始写..." maxlength="5000"></textarea>
            </div>
            <div class="editor-meta" id="editor-meta"></div>
        </div>

    </main>

</div>

<meta name="csrf-token" content="<?php echo csrf_token(); ?>">

<?php require_once __DIR__ . '/includes/footer.php'; ?>
