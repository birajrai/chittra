/**
 * Chittra - Placeholder Image Generator
 */

import express from 'express';
import { Sema } from 'async-sema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';
import cache from './cache.js';
import renderRaster, { getContentType } from './render.js';
import generateSvg from './svg.js';
import { parseSize, normalizeText, normalizeColor, parseFormat } from './utils.js';
import { getAvailableFonts } from './fonts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const TMP_DIR = path.join(ROOT_DIR, 'tmp');
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

const sema = new Sema(config.CONCURRENCY);

function cleanupTmpDir() {
    const cutoff = Date.now() - config.CLEANUP_MAX_AGE;
    fs.readdir(TMP_DIR, (err, files) => {
        if (err) return;
        files.forEach(file => {
            if (file === '.gitkeep') return;
            const filePath = path.join(TMP_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) return;
                if (stats.mtimeMs < cutoff) {
                    fs.unlink(filePath, () => {});
                }
            });
        });
    });
}

cleanupTmpDir();
setInterval(cleanupTmpDir, config.CLEANUP_INTERVAL);

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT_DIR, 'views'));

app.set('trust proxy', 1);
app.disable('x-powered-by');

// Helper to get base URL
function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', cache: cache.stats(), uptime: process.uptime() });
});

// Documentation page
app.get('/docs', (req, res) => {
    res.render('docs', {
        baseUrl: getBaseUrl(req),
        fonts: getAvailableFonts(),
        config
    });
});

// Homepage
app.get('/', (req, res) => {
    res.render('home', {
        baseUrl: getBaseUrl(req)
    });
});

// Image generation route
app.get('/:size/:p2?/:p3?/:p4?', async (req, res) => {
    const cacheKey = req.originalUrl;

    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('X-Cache', 'HIT');
        return res.send(cached);
    }

    try {
        const { size, p2, p3, p4 } = req.params;
        const { text, font } = req.query;

        const { width, height } = parseSize(size);

        let bg = config.DEFAULT_BG;
        let color = config.DEFAULT_COLOR;
        let format = 'svg';

        const formats = config.SUPPORTED_FORMATS;

        if (p2 && formats.includes(p2.toLowerCase())) {
            format = parseFormat(p2);
        } else if (p2) {
            bg = normalizeColor(p2, config.DEFAULT_BG);

            if (p3 && formats.includes(p3.toLowerCase())) {
                format = parseFormat(p3);
            } else if (p3) {
                color = normalizeColor(p3, config.DEFAULT_COLOR);

                if (p4) {
                    format = parseFormat(p4);
                }
            }
        }

        const sizeFormatMatch = size.match(/\.(svg|png|jpe?g|webp|avif)$/i);
        if (sizeFormatMatch) {
            format = parseFormat(sizeFormatMatch[1]);
        }

        const label = normalizeText(text, width, height);

        const options = {
            width,
            height,
            bg,
            color,
            text: label,
            font: font || config.DEFAULT_FONT,
        };

        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('X-Cache', 'MISS');

        if (format === 'svg') {
            const svg = generateSvg(options);
            cache.set(cacheKey, svg);
            return res.type('image/svg+xml').send(svg);
        }

        await sema.acquire();
        try {
            const buffer = await renderRaster(options, format);
            cache.set(cacheKey, buffer);
            res.type(getContentType(format)).send(buffer);
        } finally {
            sema.release();
        }
    } catch (err) {
        console.error('Error:', err.message);
        res.status(400).json({ error: 'Invalid request' });
    }
});

export function startServer() {
    app.listen(config.PORT, config.HOST, () => {
        console.log(`Chittra running on http://${config.HOST}:${config.PORT}`);
    });
}

export default app;
