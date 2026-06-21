/**
 * 在线备忘录 — 前端 JavaScript
 * 功能：备忘录 CRUD、表单校验、动态渲染、行内编辑
 * 使用 IIFE 封装，避免全局变量污染
 */
(function () {
    'use strict';

    // ========== 状态 ==========
    const state = {
        memos: [],
        editingId: null, // 正在编辑的备忘录 ID（null = 新建模式）
    };

    // ========== DOM 引用 ==========
    const memoForm = document.getElementById('memo-form');
    const memoTitle = document.getElementById('memo-title');
    const memoContent = document.getElementById('memo-content');
    const memoList = document.getElementById('memo-list');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const titleError = document.getElementById('title-error');
    const contentCount = document.getElementById('content-count');
    const memoCount = document.getElementById('memo-count');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const messageContainer = document.getElementById('message-container');

    // CSRF Token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    // ========== 消息提示 ==========
    function showMessage(text, type) {
        const toast = document.createElement('div');
        toast.className = 'message-toast message-toast-' + type;
        toast.innerHTML =
            '<span>' + escapeHtml(text) + '</span>' +
            '<button class="message-toast-close" onclick="this.parentElement.remove()">&times;</button>';
        messageContainer.appendChild(toast);
        // 3 秒后自动消失
        setTimeout(function () {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3500);
    }

    // ========== HTML 转义 ==========
    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    // ========== 字符计数 ==========
    memoContent.addEventListener('input', function () {
        var len = memoContent.value.length;
        contentCount.textContent = len + ' / 5000';
        contentCount.style.color = len > 4500 ? 'var(--color-danger)' : '';
    });

    // ========== 表单校验 ==========
    function validateMemoForm() {
        var valid = true;
        var title = memoTitle.value.trim();

        if (title === '') {
            titleError.textContent = '标题不能为空';
            memoTitle.classList.add('form-input-error');
            valid = false;
        } else if (title.length > 200) {
            titleError.textContent = '标题不能超过 200 个字符';
            memoTitle.classList.add('form-input-error');
            valid = false;
        } else {
            titleError.textContent = '';
            memoTitle.classList.remove('form-input-error');
        }

        return valid;
    }

    // 清除标题错误
    memoTitle.addEventListener('input', function () {
        if (memoTitle.value.trim() !== '') {
            titleError.textContent = '';
            memoTitle.classList.remove('form-input-error');
        }
    });

    // ========== API 请求封装 ==========
    function apiRequest(action, data) {
        var url = 'api/memos.php?action=' + encodeURIComponent(action);
        var options = {
            method: action === 'list' ? 'GET' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken,
            },
        };

        if (action !== 'list' && data !== undefined) {
            options.body = JSON.stringify(data);
        }

        return fetch(url, options)
            .then(function (res) {
                // 401 → 跳转登录
                if (res.status === 401) {
                    window.location.href = 'login.php';
                    return Promise.reject(new Error('未登录'));
                }
                return res.json();
            })
            .then(function (json) {
                if (!json.success) {
                    throw new Error(json.message || '操作失败');
                }
                return json;
            });
    }

    // ========== 加载备忘录列表 ==========
    function fetchMemos() {
        loadingState.style.display = 'block';
        memoList.style.display = 'none';
        emptyState.style.display = 'none';

        apiRequest('list')
            .then(function (json) {
                state.memos = json.memos;
                renderMemoList();
            })
            .catch(function (err) {
                if (err.message !== '未登录') {
                    showMessage('加载失败：' + err.message, 'error');
                }
                loadingState.style.display = 'none';
                emptyState.style.display = 'block';
                updateMemoCount();
            });
    }

    // ========== 渲染备忘录列表 ==========
    function renderMemoList() {
        loadingState.style.display = 'none';

        if (state.memos.length === 0) {
            memoList.style.display = 'none';
            memoList.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            memoList.style.display = '';
            memoList.innerHTML = state.memos.map(renderMemoCard).join('');
        }

        updateMemoCount();
    }

    function renderMemoCard(memo) {
        var isEditing = state.editingId === memo.id;
        var statusClass = memo.is_completed ? 'completed' : 'pending';
        var statusText = memo.is_completed ? '✅ 已完成' : '⏳ 未完成';
        var cardClass = memo.is_completed ? 'memo-card completed' : 'memo-card';
        var createdDate = formatDate(memo.created_at);
        var contentHtml = memo.content
            ? '<div class="memo-card-content">' + escapeHtml(memo.content) + '</div>'
            : '';

        if (isEditing) {
            return (
                '<div class="' + cardClass + '" data-id="' + memo.id + '">' +
                '<div class="memo-card-edit-form">' +
                '<input type="text" class="form-input edit-title" value="' + escapeHtml(memo.title) + '" maxlength="200">' +
                '<textarea class="form-input form-textarea edit-content" maxlength="5000" rows="2">' + escapeHtml(memo.content) + '</textarea>' +
                '<div class="memo-card-edit-actions">' +
                '<button class="btn btn-success btn-sm btn-save" data-id="' + memo.id + '">💾 保存</button>' +
                '<button class="btn btn-secondary btn-sm btn-cancel-edit" data-id="' + memo.id + '">取消</button>' +
                '</div>' +
                '</div>' +
                '</div>'
            );
        }

        return (
            '<div class="' + cardClass + '" data-id="' + memo.id + '">' +
            '<span class="memo-card-status ' + statusClass + '">' + statusText + '</span>' +
            '<div class="memo-card-title">' + escapeHtml(memo.title) + '</div>' +
            contentHtml +
            '<div class="memo-card-meta">📅 创建于 ' + createdDate + '</div>' +
            '<div class="memo-card-actions">' +
            '<button class="btn btn-sm btn-primary btn-edit" data-id="' + memo.id + '">✏️ 编辑</button>' +
            '<button class="btn btn-sm btn-success btn-toggle" data-id="' + memo.id + '">' +
            (memo.is_completed ? '↩️ 恢复' : '✅ 完成') +
            '</button>' +
            '<button class="btn btn-sm btn-danger btn-delete" data-id="' + memo.id + '">🗑️ 删除</button>' +
            '</div>' +
            '</div>'
        );
    }

    function updateMemoCount() {
        var total = state.memos.length;
        var completed = state.memos.filter(function (m) { return m.is_completed; }).length;
        memoCount.textContent = '共 ' + total + ' 条（已完成 ' + completed + ' 条）';
    }

    // ========== 日期格式化 ==========
    function formatDate(dateStr) {
        var d = new Date(dateStr);
        var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
        return d.getFullYear() + '-' +
            pad(d.getMonth() + 1) + '-' +
            pad(d.getDate()) + ' ' +
            pad(d.getHours()) + ':' +
            pad(d.getMinutes());
    }

    // ========== CRUD 操作 ==========
    function createMemo(title, content) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ 添加中...';

        apiRequest('create', {
            title: title,
            content: content,
        })
            .then(function (json) {
                state.memos.unshift(json.memo);
                renderMemoList();
                resetForm();
                showMessage('备忘录创建成功！', 'success');
            })
            .catch(function (err) {
                showMessage(err.message, 'error');
            })
            .finally(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = '📌 添加备忘录';
            });
    }

    function updateMemo(id, title, content) {
        apiRequest('update', {
            id: id,
            title: title,
            content: content,
        })
            .then(function (json) {
                // 替换本地数据
                var idx = state.memos.findIndex(function (m) { return m.id === id; });
                if (idx !== -1) {
                    state.memos[idx] = json.memo;
                }
                state.editingId = null;
                renderMemoList();
                exitEditMode();
                showMessage('备忘录已更新！', 'success');
            })
            .catch(function (err) {
                showMessage(err.message, 'error');
            });
    }

    function deleteMemo(id) {
        if (!confirm('确定要删除这条备忘录吗？此操作不可恢复。')) {
            return;
        }

        apiRequest('delete', { id: id })
            .then(function () {
                state.memos = state.memos.filter(function (m) { return m.id !== id; });
                renderMemoList();
                showMessage('备忘录已删除', 'info');
            })
            .catch(function (err) {
                showMessage(err.message, 'error');
            });
    }

    function toggleMemo(id) {
        apiRequest('toggle', { id: id })
            .then(function (json) {
                var idx = state.memos.findIndex(function (m) { return m.id === id; });
                if (idx !== -1) {
                    state.memos[idx].is_completed = json.is_completed;
                }
                renderMemoList();
                var status = json.is_completed ? '已完成' : '已恢复为未完成';
                showMessage('备忘录标记为' + status, 'success');
            })
            .catch(function (err) {
                showMessage(err.message, 'error');
            });
    }

    // ========== 表单提交 ==========
    memoForm.addEventListener('submit', function (e) {
        e.preventDefault();

        if (!validateMemoForm()) {
            return;
        }

        var title = memoTitle.value.trim();
        var content = memoContent.value.trim();

        if (state.editingId !== null) {
            // 更新模式
            updateMemo(state.editingId, title, content);
        } else {
            // 新建模式
            createMemo(title, content);
        }
    });

    // ========== 重置表单 ==========
    function resetForm() {
        memoTitle.value = '';
        memoContent.value = '';
        titleError.textContent = '';
        memoTitle.classList.remove('form-input-error');
        contentCount.textContent = '0 / 5000';
        contentCount.style.color = '';
        memoTitle.focus();
    }

    // ========== 退出编辑模式 ==========
    function exitEditMode() {
        state.editingId = null;
        submitBtn.textContent = '📌 添加备忘录';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
        cancelEditBtn.style.display = 'none';
        resetForm();
    }

    function enterEditMode(memo) {
        state.editingId = memo.id;
        memoTitle.value = memo.title;
        memoContent.value = memo.content;
        contentCount.textContent = memo.content.length + ' / 5000';
        submitBtn.textContent = '💾 保存修改';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
        cancelEditBtn.style.display = '';
        memoTitle.focus();
        // 滚动到表单
        memoForm.scrollIntoView({ behavior: 'smooth' });
    }

    cancelEditBtn.addEventListener('click', function () {
        state.editingId = null;
        exitEditMode();
        renderMemoList();
    });

    // ========== 事件委托：卡片操作 ==========
    memoList.addEventListener('click', function (e) {
        var target = e.target;
        var id = parseInt(target.getAttribute('data-id'));

        if (!id) return;

        // 编辑按钮
        if (target.classList.contains('btn-edit')) {
            var memo = state.memos.find(function (m) { return m.id === id; });
            if (memo) {
                enterEditMode(memo);
            }
        }

        // 保存按钮（行内编辑）
        if (target.classList.contains('btn-save')) {
            var card = target.closest('.memo-card');
            var editTitle = card.querySelector('.edit-title');
            var editContent = card.querySelector('.edit-content');
            var newTitle = editTitle ? editTitle.value.trim() : '';
            var newContent = editContent ? editContent.value.trim() : '';

            if (newTitle === '') {
                showMessage('标题不能为空', 'error');
                return;
            }
            updateMemo(id, newTitle, newContent);
        }

        // 取消编辑按钮（行内编辑）
        if (target.classList.contains('btn-cancel-edit')) {
            state.editingId = null;
            exitEditMode();
            renderMemoList();
        }

        // 切换完成状态
        if (target.classList.contains('btn-toggle')) {
            toggleMemo(id);
        }

        // 删除按钮
        if (target.classList.contains('btn-delete')) {
            deleteMemo(id);
        }
    });

    // ========== 初始化 ==========
    document.addEventListener('DOMContentLoaded', function () {
        fetchMemos();
    });
})();
