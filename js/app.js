/**
 * 在线备忘录 - 富文本编辑 + 分类
 */
(function () {
    'use strict';
    var state = { memos: [], editingId: null, categories: [], activeCat: '' };
    var csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    function $(id) { return document.getElementById(id); }
    function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

    // DOM
    var barList = $('bar-list'), barEmpty = $('bar-empty'), barLoading = $('bar-loading');
    var barFooter = $('bar-footer'), barSection = $('bar-section-title'), barCats = $('bar-categories');
    var placeholder = $('right-placeholder'), editor = $('editor');
    var editorMode = $('editor-mode'), editorMeta = $('editor-meta');
    var eTitle = $('editor-title'), eContent = $('editor-content'), eCategory = $('editor-category');
    var btnSave = $('btn-save'), btnDelete = $('btn-delete'), btnToggle = $('btn-toggle'), btnNew = $('btn-new-memo');
    var formatBar = $('format-bar'), catList = $('cat-list');
    var toastArea = $('toast-area');

    function toast(text, type) {
        var t = document.createElement('div');
        t.className = 'toast toast-' + (type === 'error' ? 'error' : 'success');
        t.innerHTML = '<span>' + esc(text) + '</span><button class="toast-close" onclick="this.parentElement.remove()">x</button>';
        if (toastArea) toastArea.appendChild(t);
        setTimeout(function () { if (t.parentElement) t.remove(); }, 3500);
    }

    // ---- API ----
    function api(action, data) {
        var opts = { method: action === 'list' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } };
        if (action !== 'list' && data !== undefined) opts.body = JSON.stringify(data);
        var url = 'api/memos.php?action=' + encodeURIComponent(action);
        if (action === 'list' && state.activeCat) url += '&category=' + encodeURIComponent(state.activeCat);
        return fetch(url, opts)
            .then(function (r) { if (r.status === 401) { location.href = 'login.php'; throw new Error('未登录'); } return r.json(); })
            .then(function (j) { if (!j.success) throw new Error(j.message); return j; });
    }

    function fetchMemos() {
        barLoading.style.display = 'block';
        api('list').then(function (j) {
            state.memos = j.memos; state.categories = j.categories || [];
            renderBar(); renderCategories();
            if (state.memos.length > 0 && !state.editingId) { /* just show list */ }
        }).catch(function (e) { if (e.message !== '未登录') toast('加载失败', 'error'); });
    }

    // ---- Sidebar ----
    function renderBar() {
        barLoading.style.display = 'none';
        var filtered = state.activeCat ? state.memos.filter(function (m) { return m.category === state.activeCat; }) : state.memos;
        if (filtered.length === 0) { barEmpty.style.display = 'block'; barList.innerHTML = ''; }
        else {
            barEmpty.style.display = 'none';
            var html = '';
            for (var i = 0; i < filtered.length; i++) {
                var m = filtered[i];
                var cls = 'bar-item' + (m.is_completed ? ' done' : '') + (state.editingId === m.id ? ' active' : '');
                html += '<div class="' + cls + '" data-id="' + m.id + '">' +
                    '<div class="bar-item-title">' + esc(m.title) + '</div>' +
                    '<div class="bar-item-meta">' + fmt(m.updated_at || m.created_at) + (m.category ? ' &middot; ' + esc(m.category) : '') + '</div></div>';
            }
            barList.innerHTML = html;
        }
        updateFooter(filtered.length);
    }

    function renderCategories() {
        var html = '<span class="cat-tag' + (state.activeCat === '' ? ' active' : '') + '" data-cat="">全部</span>';
        for (var i = 0; i < state.categories.length; i++) {
            var cat = state.categories[i];
            html += '<span class="cat-tag' + (state.activeCat === cat ? ' active' : '') + '" data-cat="' + esc(cat) + '">' + esc(cat) + '</span>';
        }
        barCats.innerHTML = html;
        // Update datalist
        var opts = '';
        for (var j = 0; j < state.categories.length; j++) opts += '<option value="' + esc(state.categories[j]) + '">';
        if (catList) catList.innerHTML = opts;
    }

    function updateFooter(count) {
        var t = count || state.memos.length, c = (count !== undefined ? 0 : state.memos.filter(function (x) { return x.is_completed; }).length);
        if (count !== undefined) c = (state.activeCat ? state.memos.filter(function (x) { return x.category === state.activeCat && x.is_completed; }).length : state.memos.filter(function (x) { return x.is_completed; }).length);
        barFooter.textContent = t + ' 条，' + c + ' 已完成';
        barSection.textContent = state.activeCat ? state.activeCat + ' (' + t + ')' : '全部 (' + t + ')';
    }

    function fmt(d) { var dt = new Date(d); return dt.getFullYear() + '/' + p(dt.getMonth()+1) + '/' + p(dt.getDate()); }
    function p(n) { return n < 10 ? '0' + n : '' + n; }

    // ---- Right Panel ----
    function showPlaceholder() {
        state.editingId = null;
        placeholder.style.display = ''; editor.style.display = 'none'; formatBar.style.display = 'none';
        renderBar();
    }

    function openNew() {
        state.editingId = null;
        placeholder.style.display = 'none'; editor.style.display = ''; formatBar.style.display = '';
        editorMode.textContent = '新建';
        eTitle.value = ''; eContent.innerHTML = ''; eCategory.value = '';
        editorMeta.textContent = '';
        btnDelete.style.display = 'none'; btnToggle.style.display = 'none';
        btnSave.textContent = '保存';
        renderBar(); eTitle.focus();
    }

    function openMemo(id) {
        var m = state.memos.find(function (x) { return x.id === id; }); if (!m) return;
        state.editingId = id;
        placeholder.style.display = 'none'; editor.style.display = ''; formatBar.style.display = '';
        editorMode.textContent = m.is_completed ? '已完成' : '编辑';
        eTitle.value = m.title;
        eCategory.value = m.category || '';
        if (m.is_html) { eContent.innerHTML = m.content; } else { eContent.textContent = m.content; }
        editorMeta.textContent = '创建于 ' + fmt(m.created_at) + ' &middot; 更新于 ' + fmt(m.updated_at || m.created_at);
        btnDelete.style.display = ''; btnToggle.style.display = '';
        btnToggle.textContent = m.is_completed ? '恢复' : '标记完成';
        btnSave.textContent = '保存';
        renderBar();
    }

    // ---- Save ----
    function getContent() { return eContent.innerHTML.trim(); }

    function save() {
        var title = eTitle.value.trim();
        if (title === '') { toast('标题不能为空', 'error'); eTitle.focus(); return; }
        var content = getContent();
        var isHtml = content.indexOf('<') !== -1;
        var category = (eCategory.value || '').trim().substring(0, 30);

        btnSave.disabled = true; btnSave.textContent = '...';

        if (state.editingId !== null) {
            api('update', { id: state.editingId, title: title, content: content, category: category, is_html: isHtml }).then(function (j) {
                var i = state.memos.findIndex(function (x) { return x.id === j.memo.id; }); if (i !== -1) state.memos[i] = j.memo;
                editorMeta.innerHTML = '更新于 ' + fmt(j.memo.updated_at);
                renderBar(); renderCategories(); toast('已保存', 'success');
            }).catch(function (e) { toast(e.message, 'error'); })
            .finally(function () { btnSave.disabled = false; btnSave.textContent = '保存'; });
        } else {
            api('create', { title: title, content: content, category: category, is_html: isHtml }).then(function (j) {
                state.memos.unshift(j.memo); state.editingId = j.memo.id;
                editorMode.textContent = '编辑';
                editorMeta.innerHTML = '创建于 ' + fmt(j.memo.created_at);
                btnDelete.style.display = ''; btnToggle.style.display = '';
                renderBar(); renderCategories(); toast('已创建', 'success');
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
            showPlaceholder(); renderCategories(); toast('已删除', 'success');
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

    // ---- Rich Text Commands ----
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.fmt-btn');
        if (!btn) return;
        e.preventDefault();
        var cmd = btn.getAttribute('data-cmd');
        var val = btn.getAttribute('data-val') || null;
        if (cmd) { document.execCommand(cmd, false, val); eContent.focus(); }
    });

    // Table insertion
    $('btn-table').addEventListener('click', function (e) {
        e.preventDefault();
        var rows = prompt('表格行数', '3');
        var cols = prompt('表格列数', '3');
        if (!rows || !cols) return;
        var r = parseInt(rows), c = parseInt(cols);
        if (isNaN(r) || isNaN(c) || r < 1 || c < 1) return;
        var html = '<table>';
        for (var i = 0; i < r; i++) {
            html += '<tr>';
            for (var j = 0; j < c; j++) html += (i === 0 ? '<th>表头</th>' : '<td></td>');
            html += '</tr>';
        }
        html += '</table><br>';
        document.execCommand('insertHTML', false, html);
        eContent.focus();
    });

    // Clear format
    $('btn-clear-fmt').addEventListener('click', function (e) {
        e.preventDefault();
        document.execCommand('removeFormat', false, null);
        eContent.focus();
    });

    // ---- Events ----
    btnNew.addEventListener('click', openNew);
    btnSave.addEventListener('click', save);
    btnDelete.addEventListener('click', remove);
    btnToggle.addEventListener('click', toggle);

    barList.addEventListener('click', function (e) {
        var item = e.target.closest('.bar-item'); if (!item) return;
        var id = parseInt(item.getAttribute('data-id')); if (id) openMemo(id);
    });

    // Category filter
    barCats.addEventListener('click', function (e) {
        var tag = e.target.closest('.cat-tag'); if (!tag) return;
        state.activeCat = tag.getAttribute('data-cat');
        renderCategories();
        // re-fetch with filter
        barLoading.style.display = 'block';
        api('list').then(function (j) { state.memos = j.memos; state.categories = j.categories || []; renderBar(); renderCategories(); })
        .catch(function (e) { toast('加载失败', 'error'); });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openNew(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    });

    document.addEventListener('DOMContentLoaded', fetchMemos);
})();
