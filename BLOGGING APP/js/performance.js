// Performance optimization utilities
import { cache } from './cache.js';

// Debounce function for search and input
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

// Throttle function for scroll events
export function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Lazy loading for images
export function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Virtual scrolling for large lists
export class VirtualScroller {
    constructor(container, itemHeight, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.items = [];
        this.visibleStart = 0;
        this.visibleEnd = 0;
        this.scrollTop = 0;
        
        this.setupScrolling();
    }

    setItems(items) {
        this.items = items;
        this.render();
    }

    setupScrolling() {
        this.container.addEventListener('scroll', throttle(() => {
            this.scrollTop = this.container.scrollTop;
            this.render();
        }, 16)); // ~60fps
    }

    render() {
        const containerHeight = this.container.clientHeight;
        const totalHeight = this.items.length * this.itemHeight;
        
        this.visibleStart = Math.floor(this.scrollTop / this.itemHeight);
        this.visibleEnd = Math.min(
            this.visibleStart + Math.ceil(containerHeight / this.itemHeight) + 1,
            this.items.length
        );

        // Create virtual container
        const virtualContainer = document.createElement('div');
        virtualContainer.style.height = `${totalHeight}px`;
        virtualContainer.style.position = 'relative';

        // Render visible items
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.renderItem(this.items[i], i);
            item.style.position = 'absolute';
            item.style.top = `${i * this.itemHeight}px`;
            item.style.height = `${this.itemHeight}px`;
            virtualContainer.appendChild(item);
        }

        this.container.innerHTML = '';
        this.container.appendChild(virtualContainer);
    }
}

// Preload critical resources
export function preloadCriticalResources() {
    // Preload Firebase modules
    const firebaseModules = [
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js',
        'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    ];

    firebaseModules.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = url;
        document.head.appendChild(link);
    });
}

// Optimize images
export function optimizeImage(src, width = 400, quality = 80) {
    if (src.includes('cloudinary')) {
        // Already optimized
        return src;
    }
    
    if (src.includes('ui-avatars.com')) {
        // Add size parameter
        return src.replace(/size=\d+/, `size=${width}`);
    }
    
    return src;
}

// Batch DOM updates
export class DOMBatcher {
    constructor() {
        this.updates = [];
        this.scheduled = false;
    }

    add(updateFn) {
        this.updates.push(updateFn);
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(() => this.flush());
        }
    }

    flush() {
        this.updates.forEach(update => update());
        this.updates = [];
        this.scheduled = false;
    }
}

// Performance monitoring
export class PerformanceMonitor {
    constructor() {
        this.metrics = {};
    }

    startTimer(name) {
        this.metrics[name] = {
            start: performance.now()
        };
    }

    endTimer(name) {
        if (this.metrics[name]) {
            this.metrics[name].duration = performance.now() - this.metrics[name].start;
            console.log(`⏱️ ${name}: ${this.metrics[name].duration.toFixed(2)}ms`);
        }
    }

    getMetrics() {
        return this.metrics;
    }

    logCacheStats() {
        const stats = cache.getStats();
        console.log('📊 Cache Stats:', stats);
    }
}

// Global performance monitor
export const perfMonitor = new PerformanceMonitor();

// Global DOM batcher
export const domBatcher = new DOMBatcher();

// Connection quality detection
export function getConnectionQuality() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        
        switch (effectiveType) {
            case 'slow-2g':
            case '2g':
                return 'slow';
            case '3g':
                return 'medium';
            case '4g':
                return 'fast';
            default:
                return 'unknown';
        }
    }
    return 'unknown';
}

// Adaptive loading based on connection
export function shouldUseCache() {
    const quality = getConnectionQuality();
    return quality === 'slow' || quality === 'medium';
}

// Memory usage monitoring
export function getMemoryUsage() {
    if ('memory' in performance) {
        return {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
    }
    return null;
}