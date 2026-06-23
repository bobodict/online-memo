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
                <button class="btn-icon" id="btn-dark-mode" title="切换暗色模式">🌙</button>
                <a href="logout.php" class="logout-link">退出</a>
            </div>
        </div>

        <!-- 搜索 -->
        <div class="search-wrap">
            <input type="text" class="search-input" id="search-input" placeholder="搜索备忘录...">
        </div>

        <button class="btn-new-memo" id="btn-new-memo">+ 新建备忘录</button>

        <!-- 分类 -->
        <div class="bar-section-title">分类</div>
        <div class="bar-categories" id="bar-categories">
            <span class="cat-tag active" data-cat="">全部</span>
        </div>

        <!-- 列表标题 -->
        <div class="bar-section-title" id="bar-section-title">全部</div>
        <div class="bar-list" id="bar-list">
            <div class="bar-item-empty" id="bar-loading">加载中...</div>
            <div class="bar-item-empty" id="bar-empty" style="display:none">没有备忘录</div>
        </div>

        <!-- 回收站入口 -->
        <div class="bar-section-title" style="margin-top:auto">回收站</div>
        <div class="bar-trash" id="bar-trash" style="display:none"></div>
        <button class="btn-trash" id="btn-trash" style="display:none">🗑 回收站</button>

        <div class="bar-footer" id="bar-footer"></div>
    </aside>

    <!-- ===== RIGHT PANEL ===== -->
    <main class="right-panel" id="right-panel">

        <!-- 回收站视图 -->
        <div class="trash-view" id="trash-view" style="display:none">
            <div class="trash-header">
                <h2>回收站</h2>
                <button class="btn btn-secondary btn-sm" id="btn-close-trash">← 返回</button>
            </div>
            <div class="trash-list" id="trash-list"></div>
            <div class="trash-empty" id="trash-empty">回收站为空</div>
        </div>

        <!-- 空状态 -->
        <div class="right-placeholder" id="right-placeholder">
            <span class="placeholder-icon">&#9998;</span>
            <p>选择一条备忘录</p>
            <p class="sub">或点击左边「+ 新建备忘录」</p>
        </div>

        <!-- 编辑器 -->
        <div class="editor" id="editor" style="display:none">
            <div class="editor-topbar">
                <span class="editor-mode" id="editor-mode">新建备忘录</span>
                <div class="editor-topbar-right">
                    <input type="text" class="cat-input" id="editor-category" placeholder="分类..." maxlength="30" list="cat-list">
                    <datalist id="cat-list"></datalist>
                    <input type="datetime-local" class="date-input" id="editor-due" title="截止日期">
                    <button class="btn btn-sm" id="btn-pin" style="display:none" title="置顶">📌</button>
                    <button class="btn btn-sm" id="btn-toggle" style="display:none">标记完成</button>
                    <button class="btn btn-sm btn-danger" id="btn-delete" style="display:none">删除</button>
                    <button class="btn btn-primary btn-sm" id="btn-save">保存</button>
                </div>
            </div>

            <div class="format-bar" id="format-bar" style="display:none">
                <button class="fmt-btn" data-cmd="bold"><b>B</b></button>
                <button class="fmt-btn" data-cmd="italic"><i>I</i></button>
                <button class="fmt-btn" data-cmd="underline"><u>U</u></button>
                <button class="fmt-btn" data-cmd="strikeThrough"><s>S</s></button>
                <span class="fmt-sep"></span>
                <button class="fmt-btn" data-cmd="formatBlock" data-val="h2">H2</button>
                <button class="fmt-btn" data-cmd="formatBlock" data-val="h3">H3</button>
                <span class="fmt-sep"></span>
                <button class="fmt-btn" data-cmd="insertUnorderedList">- List</button>
                <button class="fmt-btn" data-cmd="insertOrderedList">1. List</button>
                <span class="fmt-sep"></span>
                <button class="fmt-act" id="btn-table">Table</button>
                <button class="fmt-act" id="btn-clear-fmt">Tx</button>
            </div>

            <div class="editor-body">
                <input type="text" class="editor-title" id="editor-title" placeholder="标题" maxlength="200">
                <div class="editor-content" id="editor-content" contenteditable="true" placeholder="输入内容..."></div>
            </div>
            <div class="editor-meta" id="editor-meta"></div>
        </div>
    </main>

</div>

<!-- 自定义弹窗 -->
<div class="modal-overlay" id="modal-overlay" style="display:none">
    <div class="modal-box" id="modal-box">
        <div class="modal-header">
            <span class="modal-title" id="modal-title"></span>
            <button class="modal-close" id="modal-close">&times;</button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-footer" id="modal-footer"></div>
    </div>
</div>

<meta name="csrf-token" content="<?php echo csrf_token(); ?>">

<?php require_once __DIR__ . '/includes/footer.php'; ?>
