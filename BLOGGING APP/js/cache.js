// Advanced caching system for better performance
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.userCache = new Map();
        this.blogCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.maxCacheSize = 100; // Maximum items in cache
    }

    // Generate cache key
    generateKey(type, id, params = {}) {
        const paramStr = Object.keys(params).length > 0 ? JSON.stringify(params) : '';
        return `${type}:${id}:${paramStr}`;
    }

    // Set cache with expiry
    set(key, data, customExpiry = null) {
        const expiry = customExpiry || this.cacheExpiry;
        const cacheItem = {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + expiry
        };

        // Implement LRU cache - remove oldest if at max size
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, cacheItem);
        console.log(`📦 Cached: ${key}`);
    }

    // Get from cache if not expired
    get(key) {
        const cacheItem = this.cache.get(key);
        
        if (!cacheItem) {
            return null;
        }

        // Check if expired
        if (Date.now() > cacheItem.expiry) {
            this.cache.delete(key);
            console.log(`🗑️ Cache expired: ${key}`);
            return null;
        }

        console.log(`⚡ Cache hit: ${key}`);
        return cacheItem.data;
    }

    // Cache user data
    setUser(userId, userData) {
        const key = this.generateKey('user', userId);
        this.set(key, userData, 10 * 60 * 1000); // 10 minutes for user data
    }

    getUser(userId) {
        const key = this.generateKey('user', userId);
        return this.get(key);
    }

    // Cache blog data
    setBlogs(type, id, blogs) {
        const key = this.generateKey('blogs', `${type}:${id}`);
        this.set(key, blogs, 2 * 60 * 1000); // 2 minutes for blog lists
    }

    getBlogs(type, id) {
        const key = this.generateKey('blogs', `${type}:${id}`);
        return this.get(key);
    }

    // Clear specific cache
    clear(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // Clear expired items
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    // Get cache stats
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Create global cache instance
export const cache = new CacheManager();

// Cleanup expired cache every 5 minutes
setInterval(() => {
    cache.cleanup();
}, 5 * 60 * 1000);