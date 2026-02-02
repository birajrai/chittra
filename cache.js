import { LRUCache } from 'lru-cache';
import config from './config.js';

class Cache {
    constructor() {
        this.cache = new LRUCache({
            max: config.CACHE_ITEMS,
            ttl: config.CACHE_TTL,
        });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value) {
        this.cache.set(key, value);
    }
    has(key) {
        return this.cache.has(key);
    }
    delete(key) {
        return this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}

export default new Cache();
