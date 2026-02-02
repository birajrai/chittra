const express = require('express');
const sharp = require('sharp');
const fonts = require('./fonts');

const app = express();
const PORT = 3000;

const MIN = 10;
const MAX = 4000;

function clamp(n) {
  return Math.max(MIN, Math.min(MAX, n));
}

function parseSize(raw) {
  let scale = 1;

  if (raw.includes('@')) {
    const parts = raw.split('@');
    raw = parts[0];
    scale = Number(parts[1].replace('x', '')) || 1;
  }

  let [w, h] = raw.split('x').map(Number);
  if (!h) h = w;

  return {
    width: clamp(w * scale),
    height: clamp(h * scale),
    scale
  };
}

function svgTemplate({ width, height, bg, color, text, font }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    @import url('${fonts[font] || fonts.lato}');
    text {
      font-family: '${font}', sans-serif;
      font-size: ${Math.min(width, height) / 6}px;
      fill: ${color};
    }
  </style>
  <rect width="100%" height="100%" fill="${bg}" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">
    ${text}
  </text>
</svg>
`;
}

app.get('/:size/:bg?/:color?/:format?', async (req, res) => {
  try {
    const { size, bg = '#eee', color = '#555', format } = req.params;
    const { text, font = 'lato' } = req.query;

    const { width, height } = parseSize(size);
    const label = (text || `${width}x${height}`).replace(/\\n/g, '\n');

    const svg = svgTemplate({
      width,
      height,
      bg,
      color,
      text: label,
      font
    });

    if (!format || format === 'svg') {
      res.type('image/svg+xml').send(svg);
      return;
    }

    const buffer = await sharp(Buffer.from(svg))
      .toFormat(format)
      .toBuffer();

    res.type(`image/${format}`).send(buffer);
  } catch (err) {
    res.status(400).send('Invalid placeholder request');
  }
});

app.listen(PORT, () => {
  console.log(`Placeholder service running on http://localhost:${PORT}`);
});
