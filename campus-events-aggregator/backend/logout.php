<?php
// backend/logout.php
include 'db_connect.php'; // Includes session_start()

// Unset all session variables
$_SESSION = array();

// Destroy the session cookie on the client side
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session on the server side
session_destroy();

http_response_code(200); // OK
echo json_encode(["message" => "Logged out successfully."]);

$conn->close(); // Close the database connection
?>