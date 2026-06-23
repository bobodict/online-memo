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

        <!-- 分类筛选 -->
        <div class="bar-section-title">分类</div>
        <div class="bar-categories" id="bar-categories">
            <span class="cat-tag active" data-cat="">全部</span>
        </div>

        <div class="bar-section-title" id="bar-section-title">全部</div>
        <div class="bar-list" id="bar-list">
            <div class="bar-item-empty" id="bar-loading">加载中...</div>
            <div class="bar-item-empty" id="bar-empty" style="display:none">没有备忘录</div>
        </div>
        <div class="bar-footer" id="bar-footer"></div>
    </aside>

    <!-- ===== RIGHT PANEL ===== -->
    <main class="right-panel" id="right-panel">

        <div class="right-placeholder" id="right-placeholder">
            <span class="placeholder-icon">&#9998;</span>
            <p>选择一条备忘录</p>
            <p class="sub">或点击左边「+ 新建备忘录」</p>
        </div>

        <div class="editor" id="editor" style="display:none">
            <!-- 工具栏 -->
            <div class="editor-toolbar">
                <span class="editor-mode" id="editor-mode">新建</span>
                <div class="editor-actions">
                    <input type="text" class="cat-input" id="editor-category" placeholder="分类..." maxlength="30" list="cat-list">
                    <datalist id="cat-list"></datalist>
                    <button class="btn btn-sm" id="btn-toggle" style="display:none">标记完成</button>
                    <button class="btn btn-sm btn-danger" id="btn-delete" style="display:none">删除</button>
                    <button class="btn btn-primary btn-sm" id="btn-save">保存</button>
                </div>
            </div>

            <!-- 格式工具栏 -->
            <div class="format-bar" id="format-bar" style="display:none">
                <button class="fmt-btn" data-cmd="bold" title="加粗 (Ctrl+B)"><b>B</b></button>
                <button class="fmt-btn" data-cmd="italic" title="斜体 (Ctrl+I)"><i>I</i></button>
                <button class="fmt-btn" data-cmd="underline" title="下划线 (Ctrl+U)"><u>U</u></button>
                <button class="fmt-btn" data-cmd="strikeThrough" title="删除线"><s>S</s></button>
                <span class="fmt-sep"></span>
                <button class="fmt-btn" data-cmd="formatBlock" data-val="h2" title="标题">H</button>
                <button class="fmt-btn" data-cmd="formatBlock" data-val="h3" title="小标题">h</button>
                <span class="fmt-sep"></span>
                <button class="fmt-btn" data-cmd="insertUnorderedList" title="无序列表">&#8226; list</button>
                <button class="fmt-btn" data-cmd="insertOrderedList" title="有序列表">1. list</button>
                <span class="fmt-sep"></span>
                <button class="fmt-btn" id="btn-table" title="插入表格">&#9638; 表格</button>
                <button class="fmt-btn" id="btn-clear-fmt" title="清除格式">Tx</button>
            </div>

            <!-- 编辑区 -->
            <div class="editor-body">
                <input type="text" class="editor-title" id="editor-title" placeholder="标题" maxlength="200">
                <div class="editor-content" id="editor-content" contenteditable="true" placeholder="开始写..."></div>
            </div>
            <div class="editor-meta" id="editor-meta"></div>
        </div>

    </main>

</div>

<meta name="csrf-token" content="<?php echo csrf_token(); ?>">

<?php require_once __DIR__ . '/includes/footer.php'; ?>
