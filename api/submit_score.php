<?php
// api/submit_score.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

$name              = trim($data['name']  ?? '');
$email             = trim($data['email'] ?? '');
$total_score       = (int)($data['total_score']       ?? 0);
$total_duration_ms = (int)($data['total_duration_ms'] ?? 0);

// ---------- 基本必填 ----------
if ($name === '' || $email === '') {
  http_response_code(400);
  echo json_encode(['error' => 'missing_name_or_email']);
  exit;
}

// ---------- 名字规则：只允许字母数字下划线（长度自定，这里 1~32） ----------
if (!preg_match('/^[A-Za-z0-9_]{1,32}$/', $name)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_name_format']);
  exit;
}

// ---------- 邮箱格式 ----------
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'invalid_email_format']);
  exit;
}

// ---------- 邮箱域名白名单（核心：你要的逻辑在这） ----------
$domain   = substr(strrchr($email, '@'), 1); // 取 @ 后面的部分
$allowed  = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'utar.edu.my'];
if (!in_array(strtolower($domain), $allowed, true)) {
  http_response_code(400);
  echo json_encode(['error' => 'email_domain_not_allowed']);
  exit;
}

// 防御性检查：分数与时长不为负
if ($total_score < 0) $total_score = 0;
if ($total_duration_ms < 0) $total_duration_ms = 0;

require_once __DIR__ . '/db.php';

try {
$stmt = $pdo->prepare(
  'INSERT INTO scores (name, email, total_score, total_duration_ms) VALUES (?,?,?,?)'
);
$stmt->execute([$name, $email, $total_score, $total_duration_ms]);

echo json_encode([
  'ok' => true,
  'id' => (int)$pdo->lastInsertId() // ★★★ 最重要：前端拿这个 ID 高亮玩家
]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'insert_failed']);
}
