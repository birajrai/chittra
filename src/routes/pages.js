/**
 * Documentation Routes
 */

import { Router } from 'express';
import config from '../config.js';
import { getAvailableFonts } from '../fonts.js';
import { getBaseUrl } from '../utils.js';

const router = Router();

/**
 * GET /docs
 * Documentation page
 */
router.get('/docs', (req, res) => {
    res.render('docs', {
        baseUrl: getBaseUrl(req),
        fonts: getAvailableFonts(),
        config,
    });
});

/**
 * GET /
 * Homepage
 */
router.get('/', (req, res) => {
    res.render('home', {
        baseUrl: getBaseUrl(req),
    });
});

export default router;
