import config from './config.js';

function clamp(n) {
    return Math.max(config.MIN_SIZE, Math.min(config.MAX_SIZE, n));
}

function parseSize(input) {
    let scale = 1;
    if (input.includes('@')) {
        const [base, s] = input.split('@');
        input = base;
        scale = Number(s.replace('x', '')) || 1;
    }
    let [w, h] = input.split('x').map(Number);
    if (!h) h = w;
    return {
        width: clamp(w * scale),
        height: clamp(h * scale),
        scale,
    };
}

function normalizeText(text, w, h) {
    return (text || `${w}x${h}`).replace(/\\n/g, '\n').trim();
}

export { clamp, parseSize, normalizeText };
