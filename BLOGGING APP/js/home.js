// Home page functionality with performance optimizations
import { checkAuth, signOutUser, getUserData } from './auth.js';
import { getAllBlogPosts, formatDate, truncateText, deleteBlogPost, preloadNextPage } from './blog.js';
import { getProfilePhotoUrl } from './cloudinary.js';
import { getGreeting, showLoading, showEmptyState, showError, showSuccess } from './utils.js';
import { perfMonitor, domBatcher, setupLazyLoading, throttle, shouldUseCache } from './performance.js';

let currentUser = null;
let blogsLoaded = false;

document.addEventListener('DOMContentLoaded', async function() {
    perfMonitor.startTimer('pageLoad');
    
    // Set greeting with better styling
    const greetingElement = document.getElementById('greeting');
    const greetingData = getGreeting();
    const greetingText = greetingData.timeGreeting + '! Welcome to BlogApp';
    greetingElement.innerHTML = greetingText;
    
    // Add animation class
    greetingElement.classList.add('fade-in-up');
    
    // Check authentication status
    perfMonitor.startTimer('authCheck');
    currentUser = await checkAuth();
    perfMonitor.endTimer('authCheck');
    
    await updateNavigation(currentUser);
    
    // Load all blog posts with performance optimization
    await loadAllBlogs();
    
    // Setup logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Setup navbar scroll effect with throttling
    setupNavbarScroll();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Setup lazy loading for images
    setupLazyLoading();
    
    // Preload next page after initial load
    setTimeout(() => {
        if (blogsLoaded) {
            preloadNextPage();
        }
    }, 2000);
    
    perfMonitor.endTimer('pageLoad');
    perfMonitor.logCacheStats();
});

async function updateNavigation(user) {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (user) {
        authButtons.classList.add('d-none');
        userInfo.classList.remove('d-none');
        
        // Get user data for profile photo
        const userData = await getUserData(user.uid);
        if (userData.success) {
            const fullName = `${userData.data.firstName} ${userData.data.lastName}`;
            userName.textContent = fullName;
            
            // Set profile photo with lazy loading
            if (userData.data.photoURL) {
                const photoUrl = userData.data.photoURL.includes('cloudinary') || !userData.data.photoURL.startsWith('http') 
                    ? getProfilePhotoUrl(userData.data.photoURL, 32)
                    : userData.data.photoURL;
                
                userAvatar.dataset.src = photoUrl;
                userAvatar.classList.add('lazy');
            } else if (user.photoURL) {
                userAvatar.dataset.src = user.photoURL;
                userAvatar.classList.add('lazy');
            }
        } else {
            userName.textContent = user.displayName || 'User';
        }
    } else {
        authButtons.classList.remove('d-none');
        userInfo.classList.add('d-none');
    }
}

function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    const throttledScroll = throttle(function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, 16); // ~60fps
    
    window.addEventListener('scroll', throttledScroll);
}

function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

async function loadAllBlogs() {
    const container = document.getElementById('blogContainer');
    showLoading('blogContainer');
    
    console.log('🔄 Loading all blogs...');
    perfMonitor.startTimer('blogLoad');
    
    try {
        // Use cache based on connection quality
        const useCache = shouldUseCache();
        const result = await getAllBlogPosts(useCache);
        
        perfMonitor.endTimer('blogLoad');
        console.log('📥 Blog fetch result:', result);
        
        if (result.success) {
            console.log('✅ Blogs loaded successfully:', result.blogs.length, 'blogs');
            blogsLoaded = true;
            
            if (result.blogs.length === 0) {
                console.log('⚠️ No blogs found in database');
                showEmptyState('blogContainer', 'No blogs available yet', {
                    text: 'Be the first to write!',
                    onclick: 'window.location.href="signup.html"'
                });
            } else {
                console.log('📝 Displaying blogs...');
                displayBlogs(result.blogs);
            }
        } else {
            console.error('❌ Failed to load blogs:', result.error);
            handleBlogLoadError(result.error, container);
        }
    } catch (error) {
        perfMonitor.endTimer('blogLoad');
        console.error('❌ Exception while loading blogs:', error);
        handleBlogLoadError(error.message, container);
    }
}

function handleBlogLoadError(error, container) {
    let errorMsg = 'Failed to load blogs. ';
    
    if (error.includes('index')) {
        errorMsg += 'Database index required. ';
        const urlMatch = error.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h5><i class="fas fa-exclamation-triangle me-2"></i>Index Required</h5>
                    <p>A Firestore index is required to display blogs.</p>
                    <a href="${urlMatch[0]}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt me-2"></i>Create Index
                    </a>
                    <p class="mt-3 mb-0 small">After creating the index, wait 1-2 minutes and refresh this page.</p>
                </div>
            `;
            return;
        }
    }
    
    container.innerHTML = `
        <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-circle me-2"></i>Error Loading Blogs</h5>
            <p>${errorMsg}</p>
            <p class="mb-0"><strong>Details:</strong> ${error}</p>
            <button class="btn btn-outline-danger mt-3" onclick="window.location.reload()">
                <i class="fas fa-redo me-2"></i>Retry
            </button>
        </div>
    `;
}

function displayBlogs(blogs) {
    const container = document.getElementById('blogContainer');
    perfMonitor.startTimer('blogRender');
    
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    blogs.forEach((blog, index) => {
        const blogElement = createBlogElement(blog, index);
        fragment.appendChild(blogElement);
    });
    
    // Batch DOM update
    domBatcher.add(() => {
        container.innerHTML = '';
        container.appendChild(fragment);
        
        // Setup delete functionality after DOM update
        setupDeleteFunctionality(container);
        
        // Setup lazy loading for newly added images
        setupLazyLoading();
    });
    
    perfMonitor.endTimer('blogRender');
}

function createBlogElement(blog, index) {
    const isOwner = currentUser && currentUser.uid === blog.userId;
    
    const blogCard = document.createElement('div');
    blogCard.className = 'card blog-card fade-in-up';
    blogCard.style.animationDelay = `${index * 0.1}s`;
    blogCard.dataset.blogId = blog.id;
    
    blogCard.innerHTML = `
        <div class="card-body">
            <div class="d-flex align-items-center mb-3">
                <img data-src="${getAuthorAvatar(blog.author)}" 
                     class="rounded-circle me-3 lazy" width="40" height="40" alt="Author"
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3C/svg%3E">
                <div class="flex-grow-1">
                    <h6 class="mb-0">
                        <a href="author.html?id=${blog.userId}" class="author-link text-decoration-none">
                            ${escapeHtml(blog.author.firstName)} ${escapeHtml(blog.author.lastName)}
                        </a>
                    </h6>
                    <small class="text-muted">${formatDate(blog.createdAt)}</small>
                </div>
                ${isOwner ? `
                <div class="dropdown">
                    <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" 
                            data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="dashboard.html">
                                <i class="fas fa-edit me-2 text-primary"></i>Edit in Dashboard
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <button class="dropdown-item text-danger delete-home-btn" 
                                    data-blog-id="${blog.id}" data-title="${escapeHtml(blog.title)}">
                                <i class="fas fa-trash me-2"></i>Delete
                            </button>
                        </li>
                    </ul>
                </div>
                ` : ''}
            </div>
            
            <h5 class="card-title mb-3">${escapeHtml(blog.title)}</h5>
            <p class="card-text blog-content text-muted mb-3">
                ${escapeHtml(truncateText(blog.content, 150))}
            </p>
            
            <div class="d-flex justify-content-between align-items-center">
                <a href="author.html?id=${blog.userId}" class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-user me-1"></i>View Author
                </a>
                <div class="text-muted">
                    <i class="fas fa-clock me-1"></i>
                    <small>${getReadingTime(blog.content)} min read</small>
                </div>
            </div>
        </div>
    `;
    
    return blogCard;
}

function setupDeleteFunctionality(container) {
    container.querySelectorAll('.delete-home-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const blogId = this.dataset.blogId;
            const title = this.dataset.title;
            confirmDeleteFromHome(blogId, title);
        });
    });
}

function getAuthorAvatar(author) {
    if (author.photoURL) {
        if (author.photoURL.includes('cloudinary') || !author.photoURL.startsWith('http')) {
            return getProfilePhotoUrl(author.photoURL, 40);
        } else {
            return author.photoURL;
        }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(author.firstName + ' ' + author.lastName)}&size=40&background=6366f1&color=fff`;
}

function getReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
}

async function handleLogout() {
    const result = await signOutUser();
    if (result.success) {
        window.location.reload();
    } else {
        showError('Failed to logout: ' + result.error);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Delete functionality for home page
function confirmDeleteFromHome(blogId, title) {
    const modalElement = document.getElementById('deleteHomeModal');
    const modal = new window.bootstrap.Modal(modalElement);
    
    // Set the blog title in modal
    const titleElement = document.getElementById('deleteHomeTitle');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    document.getElementById('confirmHomeDelete').onclick = async function() {
        const btn = this;
        const originalText = btn.innerHTML;
        
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';
        
        try {
            await deleteFromHome(blogId);
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

async function deleteFromHome(blogId) {
    const result = await deleteBlogPost(blogId);
    
    if (result.success) {
        // Remove blog from UI immediately with animation
        const blogCard = document.querySelector(`[data-blog-id="${blogId}"]`);
        if (blogCard) {
            blogCard.style.transition = 'all 0.3s ease';
            blogCard.style.transform = 'scale(0.8)';
            blogCard.style.opacity = '0';
            
            setTimeout(() => {
                blogCard.remove();
                
                // Check if no blogs left and show empty state
                const container = document.getElementById('blogContainer');
                if (container.children.length === 0) {
                    showEmptyState('blogContainer', 'No blogs available yet', {
                        text: 'Be the first to write!',
                        onclick: 'window.location.href="signup.html"'
                    });
                }
            }, 300);
        }
        
        showSuccess('Blog post deleted successfully!');
    } else {
        showError('Failed to delete blog post: ' + result.error);
    }
}