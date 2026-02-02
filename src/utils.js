import config from './config.js';

/**
 * Clamp a number between min and max values
 * @param {number} n - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(n, min = config.MIN_SIZE, max = config.MAX_SIZE) {
    return Math.max(min, Math.min(max, n));
}

/**
 * Parse size string into width, height, and scale
 * Supports formats: "400", "600x400", "600x400@2x"
 * @param {string} input - Size string
 * @returns {{ width: number, height: number, scale: number }}
 */
export function parseSize(input) {
    if (!input || typeof input !== 'string') {
        return { width: 400, height: 400, scale: 1 };
    }

    let size = input.trim();
    let scale = 1;

    // Extract scale modifier (@2x, @3x, etc.)
    const scaleMatch = size.match(/@(\d+(?:\.\d+)?)x?$/i);
    if (scaleMatch) {
        scale = Math.min(parseFloat(scaleMatch[1]) || 1, config.MAX_SCALE);
        size = size.replace(/@\d+(?:\.\d+)?x?$/i, '');
    }

    // Remove format extension if present (.png, .jpg, etc.)
    size = size.replace(/\.(svg|png|jpe?g|webp|avif)$/i, '');

    // Parse dimensions
    const parts = size.split(/[x×]/i).map(s => parseInt(s, 10));
    let width = parts[0] || 400;
    let height = parts[1] || width;

    // Apply scale and clamp
    width = clamp(Math.round(width * scale));
    height = clamp(Math.round(height * scale));

    return { width, height, scale };
}

/**
 * Normalize and sanitize text for SVG display
 * @param {string} text - Input text
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Normalized text
 */
export function normalizeText(text, width, height) {
    if (!text) {
        return `${width} x ${height}`;
    }

    return text
        .replace(/\\n/g, '\n')
        .trim()
        .slice(0, 200); // Limit text length
}

/**
 * Escape HTML/XML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Validate and normalize color value
 * Supports: hex (3, 4, 6, 8 digits), named colors, rgb/rgba, transparent
 * @param {string} color - Color input
 * @param {string} fallback - Fallback color
 * @returns {string} Normalized color
 */
export function normalizeColor(color, fallback = '#555555') {
    if (!color || typeof color !== 'string') {
        return fallback;
    }

    const c = color.trim().toLowerCase();

    // Handle 'transparent' keyword
    if (c === 'transparent') {
        return 'transparent';
    }

    // Named CSS colors (common ones)
    const namedColors = [
        'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
        'pink', 'cyan', 'magenta', 'gray', 'grey', 'silver', 'maroon', 'olive',
        'lime', 'aqua', 'teal', 'navy', 'fuchsia', 'brown', 'coral', 'crimson',
        'gold', 'indigo', 'ivory', 'khaki', 'lavender', 'lightblue', 'lightgray',
        'lightgreen', 'lightyellow', 'darkblue', 'darkgray', 'darkgreen', 'darkred',
    ];

    if (namedColors.includes(c)) {
        return c;
    }

    // Hex color validation (3, 4, 6, or 8 digits)
    const hexMatch = c.match(/^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
    if (hexMatch) {
        return `#${hexMatch[1]}`;
    }

    // RGB/RGBA validation
    const rgbMatch = c.match(/^rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (rgbMatch) {
        const [, r, g, b, a] = rgbMatch;
        if (parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255) {
            if (a !== undefined) {
                return `rgba(${r},${g},${b},${a})`;
            }
            return `rgb(${r},${g},${b})`;
        }
    }

    return fallback;
}

/**
 * Parse format from path segment or extension
 * DRY: Uses config.FORMAT_ALIASES as single source of truth
 * @param {string} input - Format string (may include extension)
 * @returns {string} Normalized format
 */
export function parseFormat(input) {
    if (!input) return 'svg';

    const format = input.toLowerCase().replace(/^\./, '');

    return config.FORMAT_ALIASES[format] || 'svg';
}

/**
 * Get content type for format
 * DRY: Uses config.FORMAT_MIME_TYPES as single source of truth
 * @param {string} format - Image format
 * @returns {string} MIME type
 */
export function getContentType(format) {
    return config.FORMAT_MIME_TYPES[format] || 'image/png';
}

/**
 * Get base URL from request
 * @param {Request} req - Express request object
 * @returns {string} Base URL (protocol + host)
 */
export function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
}
