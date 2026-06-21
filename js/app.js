/**
 * 在线备忘录 - 前端 JS (Apple Notes style)
 */
(function () {
    'use strict';

    var state = { memos: [], editingId: null };
    var csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    function $(id) { return document.getElementById(id); }
    var memoList = $('memo-list'), submitBtn = $('submit-btn'), cancelBtn = $('cancel-edit-btn');
    var titleInput = $('memo-title'), contentInput = $('memo-content');
    var titleError = $('title-error'), contentCount = $('content-count'), memoCount = $('memo-count');
    var loadingEl = $('loading-state'), emptyEl = $('empty-state'), msgC = $('message-container');

    function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

    function msg(text, type) {
        var t = document.createElement('div');
        t.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
        t.innerHTML = '<span>' + esc(text) + '</span><button class="toast-close" onclick="this.parentElement.remove()">x</button>';
        if (msgC) msgC.appendChild(t);
        setTimeout(function () { if (t.parentElement) t.remove(); }, 4000);
    }

    // ---- Validation ----
    function validate() {
        if (!titleInput) return false;
        var ok = true;
        if (titleInput.value.trim() === '') {
            if (titleError) titleError.textContent = '标题不能为空';
            titleInput.classList.add('input-error'); ok = false;
        } else {
            if (titleError) titleError.textContent = '';
            titleInput.classList.remove('input-error');
        }
        return ok;
    }

    // ---- API ----
    function api(action, data) {
        var opts = { method: action === 'list' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken } };
        if (action !== 'list' && data !== undefined) opts.body = JSON.stringify(data);
        return fetch('api/memos.php?action=' + encodeURIComponent(action), opts)
            .then(function (r) { if (r.status === 401) { location.href = 'login.php'; throw new Error('未登录'); } return r.json(); })
            .then(function (j) { if (!j.success) throw new Error(j.message); return j; });
    }

    // ---- Load ----
    function fetchMemos() {
        if (loadingEl) loadingEl.style.display = 'block';
        if (memoList) memoList.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';
        api('list').then(function (j) { state.memos = j.memos; render(); })
        .catch(function (e) { if (e.message !== '未登录') msg('加载失败: ' + e.message, 'error'); if (loadingEl) loadingEl.style.display = 'none'; if (emptyEl) emptyEl.style.display = 'block'; updateCount(); });
    }

    // ---- Render ----
    function render() {
        if (loadingEl) loadingEl.style.display = 'none';
        if (state.memos.length === 0) {
            if (memoList) { memoList.style.display = 'none'; memoList.innerHTML = ''; }
            if (emptyEl) emptyEl.style.display = 'block';
        } else {
            if (emptyEl) emptyEl.style.display = 'none';
            if (memoList) { memoList.style.display = ''; memoList.innerHTML = state.memos.map(card).join(''); }
        }
        updateCount();
    }

    function card(m) {
        var editing = state.editingId === m.id;
        var done = m.is_completed ? ' done' : '';
        var meta = fmt(m.created_at);
        var body = m.content ? '<div class="memo-card-content">' + esc(m.content) + '</div>' : '';

        if (editing) {
            return '<div class="memo-card" data-id="' + m.id + '"><span class="memo-dot"></span>' +
                '<div class="memo-edit-block">' +
                '<input class="input edit-title" value="' + esc(m.title) + '" maxlength="200" placeholder="标题">' +
                '<input class="input edit-content" value="' + esc(m.content) + '" maxlength="5000" placeholder="内容">' +
                '<div class="memo-edit-actions"><button class="btn btn-primary btn-sm btn-save" data-id="' + m.id + '">保存</button>' +
                '<button class="btn btn-secondary btn-sm btn-cancel-edit">取消</button></div></div></div>';
        }
        return '<div class="memo-card' + done + '" data-id="' + m.id + '">' +
            '<span class="memo-dot" data-id="' + m.id + '" data-act="toggle"></span>' +
            '<div class="memo-body"><div class="memo-card-title">' + esc(m.title) + '</div>' + body +
            '<div class="memo-card-meta">' + meta + '</div></div>' +
            '<div class="memo-actions">' +
            '<button class="btn btn-secondary btn-sm btn-edit" data-id="' + m.id + '">编辑</button>' +
            '<button class="btn btn-danger btn-sm btn-delete" data-id="' + m.id + '">删除</button>' +
            '</div></div>';
    }

    function updateCount() {
        var t = state.memos.length, c = state.memos.filter(function (x) { return x.is_completed; }).length;
        if (memoCount) memoCount.textContent = t + ' 条（' + c + ' 已完成）';
    }

    function fmt(d) { var dt = new Date(d); return dt.getFullYear() + '/' + p(dt.getMonth()+1) + '/' + p(dt.getDate()) + ' ' + p(dt.getHours()) + ':' + p(dt.getMinutes()); }
    function p(n) { return n < 10 ? '0' + n : '' + n; }

    // ---- CRUD ----
    function create(title, content) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }
        api('create', { title: title, content: content }).then(function (j) { state.memos.unshift(j.memo); render(); reset(); msg('已创建', 'success'); })
        .catch(function (e) { msg(e.message, 'error'); })
        .finally(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '添加'; } });
    }

    function update(id, title, content) {
        api('update', { id: id, title: title, content: content }).then(function (j) {
            var i = state.memos.findIndex(function (x) { return x.id === id; });
            if (i !== -1) state.memos[i] = j.memo;
            exitEdit(); render(); msg('已更新', 'success');
        }).catch(function (e) { msg(e.message, 'error'); });
    }

    function remove(id) {
        if (!confirm('删除这条备忘录？')) return;
        api('delete', { id: id }).then(function () { state.memos = state.memos.filter(function (x) { return x.id !== id; }); render(); msg('已删除', 'success'); })
        .catch(function (e) { msg(e.message, 'error'); });
    }

    function toggle(id) {
        api('toggle', { id: id }).then(function (j) {
            var i = state.memos.findIndex(function (x) { return x.id === id; });
            if (i !== -1) state.memos[i].is_completed = j.is_completed;
            render(); msg(j.is_completed ? '已完成' : '已恢复', 'success');
        }).catch(function (e) { msg(e.message, 'error'); });
    }

    // ---- Form ----
    function reset() { if (titleInput) { titleInput.value = ''; titleInput.classList.remove('input-error'); } if (contentInput) contentInput.value = ''; if (titleError) titleError.textContent = ''; if (contentCount) contentCount.textContent = '0 / 5000'; if (titleInput) titleInput.focus(); }

    function exitEdit() { state.editingId = null; if (submitBtn) { submitBtn.textContent = '添加'; } if (cancelBtn) cancelBtn.style.display = 'none'; reset(); }

    function enterEdit(memo) {
        state.editingId = memo.id;
        if (titleInput) titleInput.value = memo.title;
        if (contentInput) contentInput.value = memo.content;
        if (contentCount) contentCount.textContent = memo.content.length + ' / 5000';
        if (submitBtn) submitBtn.textContent = '保存修改';
        if (cancelBtn) cancelBtn.style.display = '';
        if (titleInput) titleInput.focus();
    }

    // ---- Events ----
    if (submitBtn) submitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!validate()) return;
        var t = titleInput.value.trim(), c = contentInput.value.trim();
        if (state.editingId !== null) update(state.editingId, t, c);
        else create(t, c);
    });

    if (cancelBtn) cancelBtn.addEventListener('click', function () { exitEdit(); render(); });

    if (titleInput) titleInput.addEventListener('input', function () { if (titleInput.value.trim() !== '') { if (titleError) titleError.textContent = ''; titleInput.classList.remove('input-error'); } });
    if (contentInput) contentInput.addEventListener('input', function () { if (contentCount) contentCount.textContent = contentInput.value.length + ' / 5000'; });

    if (memoList) memoList.addEventListener('click', function (e) {
        var t = e.target;
        var id = parseInt(t.getAttribute('data-id'));
        if (!id) return;
        // Toggle via dot click
        if (t.getAttribute('data-act') === 'toggle') { toggle(id); return; }
        if (t.classList.contains('btn-edit')) { var m = state.memos.find(function (x) { return x.id === id; }); if (m) enterEdit(m); }
        if (t.classList.contains('btn-save')) {
            var card = t.closest('.memo-card');
            var nt = card.querySelector('.edit-title')?.value?.trim() || '';
            var nc = card.querySelector('.edit-content')?.value?.trim() || '';
            if (nt === '') { msg('标题不能为空', 'error'); return; }
            update(id, nt, nc);
        }
        if (t.classList.contains('btn-cancel-edit')) { exitEdit(); render(); }
        if (t.classList.contains('btn-delete')) { remove(id); }
    });

    document.addEventListener('DOMContentLoaded', fetchMemos);
})();
