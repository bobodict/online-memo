/**
 * 在线备忘录 - 双栏编辑
 */
(function () {
    'use strict';
    var state = { memos: [], editingId: null };
    var csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    function $(id) { return document.getElementById(id); }
    function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

    var barList = $('bar-list'), barEmpty = $('bar-empty'), barLoading = $('bar-loading'), barFooter = $('bar-footer'), barSection = $('bar-section-title');
    var placeholder = $('right-placeholder'), editor = $('editor');
    var editorMode = $('editor-mode'), editorMeta = $('editor-meta');
    var eTitle = $('editor-title'), eContent = $('editor-content');
    var btnSave = $('btn-save'), btnDelete = $('btn-delete'), btnToggle = $('btn-toggle'), btnNew = $('btn-new-memo');
    var toastArea = $('toast-area');

    function toast(text, type) {
        var t = document.createElement('div');
        t.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
        t.innerHTML = '<span>' + esc(text) + '</span><button class="toast-close" onclick="this.parentElement.remove()">x</button>';
        if (toastArea) toastArea.appendChild(t);
        setTimeout(function () { if (t.parentElement) t.remove(); }, 3500);
    }

    function api(action, data) {
        var opts = { method: action === 'list' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } };
        if (action !== 'list' && data !== undefined) opts.body = JSON.stringify(data);
        return fetch('api/memos.php?action=' + encodeURIComponent(action), opts)
            .then(function (r) { if (r.status === 401) { location.href = 'login.php'; throw new Error('未登录'); } return r.json(); })
            .then(function (j) { if (!j.success) throw new Error(j.message); return j; });
    }

    function fetchMemos() {
        barLoading.style.display = 'block';
        api('list').then(function (j) { state.memos = j.memos; renderBar(); showPlaceholder(); })
        .catch(function (e) { if (e.message !== '未登录') toast('加载失败', 'error'); });
    }

    // ---- Render sidebar ----
    function renderBar() {
        barLoading.style.display = 'none';
        if (state.memos.length === 0) { barEmpty.style.display = 'block'; }
        else {
            barEmpty.style.display = 'none';
            var html = '';
            for (var i = 0; i < state.memos.length; i++) {
                var m = state.memos[i];
                var cls = 'bar-item' + (m.is_completed ? ' done' : '') + (state.editingId === m.id ? ' active' : '');
                html += '<div class="' + cls + '" data-id="' + m.id + '">' +
                    '<div class="bar-item-title">' + esc(m.title) + '</div>' +
                    '<div class="bar-item-meta">' + fmt(m.updated_at || m.created_at) + '</div></div>';
            }
            barList.innerHTML = html;
        }
        var t = state.memos.length, c = state.memos.filter(function (x) { return x.is_completed; }).length;
        barFooter.textContent = t + ' 条，' + c + ' 已完成';
        barSection.textContent = '全部 (' + t + ')';
    }

    function fmt(d) { var dt = new Date(d); return dt.getFullYear() + '/' + p(dt.getMonth()+1) + '/' + p(dt.getDate()); }
    function p(n) { return n < 10 ? '0' + n : '' + n; }

    // ---- Right panel ----
    function showPlaceholder() {
        state.editingId = null;
        placeholder.style.display = ''; editor.style.display = 'none';
        renderBar();
    }

    function openNew() {
        state.editingId = null;
        placeholder.style.display = 'none'; editor.style.display = '';
        editorMode.textContent = '新建';
        eTitle.value = ''; eContent.value = '';
        editorMeta.textContent = '';
        btnDelete.style.display = 'none'; btnToggle.style.display = 'none';
        btnSave.textContent = '保存';
        renderBar(); eTitle.focus();
    }

    function openMemo(id) {
        var m = state.memos.find(function (x) { return x.id === id; }); if (!m) return;
        state.editingId = id;
        placeholder.style.display = 'none'; editor.style.display = '';
        editorMode.textContent = m.is_completed ? '已完成' : '编辑';
        eTitle.value = m.title; eContent.value = m.content;
        editorMeta.textContent = '创建于 ' + fmt(m.created_at) + ' · 更新于 ' + fmt(m.updated_at || m.created_at);
        btnDelete.style.display = ''; btnToggle.style.display = '';
        btnToggle.textContent = m.is_completed ? '恢复' : '标记完成';
        btnSave.textContent = '保存';
        renderBar();
    }

    // ---- CRUD ----
    function save() {
        var title = eTitle.value.trim();
        if (title === '') { toast('标题不能为空', 'error'); eTitle.focus(); return; }
        if (title.length > 200) { toast('标题不超过200字', 'error'); return; }
        if (eContent.value.length > 5000) { toast('内容不超过5000字', 'error'); return; }

        btnSave.disabled = true; btnSave.textContent = '...';

        if (state.editingId !== null) {
            // Update existing
            api('update', { id: state.editingId, title: title, content: eContent.value.trim() }).then(function (j) {
                var i = state.memos.findIndex(function (x) { return x.id === j.memo.id; }); if (i !== -1) state.memos[i] = j.memo;
                renderBar(); editorMeta.textContent = '更新于 ' + fmt(j.memo.updated_at); toast('已保存', 'success');
            }).catch(function (e) { toast(e.message, 'error'); })
            .finally(function () { btnSave.disabled = false; btnSave.textContent = '保存'; });
        } else {
            // Create new
            api('create', { title: title, content: eContent.value.trim() }).then(function (j) {
                state.memos.unshift(j.memo); state.editingId = j.memo.id;
                renderBar(); editorMode.textContent = '编辑';
                editorMeta.textContent = '创建于 ' + fmt(j.memo.created_at);
                btnDelete.style.display = ''; btnToggle.style.display = '';
                toast('已创建', 'success');
            }).catch(function (e) { toast(e.message, 'error'); })
            .finally(function () { btnSave.disabled = false; btnSave.textContent = '保存'; });
        }
    }

    function remove() {
        if (!state.editingId) return;
        if (!confirm('删除这条备忘录？')) return;
        var id = state.editingId;
        api('delete', { id: id }).then(function () {
            state.memos = state.memos.filter(function (x) { return x.id !== id; });
            showPlaceholder(); toast('已删除', 'success');
        }).catch(function (e) { toast(e.message, 'error'); });
    }

    function toggle() {
        if (!state.editingId) return;
        var id = state.editingId;
        api('toggle', { id: id }).then(function (j) {
            var i = state.memos.findIndex(function (x) { return x.id === id; }); if (i !== -1) state.memos[i].is_completed = j.is_completed;
            var m = state.memos[i];
            editorMode.textContent = m.is_completed ? '已完成' : '编辑';
            btnToggle.textContent = m.is_completed ? '恢复' : '标记完成';
            renderBar(); toast(j.is_completed ? '已完成' : '已恢复', 'success');
        }).catch(function (e) { toast(e.message, 'error'); });
    }

    // ---- Events ----
    btnNew.addEventListener('click', openNew);
    btnSave.addEventListener('click', save);
    btnDelete.addEventListener('click', remove);
    btnToggle.addEventListener('click', toggle);

    barList.addEventListener('click', function (e) {
        var item = e.target.closest('.bar-item'); if (!item) return;
        var id = parseInt(item.getAttribute('data-id')); if (id) openMemo(id);
    });

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openNew(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    });

    document.addEventListener('DOMContentLoaded', fetchMemos);
})();
