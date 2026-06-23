// Authentication state
let currentUser = null;
let firebaseReady = false;

// Wait for Firebase to initialize
window.addEventListener('load', () => {
    // Check if Firebase is ready
    const checkFirebase = setInterval(() => {
        if (window.firebaseInitialized !== undefined) {
            clearInterval(checkFirebase);
            firebaseReady = window.firebaseInitialized;
            if (firebaseReady) {
                console.log('✅ Firebase is ready');
            } else {
                console.warn('⚠️ Firebase failed to initialize');
            }
        }
    }, 100);
    
    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkFirebase);
        if (!firebaseReady) {
            console.warn('⚠️ Firebase initialization timeout');
        }
    }, 10000);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Already logged in, redirect to dashboard
        window.location.href = '/dashboard.html';
    } else {
        showLoginForm();
    }
});

function showLoginForm() {
    document.getElementById('auth-section').innerHTML = `
        <div class="auth-form">
            <h1>Smart LinkTree</h1>
            <p class="auth-subtitle">Manage your dynamic links</p>
            
            <!-- Google Sign-In Button -->
            <button id="google-signin-btn" class="google-btn" onclick="signInWithGoogle()">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                <span>Continue with Google</span>
            </button>
            
            <div class="divider">
                <span>OR</span>
            </div>
            
            <form id="login-form" onsubmit="handleLogin(event)">
                <div class="form-group">
                    <input type="text" id="login-username" placeholder="Username" required>
                </div>
                <div class="form-group">
                    <input type="password" id="login-password" placeholder="Password" required>
                </div>
                <button type="submit" class="btn btn-primary">Login</button>
            </form>
            
            <p class="auth-toggle">Don't have an account? <a href="#" onclick="showSignupForm()">Sign up</a></p>
        </div>
    `;
}

function showSignupForm() {
    document.getElementById('auth-section').innerHTML = `
        <div class="auth-form">
            <h1>Smart LinkTree</h1>
            <p class="auth-subtitle">Create your account</p>
            
            <!-- Google Sign-In Button -->
            <button id="google-signin-btn" class="google-btn" onclick="signInWithGoogle()">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google">
                <span>Continue with Google</span>
            </button>
            
            <div class="divider">
                <span>OR</span>
            </div>
            
            <form id="signup-form" onsubmit="handleSignup(event)">
                <div class="form-group">
                    <input type="text" id="signup-username" placeholder="Username" required>
                </div>
                <div class="form-group">
                    <input type="email" id="signup-email" placeholder="Email" required>
                </div>
                <div class="form-group">
                    <input type="password" id="signup-password" placeholder="Password" required>
                </div>
                <div class="form-group">
                    <select id="signup-position" required>
                        <option value="" disabled selected>Select your position</option>
                        <option value="guest">👤 Guest</option>
                        <option value="student">🎓 Student</option>
                        <option value="developer">💻 Developer</option>
                        <option value="hr">👔 HR</option>
                        <option value="admin">🛡️ Admin</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Sign Up</button>
            </form>
            
            <p class="auth-toggle">Already have an account? <a href="#" onclick="showLoginForm()">Login</a></p>
        </div>
    `;
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: username, 
                password: password 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            const error = await response.json();
            alert('Login failed: ' + error.detail);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const position = document.getElementById('signup-position').value;
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: username, 
                email: email, 
                password: password, 
                position: position 
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            const error = await response.json();
            alert('Signup failed: ' + error.detail);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html';
}

async function signInWithGoogle() {
    // Wait for Firebase to initialize (max 5 seconds)
    let attempts = 0;
    while (!window.firebaseAuth && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.firebaseAuth) {
        console.error('Firebase failed to initialize');
        alert('Firebase authentication is not available. Please refresh the page and try again.');
        return;
    }

    const btn = document.getElementById('google-signin-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Signing in with Google...</span>';
    }
    
    try {
        console.log('Starting Google Sign-In...');
        
        // Sign in with Google popup
        const result = await window.signInWithPopup(window.firebaseAuth, window.googleProvider);
        
        console.log('Google Sign-In successful, getting token...');
        
        // Get Firebase ID token
        const idToken = await result.user.getIdToken();
        
        console.log('Token received, sending to backend...');
        
        // Send to backend
        const response = await fetch('/api/auth/firebase-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_token: idToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Backend authentication successful!');
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            const error = await response.json();
            console.error('Backend error:', error);
            alert('Google Sign-In failed: ' + (error.detail || 'Unknown error'));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"><span>Continue with Google</span>';
            }
        }
    } catch (error) {
        console.error('Google Sign-In error:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Google Sign-In failed: ';
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Popup was blocked by your browser. Please allow popups for this site.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google"><span>Continue with Google</span>';
        }
    }
}
