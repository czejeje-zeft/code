// js/my-events-script.js

const myEventsContainer = document.getElementById('my-events-container');
const API_MY_EVENTS_URL = 'http://localhost/campus-events-aggregator/backend/get_my_events.php'; // NEW API endpoint

// Constants for header auth UI (GET THEM HERE inside updateAuthUI function)
// These variables will be correctly populated when updateAuthUI is called, after DOM is ready.
let authLinksDiv;
let myEventsNavBtn; // This one will be null on my-events.html, which is fine.
let submitEventBtn;
let logoutBtn;

function updateAuthUI() {
    // GET ELEMENTS INSIDE THE FUNCTION
    authLinksDiv = document.getElementById('auth-links');
    myEventsNavBtn = document.getElementById('my-events-nav-btn'); // Will be null here
    submitEventBtn = document.getElementById('submit-event-btn');
    logoutBtn = document.getElementById('logout-btn');

    if (!authLinksDiv) {
        console.error("DEBUG: Auth links div not found in header on my-events.html. Header UI update skipped.");
        return;
    }

    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        authLinksDiv.innerHTML = `<span class="welcome-message">Welcome, ${JSON.parse(loggedInUser).username}!</span>`;
        if (submitEventBtn) submitEventBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        // No myEventsNavBtn to show on this page as it's the current page
    } else {
        // This block should ideally not be reached due to redirect logic at top of my-events.html
        authLinksDiv.innerHTML = `
            <a href="login.html" class="nav-btn auth-link">Login</a>
            <a href="register.html" class="nav-btn auth-link">Register</a>
        `;
        if (submitEventBtn) submitEventBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        // No myEventsNavBtn to hide on this page
    }
}

/**
 * Fetches user's events from the backend API.
 */
async function fetchMyEvents() {
    try {
        if (!myEventsContainer) {
            console.error("DEBUG: My Events container not found. Cannot fetch/render events.");
            return;
        }
        myEventsContainer.innerHTML = '<p class="loading-message">Loading your events...</p>';
        const response = await fetch(API_MY_EVENTS_URL);

        if (!response.ok) {
            if (response.status === 401) {
                myEventsContainer.innerHTML = '<p class="error-message">You must be logged in to view your events. Redirecting to login...</p>';
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const myEvents = await response.json();
        renderMyEvents(myEvents);
    } catch (error) {
        console.error("DEBUG: Error fetching my events:", error);
        myEventsContainer.innerHTML = '<p class="error-message">Failed to load your events. Please try again later.</p>';
    }
}

/**
 * Renders a list of events into the DOM for "My Events" page.
 * @param {Array} eventsToRender - The array of event objects to display.
 */
function renderMyEvents(eventsToRender) {
    if (!myEventsContainer) {
        console.error("DEBUG: My Events container is null in renderMyEvents.");
        return;
    }
    myEventsContainer.innerHTML = '';

    if (eventsToRender.length === 0) {
        myEventsContainer.innerHTML = '<p class="no-events-message">You haven\'t created any events yet. <a href="submit-event.html">Submit one now!</a></p>';
        return;
    }

    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const currentUserId = loggedInUser ? parseInt(loggedInUser.userId) : null;

    eventsToRender.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.classList.add('event-card');

        // --- RESTORED eventCard.innerHTML CONTENT ---
        eventCard.innerHTML = `
            <span class="category-tag">${event.category}</span>
            <h3>${event.title}</h3>
            <p><strong>Date:</strong> ${event.date}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Organizer:</strong> ${event.organizer}</p>
            <a href="event-details.html?id=${event.id}" class="view-details-btn">View Details</a>
        `;
        // --- END RESTORED ---

        myEventsContainer.appendChild(eventCard);
    });
}

// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    fetchMyEvents();

    // Removed event listener for delete buttons, as per request
    // myEventsContainer.addEventListener('click', (e) => { ... });
});