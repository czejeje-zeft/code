<?php
// backend/submit_event.php
include 'db_connect.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "You must be logged in to submit an event."]);
    exit();
}

// Get the logged-in user's ID from the session
$organizer_id = $_SESSION['user_id']; // This is the new part!

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid JSON data received."]);
    exit();
}

$title = $conn->real_escape_string($data['title'] ?? '');
$category = $conn->real_escape_string($data['category'] ?? '');
$organizer = $conn->real_escape_string($data['organizer'] ?? '');
$date = $conn->real_escape_string($data['date'] ?? '');
$time = $conn->real_escape_string($data['time'] ?? '');
$location = $conn->real_escape_string($data['location'] ?? '');
$description = $conn->real_escape_string($data['description'] ?? '');
$link = $conn->real_escape_string($data['link'] ?? '');

if (empty($title) || empty($category) || empty($organizer) || empty($date) || empty($time) || empty($location) || empty($description)) {
    http_response_code(400);
    echo json_encode(["message" => "All required fields must be filled."]);
    exit();
}

// SQL INSERT statement - NOW INCLUDES organizer_id
$sql = "INSERT INTO events (title, category, organizer, event_date, event_time, location, description, link, organizer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssssssi", $title, $category, $organizer, $date, $time, $location, $description, $link, $organizer_id); // 'i' for integer organizer_id

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode([
        "message" => "New event created successfully",
        "id" => $conn->insert_id,
        "title" => $title,
        "category" => $category,
        "organizer_id" => $organizer_id // Return the organizer ID
    ]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Error submitting event: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>