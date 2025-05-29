// js/script.js

// Get the container where events will be displayed
const eventsContainer = document.getElementById('events-container');

// Get filter dropdown and search input
const categoryFilterSelect = document.getElementById('category-filter');
const searchInput = document.getElementById('event-search');

// Define your backend API endpoint for fetching events
const API_EVENTS_URL = 'http://localhost/campus-events-aggregator/backend/get_events.php';
let allEvents = []; // This will now store events fetched from the backend

// --- Carousel Elements ---
const carouselTrack = document.getElementById('carousel-track');
const carouselPrevBtn = document.getElementById('carousel-prev');
const carouselNextBtn = document.getElementById('carousel-next');
const carouselDotsContainer = document.getElementById('carousel-dots');
const heroUsernameDisplay = document.getElementById('hero-username-display'); // For welcome message in hero

let currentSlide = 0;
let carouselSlides = [];
let carouselInterval; // To store the auto-play interval

// --- NEW: Drag/Swipe variables ---
let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
// ---------------------------------

// --- Helper Functions ---

/**
 * Fetches events from the backend API.
 */
async function fetchEvents() {
    try {
        const loadingMessage = document.querySelector('.all-events-section .event-grid p');
        if (loadingMessage) {
            loadingMessage.textContent = 'Loading events...';
        }
        
        const response = await fetch(API_EVENTS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allEvents = await response.json();

        // Sort events by date (newest first)
        allEvents.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA;
        });

        populateCarousel(allEvents.slice(0, 3)); // Populate carousel with top 3 newest events
        applyFiltersAndSearch(); // Render all events into the grid
    } catch (error) {
        console.error("Error fetching events:", error);
        const errorMessage = document.querySelector('.all-events-section .event-grid p');
        if (errorMessage) {
            errorMessage.textContent = 'Failed to load events. Please try again later.';
            errorMessage.classList.add('error-message');
        }
        // Handle no events for carousel as well
        if (carouselTrack) {
            carouselTrack.innerHTML = `<div class="carousel-slide error-slide">Failed to load featured events.</div>`;
            if (carouselPrevBtn) carouselPrevBtn.style.display = 'none';
            if (carouselNextBtn) carouselNextBtn.style.display = 'none';
        }
    }
}

/**
 * Populates the carousel with event titles.
 * @param {Array} eventsForCarousel - Array of events to display in the carousel.
 */
function populateCarousel(eventsForCarousel) {
    if (!carouselTrack) return; // Exit if carousel elements not found

    carouselTrack.innerHTML = '';
    if (carouselDotsContainer) carouselDotsContainer.innerHTML = ''; // Safety check for dots container
    carouselSlides = [];

    if (eventsForCarousel.length === 0) {
        carouselTrack.innerHTML = `<div class="carousel-slide">No featured events yet.</div>`;
        if (carouselPrevBtn) carouselPrevBtn.style.display = 'none';
        if (carouselNextBtn) carouselNextBtn.style.display = 'none';
        return;
    }

    eventsForCarousel.forEach((event, index) => {
        const slide = document.createElement('div');
        slide.classList.add('carousel-slide');

        slide.innerHTML = `
            <h3>${event.title}</h3>
            <p>${event.description.substring(0, 100)}...</p>
            <a href="event-details.html?id=${event.id}" class="btn btn-primary btn-sm">View Details</a>
        `;
        carouselTrack.appendChild(slide);
        carouselSlides.push(slide); // Store slide elements

        if (carouselDotsContainer) { // Only add dots if container exists
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.dataset.slideIndex = index;
            carouselDotsContainer.appendChild(dot);
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateCarousel();
            });
        }
    });

    // Show controls if more than one slide
    if (eventsForCarousel.length > 1) {
        if (carouselPrevBtn) carouselPrevBtn.style.display = 'block'; // Or 'inline-block' depending on styling
        if (carouselNextBtn) carouselNextBtn.style.display = 'block'; // Or 'inline-block'
    } else {
        if (carouselPrevBtn) carouselPrevBtn.style.display = 'none';
        if (carouselNextBtn) carouselNextBtn.style.display = 'none';
        if (carouselDotsContainer) carouselDotsContainer.innerHTML = ''; // No dots for single slide
    }

    initCarousel(); // Initialize carousel after populating
}

/**
 * Initializes basic carousel logic (auto-play, controls, drag).
 */
function initCarousel() {
    if (carouselSlides.length <= 1) { // No carousel needed for 0 or 1 slide
        if (carouselPrevBtn) carouselPrevBtn.style.display = 'none';
        if (carouselNextBtn) carouselNextBtn.style.display = 'none';
        if (carouselDotsContainer) carouselDotsContainer.innerHTML = '';
        return;
    }

    // Controls (buttons are hidden by CSS, but listeners still active if enabled)
    if (carouselPrevBtn) {
        carouselPrevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + carouselSlides.length) % carouselSlides.length;
            updateCarousel();
            resetAutoPlay();
        });
    }
    if (carouselNextBtn) {
        carouselNextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % carouselSlides.length;
            updateCarousel();
            resetAutoPlay();
        });
    }

    // --- Drag/Swipe Event Listeners ---
    if (carouselTrack) {
        // Mouse Events
        carouselTrack.addEventListener('mousedown', startDrag);
        carouselTrack.addEventListener('mouseleave', endDrag); // End drag if mouse leaves track
        carouselTrack.addEventListener('mouseup', endDrag);
        carouselTrack.addEventListener('mousemove', drag);

        // Touch Events
        carouselTrack.addEventListener('touchstart', startDrag);
        carouselTrack.addEventListener('touchend', endDrag);
        carouselTrack.addEventListener('touchmove', drag);

        // Disable default image dragging to avoid conflicts
        carouselTrack.addEventListener('dragstart', (e) => e.preventDefault());
    }
    // ---------------------------------------

    // Auto-play
    startAutoPlay();
}

function getPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function startDrag(event) {
    if (carouselSlides.length <= 1) return;
    isDragging = true;
    startPos = getPositionX(event);
    carouselTrack.style.transition = 'none'; // Disable transition during drag
    stopAutoPlay(); // Stop auto-play while dragging
    // Prevents text selection on drag
    if (event.type === 'mousedown') carouselTrack.style.cursor = 'grabbing';
}

function drag(event) {
    if (!isDragging) return;
    event.preventDefault(); // Prevent scrolling on touch devices while dragging horizontally

    const currentPosition = getPositionX(event);
    currentTranslate = prevTranslate + currentPosition - startPos;

    // Apply real-time drag translation
    carouselTrack.style.transform = `translateX(${currentTranslate}px)`;
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    carouselTrack.style.transition = 'transform 0.5s ease-in-out'; // Re-enable transition for snapping
    carouselTrack.style.cursor = 'grab'; // Reset cursor

    const movedBy = currentTranslate - prevTranslate;
    const threshold = carouselTrack.offsetWidth / 4; // Move if dragged more than 1/4 of container width

    if (movedBy < -threshold) { // Swiped left significantly
        currentSlide = (currentSlide + 1) % carouselSlides.length;
    } else if (movedBy > threshold) { // Swiped right significantly
        currentSlide = (currentSlide - 1 + carouselSlides.length) % carouselSlides.length;
    }
    // If not enough movement, updateCarousel will snap back to currentSlide

    updateCarousel(); // This will snap to the correct slide position
    resetAutoPlay(); // Restart auto-play
    prevTranslate = currentTranslate; // Update prevTranslate for the new snapped position
}

function updateCarousel() {
    if (!carouselTrack || carouselSlides.length === 0) return;

    // Calculate the translation needed for the current slide
    currentTranslate = -currentSlide * carouselTrack.offsetWidth; // Move by full width of carousel container
    carouselTrack.style.transform = `translateX(${currentTranslate}px)`;

    // Update slides (still manage active class if needed for visual cues or specific styles)
    carouselSlides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === currentSlide) {
            slide.classList.add('active');
        }
    });

    // Update dots
    const dots = carouselDotsContainer.querySelectorAll('.dot');
    if (dots) { // Safety check
        dots.forEach((dot, index) => {
            dot.classList.remove('active');
            if (index === currentSlide) {
                dot.classList.add('active');
            }
        });
    }
}

function startAutoPlay() {
    stopAutoPlay(); // Clear any existing interval
    if (carouselSlides.length > 1) { // Only auto-play if more than one slide
        carouselInterval = setInterval(() => {
            currentSlide = (currentSlide + 1) % carouselSlides.length;
            updateCarousel();
        }, 5000); // Change slide every 5 seconds
    }
}

function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
}

function stopAutoPlay() {
    clearInterval(carouselInterval);
}


/**
 * Renders a list of events into the DOM.
 * @param {Array} eventsToRender - The array of event objects to display.
 */
function renderEvents(eventsToRender) {
    if (!eventsContainer) return; // Safety check
    eventsContainer.innerHTML = '';

    if (eventsToRender.length === 0) {
        eventsContainer.innerHTML = '<p class="no-events-message">No events found matching your criteria.</p>';
        return;
    }

    eventsToRender.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.classList.add('event-card');
        
        eventCard.innerHTML = `
            <span class="category-tag">${event.category}</span>
            <h3>${event.title}</h3>
            <p><strong>Date:</strong> ${event.date}</p>
            <p><strong>Time:</strong> ${event.time}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Organizer:</strong> ${event.organizer}</p>
            <a href="event-details.html?id=${event.id}" class="view-details-btn">View Details</a>
        `;

        eventsContainer.appendChild(eventCard);
    });
}


/**
 * Populates the featured event hero section with the first (newest) event.
 * @param {Array} events - The array of event objects.
 */
function populateFeaturedEvent(events) {
    // Safety check for elements, as they might be null if index.html structure is off
    if (!heroUsernameDisplay || !featuredEventDescription || !featuredEventLink) { // Corrected check
        console.error("DEBUG: Featured event elements not found. Cannot populate hero section.");
        return;
    }

    if (events.length > 0) {
        const newestEvent = events[0]; // Assuming events are sorted by date (newest first from PHP)
        // featuredEventTitle.textContent = newestEvent.title; // Removed as h2 is static "Featured Event:"
        featuredEventDescription.textContent = newestEvent.description.substring(0, 100) + (newestEvent.description.length > 100 ? '...' : ''); // Truncate description
        featuredEventLink.href = `event-details.html?id=${newestEvent.id}`;
        featuredEventLink.style.display = 'inline-block'; // Ensure button is visible
    } else {
        // Handle no events case for featured section
        // featuredEventTitle.textContent = "No Upcoming Events Yet!"; // Removed
        featuredEventDescription.textContent = "Be the first to submit one!";
        featuredEventLink.href = "submit-event.html";
        featuredEventLink.textContent = "Submit Event";
        featuredEventLink.style.display = 'inline-block';
    }
}


/**
 * Applies current filters and search term to the allEvents array
 * and re-renders the filtered results.
 */
function applyFiltersAndSearch() {
    let filteredEvents = [...allEvents];

    // 1. Apply Category Filter (now using select dropdown)
    const selectedCategory = categoryFilterSelect ? categoryFilterSelect.value : 'all';

    if (selectedCategory && selectedCategory !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.category === selectedCategory);
    }

    // 2. Apply Search Term
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event =>
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.organizer.toLowerCase().includes(searchTerm)
        );
    }

    renderEvents(filteredEvents);
}


// --- Authentication UI Update (consolidated into script.js only) ---
// These constants are defined here for script.js
const authLinksDiv = document.getElementById('auth-links');
const submitEventBtn = document.getElementById('submit-event-btn');
const logoutBtn = document.getElementById('logout-btn');
const myEventsNavBtn = document.getElementById('my-events-nav-btn');


function updateAuthUI() {
    if (!authLinksDiv) {
        return; // Exit if the auth container isn't found
    }

    const loggedInUser = localStorage.getItem('loggedInUser');

    if (loggedInUser) {
        const username = JSON.parse(loggedInUser).username;
        // Removed welcome message from header
        authLinksDiv.innerHTML = ''; 
        
        if (submitEventBtn) submitEventBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (myEventsNavBtn) myEventsNavBtn.style.display = 'inline-block';
        
        // Restore welcome message in hero section
        if (heroUsernameDisplay) heroUsernameDisplay.textContent = username; 
    } else {
        authLinksDiv.innerHTML = `
            <a href="login.html" class="nav-btn auth-link">Login</a>
            <a href="register.html" class="nav-btn auth-link">Register</a>
        `;
        if (submitEventBtn) submitEventBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (myEventsNavBtn) myEventsNavBtn.style.display = 'none';

        // Set default text for hero if not logged in
        if (heroUsernameDisplay) heroUsernameDisplay.textContent = "Student"; 
    }
}


// --- Event Listeners and Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Initial display of nav buttons (hidden by default in CSS, shown by JS)
    // This is a fallback; CSS should initially hide them.
    if (submitEventBtn) submitEventBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (myEventsNavBtn) myEventsNavBtn.style.display = 'none';

    fetchEvents(); // Fetch events, populate carousel, render grid
    updateAuthUI(); // Update auth UI in header and hero section

    // Event listener for the category filter dropdown
    if (categoryFilterSelect) {
        categoryFilterSelect.addEventListener('change', () => {
            applyFiltersAndSearch();
        });
    }

    // Event listener for the search input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFiltersAndSearch();
        });
    }

    // No delete listener on main page, as buttons are in event details
});