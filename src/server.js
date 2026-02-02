/**
 * Chittra - Placeholder Image Generator
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config.js';

// Middleware
import { corsMiddleware, errorHandler, notFoundHandler } from './middleware/index.js';

// Routes
import { healthRoutes, pageRoutes, imageRoutes } from './routes/index.js';

// Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const TMP_DIR = path.join(ROOT_DIR, 'tmp');

// Ensure tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

/**
 * Cleanup temporary directory
 * Removes files older than CLEANUP_MAX_AGE
 */
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

// Initial cleanup and schedule periodic cleanup
cleanupTmpDir();
setInterval(cleanupTmpDir, config.CLEANUP_INTERVAL);

// Create Express app
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT_DIR, 'views'));

// Security settings
app.set('trust proxy', 1);
app.disable('x-powered-by');

// =====================
// MIDDLEWARE
// =====================

// CORS - Allow all origins
app.use(corsMiddleware);

// =====================
// ROUTES
// =====================

// Health check (must be before other routes)
app.use(healthRoutes);

// Page routes (home, docs)
app.use(pageRoutes);

// Image generation routes (catch-all for image patterns)
app.use(imageRoutes);

// =====================
// ERROR HANDLING
// =====================

// 404 handler (for unmatched routes)
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =====================
// SERVER START
// =====================

export function startServer() {
    app.listen(config.PORT, config.HOST, () => {
        console.log(`Chittra running on http://${config.HOST}:${config.PORT}`);
    });
}

export default app;
