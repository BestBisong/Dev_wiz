function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const baseStyles = `
    /* Base Styles */
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    
    body {
        font-family: 'Open Sans', Arial, sans-serif;
        line-height: 1.5;
        min-height: 100vh;
        background-color: #f0f0f0;
        margin: 0;
        padding: 0;
    }

    .canvas-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        margin: 0 auto;
        overflow: auto;
    }

    /* Element base styles */
    .drag-item {
        position: absolute;
        padding: 8px;
        min-width: 50px;
        min-height: 30px;
        user-select: none;
    }

    /* Image specific styles */
    .drag-image {
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .drag-image img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    /* Text element styles */
    .drag-text {
        word-wrap: break-word;
        white-space: pre-wrap;
    }
    `;

    function processElement(element) {
        const {
            id,
            type = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            imageUrl = null
        } = element;

        const className = `element-${id}`;

        // Generate CSS
        let cssRule = `.${className} {\n`;
        cssRule += `  position: absolute;\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;
        
        // Convert all style properties to CSS
        if (styles) {
            Object.entries(styles).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    // Handle different style properties
                    switch (key) {
                        case 'fontSize':
                            cssRule += `  font-size: ${value}px;\n`;
                            break;
                        case 'width':
                            cssRule += `  width: ${value}px;\n`;
                            break;
                        case 'height':
                            cssRule += `  height: ${value}px;\n`;
                            break;
                        case 'color':
                        case 'backgroundColor':
                        case 'fontWeight':
                        case 'fontFamily':
                        case 'textAlign':
                        case 'border':
                        case 'borderRadius':
                        case 'padding':
                        case 'margin':
                            cssRule += `  ${key}: ${value};\n`;
                            break;
                        case 'zIndex':
                            cssRule += `  z-index: ${value};\n`;
                            break;
                        case 'opacity':
                            cssRule += `  opacity: ${value};\n`;
                            break;
                        // Add more cases as needed
                    }
                }
            });
        }

        cssRule += `}`;
        cssRules.push(cssRule);

        // Generate HTML
        switch (type.toLowerCase()) {
            case 'image':
                if (!imageUrl) {
                    return `<div class="${className} drag-item drag-image">
                        <span>Image missing</span>
                    </div>`;
                }
                return `<div class="${className} drag-item drag-image">
                    <img src="${imageUrl}" 
                         alt="User content" 
                         onerror="this.onerror=null;this.style.display='none';this.parentElement.innerHTML='<span>Image failed to load</span>'">
                </div>`;
            case 'text':
                return `<div class="${className} drag-item drag-text">${content}</div>`;
            default:
                return `<div class="${className} drag-item">${content}</div>`;
        }
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <style>
        ${baseStyles}
        ${cssRules.join('\n')}
    </style>
</head>
<body>
    <div class="canvas-container">
        ${elements.map(el => processElement(el)).join('\n')}
    </div>
</body>
</html>`;

    return { 
        html, 
        css: `${baseStyles}\n${cssRules.join('\n')}` 
    };
}

module.exports = { generateHTMLAndCSS };
