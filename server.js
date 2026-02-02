const express = require('express');
const { Sema } = require('async-sema');

const config = require('./config');
const cache = require('./cache');
const renderRaster = require('./render');
const svgTemplate = require('./svg');
const { parseSize, normalizeText } = require('./utils');

const app = express();
const sema = new Sema(config.CONCURRENCY);

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
            return res.type('image/svg+xml').send(svg);
        }

        // RASTER PATH
        await sema.acquire();
        try {
            const buffer = await renderRaster(options, format);
            cache.set(key, buffer);
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
