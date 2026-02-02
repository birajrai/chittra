import fonts from './fonts.js';

export default function svgTemplate({ width, height, bg, color, text, font }) {
    const fontUrl = fonts[font] || fonts.lato;
    const fontSize = Math.min(width, height) / 6;

    return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <style>
    @import url('${fontUrl}');
    text {
      font-family: '${font}', sans-serif;
      font-size: ${fontSize}px;
      fill: ${color};
      white-space: pre;
    }
  </style>
  <rect width="100%" height="100%" fill="${bg}" />
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">
    ${text}
  </text>
</svg>
`;
}
