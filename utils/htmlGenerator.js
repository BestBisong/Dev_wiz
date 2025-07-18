function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // Canvas dimensions
    const editorWidth = 1440;
    const editorHeight = 900;

    // Base CSS styles
    const baseStyles = `
    /* Reset & Base Styles */
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body, html {
        width: 100%;
        height: 100%;
        font-family: 'Open Sans', Arial, sans-serif;
        background-color: #f0f0f0;
    }

    .canvas-container {
        position: relative;
        width: ${editorWidth}px;
        min-height: ${editorHeight}px;
        margin: 0 auto;
        background-color: #f0f0f0;
        overflow: visible;
    }

    .canvas-element {
        position: absolute;
        user-select: none;
    }

    .drag-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .drag-text {
        word-wrap: break-word;
        white-space: pre-wrap;
    }

    @media print {
        body * {
            visibility: hidden;
        }
        .canvas-container, .canvas-container * {
            visibility: visible;
        }
        .canvas-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
        }
    }
    `;

    const cssRules = [];

    function processElement(element) {
        const {
            id,
            label,
            type = 'div', // fallback type if label is missing
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            customText = '',
            imageUrl = null
        } = element;

        const elementId = `element-${id}`;
        const className = `canvas-element ${elementId}`;

        // Generate CSS for the element
        let cssRule = `.${elementId} {\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;

        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();

                if (typeof value === 'number' && !['z-index', 'opacity', 'line-height', 'flex'].includes(key)) {
                    cssRule += `  ${cssKey}: ${value}px;\n`;
                } else {
                    cssRule += `  ${cssKey}: ${value};\n`;
                }
            }
        });

        cssRule += `}\n`;
        cssRules.push(cssRule);

        // Determine HTML content
        const actualLabel = label || type;

        let innerHTML = content || customText || '';

        switch (actualLabel.toLowerCase()) {
            case 'image':
                if (!imageUrl) {
                    return `<div class="${className} drag-image"><span>Image missing</span></div>`;
                }
                return `<div class="${className} drag-image">
                    <img src="${imageUrl}" alt="User Image"
                    onerror="this.onerror=null;this.style.display='none';this.parentElement.innerHTML='<span>Image failed to load</span>'">
                </div>`;
            case 'button':
                return `<div class="${className}">
                    <button>${innerHTML || 'Button'}</button>
                </div>`;
            case 'header':
                return `<div class="${className}">
                    <h1>${innerHTML || 'Header'}</h1>
                </div>`;
            case 'text':
                return `<div class="${className} drag-text">${innerHTML}</div>`;
            default:
                return `<div class="${className}">${innerHTML}</div>`;
        }
    }

    const htmlContent = elements.map(processElement).join('\n');

    const finalHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Canvas</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
        ${baseStyles}
        ${cssRules.join('\n')}
    </style>
</head>
<body>
    <div class="canvas-container">
        ${htmlContent}
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const canvas = document.querySelector('.canvas-container');
            const scale = Math.min(
                window.innerWidth / ${editorWidth},
                window.innerHeight / ${editorHeight}
            );
            canvas.style.transform = 'scale(' + scale + ')';
            canvas.style.transformOrigin = 'top left';
        });
    </script>
</body>
</html>`;

    return {
        html: finalHTML,
        css: `${baseStyles}\n${cssRules.join('\n')}`
    };
}

module.exports = { generateHTMLAndCSS };
