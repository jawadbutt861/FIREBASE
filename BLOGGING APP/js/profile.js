// Profile page functionality
import { requireAuth, signOutUser, getUserData, updateUserProfile, updateUserPassword } from './auth.js';
import { uploadImageToCloudinary, getProfilePhotoUrl, deleteImageFromCloudinary } from './cloudinary.js';
import { showError, showSuccess, validateForm, isValidImageFile } from './utils.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;
    
    // Load user data
    await loadUserProfile();
    
    // Setup form submission
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', handleProfileUpdate);
    
    // Setup photo upload
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const photoInput = document.getElementById('photoInput');
    
    changePhotoBtn.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoUpload);
    
    // Setup password confirmation validation
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    confirmPassword.addEventListener('input', function() {
        if (newPassword.value && newPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });
    
    newPassword.addEventListener('input', function() {
        if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity('Passwords do not match');
        } else {
            confirmPassword.setCustomValidity('');
        }
    });
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Update navigation
    const userNameNav = document.getElementById('userNameNav');
    userNameNav.textContent = currentUser.displayName || 'User';
});

async function loadUserProfile() {
    const userData = await getUserData(currentUser.uid);
    
    if (userData.success) {
        const data = userData.data;
        
        // Populate form fields
        document.getElementById('firstName').value = data.firstName || '';
        document.getElementById('lastName').value = data.lastName || '';
        document.getElementById('email').value = data.email || currentUser.email;
        
        // Set profile photo
        const profilePhoto = document.getElementById('profilePhoto');
        if (data.photoURL) {
            // If it's a Cloudinary public_id, generate optimized URL
            if (data.photoURL.includes('cloudinary') || !data.photoURL.startsWith('http')) {
                profilePhoto.src = getProfilePhotoUrl(data.photoURL, 150);
            } else {
                profilePhoto.src = data.photoURL;
            }
        } else if (currentUser.photoURL) {
            profilePhoto.src = currentUser.photoURL;
        }
        
        // Update navigation name
        const userNameNav = document.getElementById('userNameNav');
        userNameNav.textContent = `${data.firstName} ${data.lastName}`;
    } else {
        showError('Failed to load profile data: ' + userData.error);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!validateForm('profileForm')) {
        return;
    }
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate password if provided
    if (newPassword && newPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
    
    try {
        // Update profile data
        const updateData = {
            firstName: firstName,
            lastName: lastName
        };
        
        const profileResult = await updateUserProfile(currentUser.uid, updateData);
        
        if (!profileResult.success) {
            throw new Error(profileResult.error);
        }
        
        // Update password if provided
        if (newPassword) {
            const passwordResult = await updateUserPassword(newPassword);
            if (!passwordResult.success) {
                throw new Error('Profile updated but password change failed: ' + passwordResult.error);
            }
        }
        
        showSuccess('Profile updated successfully!');
        
        // Clear password fields
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        
        // Update navigation
        const userNameNav = document.getElementById('userNameNav');
        userNameNav.textContent = `${firstName} ${lastName}`;
        
    } catch (error) {
        showError(error.message || 'Failed to update profile');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    const validation = isValidImageFile(file);
    if (!validation.valid) {
        showError(validation.error);
        return;
    }
    
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const originalText = changePhotoBtn.textContent;
    changePhotoBtn.disabled = true;
    changePhotoBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Uploading...';
    
    try {
        // Get current user data to check for existing photo
        const userData = await getUserData(currentUser.uid);
        let oldPhotoId = null;
        
        if (userData.success && userData.data.photoURL) {
            // Extract public_id from existing photo URL if it's from Cloudinary
            if (!userData.data.photoURL.startsWith('http')) {
                oldPhotoId = userData.data.photoURL;
            }
        }
        
        // Upload new image to Cloudinary
        const uploadResult = await uploadImageToCloudinary(file);
        
        if (!uploadResult.success) {
            throw new Error(uploadResult.error);
        }
        
        // Update user profile with new photo URL (store public_id for optimization)
        const updateResult = await updateUserProfile(currentUser.uid, {
            photoURL: uploadResult.publicId
        });
        
        if (updateResult.success) {
            // Update profile photo display with optimized URL
            const optimizedUrl = getProfilePhotoUrl(uploadResult.publicId, 150);
            document.getElementById('profilePhoto').src = optimizedUrl;
            
            // Delete old image from Cloudinary if it exists
            if (oldPhotoId) {
                try {
                    await deleteImageFromCloudinary(oldPhotoId);
                } catch (deleteError) {
                    console.warn('Could not delete old image:', deleteError);
                    // Don't show error to user as main operation succeeded
                }
            }
            
            showSuccess('Profile photo updated successfully!');
        } else {
            throw new Error(updateResult.error);
        }
        
    } catch (error) {
        showError('Failed to upload photo: ' + error.message);
    } finally {
        changePhotoBtn.disabled = false;
        changePhotoBtn.textContent = originalText;
        // Clear file input
        e.target.value = '';
    }
}

async function handleLogout() {
    const result = await signOutUser();
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        showError('Failed to logout: ' + result.error);
    }
}