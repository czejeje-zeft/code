<?php
// backend/register.php
include 'db_connect.php'; // Includes session_start() and DB connection

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid JSON data received."]);
    exit();
}

$username = $conn->real_escape_string($data['username'] ?? '');
$email = $conn->real_escape_string($data['email'] ?? '');
$password = $conn->real_escape_string($data['password'] ?? '');

// Server-side validation
if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["message" => "All fields are required."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid email format."]);
    exit();
}

// Hash the password securely
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Check if username or email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    http_response_code(409); // Conflict
    echo json_encode(["message" => "Username or Email already exists."]);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();


// Insert new user
$sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $username, $email, $hashedPassword);

if ($stmt->execute()) {
    http_response_code(201); // Created
    echo json_encode(["message" => "Registration successful! You can now log in."]);
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Registration failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>