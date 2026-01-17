// Utility functions

// Get greeting based on current time with emojis and personalization
export function getGreeting(userName = null) {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    
    let timeGreeting = '';
    let emoji = '';
    let message = '';
    
    if (hour < 6) {
        timeGreeting = 'Good Night';
        emoji = '🌙';
        message = isWeekend ? 'Hope you\'re having a peaceful night!' : 'Working late? Take care of yourself!';
    } else if (hour < 12) {
        timeGreeting = 'Good Morning';
        emoji = '🌅';
        message = isWeekend ? 'Hope you\'re having a relaxing morning!' : 'Ready to start your day?';
    } else if (hour < 17) {
        timeGreeting = 'Good Afternoon';
        emoji = '☀️';
        message = isWeekend ? 'Enjoying your weekend?' : 'Hope your day is going well!';
    } else if (hour < 21) {
        timeGreeting = 'Good Evening';
        emoji = '🌆';
        message = isWeekend ? 'Having a great evening?' : 'Time to unwind!';
    } else {
        timeGreeting = 'Good Night';
        emoji = '🌙';
        message = isWeekend ? 'Enjoying your evening?' : 'Hope you had a productive day!';
    }
    
    return {
        greeting: `${emoji} ${timeGreeting}`,
        message: message,
        emoji: emoji,
        timeGreeting: timeGreeting
    };
}

// Get simple greeting (backward compatibility)
export function getSimpleGreeting() {
    return getGreeting().greeting;
}

// Show loading spinner
export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

// Show empty state
export function showEmptyState(containerId, message, actionButton = null) {
    const container = document.getElementById(containerId);
    if (container) {
        let actionHtml = '';
        if (actionButton) {
            actionHtml = `<button class="btn btn-primary mt-3" onclick="${actionButton.onclick}">${actionButton.text}</button>`;
        }
        
        container.innerHTML = `
            <div class="empty-state fade-in-up">
                <h4>${message}</h4>
                <p class="text-muted">There's nothing here yet.</p>
                ${actionHtml}
            </div>
        `;
    }
}

// Show error message with auto-dismiss
export function showError(message, containerId = null, autoDismiss = true, duration = 5000) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show slide-in" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = alertHtml + container.innerHTML;
        }
    } else {
        // Show at top of page
        document.body.insertAdjacentHTML('afterbegin', alertHtml);
    }
    
    // Auto dismiss after specified duration
    if (autoDismiss) {
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert-danger');
            alerts.forEach(alert => {
                if (alert.textContent.includes(message.substring(0, 20))) {
                    alert.remove();
                }
            });
        }, duration);
    }
}

// Show success message with auto-dismiss
export function showSuccess(message, containerId = null, autoDismiss = true) {
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show slide-in" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = alertHtml + container.innerHTML;
        }
    } else {
        // Show at top of page
        document.body.insertAdjacentHTML('afterbegin', alertHtml);
    }
    
    // Auto dismiss after 3 seconds
    if (autoDismiss) {
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert-success');
            alerts.forEach(alert => {
                if (alert.textContent.includes(message.substring(0, 20))) {
                    alert.remove();
                }
            });
        }, 3000);
    }
}

// Enhanced form validation with better UX
export function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        // Remove previous validation classes
        input.classList.remove('is-invalid', 'is-valid');
        
        // Check validity
        if (!input.checkValidity()) {
            input.classList.add('is-invalid');
            isValid = false;
            
            // Add shake animation
            input.addEventListener('animationend', () => {
                input.classList.remove('shake');
            }, { once: true });
        } else if (input.value.trim() !== '') {
            input.classList.add('is-valid');
        }
    });
    
    return isValid;
}

// Real-time validation for individual fields
export function validateField(input) {
    input.classList.remove('is-invalid', 'is-valid');
    
    if (!input.checkValidity()) {
        input.classList.add('is-invalid');
        return false;
    } else if (input.value.trim() !== '') {
        input.classList.add('is-valid');
        return true;
    }
    return true;
}

// Reset form validation with smooth transitions
export function resetFormValidation(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.classList.remove('is-invalid', 'is-valid');
        });
        form.reset();
    }
}

// Get URL parameters
export function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Debounce function for search/input
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Enhanced image file validation
export function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)' 
        };
    }
    
    if (file.size > maxSize) {
        return { 
            valid: false, 
            error: `Image size must be less than ${formatFileSize(maxSize)}` 
        };
    }
    
    return { valid: true };
}

// Auto-resize textarea with smooth animation
export function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Copy text to clipboard with feedback
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('Copied to clipboard!', null, true);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess('Copied to clipboard!', null, true);
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            showError('Failed to copy to clipboard');
            return false;
        }
    }
}

// Smooth scroll to element
export function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}

// Add loading state to button
export function setButtonLoading(button, isLoading, loadingText = 'Loading...') {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            ${loadingText}
        `;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Show toast notification
export function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 fade-in-up`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}