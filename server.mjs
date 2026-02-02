import express from 'express';
import { Sema } from 'async-sema';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import config from './config.js';
import cache from './cache.js';
import renderRaster from './render.js';
import svgTemplate from './svg.js';
import { parseSize, normalizeText } from './utils.js';

let __dirname = path.dirname(new URL(import.meta.url).pathname);
if (process.platform === 'win32' && __dirname.startsWith('/')) {
    __dirname = __dirname.slice(1);
}
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR);
}

function saveToTemp(data, ext) {
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filepath = path.join(TMP_DIR, filename);
    fs.writeFileSync(filepath, data);
    return filepath;
}

function cleanupTmpDir() {
    const now = Date.now();
    const cutoff = now - 24 * 60 * 60 * 1000;
    fs.readdir(TMP_DIR, (err, files) => {
        if (err) return;
        files.forEach(file => {
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
setInterval(cleanupTmpDir, 24 * 60 * 60 * 1000);

const app = express();
const sema = new Sema(config.CONCURRENCY);

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chittra Image Generator Preview</title>
        <style>
            body { font-family: system-ui, sans-serif; background: #f8f8f8; margin: 0; padding: 0; }
            .container { max-width: 900px; margin: 40px auto; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px #0001; padding: 32px; }
            h1 { margin-top: 0; }
            .examples { display: flex; flex-wrap: wrap; gap: 24px; }
            .example { background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 16px; flex: 1 1 250px; min-width: 220px; }
            .example img { display: block; margin: 0 auto 8px; max-width: 100%; border-radius: 4px; box-shadow: 0 1px 4px #0002; }
            code { background: #f3f3f3; padding: 2px 6px; border-radius: 4px; font-size: 0.95em; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Chittra Image Generator</h1>
            <p>Generate placeholder images on the fly. Try these examples:</p>
            <div class="examples">
                <div class="example">
                    <img src="/600x400" alt="600x400" />
                    <div><code>/600x400</code></div>
                </div>
                <div class="example">
                    <img src="/400" alt="400" />
                    <div><code>/400</code></div>
                </div>
                <div class="example">
                    <img src="/600x400/png" alt="600x400/png" />
                    <div><code>/600x400/png</code></div>
                </div>
                <div class="example">
                    <img src="/600x400/000/fff.png" alt="/600x400/000/fff.png" />
                    <div><code>/600x400/000/fff.png</code></div>
                </div>
                <div class="example">
                    <img src="/800?text=Hello+World" alt="/800?text=Hello+World" />
                    <div><code>/800?text=Hello+World</code></div>
                </div>
                <div class="example">
                    <img src="/600x400@2x.png" alt="/600x400@2x.png" />
                    <div><code>/600x400@2x.png</code></div>
                </div>
                <div class="example">
                    <img src="/600x400?text=Hello%5CnWorld&font=roboto" alt="/600x400?text=Hello\nWorld&font=roboto" />
                    <div><code>/600x400?text=Hello\nWorld&amp;font=roboto</code></div>
                </div>
                <div class="example">
                    <img src="/600x400/transparent/red/webp" alt="/600x400/transparent/red/webp" />
                    <div><code>/600x400/transparent/red/webp</code></div>
                </div>
            </div>
            <p style="margin-top:32px;color:#888;font-size:0.95em;">See <code>README.md</code> for more usage options.</p>
        </div>
    </body>
    </html>
    `);
});

app.get('/:size/:bg?/:color?/:format?', async (req, res) => {
    const key = req.originalUrl;

    if (cache.has(key)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(cache.get(key));
    }

    try {
        const { size, bg = '#eee', color = '#555', format } = req.params;
        const { text, font = 'lato' } = req.query;

        const { width, height } = parseSize(size);
        const label = normalizeText(text, width, height);

        const options = {
            width,
            height,
            bg: bg.toLowerCase(),
            color: color.toLowerCase(),
            text: label,
            font: font.toLowerCase(),
        };

        res.set('Cache-Control', 'public, max-age=31536000, immutable');

        // SVG FAST PATH
        if (!format || format === 'svg') {
            const svg = svgTemplate(options);
            cache.set(key, svg);
            saveToTemp(svg, 'svg');
            return res.type('image/svg+xml').send(svg);
        }

        // RASTER PATH
        await sema.acquire();
        try {
            const buffer = await renderRaster(options, format);
            cache.set(key, buffer);
            saveToTemp(buffer, format);
            res.type(`image/${format}`).send(buffer);
        } finally {
            sema.release();
        }
    } catch {
        res.status(400).send('Invalid Chittra request');
    }
});

app.listen(config.PORT, () => {
    console.log(`🎨 Chittra running on http://localhost:${config.PORT}`);
});
