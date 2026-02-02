import sharp from 'sharp';
import svgTemplate from './svg.js';

export default async function renderRaster(opts, format) {
    const svg = svgTemplate(opts);
    return sharp(Buffer.from(svg)).toFormat(format).toBuffer();
}
