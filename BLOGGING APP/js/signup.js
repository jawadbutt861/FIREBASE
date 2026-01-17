// Signup page functionality
import { signUpWithEmail, signInWithGoogle, redirectIfAuthenticated } from './auth.js';
import { uploadImageToCloudinary } from './cloudinary.js';
import { showError, showSuccess, validateForm, validateField, setButtonLoading, isValidImageFile } from './utils.js';

let selectedProfilePhoto = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Redirect if already authenticated
    await redirectIfAuthenticated();
    
    // Setup form validation and submission
    const signupForm = document.getElementById('signupForm');
    const googleSignUpBtn = document.getElementById('googleSignUp');
    
    signupForm.addEventListener('submit', handleSignup);
    googleSignUpBtn.addEventListener('click', handleGoogleSignup);
    
    // Setup real-time validation
    setupRealTimeValidation();
    
    // Setup password toggle
    setupPasswordToggle();
    
    // Setup profile photo upload
    setupProfilePhotoUpload();
});

function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('#signupForm input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            // Clear validation state on input
            input.classList.remove('is-invalid', 'is-valid');
            
            // Special handling for password confirmation
            if (input.id === 'confirmPassword' || input.id === 'password') {
                validatePasswordMatch();
            }
        });
    });
}

function validatePasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (password.value && confirmPassword.value) {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
            confirmPassword.classList.add('is-invalid');
        } else {
            confirmPassword.setCustomValidity('');
            confirmPassword.classList.remove('is-invalid');
            confirmPassword.classList.add('is-valid');
        }
    }
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

function setupProfilePhotoUpload() {
    const selectPhotoBtn = document.getElementById('selectPhotoBtn');
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const photoInput = document.getElementById('profilePhotoInput');
    const preview = document.getElementById('profilePreview');
    
    selectPhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });
    
    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        const validation = isValidImageFile(file);
        if (!validation.valid) {
            showError(validation.error);
            return;
        }
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            removePhotoBtn.classList.remove('d-none');
            selectedProfilePhoto = file;
        };
        reader.readAsDataURL(file);
    });
    
    removePhotoBtn.addEventListener('click', function() {
        preview.src = 'https://via.placeholder.com/120';
        photoInput.value = '';
        selectedProfilePhoto = null;
        this.classList.add('d-none');
    });
}

async function handleSignup(e) {
    e.preventDefault();
    
    if (!validateForm('signupForm')) {
        return;
    }
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Additional validation
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Creating account...');
    
    try {
        // First create the account
        const result = await signUpWithEmail(email, password, firstName, lastName);
        
        if (result.success) {
            // If profile photo is selected, try to upload it
            if (selectedProfilePhoto) {
                setButtonLoading(submitBtn, true, 'Uploading profile photo...');
                
                console.log('🖼️ Attempting to upload profile photo...');
                
                try {
                    const uploadResult = await uploadImageToCloudinary(selectedProfilePhoto);
                    
                    if (uploadResult.success) {
                        console.log('✅ Photo uploaded successfully');
                        // Update user profile with photo
                        const { updateUserProfile } = await import('./auth.js');
                        await updateUserProfile(result.user.uid, {
                            photoURL: uploadResult.publicId
                        });
                        console.log('✅ Profile updated with photo');
                    } else {
                        // Photo upload failed but account created - show warning
                        console.warn('⚠️ Photo upload failed:', uploadResult.error);
                        
                        // Show user-friendly error message
                        let errorMsg = 'Account created successfully, but photo upload failed. ';
                        
                        if (uploadResult.error.includes('preset')) {
                            errorMsg += 'Upload preset not configured. Please upload photo from your profile page.';
                        } else if (uploadResult.error.includes('signature')) {
                            errorMsg += 'Upload configuration issue. Please upload photo from your profile page.';
                        } else {
                            errorMsg += 'You can upload it later from your profile page.';
                        }
                        
                        showError(errorMsg, null, true, 8000); // Show for 8 seconds
                    }
                } catch (photoError) {
                    console.error('❌ Photo upload exception:', photoError);
                    showError('Account created but photo upload failed. You can upload it later from your profile.', null, true, 6000);
                }
            }
            
            showSuccess('Account created successfully! Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showError(getErrorMessage(result.error));
        }
    } catch (error) {
        console.error('❌ Signup error:', error);
        showError('An unexpected error occurred. Please try again.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

async function handleGoogleSignup() {
    const btn = document.getElementById('googleSignUp');
    setButtonLoading(btn, true, 'Signing up with Google...');
    
    try {
        const result = await signInWithGoogle();
        
        if (result.success) {
            showSuccess('Account created successfully! Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
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
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled.';
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a stronger password.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/popup-closed-by-user':
            return 'Sign-up cancelled. Please try again.';
        case 'auth/cancelled-popup-request':
            return 'Only one sign-up popup allowed at a time.';
        default:
            return error || 'Sign-up failed. Please try again.';
    }
}