<?php
// backend/edit_event.php
include 'db_connect.php';

// Only allow PUT requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Method not allowed."]);
    exit();
}

// --- INITIAL AUTHENTICATION CHECK ---
// Ensure user is logged in and session user_id exists
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["message" => "You must be logged in to edit an event."]);
    exit();
}

$user_id = $_SESSION['user_id']; // Get the logged-in user's ID

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid JSON data received."]);
    exit();
}

$event_id = $conn->real_escape_string($data['id'] ?? '');

if (empty($event_id)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Event ID is required."]);
    exit();
}

// --- FETCH EVENT AND AUTHORIZATION CHECK ---
// First, fetch the event's organizer_id
$stmt_check = $conn->prepare("SELECT organizer_id FROM events WHERE id = ?");
$stmt_check->bind_param("i", $event_id);
$stmt_check->execute();
$result_check = $stmt_check->get_result();
$event_to_edit = $result_check->fetch_assoc(); // This will be NULL if event not found
$stmt_check->close(); // Close the statement early

if (!$event_to_edit) {
    // If event not found, respond with 404
    http_response_code(404); // Not Found
    echo json_encode(["message" => "Event not found."]);
    exit();
}

// Now, check if the logged-in user is the event organizer
if ($event_to_edit['organizer_id'] != $user_id) { // Compare fetched ID with session ID
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "You are not authorized to edit this event."]);
    exit();
}
// --- END AUTHORIZATION CHECK ---

// If we reach here, the user is logged in AND authorized. Proceed with update.

// Now, retrieve and sanitize other fields for update
$title = $conn->real_escape_string($data['title'] ?? '');
$category = $conn->real_escape_string($data['category'] ?? '');
$organizer = $conn->real_escape_string($data['organizer'] ?? '');
$date = $conn->real_escape_string($data['date'] ?? '');
$time = $conn->real_escape_string($data['time'] ?? '');
$location = $conn->real_escape_string($data['location'] ?? '');
$description = $conn->real_escape_string($data['description'] ?? '');
$link = $conn->real_escape_string($data['link'] ?? '');

// Server-side validation
if (empty($title) || empty($category) || empty($organizer) || empty($date) || empty($time) || empty($location) || empty($description)) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "All required fields must be filled."]);
    exit();
}

// Prepare the update query - NOW INCLUDES organizer_id in WHERE CLAUSE for security
$sql = "UPDATE events SET title=?, category=?, organizer=?, event_date=?, event_time=?, location=?, description=?, link=? WHERE id = ? AND organizer_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssssssii", $title, $category, $organizer, $date, $time, $location, $description, $link, $event_id, $user_id); // 'i' for event_id, 'i' for user_id

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200); // OK
        echo json_encode(["message" => "Event updated successfully!", "event_id" => $event_id]);
    } else {
        // This case should ideally not be hit if authorization passed, meaning no changes were made.
        http_response_code(200); // Still OK, but nothing changed
        echo json_encode(["message" => "Event found, but no changes were made."]);
    }
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error updating event: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>