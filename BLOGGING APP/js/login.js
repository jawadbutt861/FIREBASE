// Login page functionality
import { signInWithEmail, signInWithGoogle, redirectIfAuthenticated } from './auth.js';
import { showError, showSuccess, validateForm, validateField, setButtonLoading } from './utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Redirect if already authenticated
    await redirectIfAuthenticated();
    
    // Setup form validation and submission
    const loginForm = document.getElementById('loginForm');
    const googleLoginBtn = document.getElementById('googleLogin');
    
    loginForm.addEventListener('submit', handleLogin);
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
    
    // Setup real-time validation
    setupRealTimeValidation();
    
    // Setup password toggle
    setupPasswordToggle();
});

function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('#loginForm input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            // Clear validation state on input
            input.classList.remove('is-invalid', 'is-valid');
        });
    });
}

function setupPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    toggleBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    if (!validateForm('loginForm')) {
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Signing in...');
    
    try {
        const result = await signInWithEmail(email, password);
        
        if (result.success) {
            showSuccess('Login successful! Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showError(getErrorMessage(result.error));
        }
    } catch (error) {
        showError('An unexpected error occurred. Please try again.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleGoogleLogin() {
    const btn = document.getElementById('googleLogin');
    setButtonLoading(btn, true, 'Signing in with Google...');
    
    try {
        const result = await signInWithGoogle();
        
        if (result.success) {
            showSuccess('Login successful! Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showError(getErrorMessage(result.error));
        }
    } catch (error) {
        showError('An unexpected error occurred. Please try again.');
    } finally {
        setButtonLoading(btn, false);
    }
}

function getErrorMessage(error) {
    // Convert Firebase error codes to user-friendly messages
    switch (error) {
        case 'auth/user-not-found':
            return 'No account found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/popup-closed-by-user':
            return 'Sign-in cancelled. Please try again.';
        case 'auth/cancelled-popup-request':
            return 'Only one sign-in popup allowed at a time.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please check your credentials.';
        default:
            return error || 'Login failed. Please try again.';
    }
}