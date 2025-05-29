// js/submit-event-script.js

const eventForm = document.getElementById('event-form');
const formMessage = document.getElementById('form-message');

// Define your backend API endpoint for submission
// This path is relative to your web server's document root (htdocs/)
const API_BASE_URL = 'http://localhost/campus-events-aggregator/backend/submit_event.php'; // <-- UPDATED PATH

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission (which would reload the page)

    // Get form data
    const formData = {
        title: document.getElementById('title').value,
        category: document.getElementById('category').value,
        organizer: document.getElementById('organizer').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        location: document.getElementById('location').value,
        description: document.getElementById('description').value,
        link: document.getElementById('link').value // link is optional
    };

    // Basic client-side validation (optional, but good for user experience)
    for (const key in formData) {
        if (key !== 'link' && !formData[key]) { // 'link' is optional
            formMessage.textContent = `Please fill out the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`; // Make field names readable
            formMessage.style.color = 'red';
            return; // Stop submission if validation fails
        }
    }


    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData) // Convert JavaScript object to JSON string
        });

        const result = await response.json(); // Parse the JSON response from the server

        if (response.ok) { // Check if the response status is 2xx (success)
            formMessage.textContent = 'Event submitted successfully!';
            formMessage.style.color = 'green';
            eventForm.reset(); // Clear the form after successful submission
        } else {
            // Handle server-side errors
            formMessage.textContent = `Error: ${result.message || 'Something went wrong.'}`;
            formMessage.style.color = 'red';
            console.error('Server error:', result);
        }

    } catch (error) {
        // Handle network errors (e.g., server is down, no internet)
        formMessage.textContent = 'Network error: Could not connect to the server. Is XAMPP/WAMP/MAMP running?';
        formMessage.style.color = 'red';
        console.error('Fetch error:', error);
    }
});