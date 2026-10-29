<?php
declare(strict_types=1);

$private = getenv('TUITIONHUB_PRIVATE_DIR');
if (!is_string($private) || $private === '') {
    $private = __DIR__ . '/../../../tuitionhub_private';
}

$resolved = realpath($private);
if ($resolved === false || !is_file($resolved . '/php/bootstrap.php')) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"ok":false,"error":{"code":"backend_files_missing","message":"The API is not installed correctly."}}';
    exit;
}

define('TH_PRIVATE_DIR', $resolved);
require TH_PRIVATE_DIR . '/php/bootstrap.php';
require TH_PRIVATE_DIR . '/php/health.php';
require TH_PRIVATE_DIR . '/php/auth.php';

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$marker = '/api/';
$pos = strpos($path, $marker);
$route = $pos === false ? '' : substr($path, $pos + strlen($marker));
$route = (string) preg_replace('#^index\.php/?#', '', $route);
$route = trim($route, '/');

if ($route === 'health') {
    if (!in_array($method, ['GET', 'HEAD'], true)) {
        header('Allow: GET, HEAD');
        th_error(405, 'method_not_allowed', 'Use GET for this endpoint.');
    }
    th_health();
}

if (!in_array($route, ['login', 'me', 'logout'], true)) {
    th_error(404, 'not_found', 'No such API endpoint.');
}

$config = th_load_config();
if (($config['status'] ?? '') !== 'ok') {
    th_error(503, 'configuration_unavailable', 'The API configuration is unavailable.');
}
try {
    $pdo = th_db($config['db']);
} catch (PDOException $e) {
    // Log only the driver code; PDO messages can contain the DB username.
    error_log('[tuitionhub] database connection failed, code ' . th_pdo_code($e));
    th_error(503, 'database_unavailable', 'TuitionHub cannot reach its database right now. Please try again shortly.');
}

if ($route === 'login') {
    if ($method !== 'POST') {
        header('Allow: POST');
        th_error(405, 'method_not_allowed', 'Use POST for this endpoint.');
    }

    $contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''))[0]));
    if ($contentType !== 'application/json') {
        th_error(415, 'unsupported_media_type', 'Send a JSON request.');
    }

    $raw = file_get_contents('php://input');
    if (!is_string($raw) || strlen($raw) > 16384) {
        th_error(413, 'request_too_large', 'The request is too large.');
    }

    try {
        $input = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        th_error(400, 'invalid_json', 'The request body must contain valid JSON.');
    }

    if (!is_array($input)) {
        th_error(400, 'invalid_json', 'The request body must be a JSON object.');
    }

    $identifier = $input['identifier'] ?? $input['email'] ?? $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (!is_string($identifier) || !is_string($password)) {
        th_error(422, 'invalid_input', 'Enter your email or username and password.');
    }

    $result = th_auth_login($pdo, $identifier, $password);
    if (!$result['ok']) {
        th_error($result['status'], $result['code'], $result['message']);
    }

    th_json(200, ['ok' => true, 'user' => $result['user']]);
}

if ($route === 'me') {
    if ($method !== 'GET') {
        header('Allow: GET');
        th_error(405, 'method_not_allowed', 'Use GET for this endpoint.');
    }

    $user = th_auth_user($pdo);
    if ($user === null) {
        th_error(401, 'not_authenticated', 'Please log in to continue.');
    }

    th_json(200, ['ok' => true, 'user' => $user]);
}

if ($route === 'logout') {
    if ($method !== 'POST') {
        header('Allow: POST');
        th_error(405, 'method_not_allowed', 'Use POST for this endpoint.');
    }

    th_auth_logout($pdo);
    th_json(200, ['ok' => true, 'message' => 'Logged out successfully.']);
}
