<?php
/**
 * 备忘录 CRUD API
 * 支持：list / create / update / delete(软删除) / toggle / pin / restore / purge
 */

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) { http_response_code(401); echo json_encode(['success' => false, 'message' => '请先登录']); exit; }

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$user_id = (int)$_SESSION['user_id'];
$db = getDB();

function get_json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
function check_csrf(): void {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    if (!csrf_verify($headers['x-csrf-token'] ?? '')) { http_response_code(403); echo json_encode(['success' => false, 'message' => '请求无效']); exit; }
}
function clean_html(string $html): string {
    $allowed = '<b><i><u><s><strong><em><strike><h2><h3><br><p><table><thead><tbody><tr><th><td><ul><ol><li><span><div><sub><sup>';
    $html = strip_tags($html, $allowed);
    $html = preg_replace('/\s+on\w+\s*=\s*"[^"]*"/i', '', $html);
    $html = preg_replace('/\s+on\w+\s*=\s*\'[^\']*\'/i', '', $html);
    $html = preg_replace('/javascript\s*:/i', '', $html);
    return trim($html);
}

$fields = 'id, title, content, category, is_completed, is_html, is_pinned, is_deleted, created_at, updated_at';

try {
    switch ($action) {
        // ========== 列表（排除已删除，置顶优先） ==========
        case 'list':
            if ($method !== 'GET') { http_response_code(405); break; }
            $category = $_GET['category'] ?? '';
            $trash = ($_GET['trash'] ?? '') === '1';
            $deleted_where = $trash ? 'is_deleted = 1' : 'is_deleted = 0';
            if ($category !== '') {
                $stmt = $db->prepare("SELECT {$fields} FROM memos WHERE user_id=:uid AND {$deleted_where} AND category=:cat ORDER BY is_pinned DESC, is_completed ASC, updated_at DESC");
                $stmt->execute(['uid' => $user_id, 'cat' => $category]);
            } else {
                $stmt = $db->prepare("SELECT {$fields} FROM memos WHERE user_id=:uid AND {$deleted_where} ORDER BY is_pinned DESC, is_completed ASC, updated_at DESC");
                $stmt->execute(['uid' => $user_id]);
            }
            $memos = $stmt->fetchAll();
            foreach ($memos as &$m) { $m['id']=(int)$m['id']; $m['is_completed']=(bool)$m['is_completed']; $m['is_html']=(bool)$m['is_html']; $m['is_pinned']=(bool)$m['is_pinned']; $m['is_deleted']=(bool)$m['is_deleted']; }
            echo json_encode(['success' => true, 'memos' => $memos, 'categories' => get_categories($db, $user_id)]);
            break;

        // ========== 创建 ==========
        case 'create':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input();
            $title = trim($in['title'] ?? ''); $content = trim($in['content'] ?? '');
            $category = trim($in['category'] ?? ''); $is_html = !empty($in['is_html']) ? 1 : 0;
            if ($title === '') { http_response_code(422); echo json_encode(['success' => false, 'message' => '标题不能为空']); break; }
            if ($is_html) $content = clean_html($content);
            $stmt = $db->prepare('INSERT INTO memos (user_id, title, content, category, is_html) VALUES (:uid, :t, :c, :cat, :h)');
            $stmt->execute(['uid' => $user_id, 't' => $title, 'c' => $content, 'cat' => mb_substr($category, 0, 30), 'h' => $is_html]);
            $id = (int)$db->lastInsertId();
            $stmt = $db->prepare("SELECT {$fields} FROM memos WHERE id=:id"); $stmt->execute(['id' => $id]); $m = $stmt->fetch();
            $m['id']=(int)$m['id']; $m['is_completed']=(bool)$m['is_completed']; $m['is_html']=(bool)$m['is_html']; $m['is_pinned']=(bool)$m['is_pinned']; $m['is_deleted']=(bool)$m['is_deleted'];
            echo json_encode(['success' => true, 'memo' => $m]);
            break;

        // ========== 更新 ==========
        case 'update':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input();
            $id = (int)($in['id'] ?? 0); $title = trim($in['title'] ?? ''); $content = trim($in['content'] ?? '');
            $category = trim($in['category'] ?? ''); $is_html = !empty($in['is_html']) ? 1 : 0;
            if ($id <= 0) { http_response_code(422); echo json_encode(['success' => false, 'message' => '无效 ID']); break; }
            if ($title === '') { http_response_code(422); echo json_encode(['success' => false, 'message' => '标题不能为空']); break; }
            if ($is_html) $content = clean_html($content);
            $stmt = $db->prepare('UPDATE memos SET title=:t, content=:c, category=:cat, is_html=:h, updated_at=CURRENT_TIMESTAMP WHERE id=:id AND user_id=:uid');
            $stmt->execute(['t' => $title, 'c' => $content, 'cat' => mb_substr($category, 0, 30), 'h' => $is_html, 'id' => $id, 'uid' => $user_id]);
            if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['success' => false, 'message' => '不存在或无权操作']); break; }
            $stmt = $db->prepare("SELECT {$fields} FROM memos WHERE id=:id"); $stmt->execute(['id' => $id]); $m = $stmt->fetch();
            $m['id']=(int)$m['id']; $m['is_completed']=(bool)$m['is_completed']; $m['is_html']=(bool)$m['is_html']; $m['is_pinned']=(bool)$m['is_pinned']; $m['is_deleted']=(bool)$m['is_deleted'];
            echo json_encode(['success' => true, 'memo' => $m]);
            break;

        // ========== 软删除 ==========
        case 'delete':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input(); $id = (int)($in['id'] ?? 0);
            $stmt = $db->prepare('UPDATE memos SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=:id AND user_id=:uid');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['success' => false, 'message' => '不存在']); break; }
            echo json_encode(['success' => true]);
            break;

        // ========== 恢复 ==========
        case 'restore':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input(); $id = (int)($in['id'] ?? 0);
            $stmt = $db->prepare('UPDATE memos SET is_deleted=0, deleted_at=NULL WHERE id=:id AND user_id=:uid');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            echo json_encode(['success' => $stmt->rowCount() > 0]);
            break;

        // ========== 永久删除 ==========
        case 'purge':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input(); $id = (int)($in['id'] ?? 0);
            $stmt = $db->prepare('DELETE FROM memos WHERE id=:id AND user_id=:uid AND is_deleted=1');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            echo json_encode(['success' => $stmt->rowCount() > 0]);
            break;

        // ========== 切换完成 ==========
        case 'toggle':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input(); $id = (int)($in['id'] ?? 0);
            $stmt = $db->prepare('UPDATE memos SET is_completed=NOT is_completed, updated_at=CURRENT_TIMESTAMP WHERE id=:id AND user_id=:uid');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            $stmt = $db->prepare('SELECT is_completed FROM memos WHERE id=:id'); $stmt->execute(['id' => $id]);
            echo json_encode(['success' => true, 'is_completed' => (bool)$stmt->fetchColumn()]);
            break;

        // ========== 切换置顶 ==========
        case 'pin':
            if ($method !== 'POST') { http_response_code(405); break; }
            check_csrf();
            $in = get_json_input(); $id = (int)($in['id'] ?? 0);
            $stmt = $db->prepare('UPDATE memos SET is_pinned=NOT is_pinned WHERE id=:id AND user_id=:uid');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            $stmt = $db->prepare('SELECT is_pinned FROM memos WHERE id=:id'); $stmt->execute(['id' => $id]);
            echo json_encode(['success' => true, 'is_pinned' => (bool)$stmt->fetchColumn()]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '未知操作']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器错误']);
}

function get_categories(PDO $db, int $uid): array {
    $stmt = $db->prepare("SELECT DISTINCT category FROM memos WHERE user_id=:uid AND category != '' AND is_deleted=0 ORDER BY category");
    $stmt->execute(['uid' => $uid]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}
