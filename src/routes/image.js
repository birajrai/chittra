/**
 * Image Generation Route
 * Main endpoint for generating placeholder images
 */

import { Router } from 'express';
import { Sema } from 'async-sema';
import config from '../config.js';
import cache from '../cache.js';
import renderRaster from '../render.js';
import generateSvg from '../svg.js';
import { parseSize, normalizeText, normalizeColor, parseFormat, getContentType } from '../utils.js';
import { setCacheHeaders } from '../middleware/cacheHeaders.js';

const router = Router();
const sema = new Sema(config.CONCURRENCY);

/**
 * Parse request parameters to extract bg, color, and format
 * DRY: Centralized parameter parsing logic
 * @param {Object} params - Request params { size, p2, p3, p4 }
 * @returns {Object} { bg, color, format }
 */
function parseImageParams(params) {
    const { size, p2, p3, p4 } = params;
    const formats = config.SUPPORTED_FORMATS;

    let bg = config.DEFAULT_BG;
    let color = config.DEFAULT_COLOR;
    let format = 'svg';

    // Check for format in size (e.g., 400x300.png)
    const sizeFormatMatch = size.match(/\.(svg|png|jpe?g|webp|avif)$/i);
    if (sizeFormatMatch) {
        format = parseFormat(sizeFormatMatch[1]);
    }

    // Parse p2: could be format or background color
    if (p2) {
        if (formats.includes(p2.toLowerCase())) {
            format = parseFormat(p2);
        } else {
            bg = normalizeColor(p2, config.DEFAULT_BG);

            // Parse p3: could be format or text color
            if (p3) {
                if (formats.includes(p3.toLowerCase())) {
                    format = parseFormat(p3);
                } else {
                    color = normalizeColor(p3, config.DEFAULT_COLOR);

                    // Parse p4: must be format
                    if (p4) {
                        format = parseFormat(p4);
                    }
                }
            }
        }
    }

    return { bg, color, format };
}

/**
 * GET /:size/:p2?/:p3?/:p4?
 * Generate placeholder image
 * 
 * URL Patterns:
 * - /400x300 - Default SVG with default colors
 * - /400x300/png - PNG format
 * - /400x300/ff0000 - Custom background color
 * - /400x300/ff0000/ffffff - Custom bg and text color
 * - /400x300/ff0000/ffffff/png - Custom colors with format
 * - /400x300.png - Format in size
 */
router.get('/:size/:p2?/:p3?/:p4?', async (req, res, next) => {
    const cacheKey = req.originalUrl;

    // Check cache first
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        setCacheHeaders(res, true);
        return res.type(cached.contentType).send(cached.data);
    }

    try {
        const { size } = req.params;
        const { text, font } = req.query;

        // Parse dimensions
        const { width, height } = parseSize(size);

        // Parse colors and format
        const { bg, color, format } = parseImageParams(req.params);

        // Generate label text
        const label = normalizeText(text, width, height);

        const options = {
            width,
            height,
            bg,
            color,
            text: label,
            font: font || config.DEFAULT_FONT,
        };

        // Set cache headers
        setCacheHeaders(res, false);

        // Generate SVG (fast path)
        if (format === 'svg') {
            const svg = generateSvg(options);
            const contentType = 'image/svg+xml';
            cache.set(cacheKey, { data: svg, contentType });
            return res.type(contentType).send(svg);
        }

        // Generate raster image (requires semaphore for concurrency control)
        await sema.acquire();
        try {
            const buffer = await renderRaster(options, format);
            const contentType = getContentType(format);
            cache.set(cacheKey, { data: buffer, contentType });
            res.type(contentType).send(buffer);
        } finally {
            sema.release();
        }
    } catch (err) {
        next(err);
    }
});

export default router;
