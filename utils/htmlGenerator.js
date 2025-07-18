function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const viewportWidth = 1440; // Your editor's base width for responsive calculations

    const baseStyles = `
    /* Base Reset */
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    /* Responsive Base */
    html {
        font-size: 16px;
    }

    body {
        font-family: 'Open Sans', Arial, sans-serif;
        line-height: 1.5;
        width: 100%;
        min-height: 100vh;
        position: relative;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    /* Canvas Container - Matches your editor */
    .canvas-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        margin: 0 auto;
        background-color: #f0f0f0;
    }

    /* Responsive Scaling */
    @media (max-width: ${viewportWidth}px) {
        html {
            font-size: calc(16 * (100vw / ${viewportWidth}));
        }
    }
    `;

    // Convert React styles to proper CSS with units
    function convertStyles(styles) {
        const css = {};
        if (!styles) return css;

        const unitProperties = [
            'width', 'height', 'fontSize', 
            'borderRadius', 'padding', 'margin',
            'borderWidth', 'lineHeight', 'letterSpacing'
        ];

        for (const [key, value] of Object.entries(styles)) {
            if (value === undefined || value === null) continue;

            // Convert camelCase to kebab-case
            const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();

            // Add units to numeric values
            if (typeof value === 'number' && unitProperties.includes(key)) {
                css[cssKey] = `${value}px`;
            } 
            // Handle special cases
            else if (key === 'fontFamily') {
                css[cssKey] = `"${value.replace(/"/g, '')}", Arial, sans-serif`;
            }
            else {
                css[cssKey] = value;
            }
        }

        return css;
    }

    function processElement(element) {
        const {
            id,
            label = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            customText = '',
            imageUrl = null
        } = element;

        const className = `element-${id}`;
        const elementContent = content || customText || '';
        const finalStyles = convertStyles(styles);

        // Generate CSS with responsive positioning
        let cssRule = `.${className} {\n`;
        cssRule += `  position: absolute;\n`;
        
        // Convert position to percentage for responsiveness
        cssRule += `  left: ${(position.x / viewportWidth) * 100}%;\n`;
        cssRule += `  top: ${position.y}px;\n`;
        cssRule += `  transform: translateX(-50%);\n`; // Center horizontally

        // Add all converted styles
        for (const [prop, value] of Object.entries(finalStyles)) {
            cssRule += `  ${prop}: ${value};\n`;
        }

        cssRule += `}\n`;

        // Media queries for different screen sizes
        cssRule += `@media (max-width: 768px) {
            .${className} {
                left: 50% !important;
                transform: translateX(-50%) !important;
                ${finalStyles.width ? `width: 90% !important;` : ''}
            }
        }`;

        cssRules.push(cssRule);

        // Generate HTML based on component type
        switch (label.toLowerCase()) {
            case 'image':
                return `<div class="${className} drag-item">
                    ${imageUrl 
                        ? `<img src="${imageUrl}" alt="Content" style="width:100%;height:100%;object-fit:cover;">`
                        : '<div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;">Image</div>'}
                </div>`;

            case 'header':
                return `<header class="${className} drag-item">
                    <h1 style="${finalStyles.fontFamily ? `font-family:${finalStyles.fontFamily}` : ''}">
                        ${elementContent || 'Header'}
                    </h1>
                </header>`;

            case 'text':
                return `<div class="${className} drag-item">
                    <p>${elementContent || 'Text content'}</p>
                </div>`;

            case 'button':
                return `<div class="${className} drag-item">
                    <button style="
                        ${finalStyles.backgroundColor ? `background:${finalStyles.backgroundColor};` : ''}
                        ${finalStyles.color ? `color:${finalStyles.color};` : ''}
                        padding: 8px 16px;
                        border: none;
                        cursor: pointer;
                    ">
                        ${elementContent || 'Button'}
                    </button>
                </div>`;

            // Add more component cases as needed
            default:
                return `<div class="${className} drag-item">
                    ${elementContent || label}
                </div>`;
        }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Designed Page</title>
    <style>
        ${baseStyles}
        ${cssRules.join('\n')}
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="canvas-container">
        ${elements.map(el => processElement(el)).join('\n')}
    </div>
</body>
</html>`;

    return { html };
}

module.exports = { generateHTMLAndCSS };
