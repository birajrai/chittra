/**
 * Chittra Configuration
 * All settings can be overridden via environment variables
 */

const config = {
    // Server
    PORT: parseInt(process.env.PORT || process.env.CHITTRA_PORT, 10) || 3000,
    HOST: process.env.HOST || process.env.CHITTRA_HOST || '0.0.0.0',

    // Image constraints
    MIN_SIZE: parseInt(process.env.CHITTRA_MIN_SIZE, 10) || 10,
    MAX_SIZE: parseInt(process.env.CHITTRA_MAX_SIZE, 10) || 4000,
    MAX_SCALE: parseInt(process.env.CHITTRA_MAX_SCALE, 10) || 4,

    // Cache settings
    CACHE_TTL: parseInt(process.env.CHITTRA_CACHE_TTL, 10) || 1000 * 60 * 60, // 1 hour
    CACHE_MAX_ITEMS: parseInt(process.env.CHITTRA_CACHE_MAX_ITEMS, 10) || 1000,

    // Performance
    CONCURRENCY: parseInt(process.env.CHITTRA_CONCURRENCY, 10) || 4,

    // Temp file cleanup interval (ms)
    CLEANUP_INTERVAL: parseInt(process.env.CHITTRA_CLEANUP_INTERVAL, 10) || 1000 * 60 * 60, // 1 hour
    CLEANUP_MAX_AGE: parseInt(process.env.CHITTRA_CLEANUP_MAX_AGE, 10) || 1000 * 60 * 60 * 24, // 24 hours

    // Defaults
    DEFAULT_BG: '#eeeeee',
    DEFAULT_COLOR: '#555555',
    DEFAULT_FONT: 'lato',

    // Supported formats
    SUPPORTED_FORMATS: ['svg', 'png', 'webp', 'jpeg', 'jpg', 'avif'],

    // Format to MIME type mapping (DRY: single source of truth)
    FORMAT_MIME_TYPES: {
        svg: 'image/svg+xml',
        png: 'image/png',
        webp: 'image/webp',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        avif: 'image/avif',
    },

    // Format aliases (normalize jpg -> jpeg, etc.)
    FORMAT_ALIASES: {
        jpg: 'jpeg',
        jpeg: 'jpeg',
        png: 'png',
        webp: 'webp',
        avif: 'avif',
        svg: 'svg',
    },
};

export default config;
