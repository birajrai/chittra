import { LRUCache } from 'lru-cache';
import config from './config.js';

/**
 * LRU Cache wrapper for caching generated images
 */
class ImageCache {
    constructor() {
        this.cache = new LRUCache({
            max: config.CACHE_MAX_ITEMS,
            ttl: config.CACHE_TTL,
            // Calculate size based on buffer length for better memory management
            sizeCalculation: (value) => {
                if (Buffer.isBuffer(value)) {
                    return value.length;
                }
                if (typeof value === 'string') {
                    return value.length * 2; // UTF-16
                }
                return 1;
            },
            maxSize: 100 * 1024 * 1024, // 100MB max cache size
        });
    }

    /**
     * Get cached value
     * @param {string} key - Cache key
     * @returns {Buffer|string|undefined} Cached value
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Set cached value
     * @param {string} key - Cache key
     * @param {Buffer|string} value - Value to cache
     */
    set(key, value) {
        this.cache.set(key, value);
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * Delete cached value
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear entire cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     * @returns {{ size: number, maxSize: number }}
     */
    stats() {
        return {
            size: this.cache.size,
            maxSize: this.cache.max,
        };
    }
}

export default new ImageCache();
