<?php
// backend/get_event_details.php
include 'db_connect.php'; // Include the database connection

// Get the event ID from the URL query parameter (e.g., ?id=123)
$eventId = $_GET['id'] ?? null; // Null coalescing operator for PHP 7+

if ($eventId) {
    // Sanitize the input to prevent SQL injection
    $safeEventId = intval($eventId); // Convert to integer

    // SQL query to select a single event by ID
    // CRITICAL FIX: ADD organizer_id to SELECT query
    $sql = "SELECT id, title, category, organizer, event_date, event_time, location, description, link, organizer_id FROM events WHERE id = $safeEventId";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        // Fetch the single event row
        $event = $result->fetch_assoc();
        // Rename fields for frontend consistency
        $event['date'] = $event['event_date'];
        $event['time'] = $event['event_time'];
        unset($event['event_date']); // Remove old field name
        unset($event['event_time']); // Remove old field name
        echo json_encode($event); // Encode and print as JSON
    } else {
        // Event not found
        http_response_code(404); // Set HTTP status code to 404 Not Found
        echo json_encode(["message" => "Event not found"]);
    }
} else {
    // No event ID provided in the URL
    http_response_code(400); // Set HTTP status code to 400 Bad Request
    echo json_encode(["message" => "No event ID specified"]);
}

$conn->close(); // Close the database connection
?>