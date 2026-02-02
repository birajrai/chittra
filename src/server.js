/**
 * Chittra - Placeholder Image Generator
 * Main server module
 */

import express from 'express';
import { Sema } from 'async-sema';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import config from './config.js';
import cache from './cache.js';
import renderRaster, { getContentType } from './render.js';
import generateSvg from './svg.js';
import { parseSize, normalizeText, normalizeColor, parseFormat } from './utils.js';
import { getAvailableFonts } from './fonts.js';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temp directory setup
const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Semaphore for concurrency control
const sema = new Sema(config.CONCURRENCY);

/**
 * Save generated image to temp directory
 */
function saveToTemp(data, ext) {
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filepath = path.join(TMP_DIR, filename);
    fs.writeFileSync(filepath, data);
    return filepath;
}

/**
 * Cleanup old temp files
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

// Run cleanup on startup and periodically
cleanupTmpDir();
setInterval(cleanupTmpDir, config.CLEANUP_INTERVAL);

// Create Express app
const app = express();

// Trust proxy for proper IP detection behind reverse proxies
app.set('trust proxy', 1);

// Disable x-powered-by header
app.disable('x-powered-by');

/**
 * Homepage with documentation and interactive examples
 */
app.get('/', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fonts = getAvailableFonts();

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chittra - Placeholder Image Generator</title>
    <meta name="description" content="Generate placeholder images on-the-fly. Supports SVG, PNG, WebP, JPEG, AVIF formats with custom dimensions, colors, text, and fonts.">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23667' width='100' height='100' rx='12'/><text y='.9em' x='50%' text-anchor='middle' font-size='70' fill='white'>C</text></svg>">
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        :root {
            --bg: #f5f5f7;
            --card: #ffffff;
            --text: #1d1d1f;
            --muted: #6e6e73;
            --border: #d2d2d7;
            --primary: #0071e3;
            --code-bg: #f5f5f7;
            --success: #34c759;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 40px 24px;
        }
        header {
            text-align: center;
            margin-bottom: 48px;
        }
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0 0 12px;
            letter-spacing: -0.02em;
        }
        .subtitle {
            font-size: 1.25rem;
            color: var(--muted);
            margin: 0;
        }
        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 40px 0 20px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }
        .card {
            background: var(--card);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .url-pattern {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 1rem;
            background: var(--code-bg);
            padding: 16px 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 16px 0;
            border: 1px solid var(--border);
        }
        .examples-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 24px;
        }
        .example {
            background: var(--card);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .example-preview {
            background: #e5e5e5;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 180px;
        }
        .example-preview img {
            max-width: 100%;
            max-height: 150px;
            border-radius: 4px;
        }
        .example-info {
            padding: 16px;
        }
        .example-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.95rem;
        }
        .example-url {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .example-url code {
            flex: 1;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 0.8rem;
            background: var(--code-bg);
            padding: 8px 12px;
            border-radius: 6px;
            overflow-x: auto;
            white-space: nowrap;
            border: 1px solid var(--border);
        }
        .copy-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
            white-space: nowrap;
            transition: background 0.2s;
        }
        .copy-btn:hover {
            background: #0077ed;
        }
        .copy-btn.copied {
            background: var(--success);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 0.95rem;
        }
        th, td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid var(--border);
        }
        th {
            font-weight: 600;
            background: var(--code-bg);
        }
        code {
            font-family: 'SF Mono', Monaco, monospace;
            background: var(--code-bg);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
        }
        .font-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 16px 0;
        }
        .font-tag {
            background: var(--code-bg);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            border: 1px solid var(--border);
        }
        footer {
            text-align: center;
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
            color: var(--muted);
            font-size: 0.9rem;
        }
        footer a {
            color: var(--primary);
            text-decoration: none;
        }
        footer a:hover {
            text-decoration: underline;
        }
        .quick-start {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 32px;
        }
        .quick-start h2 {
            color: white;
            border: none;
            margin-top: 0;
        }
        .quick-start code {
            background: rgba(255,255,255,0.2);
            color: white;
        }
        .quick-start .url-pattern {
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
        }
        @media (max-width: 600px) {
            h1 { font-size: 1.8rem; }
            .container { padding: 24px 16px; }
            .examples-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Chittra</h1>
            <p class="subtitle">High-performance placeholder image generator</p>
        </header>

        <div class="quick-start">
            <h2>Quick Start</h2>
            <p>Generate a placeholder image by adding dimensions to the URL:</p>
            <div class="url-pattern">${baseUrl}/<strong>{width}x{height}</strong></div>
            <p>Example: <code>${baseUrl}/600x400</code> generates a 600x400 placeholder image.</p>
        </div>

        <div class="card">
            <h2>URL Pattern</h2>
            <div class="url-pattern">${baseUrl}/{size}/{background}/{textColor}/{format}?text={text}&amp;font={font}</div>
            
            <table>
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                        <th>Example</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>size</code></td>
                        <td>Image dimensions. Use <code>WxH</code> or single value for square. Add <code>@2x</code> for retina.</td>
                        <td><code>600x400</code>, <code>400</code>, <code>300@2x</code></td>
                    </tr>
                    <tr>
                        <td><code>background</code></td>
                        <td>Background color. Hex (without #), color name, or <code>transparent</code>.</td>
                        <td><code>ff5733</code>, <code>blue</code>, <code>transparent</code></td>
                    </tr>
                    <tr>
                        <td><code>textColor</code></td>
                        <td>Text color. Same format as background.</td>
                        <td><code>ffffff</code>, <code>white</code></td>
                    </tr>
                    <tr>
                        <td><code>format</code></td>
                        <td>Output format. Defaults to SVG.</td>
                        <td><code>svg</code>, <code>png</code>, <code>webp</code>, <code>jpeg</code>, <code>avif</code></td>
                    </tr>
                    <tr>
                        <td><code>text</code></td>
                        <td>Custom text (query param). Use <code>+</code> for spaces, <code>\\n</code> for newlines.</td>
                        <td><code>?text=Hello+World</code></td>
                    </tr>
                    <tr>
                        <td><code>font</code></td>
                        <td>Font family (query param).</td>
                        <td><code>?font=roboto</code></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <h2>Examples</h2>
        <p>Click "Copy" to copy the full URL to your clipboard.</p>

        <div class="examples-grid">
            <div class="example">
                <div class="example-preview">
                    <img src="/600x400" alt="Basic placeholder">
                </div>
                <div class="example-info">
                    <div class="example-title">Basic Placeholder</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/400" alt="Square placeholder">
                </div>
                <div class="example-info">
                    <div class="example-title">Square Image</div>
                    <div class="example-url">
                        <code>${baseUrl}/400</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/400')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400/3498db/ffffff" alt="Custom colors">
                </div>
                <div class="example-info">
                    <div class="example-title">Custom Colors</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400/3498db/ffffff</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400/3498db/ffffff')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400/png" alt="PNG format">
                </div>
                <div class="example-info">
                    <div class="example-title">PNG Format</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400/png</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400/png')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400?text=Hello+World" alt="Custom text">
                </div>
                <div class="example-info">
                    <div class="example-title">Custom Text</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400?text=Hello+World</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400?text=Hello+World')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400/2c3e50/ecf0f1?text=Dark+Theme&font=montserrat" alt="With font">
                </div>
                <div class="example-info">
                    <div class="example-title">Custom Font</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400/2c3e50/ecf0f1?font=montserrat</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400/2c3e50/ecf0f1?font=montserrat')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400@2x" alt="Retina" style="max-width: 150px;">
                </div>
                <div class="example-info">
                    <div class="example-title">Retina (2x Scale)</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400@2x</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400@2x')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview" style="background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 20px 20px;">
                    <img src="/600x400/transparent/333/png" alt="Transparent">
                </div>
                <div class="example-info">
                    <div class="example-title">Transparent Background</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400/transparent/333/png</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400/transparent/333/png')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400/e74c3c/fff/webp" alt="WebP format">
                </div>
                <div class="example-info">
                    <div class="example-title">WebP Format</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400/e74c3c/fff/webp</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400/e74c3c/fff/webp')">Copy</button>
                    </div>
                </div>
            </div>

            <div class="example">
                <div class="example-preview">
                    <img src="/600x400?text=Line+1\\nLine+2" alt="Multi-line">
                </div>
                <div class="example-info">
                    <div class="example-title">Multi-line Text</div>
                    <div class="example-url">
                        <code>${baseUrl}/600x400?text=Line+1\\nLine+2</code>
                        <button class="copy-btn" onclick="copyUrl(this, '${baseUrl}/600x400?text=Line+1\\\\nLine+2')">Copy</button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <h2>Available Fonts</h2>
            <p>Use the <code>font</code> query parameter to select a Google Font:</p>
            <div class="font-list">
                ${fonts.map(f => `<span class="font-tag">${f}</span>`).join('')}
            </div>
            <p>Example: <code>${baseUrl}/600x400?font=poppins</code></p>
        </div>

        <div class="card">
            <h2>HTML Usage</h2>
            <p>Simply use the URL as an image source:</p>
            <div class="url-pattern">&lt;img src="${baseUrl}/600x400" alt="Placeholder"&gt;</div>
            
            <p>For responsive images:</p>
            <div class="url-pattern">&lt;img src="${baseUrl}/600x400" srcset="${baseUrl}/600x400 1x, ${baseUrl}/600x400@2x 2x" alt="Placeholder"&gt;</div>

            <p>CSS background:</p>
            <div class="url-pattern">background-image: url('${baseUrl}/1920x1080/333/666');</div>
        </div>

        <div class="card">
            <h2>Supported Formats</h2>
            <table>
                <thead>
                    <tr>
                        <th>Format</th>
                        <th>Extension</th>
                        <th>Transparency</th>
                        <th>Best For</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>SVG</td>
                        <td><code>.svg</code> (default)</td>
                        <td>Yes</td>
                        <td>Scalable graphics, smallest size</td>
                    </tr>
                    <tr>
                        <td>PNG</td>
                        <td><code>.png</code> or <code>/png</code></td>
                        <td>Yes</td>
                        <td>Lossless, compatibility</td>
                    </tr>
                    <tr>
                        <td>WebP</td>
                        <td><code>.webp</code> or <code>/webp</code></td>
                        <td>Yes</td>
                        <td>Modern browsers, best compression</td>
                    </tr>
                    <tr>
                        <td>JPEG</td>
                        <td><code>.jpeg</code> or <code>/jpeg</code></td>
                        <td>No</td>
                        <td>Photos, legacy support</td>
                    </tr>
                    <tr>
                        <td>AVIF</td>
                        <td><code>.avif</code> or <code>/avif</code></td>
                        <td>Yes</td>
                        <td>Cutting-edge compression</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <footer>
            <p>
                <strong>Chittra</strong> - Open source placeholder image generator<br>
                <a href="https://github.com/birajrai/chittra" target="_blank">GitHub</a> |
                MIT License
            </p>
        </footer>
    </div>

    <script>
        function copyUrl(btn, url) {
            navigator.clipboard.writeText(url).then(() => {
                btn.textContent = 'Copied!';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Copy';
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
    </script>
</body>
</html>`);
});

/**
 * Image generation route
 * Pattern: /:size/:bg?/:color?/:format?
 */
app.get('/:size/:p2?/:p3?/:p4?', async (req, res) => {
    const cacheKey = req.originalUrl;

    // Check cache first
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('X-Cache', 'HIT');
        return res.send(cached);
    }

    try {
        const { size, p2, p3, p4 } = req.params;
        const { text, font } = req.query;

        // Parse dimensions
        const { width, height } = parseSize(size);

        // Determine format and colors based on path segments
        // Patterns supported:
        // /:size
        // /:size/:format
        // /:size/:bg/:color
        // /:size/:bg/:color/:format
        let bg = config.DEFAULT_BG;
        let color = config.DEFAULT_COLOR;
        let format = 'svg';

        const formats = config.SUPPORTED_FORMATS;

        if (p2 && formats.includes(p2.toLowerCase())) {
            // /:size/:format
            format = parseFormat(p2);
        } else if (p2) {
            // /:size/:bg/...
            bg = normalizeColor(p2, config.DEFAULT_BG);

            if (p3 && formats.includes(p3.toLowerCase())) {
                // /:size/:bg/:format
                format = parseFormat(p3);
            } else if (p3) {
                // /:size/:bg/:color/...
                color = normalizeColor(p3, config.DEFAULT_COLOR);

                if (p4) {
                    format = parseFormat(p4);
                }
            }
        }

        // Handle format in size string (e.g., 600x400.png)
        const sizeFormatMatch = size.match(/\.(svg|png|jpe?g|webp|avif)$/i);
        if (sizeFormatMatch) {
            format = parseFormat(sizeFormatMatch[1]);
        }

        // Normalize text
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
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('X-Cache', 'MISS');

        // SVG fast path (no concurrency limit needed)
        if (format === 'svg') {
            const svg = generateSvg(options);
            cache.set(cacheKey, svg);
            return res.type('image/svg+xml').send(svg);
        }

        // Raster rendering with concurrency control
        await sema.acquire();
        try {
            const buffer = await renderRaster(options, format);
            cache.set(cacheKey, buffer);
            res.type(getContentType(format)).send(buffer);
        } finally {
            sema.release();
        }
    } catch (err) {
        console.error('Error generating image:', err.message);
        res.status(400).json({
            error: 'Invalid request',
            message: 'Check your URL parameters and try again.',
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        cache: cache.stats(),
        uptime: process.uptime(),
    });
});

/**
 * Start server
 */
export function startServer() {
    app.listen(config.PORT, config.HOST, () => {
        console.log(`Chittra running on http://${config.HOST}:${config.PORT}`);
    });
}

export default app;
