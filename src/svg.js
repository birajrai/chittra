import { getFont } from './fonts.js';
import { escapeXml } from './utils.js';

/**
 * Generate SVG placeholder image
 * @param {Object} options - SVG options
 * @param {number} options.width - Image width
 * @param {number} options.height - Image height
 * @param {string} options.bg - Background color
 * @param {string} options.color - Text color
 * @param {string} options.text - Display text
 * @param {string} options.font - Font identifier
 * @returns {string} SVG markup
 */
export default function generateSvg({ width, height, bg, color, text, font }) {
    const fontConfig = getFont(font);
    const fontSize = Math.max(12, Math.min(width, height) / 8);
    const safeText = escapeXml(text);

    // Handle multi-line text
    const lines = safeText.split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const startY = (height - totalHeight) / 2 + fontSize * 0.35;

    const textElements = lines
        .map((line, i) => {
            const y = startY + i * lineHeight;
            return `<tspan x="50%" dy="${i === 0 ? 0 : lineHeight}">${line}</tspan>`;
        })
        .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      @import url('${fontConfig.url}');
      .text {
        font-family: '${fontConfig.family}', system-ui, sans-serif;
        font-size: ${fontSize}px;
        font-weight: 400;
        fill: ${color};
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="${bg}"/>
  <text class="text" x="50%" y="${startY}" text-anchor="middle" dominant-baseline="middle">
    ${textElements || safeText}
  </text>
</svg>`;
}
