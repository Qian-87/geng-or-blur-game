<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// 引入 Composer 自动加载文件
require __DIR__ . '/../vendor/autoload.php';

header("Content-Type: application/json");

// === 1️⃣ 检查文件上传 ===
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["ok" => false, "error" => "No file uploaded or upload error"]);
    exit;
}

// === 2️⃣ 检查 Email 参数 ===
$email = $_POST['email'] ?? '';
if (!$email) {
    echo json_encode(["ok" => false, "error" => "Missing email address"]);
    exit;
}

// === 3️⃣ 暂存上传的 PDF 文件 ===
$tmpPath = $_FILES['file']['tmp_name'];
$filename = $_FILES['file']['name'];

// === 4️⃣ 设置邮件发送 ===
$mail = new PHPMailer(true);

try {
    // Gmail SMTP 服务器设置
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'mmlm.utar@gmail.com';  // 你的 Gmail
    $mail->Password   = 'immvtamhqucgcmxc';  // 使用「应用专用密码」！
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    // 寄件与收件人
    $mail->setFrom('mmlm.utar@gmail.com', 'Geng or Blur Game');
    $mail->addAddress($email);

    // 邮件内容
    $mail->Subject = 'Flash Match Challenge Certificate';
    $mail->isHTML(true);
    $mail->Body = nl2br("Congratulations for the achievement! Thank you for playing Flash Match Challenge! Attached is your game achievement certificate.\n\n
                    Best regards,
                    Flash Match Challenge Team");
    $mail->AltBody = "Your certificate is attached as a PDF file.";

    // 附件（PDF）
    $mail->addAttachment($tmpPath, $filename);

    // 寄出邮件
    $mail->send();

    echo json_encode(["ok" => true]);
} catch (Exception $e) {
    echo json_encode(["ok" => false, "error" => $mail->ErrorInfo]);
}
