<?php
/**
 * 数据库连接配置
 * 返回 PDO 单例实例（MySQL/MariaDB）
 */

function getDB(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $host = '127.0.0.1';
        $port = '3307';
        $dbname = 'online_memo';
        $charset = 'utf8mb4';
        $username = 'root';
        $password = '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset={$charset}";

        try {
            $pdo = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => '数据库连接失败，请检查 MySQL 服务是否已启动'
            ]);
            exit;
        }
    }

    return $pdo;
}
