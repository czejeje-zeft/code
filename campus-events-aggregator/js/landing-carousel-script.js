// js/landing-carousel-script.js

// --- Developer Carousel Elements ---
const developerCarouselTrack = document.getElementById('developer-carousel-track');
const developerCarouselPrevBtn = document.getElementById('developer-carousel-prev');
const developerCarouselNextBtn = document.getElementById('developer-carousel-next');
const developerCarouselDotsContainer = document.getElementById('developer-carousel-dots');

let developerCurrentSlide = 0;
let developerCarouselSlides = [];
let developerCarouselInterval;

// --- Drag/Swipe variables for developer carousel ---
let developerIsDragging = false;
let developerStartPos = 0;
let developerCurrentTranslate = 0;
let developerPrevTranslate = 0;

// --- Helper Functions for Developer Carousel ---

function getDeveloperPositionX(event) {
    return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function developerStartDrag(event) {
    if (developerCarouselSlides.length <= 1) return;
    developerIsDragging = true;
    developerStartPos = getDeveloperPositionX(event);
    developerCarouselTrack.style.transition = 'none'; // Disable transition during drag
    stopDeveloperAutoPlay(); // Stop auto-play while dragging
    if (event.type === 'mousedown') developerCarouselTrack.style.cursor = 'grabbing';
}

function developerDrag(event) {
    if (!developerIsDragging) return;
    event.preventDefault(); // Prevent scrolling on touch devices

    const currentPosition = getDeveloperPositionX(event);
    developerCurrentTranslate = developerPrevTranslate + currentPosition - developerStartPos;

    developerCarouselTrack.style.transform = `translateX(${developerCurrentTranslate}px)`;
}

function developerEndDrag() {
    if (!developerIsDragging) return;
    developerIsDragging = false;
    developerCarouselTrack.style.transition = 'transform 0.5s ease-in-out'; // Re-enable transition
    developerCarouselTrack.style.cursor = 'grab'; // Reset cursor

    const movedBy = developerCurrentTranslate - developerPrevTranslate;
    const threshold = developerCarouselTrack.offsetWidth / 4; // Threshold for swipe

    if (movedBy < -threshold) {
        developerCurrentSlide = (developerCurrentSlide + 1) % developerCarouselSlides.length;
    } else if (movedBy > threshold) {
        developerCurrentSlide = (developerCurrentSlide - 1 + developerCarouselSlides.length) % developerCarouselSlides.length;
    }

    updateDeveloperCarousel();
    resetDeveloperAutoPlay();
    developerPrevTranslate = developerCurrentTranslate;
}

function updateDeveloperCarousel() {
    if (!developerCarouselTrack || developerCarouselSlides.length === 0) return;

    developerCurrentTranslate = -developerCurrentSlide * developerCarouselTrack.offsetWidth;
    developerCarouselTrack.style.transform = `translateX(${developerCurrentTranslate}px)`;

    developerCarouselSlides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === developerCurrentSlide) {
            slide.classList.add('active');
        }
    });

    if (developerCarouselDotsContainer) {
        const dots = developerCarouselDotsContainer.querySelectorAll('.dot');
        if (dots) {
            dots.forEach((dot, index) => {
                dot.classList.remove('active');
                if (index === developerCurrentSlide) {
                    dot.classList.add('active');
                }
            });
        }
    }
}

function startDeveloperAutoPlay() {
    stopDeveloperAutoPlay();
    if (developerCarouselSlides.length > 1) {
        developerCarouselInterval = setInterval(() => {
            developerCurrentSlide = (developerCurrentSlide + 1) % developerCarouselSlides.length;
            updateDeveloperCarousel();
        }, 5000);
    }
}

function resetDeveloperAutoPlay() {
    stopDeveloperAutoPlay();
    startDeveloperAutoPlay();
}

function stopDeveloperAutoPlay() {
    clearInterval(developerCarouselInterval);
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    developerCarouselSlides = Array.from(developerCarouselTrack.children); // Get all developer cards as slides

    if (developerCarouselSlides.length > 0) {
        // Initialize dots
        if (developerCarouselDotsContainer) {
            developerCarouselSlides.forEach((slide, index) => {
                const dot = document.createElement('span');
                dot.classList.add('dot');
                if (index === 0) dot.classList.add('active');
                dot.dataset.slideIndex = index;
                developerCarouselDotsContainer.appendChild(dot);
                dot.addEventListener('click', () => {
                    developerCurrentSlide = index;
                    updateDeveloperCarousel();
                });
            });
        }
        
        updateDeveloperCarousel(); // Set initial position and active dot/slide
        startDeveloperAutoPlay(); // Start auto-play

        // Add drag/swipe listeners
        if (developerCarouselTrack) {
            developerCarouselTrack.addEventListener('mousedown', developerStartDrag);
            developerCarouselTrack.addEventListener('mouseleave', developerEndDrag);
            developerCarouselTrack.addEventListener('mouseup', developerEndDrag);
            developerCarouselTrack.addEventListener('mousemove', developerDrag);

            developerCarouselTrack.addEventListener('touchstart', developerStartDrag);
            developerCarouselTrack.addEventListener('touchend', developerEndDrag);
            developerCarouselTrack.addEventListener('touchmove', developerDrag);

            developerCarouselTrack.addEventListener('dragstart', (e) => e.preventDefault());
        }

        // --- REMOVED JAVASCRIPT CONTROL OF BUTTON DISPLAY (for swipe-only) ---
        // These lines were causing the arrows to appear:
        // if (developerCarouselSlides.length > 1) {
        //     if (developerCarouselPrevBtn) developerCarouselPrevBtn.style.display = 'block';
        //     if (developerCarouselNextBtn) developerCarouselNextBtn.style.display = 'block';
        // } else {
        //     if (developerCarouselPrevBtn) developerCarouselPrevBtn.style.display = 'none';
        //     if (developerCarouselNextBtn) developerCarouselNextBtn.style.display = 'none';
        //     if (developerCarouselDotsContainer) developerCarouselDotsContainer.innerHTML = '';
        // }
        // ---------------------------------------------------------------------

    } else {
        // No developer cards found
        if (developerCarouselPrevBtn) developerCarouselPrevBtn.style.display = 'none';
        if (developerCarouselNextBtn) developerCarouselNextBtn.style.display = 'none';
        if (developerCarouselDotsContainer) developerCarouselDotsContainer.innerHTML = '';
        if (developerCarouselTrack) developerCarouselTrack.innerHTML = `<div class="developer-card">No developer profiles available.</div>`;
    }
});