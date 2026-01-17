// Author page functionality
import { getAuthorBlogPosts, formatDate } from './blog.js';
import { getProfilePhotoUrl } from './cloudinary.js';
import { getUrlParameter, showLoading, showEmptyState, showError } from './utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Get author ID from URL parameters
    const authorId = getUrlParameter('id');
    
    if (!authorId) {
        showError('Author not specified');
        return;
    }
    
    // Load author's blog posts
    await loadAuthorBlogs(authorId);
});

async function loadAuthorBlogs(authorId) {
    const container = document.getElementById('authorBlogsContainer');
    showLoading('authorBlogsContainer');
    
    const result = await getAuthorBlogPosts(authorId);
    
    if (result.success) {
        // Update author info
        updateAuthorInfo(result.author);
        
        if (result.blogs.length === 0) {
            showEmptyState('authorBlogsContainer', 'This author hasn\'t written any blogs yet');
        } else {
            displayAuthorBlogs(result.blogs);
        }
    } else {
        showError('Failed to load author blogs: ' + result.error, 'authorBlogsContainer');
    }
}

function updateAuthorInfo(author) {
    const authorName = `${author.firstName} ${author.lastName}`;
    
    // Update author info section
    document.getElementById('authorName').textContent = authorName;
    document.getElementById('authorEmail').textContent = author.email;
    document.getElementById('authorNameTitle').textContent = authorName;
    
    // Update profile photo if available
    const authorPhoto = document.getElementById('authorPhoto');
    if (author.photoURL) {
        // If it's a Cloudinary public_id, generate optimized URL
        if (author.photoURL.includes('cloudinary') || !author.photoURL.startsWith('http')) {
            authorPhoto.src = getProfilePhotoUrl(author.photoURL, 100);
        } else {
            authorPhoto.src = author.photoURL;
        }
    }
    
    // Update page title
    document.title = `${authorName}'s Blogs - Blog App`;
}

function displayAuthorBlogs(blogs) {
    const container = document.getElementById('authorBlogsContainer');
    
    const blogsHtml = blogs.map(blog => `
        <div class="card blog-card">
            <div class="card-body">
                <h5 class="card-title">${escapeHtml(blog.title)}</h5>
                <div class="blog-meta mb-2">
                    <small class="text-muted">
                        Published on ${formatDate(blog.createdAt)}
                        ${blog.updatedAt && blog.updatedAt !== blog.createdAt ? 
                            `• Updated on ${formatDate(blog.updatedAt)}` : ''}
                    </small>
                </div>
                <p class="card-text blog-content">${escapeHtml(blog.content)}</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = blogsHtml;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}