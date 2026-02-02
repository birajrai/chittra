/**
 * Cache Headers Middleware
 * DRY: Centralized cache header management
 */

/**
 * Set cache headers on response
 * @param {Response} res - Express response object
 * @param {boolean} isHit - Whether the response is from cache
 */
export function setCacheHeaders(res, isHit = false) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('X-Cache', isHit ? 'HIT' : 'MISS');
}

/**
 * Middleware to set cache headers for static responses
 * @param {number} maxAge - Max age in seconds (default: 1 year)
 */
export function staticCacheMiddleware(maxAge = 31536000) {
    return (req, res, next) => {
        res.set('Cache-Control', `public, max-age=${maxAge}, immutable`);
        next();
    };
}

export default setCacheHeaders;
