function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const ids = []; // Collect IDs here

    const baseStyles = `
    /* Base Styles */
    body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        position: relative;
        font-family: Arial, sans-serif;
    }

    .canvas-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow: auto;
        background: #f0f0f0;
    }

    .canvas-container img {
        max-width: 100%;
        height: auto;
        display: block;
    }
    `;

    function processElement(element, index) {
        const {
            id = `element-${index}`,
            label = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            children = []
        } = element;

        ids.push(id); // Collect the ID

        // Generate a unique CSS class
        const className = `element-${label.toLowerCase().replace(/\s+/g, '-')}-${id}`;

        // Create CSS rule
        let cssRule = `.${className} {\n`;
        cssRule += `  position: absolute;\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;

        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                cssRule += `  ${cssProperty}: ${value};\n`;
            }
        });

        cssRule += `}`;

        cssRules.push(cssRule);

        // Process children recursively
        let childHTML = '';
        if (Array.isArray(children) && children.length > 0) {
            childHTML = children.map((child, idx) => processElement(child, idx)).join('\n');
        }

        // Generate HTML for the element, including children if any
        let elementHTML = '';
        switch (label.toLowerCase()) {
            case 'header':
                elementHTML = `<header class="${className}">${content || 'Header'}\n${childHTML}</header>`;
                break;
            case 'image':
                elementHTML = `<img class="${className}" src="${content || '#'}" alt="User Image">`;
                break;
            case 'section':
                elementHTML = `<section class="${className}">${content || ''}\n${childHTML}</section>`;
                break;
            default:
                elementHTML = `<div class="${className}">${content || ''}\n${childHTML}</div>`;
        }

        return elementHTML;
    }

    // Generate HTML for all top-level elements
    const htmlElements = elements.map((el, idx) => processElement(el, idx));

    const css = `${baseStyles}\n${cssRules.join('\n')}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
    <div class="canvas-container">
        ${htmlElements.join('\n        ')}
    </div>
</body>
</html>`;

    return { html, css, ids };
}

module.exports = { generateHTMLAndCSS };
