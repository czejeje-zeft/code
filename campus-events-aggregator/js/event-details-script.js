// js/event-details-script.js

// Constants for main content areas (these are fine at top-level)
const eventDetailCard = document.getElementById('event-detail-card');
const eventDetailActionsDiv = document.getElementById('event-detail-actions');
const API_DETAIL_URL_BASE = 'http://localhost/campus-events-aggregator/backend/get_event_details.php';

// updateAuthUI function - ensures header navigation works
function updateAuthUI() {
    // GET ELEMENTS INSIDE THE FUNCTION - this is the fix for "Cannot set properties of null"!
    const authLinksDiv = document.getElementById('auth-links');
    const myEventsNavBtn = document.getElementById('my-events-nav-btn');
    const submitEventBtn = document.getElementById('submit-event-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (!authLinksDiv) {
        console.error("DEBUG: Header Auth links div not found. Header UI update skipped.");
        return;
    }

    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        authLinksDiv.innerHTML = `<span class="welcome-message">Welcome, ${JSON.parse(loggedInUser).username}!</span>`;
        if (submitEventBtn) submitEventBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (myEventsNavBtn) myEventsNavBtn.style.display = 'inline-block';
    } else {
        authLinksDiv.innerHTML = `
            <a href="login.html" class="nav-btn auth-link">Login</a>
            <a href="register.html" class="nav-btn auth-link">Register</a>
        `;
        if (submitEventBtn) submitEventBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (myEventsNavBtn) myEventsNavBtn.style.display = 'none';
    }
}

/**
 * Extracts the event ID from the URL query parameters.
 * @returns {string|null} The event ID as a string, or null if not found.
 */
function getEventIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Fetches event data from the backend and renders it.
 * @param {string} eventId - The ID of the event to fetch.
 */
async function fetchAndRenderEventDetails(eventId) {
    if (!eventDetailCard) {
        console.error("DEBUG: Event detail card container not found. Cannot render details.");
        return;
    }

    if (!eventId) {
        eventDetailCard.innerHTML = `
            <p class="error-message">Error: No event ID provided in the URL.</p>
            <p>Please go back to the <a href="index.html">main events page</a>.</p>
        `;
        if (eventDetailActionsDiv) eventDetailActionsDiv.innerHTML = '';
        return;
    }

    try {
        eventDetailCard.innerHTML = '<p class="loading-message">Loading event details...</p>';
        
        const response = await fetch(`${API_DETAIL_URL_BASE}?id=${eventId}`);

        if (!response.ok) {
            if (response.status === 404) {
                eventDetailCard.innerHTML = `
                    <p class="error-message">Event not found.</p>
                    <p>The event with ID ${eventId} could not be found. Please go back to the <a href="index.html">main events page</a>.</p>
                `;
            } else {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }
            if (eventDetailActionsDiv) eventDetailActionsDiv.innerHTML = '';
            return;
        }

        const event = await response.json();
        renderEventDetails(event);
    } catch (error) {
        console.error('DEBUG: Error fetching event details:', error);
        eventDetailCard.innerHTML = `<p class="error-message">Failed to load event details: ${error.message}. Please try again later.</p>`;
        if (eventDetailActionsDiv) eventDetailActionsDiv.innerHTML = '';
    }
}

/**
 * Renders the details of a single event onto the page.
 * @param {Object} event - The event object to display.
 */
function renderEventDetails(event) {
    if (!event) {
        eventDetailCard.innerHTML = `
            <p class="error-message">Event data missing for rendering.</p>
            <p>Please go back to the <a href="index.html">main events page</a>.</p>
        `;
        if (eventDetailActionsDiv) eventDetailActionsDiv.innerHTML = '';
        return;
    }

    eventDetailCard.innerHTML = `
        <span class="category-tag">${event.category}</span>
        <h2>${event.title}</h2>
        <p><strong>Organizer:</strong> ${event.organizer}</p>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p>${event.description}</p>
        ${event.link ? `<p><a href="${event.link}" target="_blank" class="external-link-btn">Visit Event Website</a></p>` : ''}
    `;

    // Add Edit/Delete buttons if authorized
    if (eventDetailActionsDiv) { // Ensure the div exists
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        const currentUserId = loggedInUser ? parseInt(loggedInUser.userId) : null;

        // DEBUGGING CONSOLE LOGS
        console.log("DEBUG: Details Page - currentUserId:", currentUserId, "Type:", typeof currentUserId);
        console.log("DEBUG: Details Page - event.organizer_id:", event.organizer_id, "Type:", typeof event.organizer_id);
        console.log("DEBUG: Details Page - Parsed organizer_id:", parseInt(event.organizer_id), "Type:", typeof parseInt(event.organizer_id));
        console.log("DEBUG: Details Page - Comparison result (currentUserId === parseInt(event.organizer_id)):", (currentUserId === parseInt(event.organizer_id)));


        if (currentUserId && event.organizer_id && parseInt(event.organizer_id) === currentUserId) {
            eventDetailActionsDiv.innerHTML = `
                <a href="edit-event.html?id=${event.id}" class="action-btn edit-btn">Edit Event</a>
                <button class="action-btn delete-btn" data-event-id="${event.id}">Delete Event</button>
            `;
            console.log("DEBUG: Buttons HTML injected into eventDetailActionsDiv!"); // <--- ADDED LOG
            // Add event listener for delete button
            const deleteButton = eventDetailActionsDiv.querySelector('.delete-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', (e) => {
                    const eventIdToDelete = e.target.dataset.eventId;
                    if (typeof deleteEvent === 'function') {
                        deleteEvent(parseInt(eventIdToDelete));
                    } else {
                        console.error("DEBUG: deleteEvent function not found. Make sure edit-delete-script.js is loaded.");
                    }
                });
            }
        } else {
            eventDetailActionsDiv.innerHTML = ''; // Clear buttons if not authorized
            console.log("DEBUG: Not authorized or event not owned. No Edit/Delete buttons injected."); // <--- ADDED LOG
        }
    } else {
        console.warn("DEBUG: eventDetailActionsDiv element not found for button injection."); // <--- ADDED LOG
    }
}


// --- Main Logic for Details Page ---
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI(); // Update auth UI in header
    const eventId = getEventIdFromUrl();
    fetchAndRenderEventDetails(eventId); // Call the fetch and render function
});