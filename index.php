<?php
/**
 * 主页面 —— 备忘录仪表盘
 * 需要登录后才能访问
 */

require_once __DIR__ . '/includes/session.php';
require_once __DIR__ . '/includes/auth.php';

require_login();

$user = current_user();
$page_title = '我的备忘录 - 在线备忘录';
require_once __DIR__ . '/includes/header.php';
?>

<section class="dashboard">
    <div class="dashboard-header">
        <h2>欢迎，<?php echo htmlspecialchars($user['username'] ?? '', ENT_QUOTES, 'UTF-8'); ?></h2>
        <p class="text-secondary">管理你的备忘录，记录每一个重要事项</p>
    </div>

    <!-- 新建备忘录表单 -->
    <div class="memo-form-wrapper">
        <h3 class="form-section-title">新建备忘录</h3>
        <form id="memo-form" class="memo-form" novalidate>
            <div class="form-group">
                <label for="memo-title">标题 <span class="required">*</span></label>
                <input
                    type="text"
                    id="memo-title"
                    name="title"
                    class="form-input"
                    required
                    maxlength="200"
                    placeholder="输入备忘录标题..."
                >
                <span class="form-error" id="title-error"></span>
            </div>
            <div class="form-group">
                <label for="memo-content">内容</label>
                <textarea
                    id="memo-content"
                    name="content"
                    class="form-input form-textarea"
                    maxlength="5000"
                    rows="3"
                    placeholder="输入备忘录内容（可选）..."
                ></textarea>
                <span class="char-count" id="content-count">0 / 5000</span>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" id="submit-btn">添加备忘录</button>
                <button type="button" class="btn btn-secondary" id="cancel-edit-btn" style="display:none;">取消编辑</button>
            </div>
        </form>
    </div>

    <!-- 提示消息 -->
    <div id="message-container"></div>

    <!-- 备忘录列表 -->
    <div class="memo-list-wrapper">
        <h3 class="form-section-title">
            我的备忘录
            <span class="memo-count" id="memo-count"></span>
        </h3>

        <!-- 加载状态 -->
        <div id="loading-state" class="empty-state">
            <div class="spinner"></div>
            <p>加载中...</p>
        </div>

        <!-- 备忘录列表容器 -->
        <div id="memo-list" class="memo-grid" style="display:none;"></div>

        <!-- 空状态 -->
        <div id="empty-state" class="empty-state" style="display:none;">
            <div class="empty-icon">&middot; &middot; &middot;</div>
            <p>还没有备忘录</p>
            <p class="text-secondary">在上方创建你的第一个备忘录吧！</p>
        </div>
    </div>
</section>

<!-- CSRF Token (供 JS 读取) -->
<meta name="csrf-token" content="<?php echo csrf_token(); ?>">

<?php
require_once __DIR__ . '/includes/footer.php';
