function generateHTMLAndCSS(elements, baseUrl = '') {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // Canvas dimensions from your frontend
    const editorWidth = 1440;
    const editorHeight = 900;

    // Enhanced Base CSS with responsive improvements
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
        overflow-x: hidden;
    }

    .canvas-container {
        position: relative;
        width: ${editorWidth}px;
        min-height: ${editorHeight}px;
        margin: 0 auto;
        background-color: #f0f0f0;
        overflow: visible;
        transform-origin: top left;
    }

    .canvas-element {
        position: absolute;
        user-select: none;
        transform-origin: top left;
    }

    .drag-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
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
            transform: none !important;
        }
    }
    `;

    const cssRules = [];

    function processElement(element) {
        const {
            id,
            label,
            type = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            customText = '',
            imageUrl = ''
        } = element;

        const elementId = `element-${id}`;
        const className = `canvas-element ${elementId}`;

        // Generate CSS for the element
        let cssRule = `.${elementId} {\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;

        // Convert styles to CSS
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                
                // Handle different value types
                if (typeof value === 'number' && !['zIndex', 'opacity', 'lineHeight', 'flex'].includes(key)) {
                    cssRule += `  ${cssKey}: ${value}px;\n`;
                } else if (key === 'backgroundImage' && value.includes('url')) {
                    // Ensure image URLs are absolute
                    const absoluteUrl = value.startsWith('http') ? value : 
                                      `${baseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
                    cssRule += `  ${cssKey}: url("${absoluteUrl}");\n`;
                } else {
                    cssRule += `  ${cssKey}: ${value};\n`;
                }
            }
        });

        cssRule += `}\n`;
        cssRules.push(cssRule);

        // Generate HTML content
        const actualLabel = label || type;
        let innerHTML = content || customText || '';

        switch (actualLabel.toLowerCase()) {
            case 'image':
                const imgSrc = imageUrl.startsWith('http') ? imageUrl : 
                             `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
                return `<div class="${className} drag-image">
                    <img src="${imgSrc}" alt="User Image" 
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
        function adjustCanvasSize() {
            const canvas = document.querySelector('.canvas-container');
            const scale = Math.min(
                window.innerWidth / ${editorWidth},
                window.innerHeight / ${editorHeight}
            );
            
            // Apply scaling while maintaining aspect ratio
            canvas.style.transform = 'scale(' + scale + ')';
            
            // Center the canvas
            canvas.style.marginLeft = '50%';
            canvas.style.transform = 'scale(' + scale + ') translateX(-50%)';
            
            // Store scale for potential use in other calculations
            canvas.dataset.scale = scale;
        }

        // Initial adjustment
        document.addEventListener('DOMContentLoaded', adjustCanvasSize);
        
        // Adjust on window resize
        window.addEventListener('resize', adjustCanvasSize);
    </script>
</body>
</html>`;

    return {
        html: finalHTML,
        css: `${baseStyles}\n${cssRules.join('\n')}`
    };
}

module.exports = { generateHTMLAndCSS };
