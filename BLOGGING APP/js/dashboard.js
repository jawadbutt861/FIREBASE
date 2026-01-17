// Dashboard page functionality with performance optimizations
import { requireAuth, signOutUser, getUserData } from './auth.js';
import { createBlogPost, getUserBlogPosts, updateBlogPost, deleteBlogPost, formatDate } from './blog.js';
import { getProfilePhotoUrl } from './cloudinary.js';
import { showError, showSuccess, validateForm, resetFormValidation, showLoading, showEmptyState, getGreeting } from './utils.js';
import { perfMonitor, domBatcher, debounce, shouldUseCache } from './performance.js';

let currentUser = null;
let editingBlogId = null;

document.addEventListener('DOMContentLoaded', async function() {
    perfMonitor.startTimer('dashboardLoad');
    
    // Require authentication
    currentUser = await requireAuth();
    if (!currentUser) return;
    
    // Load user data and setup page
    await setupDashboard();
    
    // Setup form submission
    const blogForm = document.getElementById('blogForm');
    blogForm.addEventListener('submit', handleBlogSubmission);
    
    // Setup character counters with debouncing
    setupCharacterCounters();
    
    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Setup cancel edit
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
    
    // Load user's blog posts
    await loadUserBlogs();
    
    perfMonitor.endTimer('dashboardLoad');
    perfMonitor.logCacheStats();
});

function setupCharacterCounters() {
    const blogTitle = document.getElementById('blogTitle');
    const blogBody = document.getElementById('blogBody');
    const titleCharCount = document.getElementById('titleCharCount');
    const charCount = document.getElementById('charCount');
    
    // Debounced character counting for better performance
    const updateTitleCount = debounce(function(value) {
        titleCharCount.textContent = value.length;
        if (value.length > 200) {
            titleCharCount.classList.add('text-danger');
        } else {
            titleCharCount.classList.remove('text-danger');
        }
    }, 100);
    
    const updateBodyCount = debounce(function(value) {
        charCount.textContent = value.length;
        if (value.length > 10000) {
            charCount.classList.add('text-danger');
        } else {
            charCount.classList.remove('text-danger');
        }
    }, 100);
    
    blogTitle.addEventListener('input', function() {
        updateTitleCount(this.value);
    });
    
    blogBody.addEventListener('input', function() {
        updateBodyCount(this.value);
    });
}

async function setupDashboard() {
    perfMonitor.startTimer('dashboardSetup');
    
    const userNameElements = document.querySelectorAll('#userName, #userNameNav');
    const dashboardGreeting = document.getElementById('dashboardGreeting');
    
    // Get user data with caching
    const userData = await getUserData(currentUser.uid);
    
    // Set greeting with enhanced system
    if (dashboardGreeting) {
        const greetingData = getGreeting();
        dashboardGreeting.textContent = greetingData.greeting;
    }
    
    if (userData.success) {
        const fullName = `${userData.data.firstName} ${userData.data.lastName}`;
        userNameElements.forEach(el => el.textContent = fullName);
    } else {
        userNameElements.forEach(el => el.textContent = currentUser.displayName || 'User');
    }
    
    perfMonitor.endTimer('dashboardSetup');
}

async function handleBlogSubmission(e) {
    e.preventDefault();
    
    if (!validateForm('blogForm')) {
        return;
    }
    
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('blogBody').value.trim();
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    
    perfMonitor.startTimer('blogSubmission');
    
    try {
        let result;
        
        if (editingBlogId) {
            // Update existing blog
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            result = await updateBlogPost(editingBlogId, title, content);
            
            if (result.success) {
                showSuccess('Blog post updated successfully!');
                cancelEdit();
                await loadUserBlogs();
            } else {
                showError('Failed to update blog post: ' + result.error);
            }
        } else {
            // Create new blog
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publishing...';
            result = await createBlogPost(currentUser.uid, title, content);
            
            if (result.success) {
                showSuccess('Blog post published successfully!');
                resetFormValidation('blogForm');
                document.getElementById('charCount').textContent = '0';
                document.getElementById('titleCharCount').textContent = '0';
                await loadUserBlogs();
            } else {
                showError('Failed to publish blog post: ' + result.error);
            }
        }
    } catch (error) {
        showError('An unexpected error occurred. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        perfMonitor.endTimer('blogSubmission');
    }
}

async function loadUserBlogs() {
    const container = document.getElementById('userBlogsContainer');
    showLoading('userBlogsContainer');
    
    perfMonitor.startTimer('userBlogsLoad');
    
    // Use cache based on connection quality
    const useCache = shouldUseCache();
    const result = await getUserBlogPosts(currentUser.uid, useCache);
    
    perfMonitor.endTimer('userBlogsLoad');
    
    if (result.success) {
        if (result.blogs.length === 0) {
            showEmptyState('userBlogsContainer', 'You haven\'t written any blogs yet', {
                text: 'Write Your First Blog',
                onclick: 'document.getElementById("blogTitle").focus()'
            });
        } else {
            displayUserBlogs(result.blogs);
        }
    } else {
        showError('Failed to load your blogs: ' + result.error, 'userBlogsContainer');
    }
}

function displayUserBlogs(blogs) {
    const container = document.getElementById('userBlogsContainer');
    perfMonitor.startTimer('userBlogsRender');
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    blogs.forEach(blog => {
        const blogElement = createUserBlogElement(blog);
        fragment.appendChild(blogElement);
    });
    
    // Batch DOM update
    domBatcher.add(() => {
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Setup event listeners after DOM update
        setupBlogEventListeners(container);
    });
    
    perfMonitor.endTimer('userBlogsRender');
}

function createUserBlogElement(blog) {
    const escapedTitle = escapeHtml(blog.title);
    const escapedContent = escapeHtml(blog.content);
    
    const blogCard = document.createElement('div');
    blogCard.className = 'card blog-card';
    blogCard.dataset.blogId = blog.id;
    
    blogCard.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${escapedTitle}</h5>
            <div class="blog-meta mb-2">
                <small class="text-muted">
                    Published on ${formatDate(blog.createdAt)}
                    ${blog.updatedAt && blog.updatedAt !== blog.createdAt ? 
                        `• Updated on ${formatDate(blog.updatedAt)}` : ''}
                </small>
            </div>
            <p class="card-text blog-content">${escapeHtml(truncateText(blog.content, 300))}</p>
            <div class="blog-actions">
                <button class="btn btn-outline-primary btn-sm edit-btn" 
                        data-blog-id="${blog.id}" 
                        data-title="${escapedTitle}" 
                        data-content="${escapedContent}">
                    <i class="fas fa-edit me-1"></i>Edit
                </button>
                <button class="btn btn-outline-danger btn-sm delete-btn" 
                        data-blog-id="${blog.id}" 
                        data-title="${escapedTitle}">
                    <i class="fas fa-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    `;
    
    return blogCard;
}

function setupBlogEventListeners(container) {
    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const blogId = this.dataset.blogId;
            const title = this.dataset.title;
            const content = this.dataset.content;
            editBlog(blogId, title, content);
        });
    });
    
    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const blogId = this.dataset.blogId;
            const title = this.dataset.title || 'this blog post';
            confirmDeleteBlog(blogId, title);
        });
    });
}

// Make functions available for event handlers
function editBlog(blogId, title, content) {
    editingBlogId = blogId;
    
    // Populate form
    document.getElementById('blogTitle').value = title;
    document.getElementById('blogBody').value = content;
    document.getElementById('charCount').textContent = content.length;
    document.getElementById('titleCharCount').textContent = title.length;
    
    // Update UI
    document.getElementById('submitBtn').textContent = 'Update Blog';
    document.getElementById('cancelEdit').classList.remove('d-none');
    
    // Scroll to form smoothly
    document.getElementById('blogForm').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function confirmDeleteBlog(blogId, title = 'this blog post') {
    const modalElement = document.getElementById('deleteModal');
    const modal = new window.bootstrap.Modal(modalElement);
    
    // Set the blog title in modal
    const titleElement = document.getElementById('deleteTitle');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    document.getElementById('confirmDelete').onclick = async function() {
        const btn = this;
        const originalText = btn.innerHTML;
        
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
        
        try {
            await deleteBlog(blogId);
            modal.hide();
        } catch (error) {
            showError('Failed to delete blog post: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };
    
    modal.show();
}

async function deleteBlog(blogId) {
    perfMonitor.startTimer('blogDelete');
    
    const result = await deleteBlogPost(blogId);
    
    perfMonitor.endTimer('blogDelete');
    
    if (result.success) {
        // Remove blog from UI immediately with animation
        const blogCard = document.querySelector(`[data-blog-id="${blogId}"]`);
        if (blogCard) {
            blogCard.style.transition = 'all 0.3s ease';
            blogCard.style.transform = 'translateX(-100%)';
            blogCard.style.opacity = '0';
            
            setTimeout(() => {
                blogCard.remove();
                
                // Check if no blogs left and show empty state
                const container = document.getElementById('userBlogsContainer');
                if (container.children.length === 0) {
                    showEmptyState('userBlogsContainer', 'You haven\'t written any blogs yet', {
                        text: 'Write Your First Blog',
                        onclick: 'document.getElementById("blogTitle").focus()'
                    });
                }
            }, 300);
        }
        
        showSuccess('Blog post deleted successfully!');
    } else {
        showError('Failed to delete blog post: ' + result.error);
    }
}

function cancelEdit() {
    editingBlogId = null;
    resetFormValidation('blogForm');
    document.getElementById('charCount').textContent = '0';
    document.getElementById('titleCharCount').textContent = '0';
    document.getElementById('submitBtn').textContent = 'Publish Blog';
    document.getElementById('cancelEdit').classList.add('d-none');
}

async function handleLogout() {
    const result = await signOutUser();
    if (result.success) {
        window.location.href = 'index.html';
    } else {
        showError('Failed to logout: ' + result.error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
}