<?php
/**
 * HTTPS mail relay for Davetanisi (Render cannot open SMTP 465/587 on free plans).
 * Upload this file + davetanisi-mail-relay.config.php to mekanizma.com public_html.
 *
 * POST JSON:
 *   { "secret":"...", "to":["info@mekanizma.com"], "subject":"...", "text":"...", "html":"...", "replyTo":"..." }
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'POST only']);
  exit;
}

$configFile = __DIR__ . '/davetanisi-mail-relay.config.php';
if (!is_file($configFile)) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'config missing']);
  exit;
}
/** @var array{relay_secret:string,smtp_host:string,smtp_port:int,smtp_user:string,smtp_pass:string,smtp_from:string,smtp_from_name:string} $cfg */
$cfg = require $configFile;

$raw = file_get_contents('php://input') ?: '';
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'invalid json']);
  exit;
}

$secret = (string)($data['secret'] ?? '');
if ($secret === '' || !hash_equals((string)$cfg['relay_secret'], $secret)) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'unauthorized']);
  exit;
}

$toList = $data['to'] ?? [];
if (is_string($toList)) $toList = [$toList];
if (!is_array($toList) || !$toList) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'to required']);
  exit;
}
$toList = array_values(array_filter(array_map(static function ($addr) {
  $addr = strtolower(trim((string)$addr));
  return in_array($addr, ['info@mekanizma.com', 'yonetici@davetanisi.com'], true) ? $addr : '';
}, $toList)));
if (!$toList) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'to required']);
  exit;
}

$subject = trim((string)($data['subject'] ?? ''));
$text = (string)($data['text'] ?? '');
$html = (string)($data['html'] ?? '');
$replyTo = trim((string)($data['replyTo'] ?? ''));
if ($subject === '' || ($text === '' && $html === '')) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'subject/body required']);
  exit;
}

$fromEmail = (string)$cfg['smtp_from'];
$fromName = (string)$cfg['smtp_from_name'];
$host = (string)$cfg['smtp_host'];
$port = (int)($cfg['smtp_port'] ?? 465);
$user = (string)$cfg['smtp_user'];
$pass = (string)$cfg['smtp_pass'];

function smtp_read($fp): string {
  $data = '';
  while (!feof($fp)) {
    $line = fgets($fp, 515);
    if ($line === false) break;
    $data .= $line;
    if (isset($line[3]) && $line[3] === ' ') break;
  }
  return $data;
}

function smtp_cmd($fp, string $cmd): string {
  fwrite($fp, $cmd . "\r\n");
  return smtp_read($fp);
}

try {
  $errno = 0;
  $errstr = '';
  $remote = $port === 465 ? "ssl://{$host}:{$port}" : "tcp://{$host}:{$port}";
  $fp = stream_socket_client($remote, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);
  if (!$fp) {
    throw new RuntimeException("connect failed: {$errstr}");
  }
  stream_set_timeout($fp, 20);
  $banner = smtp_read($fp);
  if (strpos($banner, '220') !== 0) throw new RuntimeException('banner rejected');
  $ehlo = smtp_cmd($fp, 'EHLO davetanisi.com');
  if (strpos($ehlo, '250') !== 0) throw new RuntimeException('EHLO failed');
  if ($port !== 465) {
    $start = smtp_cmd($fp, 'STARTTLS');
    if (strpos($start, '220') !== 0) throw new RuntimeException('STARTTLS failed');
    if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
      throw new RuntimeException('TLS failed');
    }
    $ehlo = smtp_cmd($fp, 'EHLO davetanisi.com');
    if (strpos($ehlo, '250') !== 0) throw new RuntimeException('EHLO after TLS failed');
  }

  $auth = smtp_cmd($fp, 'AUTH LOGIN');
  if (strpos($auth, '334') !== 0) throw new RuntimeException('AUTH not accepted');
  $u = smtp_cmd($fp, base64_encode($user));
  if (strpos($u, '334') !== 0) throw new RuntimeException('USER rejected');
  $p = smtp_cmd($fp, base64_encode($pass));
  if (strpos($p, '235') !== 0) throw new RuntimeException('PASS rejected');

  $mailFrom = smtp_cmd($fp, 'MAIL FROM:<' . $fromEmail . '>');
  if (strpos($mailFrom, '250') !== 0) throw new RuntimeException('MAIL FROM failed');
  foreach ($toList as $addr) {
    $rcpt = smtp_cmd($fp, 'RCPT TO:<' . $addr . '>');
    if (strpos($rcpt, '250') !== 0 && strpos($rcpt, '251') !== 0) {
      throw new RuntimeException('RCPT failed: ' . $addr);
    }
  }
  $dataResp = smtp_cmd($fp, 'DATA');
  if (strpos($dataResp, '354') !== 0) throw new RuntimeException('DATA not accepted');

  $boundary = 'b' . bin2hex(random_bytes(8));
  $headers = [];
  $headers[] = 'Date: ' . date('r');
  $headers[] = 'From: ' . sprintf('"%s" <%s>', addcslashes($fromName, '"'), $fromEmail);
  $headers[] = 'To: ' . implode(', ', $toList);
  $headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
  $headers[] = 'MIME-Version: 1.0';
  if ($replyTo !== '') $headers[] = 'Reply-To: ' . $replyTo;
  if ($html !== '') {
    $headers[] = 'Content-Type: multipart/alternative; boundary="' . $boundary . '"';
    $body = "--{$boundary}\r\n"
      . "Content-Type: text/plain; charset=UTF-8\r\n\r\n"
      . ($text !== '' ? $text : strip_tags($html)) . "\r\n"
      . "--{$boundary}\r\n"
      . "Content-Type: text/html; charset=UTF-8\r\n\r\n"
      . $html . "\r\n"
      . "--{$boundary}--\r\n";
  } else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $body = $text . "\r\n";
  }

  $payload = implode("\r\n", $headers) . "\r\n\r\n" . $body;
  $payload = preg_replace('/^\./m', '..', $payload) ?? $payload;
  fwrite($fp, $payload . "\r\n.\r\n");
  $end = smtp_read($fp);
  if (strpos($end, '250') !== 0) throw new RuntimeException('message not accepted');
  smtp_cmd($fp, 'QUIT');
  fclose($fp);

  echo json_encode(['ok' => true]);
} catch (Throwable $e) {
  http_response_code(502);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
