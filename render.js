const sharp = require('sharp');
const svgTemplate = require('./svg');

module.exports = async function renderRaster(opts, format) {
    const svg = svgTemplate(opts);
    return sharp(Buffer.from(svg)).toFormat(format).toBuffer();
};
