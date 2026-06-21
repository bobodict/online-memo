/**
 * 在线备忘录 — 前端 JS
 */
(function () {
    'use strict';

    const state = { memos: [], editingId: null };

    const memoList   = document.getElementById('memo-list');
    const submitBtn  = document.getElementById('submit-btn');
    const cancelBtn  = document.getElementById('cancel-edit-btn');
    const titleInput = document.getElementById('memo-title');
    const contentInput = document.getElementById('memo-content');
    const titleError = document.getElementById('title-error');
    const contentCount = document.getElementById('content-count');
    const memoCount  = document.getElementById('memo-count');
    const loadingEl  = document.getElementById('loading-state');
    const emptyEl    = document.getElementById('empty-state');
    const msgContainer = document.getElementById('message-container');

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(s));
        return d.innerHTML;
    }

    function showMessage(text, type) {
        var t = document.createElement('div');
        t.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
        t.innerHTML = '<span>' + escapeHtml(text) + '</span><button class="toast-close" onclick="this.parentElement.remove()">x</button>';
        msgContainer.appendChild(t);
        setTimeout(function () { if (t.parentElement) t.remove(); }, 4000);
    }

    // Char count
    if (contentInput) contentInput.addEventListener('input', function () {
        var len = contentInput.value.length;
        if (contentCount) contentCount.textContent = len + ' / 5000';
    });

    // Validation
    function validate() {
        var ok = true;
        if (titleInput && titleInput.value.trim() === '') {
            if (titleError) titleError.textContent = '标题不能为空';
            if (titleInput) titleInput.classList.add('input-error');
            ok = false;
        } else {
            if (titleError) titleError.textContent = '';
            if (titleInput) titleInput.classList.remove('input-error');
        }
        return ok;
    }
    if (titleInput) titleInput.addEventListener('input', function () {
        if (titleInput.value.trim() !== '') { if (titleError) titleError.textContent = ''; titleInput.classList.remove('input-error'); }
    });

    // API
    function api(action, data) {
        var url = 'api/memos.php?action=' + encodeURIComponent(action);
        var opts = {
            method: action === 'list' ? 'GET' : 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }
        };
        if (action !== 'list' && data !== undefined) opts.body = JSON.stringify(data);
        return fetch(url, opts).then(function (r) {
            if (r.status === 401) { window.location.href = 'login.php'; return Promise.reject(new Error('未登录')); }
            return r.json();
        }).then(function (j) {
            if (!j.success) throw new Error(j.message || '操作失败');
            return j;
        });
    }

    // Load
    function fetchMemos() {
        loadingEl.style.display = 'block'; memoList.style.display = 'none'; emptyEl.style.display = 'none';
        api('list').then(function (j) {
            state.memos = j.memos;
            render();
        }).catch(function (e) {
            if (e.message !== '未登录') showMessage('加载失败: ' + e.message, 'error');
            loadingEl.style.display = 'none'; emptyEl.style.display = 'block'; updateCount();
        });
    }

    // Render
    function render() {
        loadingEl.style.display = 'none';
        if (state.memos.length === 0) {
            memoList.style.display = 'none'; memoList.innerHTML = ''; emptyEl.style.display = 'block';
        } else {
            emptyEl.style.display = 'none'; memoList.style.display = '';
            memoList.innerHTML = state.memos.map(renderItem).join('');
        }
        updateCount();
    }

    function renderItem(m) {
        var editing = state.editingId === m.id;
        var done = m.is_completed ? ' done' : '';
        var dot = m.is_completed ? '' : '';
        var meta = formatDate(m.created_at);
        var content = m.content ? '<div class="memo-item-content">' + escapeHtml(m.content) + '</div>' : '';

        if (editing) {
            return '<div class="memo-item" data-id="' + m.id + '">' +
                '<span class="memo-status-dot"></span>' +
                '<div class="memo-edit-block">' +
                '<input class="input edit-title" value="' + escapeHtml(m.title) + '" maxlength="200">' +
                '<input class="input edit-content" value="' + escapeHtml(m.content) + '" maxlength="5000">' +
                '<div class="memo-edit-actions">' +
                '<button class="btn btn-sm btn-save" data-id="' + m.id + '">Save</button>' +
                '<button class="btn btn-sm btn-cancel-edit">Cancel</button>' +
                '</div></div></div>';
        }

        return '<div class="memo-item' + done + '" data-id="' + m.id + '">' +
            '<span class="memo-status-dot"></span>' +
            '<div class="memo-item-body">' +
            '<div class="memo-item-title">' + escapeHtml(m.title) + '</div>' +
            content +
            '<div class="memo-item-meta">' + meta + '</div>' +
            '</div>' +
            '<div class="memo-item-actions">' +
            '<button class="btn btn-sm btn-edit" data-id="' + m.id + '">Edit</button>' +
            '<button class="btn btn-sm btn-toggle" data-id="' + m.id + '">' + (m.is_completed ? 'Undo' : 'Done') + '</button>' +
            '<button class="btn btn-sm btn-danger btn-delete" data-id="' + m.id + '">Del</button>' +
            '</div></div>';
    }

    function updateCount() {
        var t = state.memos.length, c = state.memos.filter(function (x) { return x.is_completed; }).length;
        memoCount.textContent = t + ' 条，' + c + ' 已完成';
    }

    function formatDate(d) { var dt = new Date(d); return dt.getFullYear() + '-' + pad(dt.getMonth()+1) + '-' + pad(dt.getDate()) + ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes()); }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    // CRUD
    function createMemo(title, content) {
        submitBtn.disabled = true; submitBtn.textContent = '...';
        api('create', { title: title, content: content }).then(function (j) {
            state.memos.unshift(j.memo); render(); resetForm(); showMessage('已创建', 'success');
        }).catch(function (e) { showMessage(e.message, 'error'); })
        .finally(function () { submitBtn.disabled = false; submitBtn.textContent = '添加'; });
    }

    function updateMemo(id, title, content) {
        api('update', { id: id, title: title, content: content }).then(function (j) {
            var idx = state.memos.findIndex(function (m) { return m.id === id; });
            if (idx !== -1) state.memos[idx] = j.memo;
            state.editingId = null; render(); exitEdit(); showMessage('已更新', 'success');
        }).catch(function (e) { showMessage(e.message, 'error'); });
    }

    function deleteMemo(id) {
        if (!confirm('确定删除？')) return;
        api('delete', { id: id }).then(function () {
            state.memos = state.memos.filter(function (m) { return m.id !== id; });
            render(); showMessage('已删除', 'success');
        }).catch(function (e) { showMessage(e.message, 'error'); });
    }

    function toggleMemo(id) {
        api('toggle', { id: id }).then(function (j) {
            var idx = state.memos.findIndex(function (m) { return m.id === id; });
            if (idx !== -1) state.memos[idx].is_completed = j.is_completed;
            render(); showMessage(j.is_completed ? '已完成' : '已恢复', 'success');
        }).catch(function (e) { showMessage(e.message, 'error'); });
    }

    // Form
    if (submitBtn) submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!validate()) return;
        var title = titleInput.value.trim(), content = contentInput.value.trim();
        if (state.editingId !== null) { updateMemo(state.editingId, title, content); }
        else { createMemo(title, content); }
    });

    function resetForm() { titleInput.value = ''; contentInput.value = ''; titleError.textContent = ''; titleInput.classList.remove('input-error'); contentCount.textContent = '0 / 5000'; titleInput.focus(); }

    function exitEdit() {
        state.editingId = null;
        submitBtn.textContent = '添加'; submitBtn.classList.remove('btn-primary'); submitBtn.classList.add('btn-primary');
        cancelBtn.style.display = 'none'; resetForm();
    }

    function enterEdit(memo) {
        state.editingId = memo.id;
        titleInput.value = memo.title; contentInput.value = memo.content;
        contentCount.textContent = memo.content.length + ' / 5000';
        submitBtn.textContent = '保存'; cancelBtn.style.display = '';
        titleInput.focus(); titleInput.scrollIntoView({ behavior: 'smooth' });
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (cancelBtn) cancelBtn.addEventListener('click', function () { exitEdit(); render(); });
        if (memoList) memoList.addEventListener('click', function (e) {
            var t = e.target;
            var id = parseInt(t.getAttribute('data-id'));
            if (!id) return;
            if (t.classList.contains('btn-edit')) {
                var m = state.memos.find(function (x) { return x.id === id; });
                if (m) enterEdit(m);
            }
            if (t.classList.contains('btn-save')) {
                var card = t.closest('.memo-item');
                var nt = card.querySelector('.edit-title').value.trim();
                var nc = card.querySelector('.edit-content').value.trim();
                if (nt === '') { showMessage('标题不能为空', 'error'); return; }
                updateMemo(id, nt, nc);
            }
            if (t.classList.contains('btn-cancel-edit')) { exitEdit(); render(); }
            if (t.classList.contains('btn-toggle')) { toggleMemo(id); }
            if (t.classList.contains('btn-delete')) { deleteMemo(id); }
        });
        fetchMemos();
    });
})();
