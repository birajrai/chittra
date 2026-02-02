/**
 * Google Fonts mapping
 * Maps font identifiers to Google Fonts CSS URLs
 */

const fonts = {
    // Sans-serif fonts
    lato: {
        url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
        family: 'Lato',
    },
    roboto: {
        url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
        family: 'Roboto',
    },
    opensans: {
        url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
        family: 'Open Sans',
    },
    montserrat: {
        url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap',
        family: 'Montserrat',
    },
    poppins: {
        url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap',
        family: 'Poppins',
    },
    raleway: {
        url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap',
        family: 'Raleway',
    },
    oswald: {
        url: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap',
        family: 'Oswald',
    },
    noto: {
        url: 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap',
        family: 'Noto Sans',
    },
    ptsans: {
        url: 'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap',
        family: 'PT Sans',
    },
    sourcesans: {
        url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;700&display=swap',
        family: 'Source Sans 3',
    },
    inter: {
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
        family: 'Inter',
    },

    // Serif fonts
    lora: {
        url: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap',
        family: 'Lora',
    },
    playfair: {
        url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap',
        family: 'Playfair Display',
    },
    merriweather: {
        url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
        family: 'Merriweather',
    },

    // Monospace fonts
    mono: {
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
        family: 'JetBrains Mono',
    },
    fira: {
        url: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap',
        family: 'Fira Code',
    },
};

/**
 * Get font configuration by name
 * @param {string} name - Font identifier
 * @returns {{ url: string, family: string }} Font configuration
 */
export function getFont(name) {
    const key = (name || 'lato').toLowerCase().replace(/[\s-]/g, '');
    return fonts[key] || fonts.lato;
}

/**
 * Get list of available font names
 * @returns {string[]} Array of font identifiers
 */
export function getAvailableFonts() {
    return Object.keys(fonts);
}

export default fonts;
