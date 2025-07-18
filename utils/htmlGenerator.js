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
        font-family: 'Open-sans', Arial, sans-serif;
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
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* Add other component styles as needed */
    `;

    function processElement(element) {
        const {
            id,
            label = 'div',
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
        
        // Convert React style props to CSS
        const styleMap = {
            color: styles.color || '#000000',
            fontSize: styles.fontSize ? `${styles.fontSize}px` : '16px',
            fontWeight: styles.fontWeight || '400',
            fontFamily: styles.fontFamily || 'Open-sans, Arial, sans-serif',
            textAlign: styles.textAlign || 'left',
            backgroundColor: styles.backgroundColor || 'transparent',
            width: styles.width ? `${styles.width}px` : '200px',
            height: styles.height ? `${styles.height}px` : '200px',
            border: styles.border || 'none'
        };

        Object.entries(styleMap).forEach(([key, value]) => {
            if (value) {
                cssRule += `  ${key}: ${value};\n`;
            }
        });

        cssRule += `}`;
        cssRules.push(cssRule);

        // Generate HTML
        switch (label.toLowerCase()) {
            case 'image':
                if (!imageUrl) {
                    return `<div class="${className} drag-item drag-image">
                        <span>Image missing</span>
                    </div>`;
                }
                return `<div class="${className} drag-item drag-image">
                    <img src="${imageUrl}" 
                         alt="User content" 
                         style="width:100%;height:100%;object-fit:cover;"
                         onerror="this.onerror=null;this.style.display='none';this.parentElement.innerHTML+='<span>Image failed to load</span>'">
                </div>`;
            // Add other cases as needed
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

    return { html, css: `${baseStyles}\n${cssRules.join('\n')}` };
}

module.exports = { generateHTMLAndCSS };
