<?php
// backend/get_my_events.php
include 'db_connect.php'; // Includes session_start() and DB connection

// --- AUTHENTICATION CHECK ---
// Ensure user is logged in and session user_id exists
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(["message" => "You must be logged in to view your events."]);
    exit();
}

$user_id = $_SESSION['user_id']; // Get the logged-in user's ID

// SQL query to select events where organizer_id matches the logged-in user's ID
$sql = "SELECT id, title, category, organizer, event_date, event_time, location, description, link, organizer_id
        FROM events
        WHERE organizer_id = ?
        ORDER BY event_date ASC, event_time ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id); // 'i' for integer user_id
$stmt->execute();
$result = $stmt->get_result();

$events = array(); // Initialize an empty array to hold events
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        // Rename 'event_date' to 'date' and 'event_time' to 'time' for consistency with frontend
        $row['date'] = $row['event_date'];
        $row['time'] = $row['event_time'];
        unset($row['event_date']); // Remove old field name
        unset($row['event_time']); // Remove old field name
        $events[] = $row;
    }
}

echo json_encode($events); // Encode the events array as JSON and print it

$stmt->close();
$conn->close(); // Close the database connection
?>