/**
 * 在线备忘录 - 完整功能
 */
(function () {
    'use strict';
    var state = { memos: [], editingId: null, categories: [], activeCat: '', query: '', trashMode: false };
    var csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    function $(id) { return document.getElementById(id); }
    function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }

    // DOM
    var barList = $('bar-list'), barEmpty = $('bar-empty'), barLoading = $('bar-loading');
    var barFooter = $('bar-footer'), barSection = $('bar-section-title'), barCats = $('bar-categories');
    var barTrash = $('bar-trash'), btnTrashBtn = $('btn-trash');
    var placeholder = $('right-placeholder'), editor = $('editor');
    var trashView = $('trash-view'), trashList = $('trash-list'), trashEmpty = $('trash-empty');
    var editorMode = $('editor-mode'), editorMeta = $('editor-meta');
    var eTitle = $('editor-title'), eContent = $('editor-content'), eCategory = $('editor-category');
    var btnSave = $('btn-save'), btnDelete = $('btn-delete'), btnToggle = $('btn-toggle'), btnPin = $('btn-pin'), btnNew = $('btn-new-memo');
    var formatBar = $('format-bar'), catList = $('cat-list'), searchInput = $('search-input');
    var btnCloseTrash = $('btn-close-trash'), btnDark = $('btn-dark-mode');
    var toastArea = $('toast-area');

    function toast(text) {
        var t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = '<span>' + esc(text) + '</span><button class="toast-close" onclick="this.parentElement.remove()">x</button>';
        if (toastArea) toastArea.appendChild(t);
        setTimeout(function () { if (t.parentElement) t.remove(); }, 2500);
    }

    function api(action, data) {
        var opts = { method: action === 'list' ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } };
        if (action !== 'list' && data !== undefined) opts.body = JSON.stringify(data);
        var url = 'api/memos.php?action=' + action;
        if (action === 'list' && state.activeCat) url += '&category=' + encodeURIComponent(state.activeCat);
        if (action === 'list' && state.trashMode) url += '&trash=1';
        return fetch(url, opts)
            .then(function (r) { if (r.status === 401) { location.href = 'login.php'; throw new Error('未登录'); } return r.json(); })
            .then(function (j) { if (!j.success) throw new Error(j.message || '失败'); return j; })
            .catch(function (e) { if (e.message !== '未登录') toast(e.message); throw e; });
    }

    // ====== Load ======
    function fetchMemos() {
        barLoading.style.display = 'block';
        api('list').then(function (j) {
            state.memos = j.memos; state.categories = j.categories || [];
            renderBar(); renderCategories(); renderTrashSidebar();
        }).catch(function () {});
    }

    // ====== Sidebar ======
    function renderBar() {
        barLoading.style.display = 'none';
        var filtered = state.memos;
        if (state.activeCat && !state.trashMode) filtered = filtered.filter(function (m) { return m.category === state.activeCat; });
        if (state.query) {
            var q = state.query.toLowerCase();
            filtered = filtered.filter(function (m) { return m.title.toLowerCase().indexOf(q) !== -1 || m.content.toLowerCase().indexOf(q) !== -1; });
        }
        if (filtered.length === 0) { barEmpty.style.display = 'block'; barList.innerHTML = ''; }
        else {
            barEmpty.style.display = 'none';
            var html = '';
            for (var i = 0; i < filtered.length; i++) {
                var m = filtered[i];
                var cls = 'bar-item' + (m.is_completed ? ' done' : '') + (m.is_pinned ? ' pinned' : '') + (state.editingId === m.id ? ' active' : '');
                html += '<div class="' + cls + '" data-id="' + m.id + '">' +
                    '<div class="bar-item-title">' + (m.is_pinned ? '<span class="pin-dot">&#9733; </span>' : '') + esc(m.title) + '</div>' +
                    '<div class="bar-item-meta">' + fmt(m.updated_at || m.created_at) + (m.category ? ' &middot; ' + esc(m.category) : '') + '</div></div>';
            }
            barList.innerHTML = html;
        }
        updateFooter(filtered.length);
    }

    function renderTrashSidebar() {
        var deleted = state.memos.filter(function (m) { return m.is_deleted; });
        if (deleted.length > 0) {
            btnTrashBtn.style.display = '';
            btnTrashBtn.textContent = '🗑 回收站 (' + deleted.length + ')';
        } else {
            btnTrashBtn.style.display = 'none';
        }
    }

    // ====== Categories ======
    function getSavedCats() { try { return JSON.parse(localStorage.getItem('memo_categories') || '[]'); } catch (e) { return []; } }
    function saveCats(cats) { localStorage.setItem('memo_categories', JSON.stringify(cats)); }
    function getAllCategories() {
        var saved = getSavedCats(), merged = saved.slice();
        for (var i = 0; i < state.categories.length; i++) { if (merged.indexOf(state.categories[i]) === -1) merged.push(state.categories[i]); }
        return merged;
    }
    function renderCategories() {
        var allCats = getAllCategories();
        var html = '<span class="cat-tag' + (state.activeCat === '' ? ' active' : '') + '" data-cat="">全部</span>';
        for (var i = 0; i < allCats.length; i++) {
            var cat = allCats[i];
            html += '<span class="cat-row"><span class="cat-tag' + (state.activeCat === cat ? ' active' : '') + '" data-cat="' + esc(cat) + '">' + esc(cat) + '</span><button class="cat-del" data-delcat="' + esc(cat) + '">&times;</button></span>';
        }
        html += '<button class="cat-add" id="btn-add-cat">+</button>';
        barCats.innerHTML = html;
        var opts = ''; for (var j = 0; j < allCats.length; j++) opts += '<option value="' + esc(allCats[j]) + '">'; if (catList) catList.innerHTML = opts;
        var addBtn = document.getElementById('btn-add-cat');
        if (addBtn) addBtn.onclick = function () { var n = prompt('新分类名称：'); if (n && n.trim()) { n = n.trim().substring(0, 30); var s = getSavedCats(); if (s.indexOf(n) === -1) { s.push(n); saveCats(s); } renderCategories(); } };
    }

    function updateFooter(cnt) {
        var t = cnt || state.memos.length;
        barFooter.textContent = t + ' 条';
        barSection.textContent = state.trashMode ? '回收站 (' + t + ')' : (state.activeCat || '全部') + ' (' + t + ')';
    }

    function fmt(d) { var dt = new Date(d); return dt.getFullYear() + '/' + p(dt.getMonth()+1) + '/' + p(dt.getDate()); }
    function p(n) { return n < 10 ? '0' + n : '' + n; }

    // ====== Editor ======
    function hideAll() { placeholder.style.display = 'none'; editor.style.display = 'none'; trashView.style.display = 'none'; formatBar.style.display = 'none'; }
    function showPlaceholder() { state.editingId = null; hideAll(); placeholder.style.display = ''; renderBar(); }
    function openNew() {
        state.editingId = null; state.trashMode = false;
        hideAll(); editor.style.display = ''; formatBar.style.display = '';
        editorMode.textContent = '新建备忘录'; editorMeta.textContent = '';
        eTitle.value = ''; eContent.innerHTML = ''; eCategory.value = '';
        btnDelete.style.display = 'none'; btnToggle.style.display = 'none'; btnPin.style.display = 'none';
        btnSave.textContent = '保存'; renderBar(); eTitle.focus();
    }
    function openMemo(id) {
        var m = state.memos.find(function (x) { return x.id === id; }); if (!m) return;
        if (m.is_deleted) return;
        state.editingId = id; state.trashMode = false;
        hideAll(); editor.style.display = ''; formatBar.style.display = '';
        editorMode.textContent = m.is_completed ? '已完成' : '编辑';
        eTitle.value = m.title; eCategory.value = m.category || '';
        if (m.is_html) eContent.innerHTML = m.content; else eContent.innerText = m.content;
        editorMeta.textContent = '创建于 ' + fmt(m.created_at) + ' - 更新于 ' + fmt(m.updated_at || m.created_at);
        btnDelete.style.display = ''; btnToggle.style.display = ''; btnPin.style.display = '';
        btnToggle.textContent = m.is_completed ? '恢复' : '完成';
        btnPin.textContent = m.is_pinned ? '📌 已置顶' : '📌 置顶';
        btnPin.style.fontWeight = m.is_pinned ? '700' : '';
        btnSave.textContent = '保存';
        renderBar();
    }
    function getContent() { return eContent.innerHTML.trim(); }

    function save() {
        var title = eTitle.value.trim(); if (title === '') { toast('标题不能为空'); eTitle.focus(); return; }
        var content = getContent(), isHtml = content.indexOf('<') !== -1;
        var cat = (eCategory.value || '').trim().substring(0, 30);
        btnSave.disabled = true; btnSave.textContent = '...';
        var p = { title: title, content: content, category: cat, is_html: isHtml };
        if (state.editingId !== null) {
            p.id = state.editingId;
            api('update', p).then(function (j) { updateMemoInState(j.memo); editorMeta.textContent = '更新于 ' + fmt(j.memo.updated_at); renderBar(); renderCategories(); toast('已保存'); })
            .finally(function () { btnSave.disabled = false; btnSave.textContent = '保存'; });
        } else {
            api('create', p).then(function (j) { state.memos.unshift(j.memo); state.editingId = j.memo.id; editorMode.textContent = '编辑'; editorMeta.textContent = '创建于 ' + fmt(j.memo.created_at); btnDelete.style.display = ''; btnToggle.style.display = ''; btnPin.style.display = ''; renderBar(); renderCategories(); toast('已创建'); })
            .finally(function () { btnSave.disabled = false; btnSave.textContent = '保存'; });
        }
    }

    function updateMemoInState(memo) { var i = state.memos.findIndex(function (x) { return x.id === memo.id; }); if (i !== -1) state.memos[i] = memo; }

    function trash() {
        if (!state.editingId) return;
        if (!confirm('移动到回收站？')) return;
        api('delete', { id: state.editingId }).then(function () {
            var i = state.memos.findIndex(function (x) { return x.id === state.editingId; }); if (i !== -1) state.memos[i].is_deleted = true;
            showPlaceholder(); renderBar(); renderTrashSidebar(); toast('已移到回收站');
        }).catch(function () {});
    }

    function toggle() {
        if (!state.editingId) return;
        api('toggle', { id: state.editingId }).then(function (j) {
            var i = state.memos.findIndex(function (x) { return x.id === state.editingId; }); if (i !== -1) state.memos[i].is_completed = j.is_completed;
            editorMode.textContent = state.memos[i].is_completed ? '已完成' : '编辑';
            btnToggle.textContent = state.memos[i].is_completed ? '恢复' : '完成';
            renderBar();
        }).catch(function () {});
    }

    function pin() {
        if (!state.editingId) return;
        api('pin', { id: state.editingId }).then(function (j) {
            var i = state.memos.findIndex(function (x) { return x.id === state.editingId; }); if (i !== -1) state.memos[i].is_pinned = j.is_pinned;
            btnPin.textContent = j.is_pinned ? '📌 已置顶' : '📌 置顶';
            btnPin.style.fontWeight = j.is_pinned ? '700' : '';
            renderBar(); toast(j.is_pinned ? '已置顶' : '已取消置顶');
        }).catch(function () {});
    }

    // ====== Trash View ======
    function openTrash() {
        state.trashMode = true; state.editingId = null;
        hideAll(); trashView.style.display = ''; placeholder.style.display = 'none';
        barLoading.style.display = 'block';
        api('list').then(function (j) {
            state.memos = j.memos;
            var deleted = j.memos.filter(function (m) { return m.is_deleted; });
            renderTrashList(deleted); renderBar(); renderTrashSidebar();
        }).catch(function () {});
    }

    function renderTrashList(items) {
        barLoading.style.display = 'none';
        if (items.length === 0) { trashList.innerHTML = ''; trashEmpty.style.display = ''; }
        else {
            trashEmpty.style.display = 'none';
            var html = '';
            for (var i = 0; i < items.length; i++) {
                var m = items[i];
                html += '<div class="trash-item"><div class="trash-item-title">' + esc(m.title) + '</div>' +
                    '<div class="trash-item-meta">' + fmt(m.created_at) + '</div>' +
                    '<div class="trash-item-actions">' +
                    '<button class="btn btn-sm btn-secondary btn-restore" data-id="' + m.id + '">恢复</button>' +
                    '<button class="btn btn-sm btn-danger btn-purge" data-id="' + m.id + '">彻底删除</button>' +
                    '</div></div>';
            }
            trashList.innerHTML = html;
        }
    }

    // ====== Dark Mode ======
    function initDarkMode() {
        var saved = localStorage.getItem('dark_mode');
        if (saved === '1') document.body.classList.add('dark');
        if (btnDark) btnDark.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    }
    function toggleDark() {
        document.body.classList.toggle('dark');
        var isDark = document.body.classList.contains('dark');
        localStorage.setItem('dark_mode', isDark ? '1' : '0');
        if (btnDark) btnDark.textContent = isDark ? '☀️' : '🌙';
    }

    // ====== Format bar ======
    formatBar.addEventListener('mousedown', function (e) {
        var btn = e.target.closest('.fmt-btn'); if (!btn) return;
        e.preventDefault();
        var cmd = btn.getAttribute('data-cmd'), val = btn.getAttribute('data-val') || null;
        if (cmd) { document.execCommand(cmd, false, val); toggleFormatBtns(); }
    });
    $('btn-table').addEventListener('mousedown', function (e) {
        e.preventDefault();
        var r = parseInt(prompt('行数', '2')), c = parseInt(prompt('列数', '3'));
        if (!r || !c) return;
        var html = '<table><thead><tr>'; for (var j = 0; j < c; j++) html += '<th>表头</th>';
        html += '</tr></thead><tbody>';
        for (var i = 1; i < r; i++) { html += '<tr>'; for (var k = 0; k < c; k++) html += '<td>&nbsp;</td>'; html += '</tr>'; }
        html += '</tbody></table>';
        document.execCommand('insertHTML', false, html); eContent.focus();
    });
    $('btn-clear-fmt').addEventListener('mousedown', function (e) { e.preventDefault(); document.execCommand('removeFormat', false, null); eContent.focus(); });
    function toggleFormatBtns() {
        var btns = formatBar.querySelectorAll('.fmt-btn');
        for (var i = 0; i < btns.length; i++) {
            var cmd = btns[i].getAttribute('data-cmd');
            if (!cmd || cmd === 'formatBlock' || cmd === 'insertUnorderedList' || cmd === 'insertOrderedList') continue;
            btns[i].classList.toggle('on', document.queryCommandState(cmd));
        }
    }
    eContent.addEventListener('keyup', toggleFormatBtns);
    eContent.addEventListener('mouseup', toggleFormatBtns);
    document.addEventListener('selectionchange', function () { if (document.activeElement === eContent) toggleFormatBtns(); });

    // ====== Events ======
    btnNew.addEventListener('click', openNew);
    btnSave.addEventListener('click', save);
    btnDelete.addEventListener('click', trash);
    btnToggle.addEventListener('click', toggle);
    btnPin.addEventListener('click', pin);
    btnDark.addEventListener('click', toggleDark);
    btnTrashBtn.addEventListener('click', openTrash);
    btnCloseTrash.addEventListener('click', function () { state.trashMode = false; hideAll(); placeholder.style.display = ''; fetchMemos(); });

    // Sidebar click
    barList.addEventListener('click', function (e) {
        var item = e.target.closest('.bar-item'); if (!item) return;
        openMemo(parseInt(item.getAttribute('data-id')));
    });

    // Categories
    barCats.addEventListener('click', function (e) {
        var del = e.target.closest('.cat-del');
        if (del) {
            var cat = del.getAttribute('data-delcat');
            if (!confirm('删除分类 "' + cat + '"？')) return;
            var s = getSavedCats(); var idx = s.indexOf(cat);
            if (idx !== -1) { s.splice(idx, 1); saveCats(s); }
            if (state.activeCat === cat) state.activeCat = '';
            renderCategories();
            api('list').then(function (j) { state.memos = j.memos; state.categories = j.categories || []; renderBar(); });
            return;
        }
        var tag = e.target.closest('.cat-tag'); if (!tag) return;
        state.activeCat = tag.getAttribute('data-cat'); renderCategories();
        api('list').then(function (j) { state.memos = j.memos; state.categories = j.categories || []; renderBar(); renderTrashSidebar(); });
    });

    // Trash list actions
    trashList.addEventListener('click', function (e) {
        var t = e.target; var id = parseInt(t.getAttribute('data-id')); if (!id) return;
        if (t.classList.contains('btn-restore')) {
            api('restore', { id: id }).then(function () { openTrash(); toast('已恢复'); }).catch(function () {});
        }
        if (t.classList.contains('btn-purge')) {
            if (!confirm('彻底删除？不可恢复！')) return;
            api('purge', { id: id }).then(function () { openTrash(); toast('已彻底删除'); }).catch(function () {});
        }
    });

    // Search
    searchInput.addEventListener('input', function () {
        state.query = searchInput.value; renderBar();
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); openNew(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); searchInput.focus(); }
    });

    document.addEventListener('DOMContentLoaded', function () { initDarkMode(); fetchMemos(); });
})();
