function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const ids = [];

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

    /* Component-specific base styles */
    .drag-image {
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: pointer;
    }

    .dragnav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
    }

    .dragnav ul {
        display: flex;
        list-style: none;
        gap: 20px;
    }

    .drag-footer {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        padding: 40px;
    }

    .drag-footer ul {
        list-style: none;
    }

    .drag-card {
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .drag-button {
        padding: 10px 20px;
        border: none;
        cursor: pointer;
    }
    `;

    function convertStyles(styles) {
        const css = {};
        const propertyMap = {
            color: 'color',
            fontSize: 'font-size',
            fontWeight: 'font-weight',
            fontFamily: 'font-family',
            textAlign: 'text-align',
            backgroundColor: 'background-color',
            width: 'width',
            height: 'height',
            border: 'border',
            borderRadius: 'border-radius',
            padding: 'padding',
            margin: 'margin',
            opacity: 'opacity',
            zIndex: 'z-index'
        };

        for (const [key, value] of Object.entries(styles || {})) {
            const cssProperty = propertyMap[key] || key;
            
            // Handle numeric values
            if (typeof value === 'number') {
                if (['fontSize', 'borderRadius', 'width', 'height', 'padding', 'margin'].includes(key)) {
                    css[cssProperty] = `${value}px`;
                    continue;
                }
            }
            
            css[cssProperty] = value;
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
            imageUrl = null,
            imagePreview = null
        } = element;

        const className = `element-${id}`;
        const elementContent = content || customText || '';
        const imgSrc = imageUrl || imagePreview;

        // Generate CSS
        const convertedStyles = convertStyles(styles);
        let cssRule = `.${className} {\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;
        
        for (const [property, value] of Object.entries(convertedStyles)) {
            cssRule += `  ${property}: ${value};\n`;
        }

        cssRule += `}`;
        cssRules.push(cssRule);

        // Generate HTML based on component type
        switch (label.toLowerCase()) {
            case 'image':
                return `<div class="${className} drag-item drag-image">
                    ${imgSrc 
                        ? `<img src="${imgSrc}" alt="User content" onerror="this.onerror=null;this.style.display='none';this.parentElement.innerHTML='<span>Image failed to load</span>'">`
                        : '<span>Click to upload image</span>'}
                </div>`;

            case 'header':
                return `<div class="${className} drag-item">
                    <h1>${elementContent || 'Header'}</h1>
                </div>`;

            case 'text':
                return `<div class="${className} drag-item">
                    <p>${elementContent || 'Text content'}</p>
                </div>`;

            case 'button':
                return `<div class="${className} drag-item">
                    <button class="drag-button">${elementContent || 'Button'}</button>
                </div>`;

            case 'navbar':
                return `<div class="${className} drag-item dragnav">
                    <div class="draglogo">${elementContent || 'Logo'}</div>
                    <ul>
                        <li>Link 1</li>
                        <li>Link 2</li>
                        <li>Link 3</li>
                    </ul>
                </div>`;

            case 'footer':
                return `<footer class="${className} drag-item drag-footer">
                    <div>
                        <h4>Company</h4>
                        <ul>
                            <li>About</li>
                            <li>Careers</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Support</h4>
                        <ul>
                            <li>Contact</li>
                            <li>FAQ</li>
                        </ul>
                    </div>
                </footer>`;

            case 'card':
                return `<div class="${className} drag-item drag-card">
                    <p>${elementContent || 'Card content'}</p>
                </div>`;

            default:
                return `<div class="${className} drag-item">${elementContent || label}</div>`;
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
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="canvas-container">
        ${elements.map(el => processElement(el)).join('\n')}
    </div>
</body>
</html>`;

    return { html, css: `${baseStyles}\n${cssRules.join('\n')}` };
}

module.exports = { generateHTMLAndCSS };
