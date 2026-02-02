const LRUCache = require('lru-cache');
const { CACHE_TTL, CACHE_ITEMS } = require('./config');

module.exports = new LRUCache({
    max: CACHE_ITEMS,
    ttl: CACHE_TTL,
});
