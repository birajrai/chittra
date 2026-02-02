const { LRUCache } = require('lru-cache');
const { CACHE_TTL, CACHE_ITEMS } = require('./config');

class Cache {
    constructor() {
        this.cache = new LRUCache({
            max: CACHE_ITEMS,
            ttl: CACHE_TTL,
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

module.exports = new Cache();
