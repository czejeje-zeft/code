<?php
// backend/get_events.php
include 'db_connect.php';

// SQL query to select all events, ordered by date and time
// IMPORTANT: If you add 'organizer_id' column, uncomment/add it here
$sql = "SELECT id, title, category, organizer, event_date, event_time, location, description, link, organizer_id FROM events ORDER BY event_date ASC, event_time ASC";
$result = $conn->query($sql);

$events = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $row['date'] = $row['event_date'];
        $row['time'] = $row['event_time'];
        unset($row['event_date']);
        unset($row['event_time']);
        $events[] = $row;
    }
}
echo json_encode($events);
$conn->close();
?>