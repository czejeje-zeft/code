// js/edit-delete-script.js

const API_EVENTS_BASE_URL = 'http://localhost/campus-events-aggregator/backend/'; // Base URL for event APIs

// --- EDIT EVENT LOGIC (for edit-event.html) ---
const editEventForm = document.getElementById('edit-event-form');
const editMessage = document.getElementById('edit-message');

if (editEventForm) {
    const eventIdInput = document.getElementById('event-id');
    const titleInput = document.getElementById('edit-title');
    const categorySelect = document.getElementById('edit-category');
    const organizerInput = document.getElementById('edit-organizer');
    const dateInput = document.getElementById('edit-date');
    const timeInput = document.getElementById('edit-time');
    const locationInput = document.getElementById('edit-location');
    const descriptionInput = document.getElementById('edit-description');
    const linkInput = document.getElementById('edit-link');

    // Function to fetch event data and populate the form
    async function loadEventForEdit() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');

        if (!eventId) {
            editMessage.textContent = "Error: No event ID provided for editing.";
            editMessage.style.color = 'red';
            return;
        }

        try {
            const response = await fetch(`${API_EVENTS_BASE_URL}get_event_details.php?id=${eventId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Event not found.");
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const event = await response.json();

            // Populate the form fields
            eventIdInput.value = event.id;
            titleInput.value = event.title;
            categorySelect.value = event.category;
            organizerInput.value = event.organizer;
            dateInput.value = event.date; // Date input expects YYYY-MM-DD
            timeInput.value = event.time; // Time input expects HH:MM
            locationInput.value = event.location;
            descriptionInput.value = event.description;
            linkInput.value = event.link;

        } catch (error) {
            editMessage.textContent = `Failed to load event: ${error.message}`;
            editMessage.style.color = 'red';
            console.error('Error loading event for edit:', error);
        }
    }

    // Call loadEventForEdit when the page loads
    document.addEventListener('DOMContentLoaded', loadEventForEdit);


    // Handle edit form submission
    editEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            id: eventIdInput.value,
            title: titleInput.value,
            category: categorySelect.value,
            organizer: organizerInput.value,
            date: dateInput.value,
            time: timeInput.value,
            location: locationInput.value,
            description: descriptionInput.value,
            link: linkInput.value
        };

        // Basic client-side validation
        for (const key in formData) {
            if (key !== 'link' && !formData[key]) {
                editMessage.textContent = `Please fill out the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`;
                editMessage.style.color = 'red';
                return;
            }
        }

        try {
            const response = await fetch(`${API_EVENTS_BASE_URL}edit_event.php`, {
                method: 'PUT', // Use PUT method for updates
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                editMessage.textContent = result.message;
                editMessage.style.color = 'green';
                setTimeout(() => {
                    window.location.href = 'index.html'; // Redirect after successful edit
                }, 1500);
            } else {
                editMessage.textContent = `Error: ${result.message || 'Failed to save changes.'}`;
                editMessage.style.color = 'red';
                console.error('Edit error:', result);
            }

        } catch (error) {
            editMessage.textContent = 'Network error: Could not connect to the server.';
            editMessage.style.color = 'red';
            console.error('Fetch error:', error);
        }
    });
}


// --- DELETE EVENT LOGIC (Called from main page) ---
async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return; // User cancelled
    }

    try {
        const response = await fetch(`${API_EVENTS_BASE_URL}delete_event.php`, {
            method: 'DELETE', // <--- THIS IS THE CRITICAL LINE
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: eventId }) // Send ID in body
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.reload();
        } else {
            console.error('Delete error:', result.message);
            alert(`Error deleting event: ${result.message || 'Something went wrong.'}`);
        }

    } catch (error) {
        console.error('Network error during delete:', error);
        alert('Network error: Could not delete event.');
    }
}