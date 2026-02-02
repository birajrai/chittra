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

const TMP_DIR = path.join(__dirname, '..', 'tmp');
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
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Health check - must be before the catch-all route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', cache: cache.stats(), uptime: process.uptime() });
});

// Homepage
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fonts = getAvailableFonts();

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chittra - Placeholder Image Generator</title>
    <meta name="description" content="Generate placeholder images on-the-fly with custom dimensions, colors, text, and fonts.">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%234f46e5' width='100' height='100' rx='20'/><text y='70' x='50%' text-anchor='middle' font-size='60' font-weight='bold' fill='white'>C</text></svg>">
</head>
<body class="bg-gray-50 text-gray-900 antialiased">
    <div class="max-w-4xl mx-auto px-4 py-12">
        
        <!-- Header -->
        <header class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-2">Chittra</h1>
            <p class="text-gray-500">Fast placeholder image generator</p>
        </header>

        <!-- Quick Start -->
        <section class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 class="text-lg font-semibold mb-4">Quick Start</h2>
            <div class="flex items-center gap-3 bg-gray-50 rounded-lg p-3 font-mono text-sm">
                <code class="flex-1 text-gray-700">${baseUrl}/<span class="text-indigo-600 font-semibold">{width}x{height}</span></code>
                <button onclick="copy('${baseUrl}/600x400')" class="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition">Copy</button>
            </div>
        </section>

        <!-- Examples -->
        <section class="mb-8">
            <h2 class="text-lg font-semibold mb-4">Examples</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 p-4 flex items-center justify-center h-32">
                        <img src="${baseUrl}/200x120" alt="Basic" class="max-h-full rounded">
                    </div>
                    <div class="p-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500 mb-2">Basic</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-gray-50 px-2 py-1 rounded truncate">/600x400</code>
                            <button onclick="copy('${baseUrl}/600x400')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Copy</button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 p-4 flex items-center justify-center h-32">
                        <img src="${baseUrl}/120" alt="Square" class="max-h-full rounded">
                    </div>
                    <div class="p-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500 mb-2">Square</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-gray-50 px-2 py-1 rounded truncate">/400</code>
                            <button onclick="copy('${baseUrl}/400')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Copy</button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 p-4 flex items-center justify-center h-32">
                        <img src="${baseUrl}/200x120/3b82f6/ffffff" alt="Custom Colors" class="max-h-full rounded">
                    </div>
                    <div class="p-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500 mb-2">Custom Colors</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-gray-50 px-2 py-1 rounded truncate">/600x400/3b82f6/fff</code>
                            <button onclick="copy('${baseUrl}/600x400/3b82f6/ffffff')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Copy</button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 p-4 flex items-center justify-center h-32">
                        <img src="${baseUrl}/200x120?text=Hello" alt="Custom Text" class="max-h-full rounded">
                    </div>
                    <div class="p-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500 mb-2">Custom Text</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-gray-50 px-2 py-1 rounded truncate">/600x400?text=Hello</code>
                            <button onclick="copy('${baseUrl}/600x400?text=Hello')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Copy</button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 p-4 flex items-center justify-center h-32">
                        <img src="${baseUrl}/200x120/png" alt="PNG" class="max-h-full rounded">
                    </div>
                    <div class="p-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500 mb-2">PNG Format</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-gray-50 px-2 py-1 rounded truncate">/600x400/png</code>
                            <button onclick="copy('${baseUrl}/600x400/png')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Copy</button>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div class="bg-gray-100 p-4 flex items-center justify-center h-32">
                        <img src="${baseUrl}/200x120/1f2937/f3f4f6?font=poppins" alt="Font" class="max-h-full rounded">
                    </div>
                    <div class="p-3 border-t border-gray-100">
                        <p class="text-xs text-gray-500 mb-2">Custom Font</p>
                        <div class="flex items-center gap-2">
                            <code class="flex-1 text-xs bg-gray-50 px-2 py-1 rounded truncate">/600x400?font=poppins</code>
                            <button onclick="copy('${baseUrl}/600x400?font=poppins')" class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Copy</button>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        <!-- URL Pattern -->
        <section class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 class="text-lg font-semibold mb-4">URL Pattern</h2>
            <code class="block bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-6 overflow-x-auto">/${"{size}"}/{"{bg}"}/{"{color}"}/{"{format}"}?text={"{text}"}&font={"{font}"}</code>
            
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-2 pr-4 font-medium text-gray-900">Parameter</th>
                            <th class="text-left py-2 pr-4 font-medium text-gray-900">Description</th>
                            <th class="text-left py-2 font-medium text-gray-900">Example</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-600">
                        <tr class="border-b border-gray-100">
                            <td class="py-2 pr-4"><code class="text-indigo-600">size</code></td>
                            <td class="py-2 pr-4">Dimensions (WxH or single for square). Add @2x for retina.</td>
                            <td class="py-2"><code>600x400</code>, <code>400</code>, <code>300@2x</code></td>
                        </tr>
                        <tr class="border-b border-gray-100">
                            <td class="py-2 pr-4"><code class="text-indigo-600">bg</code></td>
                            <td class="py-2 pr-4">Background color (hex without #, name, or transparent)</td>
                            <td class="py-2"><code>3b82f6</code>, <code>blue</code>, <code>transparent</code></td>
                        </tr>
                        <tr class="border-b border-gray-100">
                            <td class="py-2 pr-4"><code class="text-indigo-600">color</code></td>
                            <td class="py-2 pr-4">Text color</td>
                            <td class="py-2"><code>ffffff</code>, <code>white</code></td>
                        </tr>
                        <tr class="border-b border-gray-100">
                            <td class="py-2 pr-4"><code class="text-indigo-600">format</code></td>
                            <td class="py-2 pr-4">Output format (default: svg)</td>
                            <td class="py-2"><code>svg</code>, <code>png</code>, <code>webp</code>, <code>jpeg</code>, <code>avif</code></td>
                        </tr>
                        <tr class="border-b border-gray-100">
                            <td class="py-2 pr-4"><code class="text-indigo-600">text</code></td>
                            <td class="py-2 pr-4">Custom text (query param)</td>
                            <td class="py-2"><code>?text=Hello+World</code></td>
                        </tr>
                        <tr>
                            <td class="py-2 pr-4"><code class="text-indigo-600">font</code></td>
                            <td class="py-2 pr-4">Font family (query param)</td>
                            <td class="py-2"><code>?font=roboto</code></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <!-- Fonts -->
        <section class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 class="text-lg font-semibold mb-4">Available Fonts</h2>
            <div class="flex flex-wrap gap-2">
                ${fonts.map(f => `<span class="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">${f}</span>`).join('')}
            </div>
        </section>

        <!-- Usage -->
        <section class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 class="text-lg font-semibold mb-4">Usage</h2>
            
            <div class="space-y-4">
                <div>
                    <p class="text-sm text-gray-500 mb-2">HTML</p>
                    <code class="block bg-gray-50 rounded-lg p-3 text-sm text-gray-700 overflow-x-auto">&lt;img src="${baseUrl}/600x400" alt="Placeholder"&gt;</code>
                </div>
                
                <div>
                    <p class="text-sm text-gray-500 mb-2">Retina Support</p>
                    <code class="block bg-gray-50 rounded-lg p-3 text-sm text-gray-700 overflow-x-auto">&lt;img src="${baseUrl}/600x400" srcset="${baseUrl}/600x400@2x 2x"&gt;</code>
                </div>
                
                <div>
                    <p class="text-sm text-gray-500 mb-2">CSS Background</p>
                    <code class="block bg-gray-50 rounded-lg p-3 text-sm text-gray-700 overflow-x-auto">background-image: url('${baseUrl}/1920x1080');</code>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="text-center text-sm text-gray-400">
            <a href="https://github.com/birajrai/chittra" class="text-indigo-600 hover:underline">GitHub</a>
            <span class="mx-2">-</span>
            <span>MIT License</span>
        </footer>

    </div>

    <script>
        function copy(text) {
            navigator.clipboard.writeText(text);
        }
    </script>
</body>
</html>`);
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
