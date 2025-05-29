// js/auth-script.js

const API_AUTH_BASE_URL = 'http://localhost/campus-events-aggregator/backend/'; // Base URL for auth APIs

// --- Registration Logic ---
const registerForm = document.getElementById('register-form');
const registerMessage = document.getElementById('register-message');

if (registerForm) { // Only run if register form exists on the page
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch(`${API_AUTH_BASE_URL}register.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (response.ok) {
                registerMessage.textContent = result.message;
                registerMessage.style.color = 'green';
                registerForm.reset();
                // Optionally redirect to login page after successful registration
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                registerMessage.textContent = `Error: ${result.message || 'Registration failed.'}`;
                registerMessage.style.color = 'red';
                console.error('Registration error:', result);
            }
        } catch (error) {
            registerMessage.textContent = 'Network error: Could not connect to the server.';
            registerMessage.style.color = 'red';
            console.error('Fetch error:', error);
        }
    });
}

// --- Login Logic ---
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

if (loginForm) { // Only run if login form exists on the page
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('login-username').value; // Can be username or email
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_AUTH_BASE_URL}login.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                loginMessage.textContent = result.message;
                loginMessage.style.color = 'green';
                loginForm.reset();
                // Store user info in localStorage for frontend persistence
                localStorage.setItem('loggedInUser', JSON.stringify({ username: result.username, userId: result.user_id }));
                // Redirect to main page after successful login
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                loginMessage.textContent = `Error: ${result.message || 'Login failed.'}`;
                loginMessage.style.color = 'red';
                console.error('Login error:', result);
            }
        } catch (error) {
            loginMessage.textContent = 'Network error: Could not connect to the server.';
            loginMessage.style.color = 'red';
            console.error('Fetch error:', error);
        }
    });
}

// --- Logout Logic (This will be called from index.html) ---
async function logoutUser() {
    console.log("Logout button clicked, attempting logout..."); // Add this
    console.log("logoutUser function triggered!");
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) { // Wait, this is for DELETE!
        // >>> FIX THIS LINE: The confirm message is wrong for logout <<<
        // It should be:
        // if (!confirm('Are you sure you want to log out?')) {
        //    return;
        // 
        }
    try {
        const response = await fetch(`${API_AUTH_BASE_URL}logout.php`, {
            method: 'POST', // POST is often preferred for logout to avoid CSRF issues
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message); // Or update a UI message
            localStorage.removeItem('loggedInUser'); // Clear frontend storage
            window.location.href = 'index.html'; // Redirect to main page
        } else {
            console.error('Logout failed:', result.message);
            alert(`Logout failed: ${result.message}`);
        }
    } catch (error) {
        console.error('Network error during logout:', error);
        alert('Network error during logout.');
    }
}
