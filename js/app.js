/**
 * 在线备忘录 - 双栏布局
 */
(function () {
    'use strict';
    var state = { memos: [], editingId: null, activeId: null };
    var csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    function $(id) { return document.getElementById(id); }
    function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

    var barList = $('bar-list'), barEmpty = $('bar-empty'), barLoading = $('bar-loading'), barFooter = $('bar-footer'), barSection = $('bar-section-title');
    var formHeading = $('form-heading');
    var titleInput = $('memo-title'), contentInput = $('memo-content');
    var submitBtn = $('submit-btn'), cancelBtn = $('cancel-edit-btn'), deleteBtn = $('delete-edit-btn');
    var titleError = $('title-error'), contentCount = $('content-count');
    var toastArea = $('toast-area'), btnNew = $('btn-new-memo');

    function toast(text, type) {
        var t = document.createElement('div');
        t.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
        t.innerHTML = '<span>' + esc(text) + '</span><button class="toast-close" onclick="this.parentElement.remove()">x</button>';
        if (toastArea) toastArea.appendChild(t);
        setTimeout(function () { if (t.parentElement) t.remove(); }, 4000);
    }

    function validate() {
        if (!titleInput) return false;
        if (titleInput.value.trim() === '') { if (titleError) titleError.textContent = '标题不能为空'; titleInput.classList.add('input-error'); return false; }
        if (titleError) titleError.textContent = ''; titleInput.classList.remove('input-error'); return true;
    }

    function api(action, data) {
        var opts = { method: action === 'list' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } };
        if (action !== 'list' && data !== undefined) opts.body = JSON.stringify(data);
        return fetch('api/memos.php?action=' + encodeURIComponent(action), opts)
            .then(function (r) { if (r.status === 401) { location.href = 'login.php'; throw new Error('未登录'); } return r.json(); })
            .then(function (j) { if (!j.success) throw new Error(j.message); return j; });
    }

    function fetchMemos() {
        if (barLoading) barLoading.style.display = 'block';
        api('list').then(function (j) {
            state.memos = j.memos; renderBar();
            if (state.memos.length > 0) selectMemo(state.memos[0].id);
            else newMemoMode();
        }).catch(function (e) { if (e.message !== '未登录') toast('加载失败', 'error'); });
    }

    function renderBar() {
        if (barLoading) barLoading.style.display = 'none';
        if (state.memos.length === 0) {
            if (barEmpty) barEmpty.style.display = 'block';
        } else {
            if (barEmpty) barEmpty.style.display = 'none';
            var html = '';
            for (var i = 0; i < state.memos.length; i++) {
                var m = state.memos[i];
                var cls = 'bar-item' + (m.is_completed ? ' done' : '') + (state.activeId === m.id ? ' active' : '');
                html += '<div class="' + cls + '" data-id="' + m.id + '">' +
                    '<div class="bar-item-title">' + esc(m.title) + '</div>' +
                    '<div class="bar-item-meta">' + fmt(m.updated_at || m.created_at) + '</div></div>';
            }
            if (barList) barList.innerHTML = html;
        }
        updateFooter();
    }

    function updateFooter() { var t = state.memos.length, c = state.memos.filter(function (x) { return x.is_completed; }).length; if (barFooter) barFooter.textContent = t + ' 条，' + c + ' 已完成'; if (barSection) barSection.textContent = '所有备忘录 (' + t + ')'; }

    function selectMemo(id) {
        state.activeId = id; state.editingId = id;
        var m = state.memos.find(function (x) { return x.id === id; }); if (!m) return;
        if (formHeading) formHeading.textContent = '编辑';
        if (titleInput) titleInput.value = m.title;
        if (contentInput) contentInput.value = m.content;
        if (contentCount) contentCount.textContent = m.content.length + ' / 5000';
        if (submitBtn) submitBtn.textContent = '保存修改';
        if (cancelBtn) cancelBtn.style.display = '';
        if (deleteBtn) deleteBtn.style.display = '';
        if (titleError) { titleError.textContent = ''; titleInput.classList.remove('input-error'); }
        renderBar();
    }

    function newMemoMode() {
        state.editingId = null; state.activeId = null;
        if (formHeading) formHeading.textContent = '新建备忘录';
        if (titleInput) { titleInput.value = ''; titleInput.classList.remove('input-error'); }
        if (contentInput) contentInput.value = '';
        if (titleError) titleError.textContent = '';
        if (contentCount) contentCount.textContent = '0 / 5000';
        if (submitBtn) submitBtn.textContent = '添加备忘录';
        if (cancelBtn) cancelBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        renderBar();
        if (titleInput) titleInput.focus();
    }

    function resetForm() { newMemoMode(); }

    function fmt(d) { var dt = new Date(d); return dt.getFullYear() + '/' + p(dt.getMonth()+1) + '/' + p(dt.getDate()); }
    function p(n) { return n < 10 ? '0' + n : '' + n; }

    // CRUD
    function create() {
        if (!validate()) return;
        var title = titleInput.value.trim(), content = contentInput.value.trim();
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }
        api('create', { title: title, content: content }).then(function (j) {
            state.memos.unshift(j.memo);
            state.activeId = j.memo.id; state.editingId = j.memo.id;
            renderBar(); toast('已创建', 'success');
            if (formHeading) formHeading.textContent = '编辑';
            if (submitBtn) submitBtn.textContent = '保存修改';
            if (cancelBtn) cancelBtn.style.display = '';
            if (deleteBtn) deleteBtn.style.display = '';
        }).catch(function (e) { toast(e.message, 'error'); })
        .finally(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '添加备忘录'; } });
    }

    function update() {
        if (!validate()) return;
        if (!state.editingId) return;
        var title = titleInput.value.trim(), content = contentInput.value.trim();
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '...'; }
        api('update', { id: state.editingId, title: title, content: content }).then(function (j) {
            var i = state.memos.findIndex(function (x) { return x.id === j.memo.id; }); if (i !== -1) state.memos[i] = j.memo;
            renderBar(); toast('已更新', 'success');
        }).catch(function (e) { toast(e.message, 'error'); })
        .finally(function () { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '保存修改'; } });
    }

    function remove() {
        if (!state.editingId) return;
        if (!confirm('删除这条备忘录？')) return;
        var id = state.editingId;
        api('delete', { id: id }).then(function () {
            state.memos = state.memos.filter(function (x) { return x.id !== id; });
            state.editingId = null; state.activeId = null;
            if (state.memos.length > 0) selectMemo(state.memos[0].id); else newMemoMode();
            toast('已删除', 'success');
        }).catch(function (e) { toast(e.message, 'error'); });
    }

    // Events
    if (submitBtn) submitBtn.addEventListener('click', function (e) { e.preventDefault(); if (state.editingId !== null) update(); else create(); });
    if (cancelBtn) cancelBtn.addEventListener('click', function () { newMemoMode(); });
    if (deleteBtn) deleteBtn.addEventListener('click', function () { remove(); });
    if (btnNew) btnNew.addEventListener('click', function () { newMemoMode(); });

    if (titleInput) titleInput.addEventListener('input', function () { if (titleInput.value.trim() !== '') { if (titleError) titleError.textContent = ''; titleInput.classList.remove('input-error'); } });
    if (contentInput) contentInput.addEventListener('input', function () { if (contentCount) contentCount.textContent = contentInput.value.length + ' / 5000'; });

    if (barList) barList.addEventListener('click', function (e) {
        var item = e.target.closest('.bar-item'); if (!item) return;
        var id = parseInt(item.getAttribute('data-id')); if (id) selectMemo(id);
    });

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); newMemoMode(); }
    });

    document.addEventListener('DOMContentLoaded', fetchMemos);
})();
