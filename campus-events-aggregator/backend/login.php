<?php
// backend/login.php
include 'db_connect.php'; // Includes session_start() and DB connection

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid JSON data received."]);
    exit();
}

$username = $conn->real_escape_string($data['username'] ?? '');
$password = $conn->real_escape_string($data['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["message" => "Username and password are required."]);
    exit();
}

// Find the user by username or email
$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $username, $username); // Check against both username and email
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    // Verify the password
    if (password_verify($password, $user['password'])) {
        // Login successful: Store user info in session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['logged_in'] = true;

        http_response_code(200); // OK
        echo json_encode(["message" => "Login successful!", "username" => $user['username'], "user_id" => $user['id']]);
    } else {
        // Password does not match
        http_response_code(401); // Unauthorized
        echo json_encode(["message" => "Invalid username or password."]);
    }
} else {
    // User not found
    http_response_code(401); // Unauthorized
    echo json_encode(["message" => "Invalid username or password."]);
}

$stmt->close();
$conn->close();
?>