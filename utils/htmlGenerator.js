function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const htmlElements = [];
    const baseStyles = `
    /* Base Styles */
    body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        position: relative;
        font-family: Arial, sans-serif;
    }
    `;

    elements.forEach((element, index) => {
        const {
            id = `element-${index}`,
            label = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            children = []
        } = element;

        // Generate CSS class
        const className = `element-${label.toLowerCase().replace(/\s+/g, '-')}-${id}`;

        // Create CSS rule
        let cssRule = `.${className} {\n`;
        cssRule += `  position: absolute;\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;

        // Add custom styles
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                cssRule += `  ${cssProperty}: ${value};\n`;
            }
        });

        cssRule += `}`;
        cssRules.push(cssRule);

        // Generate HTML based on element type
        let elementHTML = '';
        switch (label.toLowerCase()) {
            case 'header':
                elementHTML = `<header class="${className}">${content || 'Header'}</header>`;
                break;
            case 'image':
                elementHTML = `<img class="${className}" src="${content || '#'}" alt="User content">`;
                break;
            case 'section':
                elementHTML = `<section class="${className}">${content || ''}</section>`;
                break;
            default:
                elementHTML = `<div class="${className}">${content || ''}</div>`;
        }

        htmlElements.push(elementHTML);
    });

    // Combine all CSS
    const css = `${baseStyles}\n${cssRules.join('\n')}`;

    // Generate HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <style>${css}</style>
</head>
<body>
    ${htmlElements.join('\n    ')}
</body>
</html>`;

    return { html, css };
}

module.exports = { generateHTMLAndCSS };