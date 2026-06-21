<?php
/**
 * 备忘录 CRUD API
 * 所有请求返回 JSON
 *
 * GET  ?action=list        → 获取当前用户所有备忘录
 * POST ?action=create      → 创建新备忘录（JSON body: title, content）
 * POST ?action=update      → 更新备忘录（JSON body: id, title, content, is_completed）
 * POST ?action=delete      → 删除备忘录（JSON body: id）
 * POST ?action=toggle      → 切换完成状态（JSON body: id）
 */

require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';

// 设置响应头
header('Content-Type: application/json; charset=utf-8');

// 必须登录
if (!is_logged_in()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '请先登录']);
    exit;
}

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// 解析 JSON 请求体
function get_json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// CSRF 校验
function check_csrf(): void
{
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $token = $headers['x-csrf-token'] ?? '';

    if (!csrf_verify($token)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => '请求无效，请刷新页面后重试']);
        exit;
    }
}

// 获取当前用户 ID
$user_id = (int) $_SESSION['user_id'];
$db = getDB();

try {
    switch ($action) {

        // ========== 获取所有备忘录 ==========
        case 'list':
            if ($method !== 'GET') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => '请求方法不允许']);
                break;
            }

            $stmt = $db->prepare(
                'SELECT id, title, content, is_completed, created_at, updated_at
                 FROM memos
                 WHERE user_id = :user_id
                 ORDER BY is_completed ASC, created_at DESC'
            );
            $stmt->execute(['user_id' => $user_id]);
            $memos = $stmt->fetchAll();

            // 类型转换
            foreach ($memos as &$memo) {
                $memo['id'] = (int) $memo['id'];
                $memo['is_completed'] = (bool) $memo['is_completed'];
            }
            unset($memo);

            echo json_encode(['success' => true, 'memos' => $memos]);
            break;

        // ========== 创建备忘录 ==========
        case 'create':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => '请求方法不允许']);
                break;
            }

            check_csrf();

            $input = get_json_input();
            $title = trim($input['title'] ?? '');
            $content = trim($input['content'] ?? '');

            // 服务端验证
            if ($title === '') {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '备忘录标题不能为空']);
                break;
            }
            if (mb_strlen($title) > 200) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '标题长度不能超过 200 个字符']);
                break;
            }
            if (mb_strlen($content) > 5000) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '内容长度不能超过 5000 个字符']);
                break;
            }

            $stmt = $db->prepare(
                'INSERT INTO memos (user_id, title, content) VALUES (:user_id, :title, :content)'
            );
            $stmt->execute([
                'user_id' => $user_id,
                'title'   => $title,
                'content' => $content,
            ]);

            $memo_id = (int) $db->lastInsertId();

            // 返回新建的完整记录
            $stmt = $db->prepare('SELECT id, title, content, is_completed, created_at, updated_at FROM memos WHERE id = :id');
            $stmt->execute(['id' => $memo_id]);
            $memo = $stmt->fetch();
            $memo['id'] = (int) $memo['id'];
            $memo['is_completed'] = (bool) $memo['is_completed'];

            echo json_encode(['success' => true, 'memo' => $memo]);
            break;

        // ========== 更新备忘录 ==========
        case 'update':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => '请求方法不允许']);
                break;
            }

            check_csrf();

            $input = get_json_input();
            $memo_id = (int) ($input['id'] ?? 0);
            $title = trim($input['title'] ?? '');
            $content = trim($input['content'] ?? '');

            if ($memo_id <= 0) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '无效的备忘录 ID']);
                break;
            }
            if ($title === '') {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '备忘录标题不能为空']);
                break;
            }
            if (mb_strlen($title) > 200) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '标题长度不能超过 200 个字符']);
                break;
            }
            if (mb_strlen($content) > 5000) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '内容长度不能超过 5000 个字符']);
                break;
            }

            // 所有权检查
            $stmt = $db->prepare(
                'UPDATE memos SET title = :title, content = :content, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND user_id = :user_id'
            );
            $stmt->execute([
                'title'   => $title,
                'content' => $content,
                'id'      => $memo_id,
                'user_id' => $user_id,
            ]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => '备忘录不存在或无权操作']);
                break;
            }

            // 返回更新后的记录
            $stmt = $db->prepare('SELECT id, title, content, is_completed, created_at, updated_at FROM memos WHERE id = :id');
            $stmt->execute(['id' => $memo_id]);
            $memo = $stmt->fetch();
            $memo['id'] = (int) $memo['id'];
            $memo['is_completed'] = (bool) $memo['is_completed'];

            echo json_encode(['success' => true, 'memo' => $memo]);
            break;

        // ========== 删除备忘录 ==========
        case 'delete':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => '请求方法不允许']);
                break;
            }

            check_csrf();

            $input = get_json_input();
            $memo_id = (int) ($input['id'] ?? 0);

            if ($memo_id <= 0) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '无效的备忘录 ID']);
                break;
            }

            $stmt = $db->prepare('DELETE FROM memos WHERE id = :id AND user_id = :user_id');
            $stmt->execute([
                'id'      => $memo_id,
                'user_id' => $user_id,
            ]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => '备忘录不存在或无权操作']);
                break;
            }

            echo json_encode(['success' => true]);
            break;

        // ========== 切换完成状态 ==========
        case 'toggle':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => '请求方法不允许']);
                break;
            }

            check_csrf();

            $input = get_json_input();
            $memo_id = (int) ($input['id'] ?? 0);

            if ($memo_id <= 0) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => '无效的备忘录 ID']);
                break;
            }

            // 原子翻转
            $stmt = $db->prepare(
                'UPDATE memos SET is_completed = NOT is_completed, updated_at = CURRENT_TIMESTAMP WHERE id = :id AND user_id = :user_id'
            );
            $stmt->execute([
                'id'      => $memo_id,
                'user_id' => $user_id,
            ]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => '备忘录不存在或无权操作']);
                break;
            }

            // 读取新状态
            $stmt = $db->prepare('SELECT is_completed FROM memos WHERE id = :id');
            $stmt->execute(['id' => $memo_id]);
            $memo = $stmt->fetch();

            echo json_encode([
                'success'      => true,
                'is_completed' => (bool) $memo['is_completed'],
            ]);
            break;

        // ========== 未知操作 ==========
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => '未知的 API 操作']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '服务器内部错误']);
}
