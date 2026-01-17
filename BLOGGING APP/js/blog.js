// Blog management utilities with performance optimizations
import { db } from '../firebaseconfig.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    getDoc,
    limit,
    startAfter
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getUserData } from './auth.js';
import { cache } from './cache.js';

// Pagination settings
const BLOGS_PER_PAGE = 10;
let lastBlogDoc = null;

// Create a new blog post
export async function createBlogPost(userId, title, content) {
    try {
        const blogPost = {
            userId: userId,
            title: title,
            content: content,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const docRef = await addDoc(collection(db, 'blogs'), blogPost);
        
        // Clear relevant caches
        cache.clear('blogs');
        
        return { success: true, id: docRef.id };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get all blog posts with caching and pagination
export async function getAllBlogPosts(useCache = true, page = 1) {
    try {
        console.log('📡 Fetching all blogs from Firestore...');
        
        // Check cache first
        if (useCache) {
            const cachedBlogs = cache.getBlogs('all', 'blogs');
            if (cachedBlogs) {
                console.log('⚡ Using cached blogs');
                return { success: true, blogs: cachedBlogs };
            }
        }
        
        // Fetch with pagination
        let q;
        try {
            if (page === 1) {
                q = query(
                    collection(db, 'blogs'), 
                    orderBy('createdAt', 'desc'),
                    limit(BLOGS_PER_PAGE)
                );
            } else {
                q = query(
                    collection(db, 'blogs'), 
                    orderBy('createdAt', 'desc'),
                    startAfter(lastBlogDoc),
                    limit(BLOGS_PER_PAGE)
                );
            }
            
            const querySnapshot = await getDocs(q);
            
            // Store last document for pagination
            if (querySnapshot.docs.length > 0) {
                lastBlogDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            }
            
            console.log('📊 Found', querySnapshot.size, 'blogs');
            
            // Batch user data requests
            const userIds = [...new Set(querySnapshot.docs.map(doc => doc.data().userId))];
            const userDataPromises = userIds.map(userId => getUserDataCached(userId));
            const userDataResults = await Promise.all(userDataPromises);
            
            // Create user data map for quick lookup
            const userDataMap = {};
            userIds.forEach((userId, index) => {
                userDataMap[userId] = userDataResults[index].success ? 
                    userDataResults[index].data : 
                    { firstName: 'Unknown', lastName: 'User' };
            });
            
            const blogs = querySnapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
                author: userDataMap[docSnap.data().userId]
            }));
            
            // Cache the results
            if (useCache && page === 1) {
                cache.setBlogs('all', 'blogs', blogs);
            }
            
            console.log('✅ Successfully loaded', blogs.length, 'blogs');
            return { success: true, blogs, hasMore: querySnapshot.docs.length === BLOGS_PER_PAGE };
            
        } catch (indexError) {
            // Fallback without orderBy if index error
            if (indexError.message.includes('index')) {
                console.warn('⚠️ Index not found, fetching without sorting...');
                return await getAllBlogsWithoutIndex(useCache);
            } else {
                throw indexError;
            }
        }
    } catch (error) {
        console.error('❌ Error fetching blogs:', error);
        return { success: false, error: error.message };
    }
}

// Fallback method without index
async function getAllBlogsWithoutIndex(useCache = true) {
    try {
        const querySnapshot = await getDocs(collection(db, 'blogs'));
        console.log('📊 Found', querySnapshot.size, 'blogs (unsorted)');
        
        // Batch user data requests
        const userIds = [...new Set(querySnapshot.docs.map(doc => doc.data().userId))];
        const userDataPromises = userIds.map(userId => getUserDataCached(userId));
        const userDataResults = await Promise.all(userDataPromises);
        
        // Create user data map
        const userDataMap = {};
        userIds.forEach((userId, index) => {
            userDataMap[userId] = userDataResults[index].success ? 
                userDataResults[index].data : 
                { firstName: 'Unknown', lastName: 'User' };
        });
        
        const blogs = querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            author: userDataMap[docSnap.data().userId]
        }));
        
        // Sort manually by createdAt
        blogs.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        // Cache the results
        if (useCache) {
            cache.setBlogs('all', 'blogs', blogs);
        }
        
        console.log('✅ Successfully loaded', blogs.length, 'blogs (sorted manually)');
        return { success: true, blogs };
    } catch (error) {
        throw error;
    }
}

// Cached user data fetching
async function getUserDataCached(userId) {
    // Check cache first
    const cachedUser = cache.getUser(userId);
    if (cachedUser) {
        return { success: true, data: cachedUser };
    }
    
    // Fetch from database
    const userData = await getUserData(userId);
    if (userData.success) {
        cache.setUser(userId, userData.data);
    }
    
    return userData;
}

// Get blog posts by user ID with caching
export async function getUserBlogPosts(userId, useCache = true) {
    try {
        console.log('📡 Fetching blogs for user:', userId);
        
        // Check cache first
        if (useCache) {
            const cachedBlogs = cache.getBlogs('user', userId);
            if (cachedBlogs) {
                console.log('⚡ Using cached user blogs');
                return { success: true, blogs: cachedBlogs };
            }
        }
        
        let q;
        try {
            q = query(
                collection(db, 'blogs'), 
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
        } catch (indexError) {
            if (indexError.message.includes('index')) {
                console.warn('⚠️ Index not found, fetching without sorting...');
                q = query(collection(db, 'blogs'), where('userId', '==', userId));
            } else {
                throw indexError;
            }
        }
        
        const querySnapshot = await getDocs(q);
        const blogs = [];
        
        querySnapshot.forEach((doc) => {
            blogs.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort manually if no index
        if (!q._query.orderBy || q._query.orderBy.length === 0) {
            blogs.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });
        }
        
        // Cache the results
        if (useCache) {
            cache.setBlogs('user', userId, blogs);
        }
        
        console.log('✅ Found', blogs.length, 'blogs for user');
        return { success: true, blogs };
        
    } catch (error) {
        console.error('❌ Error fetching user blogs:', error);
        return { success: false, error: error.message };
    }
}

// Get blog posts by specific author with caching
export async function getAuthorBlogPosts(authorId, useCache = true) {
    try {
        console.log('📡 Fetching blogs for author:', authorId);
        
        // Check cache first
        if (useCache) {
            const cachedData = cache.get(`author:${authorId}`);
            if (cachedData) {
                console.log('⚡ Using cached author data');
                return cachedData;
            }
        }
        
        // Fetch blogs and author data in parallel
        const [blogsResult, authorData] = await Promise.all([
            getUserBlogPosts(authorId, useCache),
            getUserDataCached(authorId)
        ]);
        
        const result = {
            success: blogsResult.success,
            blogs: blogsResult.success ? blogsResult.blogs : [],
            author: authorData.success ? authorData.data : { firstName: 'Unknown', lastName: 'User' }
        };
        
        // Cache the combined result
        if (useCache && result.success) {
            cache.set(`author:${authorId}`, result, 5 * 60 * 1000); // 5 minutes
        }
        
        console.log('✅ Found', result.blogs.length, 'blogs for author');
        return result;
        
    } catch (error) {
        console.error('❌ Error fetching author blogs:', error);
        return { success: false, error: error.message };
    }
}

// Update a blog post
export async function updateBlogPost(blogId, title, content) {
    try {
        const blogRef = doc(db, 'blogs', blogId);
        await updateDoc(blogRef, {
            title: title,
            content: content,
            updatedAt: new Date()
        });
        
        // Clear relevant caches
        cache.clear('blogs');
        cache.clear('author');
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Delete a blog post
export async function deleteBlogPost(blogId) {
    try {
        await deleteDoc(doc(db, 'blogs', blogId));
        
        // Clear relevant caches
        cache.clear('blogs');
        cache.clear('author');
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get a single blog post with caching
export async function getBlogPost(blogId, useCache = true) {
    try {
        // Check cache first
        if (useCache) {
            const cachedBlog = cache.get(`blog:${blogId}`);
            if (cachedBlog) {
                console.log('⚡ Using cached blog post');
                return { success: true, blog: cachedBlog };
            }
        }
        
        const docRef = doc(db, 'blogs', blogId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const blog = { id: docSnap.id, ...docSnap.data() };
            
            // Cache the result
            if (useCache) {
                cache.set(`blog:${blogId}`, blog, 10 * 60 * 1000); // 10 minutes
            }
            
            return { success: true, blog };
        } else {
            return { success: false, error: 'Blog post not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Format date for display
export function formatDate(date) {
    if (date && date.toDate) {
        return date.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return 'Unknown date';
}

// Truncate text for preview
export function truncateText(text, maxLength = 200) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Preload next page of blogs
export async function preloadNextPage() {
    try {
        if (lastBlogDoc) {
            console.log('🔄 Preloading next page...');
            await getAllBlogPosts(true, 2);
        }
    } catch (error) {
        console.log('Failed to preload next page:', error);
    }
}