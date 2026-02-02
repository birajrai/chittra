const LRU = require('lru-cache');
const { CACHE_TTL, CACHE_ITEMS } = require('./config');

module.exports = new LRU.Cache({
    max: CACHE_ITEMS,
    ttl: CACHE_TTL,
});
