    function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // CSS Rules
    const cssRules = [];
    const htmlElements = [];

    elements.forEach((element, index) => {
        const safeElement = element || {};
        const {
        label = 'div',
        styles = {},
        position = { x: 0, y: 0 },
        imagePreview,
        customText,
        id = index
        } = safeElement;

        // Create CSS class
        const className = `element-${label.toLowerCase()}-${id}`;

        // Build CSS Rule
        let cssRule = `.${className} {\n`;
        cssRule += `  position: absolute;\n`;
        cssRule += `  left: ${position.x || 0}px;\n`;
        cssRule += `  top: ${position.y || 0}px;\n`;

        // Add custom styles
        Object.entries(styles).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            const cssProperty = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
            cssRule += `  ${cssProperty}: ${value};\n`;
        }
        });

        cssRule += `}\n`;
        cssRules.push(cssRule);

        // Generate HTML content based on element type
        let content = '';
        switch (label.toLowerCase()) {
        case 'header':
            content = `<h1>${customText || 'Header'}</h1>`;
            break;
        case 'image':
            content = imagePreview 
            ? `<img src="${imagePreview}" alt="User uploaded">`
            : '<div class="image-placeholder">Image</div>';
            break;
        // Add other cases as needed
        default:
            content = customText || label;
        }

        htmlElements.push(`<div class="${className}">${content}</div>`);
    });

    // Combine all CSS
    const css = `/* Generated CSS */\n${cssRules.join('\n')}\n\n/* Base Styles */\n
    body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    position: relative;
    font-family: Arial, sans-serif;
    }

    .image-placeholder {
    width: 200px;
    height: 200px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #ccc;
    }`;

    // Generate HTML document
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <link rel="stylesheet" href="styles.css">
    </head>
    <body>
    ${htmlElements.join('\n  ')}
    </body>
    </html>`;

    return { html, css };
    }

    module.exports = { generateHTMLAndCSS };