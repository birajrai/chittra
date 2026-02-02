/**
 * Raster image renderer using Sharp
 */

import sharp from 'sharp';
import generateSvg from './svg.js';

/**
 * Render SVG to raster format (PNG, WebP, JPEG, AVIF)
 * @param {Object} options - Image options
 * @param {string} format - Output format
 * @returns {Promise<Buffer>} Image buffer
 */
export default async function renderRaster(options, format) {
    const svg = generateSvg(options);
    const svgBuffer = Buffer.from(svg);

    let pipeline = sharp(svgBuffer, {
        density: 150, // Higher density for better quality
    });

    const hasTransparentBg = options.bg === 'transparent';

    switch (format) {
        case 'png':
            pipeline = pipeline.png({
                compressionLevel: 6,
                adaptiveFiltering: true,
            });
            break;

        case 'webp':
            pipeline = pipeline.webp({
                quality: 85,
                alphaQuality: 100,
                lossless: false,
            });
            break;

        case 'jpeg':
        case 'jpg':
            // JPEG doesn't support transparency, add white background
            if (hasTransparentBg) {
                pipeline = pipeline.flatten({ background: '#ffffff' });
            }
            pipeline = pipeline.jpeg({
                quality: 85,
                progressive: true,
            });
            break;

        case 'avif':
            pipeline = pipeline.avif({
                quality: 80,
                effort: 4,
            });
            break;

        default:
            pipeline = pipeline.png();
    }

    return pipeline.toBuffer();
}

/**
 * Get content type for format
 * @param {string} format - Image format
 * @returns {string} MIME type
 */
export function getContentType(format) {
    const types = {
        svg: 'image/svg+xml',
        png: 'image/png',
        webp: 'image/webp',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        avif: 'image/avif',
    };
    return types[format] || 'image/png';
}
