# Chittra

High-performance placeholder image generator with support for multiple formats, custom colors, text, and Google Fonts.

## Features

- Multiple output formats: SVG (default), PNG, WebP, JPEG, AVIF
- Custom dimensions with retina support (@2x, @3x)
- Custom background and text colors
- Custom text with multi-line support
- 15+ Google Fonts
- In-memory LRU caching
- Concurrency control for raster generation
- Zero external API dependencies

## Installation

```bash
# Clone the repository
git clone https://github.com/birajrai/chittra.git
cd chittra

# Install dependencies
npm install

# Start the server
npm start
```

Or with Bun:

```bash
bun install
bun start
```

## Usage

### URL Pattern

```
http://localhost:3000/{size}/{background}/{textColor}/{format}?text={text}&font={font}
```

### Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `size` | Dimensions (WxH or single value for square). Add @2x for retina. | `600x400`, `400`, `300@2x` |
| `background` | Background color (hex without #, color name, or `transparent`) | `ff5733`, `blue`, `transparent` |
| `textColor` | Text color (same format as background) | `ffffff`, `white` |
| `format` | Output format | `svg`, `png`, `webp`, `jpeg`, `avif` |
| `text` | Custom text (query param). Use + for spaces, \n for newlines. | `?text=Hello+World` |
| `font` | Font family (query param) | `?font=roboto` |

### Examples

```
# Basic placeholder (600x400 SVG)
/600x400

# Square image
/400

# PNG format
/600x400/png

# Custom colors (blue background, white text)
/600x400/3498db/ffffff

# Custom colors with format
/600x400/000/fff/png

# Custom text
/600x400?text=Hello+World

# Custom font
/600x400?text=Welcome&font=poppins

# Retina (2x)
/600x400@2x

# Multi-line text
/600x400?text=Line+1\nLine+2

# Transparent background (PNG/WebP)
/600x400/transparent/333/png

# WebP format with colors
/600x400/e74c3c/fff/webp
```

### HTML Usage

```html
<!-- Basic image -->
<img src="https://your-domain.com/600x400" alt="Placeholder">

<!-- Responsive with retina -->
<img 
  src="https://your-domain.com/600x400" 
  srcset="https://your-domain.com/600x400 1x, https://your-domain.com/600x400@2x 2x" 
  alt="Placeholder"
>

<!-- CSS background -->
<style>
  .hero {
    background-image: url('https://your-domain.com/1920x1080/333/666');
  }
</style>
```

## Available Fonts

- **Sans-serif**: lato, roboto, opensans, montserrat, poppins, raleway, oswald, noto, ptsans, sourcesans, inter
- **Serif**: lora, playfair, merriweather
- **Monospace**: mono, fira

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `HOST` | 0.0.0.0 | Server host |
| `CHITTRA_MIN_SIZE` | 10 | Minimum image dimension |
| `CHITTRA_MAX_SIZE` | 4000 | Maximum image dimension |
| `CHITTRA_MAX_SCALE` | 4 | Maximum scale factor (@4x) |
| `CHITTRA_CACHE_TTL` | 3600000 | Cache TTL in ms (1 hour) |
| `CHITTRA_CACHE_MAX_ITEMS` | 1000 | Max cached items |
| `CHITTRA_CONCURRENCY` | 4 | Max concurrent raster renders |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Homepage with documentation |
| `GET /:size/...` | Generate placeholder image |
| `GET /health` | Health check with cache stats |

## Output Formats

| Format | Extension | Transparency | Best For |
|--------|-----------|--------------|----------|
| SVG | `.svg` (default) | Yes | Scalable graphics, smallest size |
| PNG | `/png` | Yes | Lossless, compatibility |
| WebP | `/webp` | Yes | Modern browsers, best compression |
| JPEG | `/jpeg` | No | Photos, legacy support |
| AVIF | `/avif` | Yes | Cutting-edge compression |

## Project Structure

```
chittra/
├── index.js           # Entry point
├── package.json       # Project configuration
├── src/
│   ├── server.js      # Express server and routes
│   ├── config.js      # Configuration
│   ├── cache.js       # LRU cache wrapper
│   ├── svg.js         # SVG template generator
│   ├── render.js      # Raster image renderer (Sharp)
│   ├── fonts.js       # Google Fonts mapping
│   └── utils.js       # Utility functions
└── tmp/               # Temporary file storage
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

[Biraj Rai](https://github.com/birajrai)
