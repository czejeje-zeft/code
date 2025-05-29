<?php
// backend/delete_event.php
include 'db_connect.php';

// Only allow DELETE requests for this endpoint
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Method not allowed."]);
    exit();
}

// --- INITIAL AUTHENTICATION CHECK ---
// Ensure user is logged in and session user_id exists
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["message" => "You must be logged in to delete an event."]);
    exit();
}

$user_id = $_SESSION['user_id']; // Get the logged-in user's ID

// Get the raw POST data (JSON string) from the request body for event ID
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
$event_to_delete = $result_check->fetch_assoc(); // This will be NULL if event not found
$stmt_check->close(); // Close the statement early

if (!$event_to_delete) {
    // If event not found, respond with 404
    http_response_code(404); // Not Found
    echo json_encode(["message" => "Event not found or already deleted."]);
    exit();
}

// Now, check if the logged-in user is the event organizer
if ($event_to_delete['organizer_id'] != $user_id) { // Compare fetched ID with session ID
    http_response_code(403); // Forbidden
    echo json_encode(["message" => "You are not authorized to delete this event."]);
    exit();
}
// --- END AUTHORIZATION CHECK ---

// If we reach here, the user is logged in AND authorized. Proceed with deletion.

// Prepare the delete query (now includes organizer_id in WHERE for double-safety)
$sql = "DELETE FROM events WHERE id = ? AND organizer_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $event_id, $user_id); // Pass user_id from session

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        http_response_code(200); // OK
        echo json_encode(["message" => "Event deleted successfully!", "event_id" => $event_id]);
    } else {
        // This case should ideally not be hit if authorization passed
        http_response_code(404); // Not Found (or no rows affected)
        echo json_encode(["message" => "Event not found or already deleted (after authorization)."]);
    }
} else {
    http_response_code(500); // Internal Server Error
    echo json_encode(["message" => "Error deleting event: " . $stmt->error]);
}

$conn->close();
?>