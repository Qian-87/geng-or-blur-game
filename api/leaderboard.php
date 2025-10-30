<?php
// api/leaderboard.php
header('Content-Type: application/json');

require_once __DIR__ . '/db.php';

$latestId = isset($_GET['latest_id']) ? (int)$_GET['latest_id'] : 0;

try {
  // Top 10（分数高优先，时长短优先，id稳定排序）
  $sqlTop = "SELECT id, name, total_score, total_duration_ms
             FROM scores
             ORDER BY total_score DESC, total_duration_ms ASC, id ASC
             LIMIT 10";
  $top = $pdo->query($sqlTop)->fetchAll(PDO::FETCH_ASSOC);

  // 查最新插入玩家
  $me = null; $rank = null;
  if ($latestId > 0) {
    $stmt = $pdo->prepare("SELECT id, name, total_score, total_duration_ms FROM scores WHERE id = ?");
    $stmt->execute([$latestId]);
    $me = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($me) {
      $rs = $pdo->prepare(
        "SELECT 1 + COUNT(*) AS r
           FROM scores
          WHERE total_score > ?
             OR (total_score = ? AND total_duration_ms < ?)"
      );
      $rs->execute([(int)$me['total_score'], (int)$me['total_score'], (int)$me['total_duration_ms']]);
      $rank = (int)$rs->fetchColumn();
    }
  }

  $rows = [];
  $i = 1;
  foreach ($top as $t) {
    $rows[] = [
      'rank'        => $i++,
      'id'          => (int)$t['id'],
      'name'        => $t['name'],
      'score'       => (int)$t['total_score'],
      'duration_ms' => (int)$t['total_duration_ms'],
    ];
  }

  $meOut = null;
  if ($me) {
    $meOut = [
      'rank'        => $rank,
      'id'          => (int)$me['id'],
      'name'        => $me['name'],
      'score'       => (int)$me['total_score'],
      'duration_ms' => (int)$me['total_duration_ms'],
    ];
  }

  echo json_encode(['rows' => $rows, 'me' => $meOut], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'leaderboard query failed', 'detail' => $e->getMessage()]);
}
