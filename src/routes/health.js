/**
 * Health Check Route
 */

import { Router } from 'express';
import cache from '../cache.js';

const router = Router();

/**
 * GET /health
 * Returns server health status and cache statistics
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        cache: cache.stats(),
        uptime: process.uptime(),
    });
});

export default router;
