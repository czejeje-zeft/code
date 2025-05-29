<?php
// backend/db_connect.php

// Start a PHP session. This must be the very first thing in your PHP script.
// It allows us to store user authentication status across requests.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "campus_event_hub";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set headers for CORS
header("Access-Control-Allow-Origin: *"); // For development
header("Content-Type: application/json; charset=UTF-8");

// CRITICAL: Ensure these are present and correct for DELETE/PUT
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS"); // Make sure PUT and DELETE are explicitly listed
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// CRITICAL: Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); // Send 200 OK for OPTIONS
    exit(); // Crucially, exit here to prevent further script execution
}

// Handle preflight OPTIONS requests (sent by browsers for complex requests)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>