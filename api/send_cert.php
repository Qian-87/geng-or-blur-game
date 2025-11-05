<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// 显示错误（开发用）
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 输出 JSON
header('Content-Type: application/json');

// 载入 PHPMailer
require __DIR__ . '/../vendor/autoload.php';

// 检查文件上传
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["ok" => false, "error" => "No file uploaded"]);
    exit;
}

$email = $_POST['email'];
$name  = $_POST['name'];
$score = $_POST['score'];
$tmpPath = $_FILES['file']['tmp_name'];
$fileName = $_FILES['file']['name'];

$mail = new PHPMailer(true);

try {
    // Gmail SMTP 设置
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'mmlm.utar@gmail.com'; // ✅ 你的完整Gmail
    $mail->Password   = 'immvtamhqucgcmxc'; // ✅ Gmail App Password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // 发件人 + 收件人
    $mail->setFrom('mmlm.utar@gmail.com', 'Geng or Blur? Game');
    $mail->addAddress($email, $name);

    // 邮件内容
    $mail->isHTML(false);
    $mail->Subject = 'Your Game Certificate';
    $mail->Body    = "Hi $name,\n\nCongratulations! Here’s your certificate for Geng or Blur?\n\nScore: $score\n\nBest regards,\nThe Geng or Blur Team";

    // 附件
    $mail->addAttachment($tmpPath, $fileName);

    // 发送
    $mail->send();
    echo json_encode(["ok" => true]);
} catch (Exception $e) {
    echo json_encode(["ok" => false, "error" => $mail->ErrorInfo]);
}
