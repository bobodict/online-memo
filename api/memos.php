<?php
/**
 * 备忘录 CRUD API
 */

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '请先登录']);
    exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$user_id = (int) $_SESSION['user_id'];
$db = getDB();

function get_json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function check_csrf(): void {
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $token = $headers['x-csrf-token'] ?? '';
    if (!csrf_verify($token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => '请求无效，请刷新页面后重试']);
        exit;
    }
}

/** 简易 HTML 清洗：只保留安全标签 */
function clean_html(string $html): string {
    $allowed = '<b><i><u><s><strong><em><strike><h2><h3><br><p><table><thead><tbody><tr><th><td><ul><ol><li><span><div><sub><sup>';
    $html = strip_tags($html, $allowed);
    // 移除危险属性（onclick, onerror, javascript: 等）
    $html = preg_replace('/\s+on\w+\s*=\s*"[^"]*"/i', '', $html);
    $html = preg_replace('/\s+on\w+\s*=\s*\'[^\']*\'/i', '', $html);
    $html = preg_replace('/javascript\s*:/i', '', $html);
    return trim($html);
}

// 拼接 SELECT 字段
$select_fields = 'id, title, content, category, is_completed, is_html, created_at, updated_at';
$order_by = 'ORDER BY is_completed ASC, updated_at DESC';

try {
    switch ($action) {

        case 'list':
            if ($method !== 'GET') { http_response_code(405); echo json_encode(['success' => false, 'message' => '请求方法不允许']); break; }
            $category = $_GET['category'] ?? '';
            if ($category !== '') {
                $stmt = $db->prepare("SELECT {$select_fields} FROM memos WHERE user_id = :uid AND category = :cat {$order_by}");
                $stmt->execute(['uid' => $user_id, 'cat' => $category]);
            } else {
                $stmt = $db->prepare("SELECT {$select_fields} FROM memos WHERE user_id = :uid {$order_by}");
                $stmt->execute(['uid' => $user_id]);
            }
            $memos = $stmt->fetchAll();
            foreach ($memos as &$m) { $m['id'] = (int)$m['id']; $m['is_completed'] = (bool)$m['is_completed']; $m['is_html'] = (bool)$m['is_html']; }
            echo json_encode(['success' => true, 'memos' => $memos, 'categories' => get_categories($db, $user_id)]);
            break;

        case 'create':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => '请求方法不允许']); break; }
            check_csrf();
            $input = get_json_input();
            $title = trim($input['title'] ?? '');
            $content = trim($input['content'] ?? '');
            $category = trim($input['category'] ?? '');
            $is_html = !empty($input['is_html']) ? 1 : 0;
            if ($title === '') { http_response_code(422); echo json_encode(['success' => false, 'message' => '备忘录标题不能为空']); break; }
            if (mb_strlen($title) > 200) { http_response_code(422); echo json_encode(['success' => false, 'message' => '标题长度不能超过 200 个字符']); break; }
            if (mb_strlen($content) > 50000) { http_response_code(422); echo json_encode(['success' => false, 'message' => '内容过长']); break; }
            if ($is_html) $content = clean_html($content);
            $stmt = $db->prepare('INSERT INTO memos (user_id, title, content, category, is_html) VALUES (:uid, :title, :content, :cat, :html)');
            $stmt->execute(['uid' => $user_id, 'title' => $title, 'content' => $content, 'cat' => mb_substr($category, 0, 30), 'html' => $is_html]);
            $id = (int)$db->lastInsertId();
            $stmt = $db->prepare("SELECT {$select_fields} FROM memos WHERE id = :id");
            $stmt->execute(['id' => $id]); $memo = $stmt->fetch();
            $memo['id'] = (int)$memo['id']; $memo['is_completed'] = (bool)$memo['is_completed']; $memo['is_html'] = (bool)$memo['is_html'];
            echo json_encode(['success' => true, 'memo' => $memo]);
            break;

        case 'update':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => '请求方法不允许']); break; }
            check_csrf();
            $input = get_json_input();
            $id = (int)($input['id'] ?? 0);
            $title = trim($input['title'] ?? '');
            $content = trim($input['content'] ?? '');
            $category = trim($input['category'] ?? '');
            $is_html = !empty($input['is_html']) ? 1 : 0;
            if ($id <= 0) { http_response_code(422); echo json_encode(['success' => false, 'message' => '无效的备忘录 ID']); break; }
            if ($title === '') { http_response_code(422); echo json_encode(['success' => false, 'message' => '备忘录标题不能为空']); break; }
            if (mb_strlen($title) > 200) { http_response_code(422); echo json_encode(['success' => false, 'message' => '标题长度不能超过 200 个字符']); break; }
            if (mb_strlen($content) > 50000) { http_response_code(422); echo json_encode(['success' => false, 'message' => '内容过长']); break; }
            if ($is_html) $content = clean_html($content);
            $stmt = $db->prepare('UPDATE memos SET title=:title, content=:content, category=:cat, is_html=:html, updated_at=CURRENT_TIMESTAMP WHERE id=:id AND user_id=:uid');
            $stmt->execute(['title' => $title, 'content' => $content, 'cat' => mb_substr($category, 0, 30), 'html' => $is_html, 'id' => $id, 'uid' => $user_id]);
            if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['success' => false, 'message' => '备忘录不存在或无权操作']); break; }
            $stmt = $db->prepare("SELECT {$select_fields} FROM memos WHERE id = :id");
            $stmt->execute(['id' => $id]); $memo = $stmt->fetch();
            $memo['id'] = (int)$memo['id']; $memo['is_completed'] = (bool)$memo['is_completed']; $memo['is_html'] = (bool)$memo['is_html'];
            echo json_encode(['success' => true, 'memo' => $memo]);
            break;

        case 'delete':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => '请求方法不允许']); break; }
            check_csrf();
            $input = get_json_input(); $id = (int)($input['id'] ?? 0);
            $stmt = $db->prepare('DELETE FROM memos WHERE id=:id AND user_id=:uid');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['success' => false, 'message' => '备忘录不存在或无权操作']); break; }
            echo json_encode(['success' => true]);
            break;

        case 'toggle':
            if ($method !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'message' => '请求方法不允许']); break; }
            check_csrf();
            $input = get_json_input(); $id = (int)($input['id'] ?? 0);
            $stmt = $db->prepare('UPDATE memos SET is_completed=NOT is_completed, updated_at=CURRENT_TIMESTAMP WHERE id=:id AND user_id=:uid');
            $stmt->execute(['id' => $id, 'uid' => $user_id]);
            if ($stmt->rowCount() === 0) { http_response_code(404); echo json_encode(['success' => false, 'message' => '备忘录不存在或无权操作']); break; }
            $stmt = $db->prepare('SELECT is_completed FROM memos WHERE id=:id'); $stmt->execute(['id' => $id]);
            echo json_encode(['success' => true, 'is_completed' => (bool)$stmt->fetchColumn()]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '未知的 API 操作']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器内部错误']);
}

function get_categories(PDO $db, int $user_id): array {
    $stmt = $db->prepare('SELECT DISTINCT category FROM memos WHERE user_id=:uid AND category != \'\' ORDER BY category');
    $stmt->execute(['uid' => $user_id]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}
