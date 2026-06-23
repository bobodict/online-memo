<?php
/**
 * 图片上传接口
 */
require_once __DIR__ . '/../includes/session.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json; charset=utf-8');

if (!is_logged_in()) { http_response_code(401); echo json_encode(['success' => false, 'message' => '请先登录']); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }

// CSRF check via header
$headers = array_change_key_case(getallheaders(), CASE_LOWER);
$token = $headers['x-csrf-token'] ?? '';
if (!csrf_verify($token)) { http_response_code(403); echo json_encode(['success' => false, 'message' => '请求无效']); exit; }

if (empty($_FILES['image'])) { http_response_code(422); echo json_encode(['success' => false, 'message' => '没有文件']); exit; }

$file = $_FILES['image'];
$maxSize = 5 * 1024 * 1024; // 5MB
$allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => '上传失败，错误码: ' . $file['error']]); exit;
}
if ($file['size'] > $maxSize) { echo json_encode(['success' => false, 'message' => '图片不能超过 5MB']); exit; }
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
if (!in_array($mime, $allowed)) { echo json_encode(['success' => false, 'message' => '仅支持 JPG/PNG/GIF/WebP']); exit; }

$ext = match($mime) { 'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp', default => 'jpg' };
$filename = date('Ymd_His_') . bin2hex(random_bytes(4)) . '.' . $ext;
$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
$dest = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) { echo json_encode(['success' => false, 'message' => '保存文件失败']); exit; }

echo json_encode(['success' => true, 'url' => 'uploads/' . $filename, 'filename' => $filename]);
