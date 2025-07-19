function generateHTMLAndCSS(elements, baseUrl = '') {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const editorWidth = 1440;
    const editorHeight = 900;

    const baseStyles = `
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
        background-color: white;
        transform-origin: top left;
    }
    .canvas-element {
        position: absolute;
        user-select: none;
    }
    .drag-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
    }
    .drag-text {
        word-wrap: break-word;
        white-space: pre-wrap;
    }`;

    const cssRules = [];

    function processElement(element) {
        const {
            id,
            type = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            imageUrl = ''
        } = element;

        const elementId = `element-${id}`;
        const className = `canvas-element ${elementId}`;

        // Generate CSS
        let cssRule = `.${elementId} {\n  left: ${position.x}px;\n  top: ${position.y}px;\n`;
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                cssRule += `  ${cssKey}: ${value}${typeof value === 'number' ? 'px' : ''};\n`;
            }
        });
        cssRule += `}\n`;
        cssRules.push(cssRule);

        // Generate HTML
        if (type.toLowerCase() === 'image') {
            const finalUrl = imageUrl.startsWith('http') ? imageUrl 
                          : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            return `<div class="${className} drag-image">
                <img src="${finalUrl}" alt="Canvas Image"
                onerror="this.onerror=null;this.parentElement.innerHTML='<span>Image failed to load</span>'">
            </div>`;
        }
        return `<div class="${className}">${content}</div>`;
    }

    return {
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas Export</title>
    <style>
        ${baseStyles}
        ${cssRules.join('\n')}
    </style>
</head>
<body>
    <div class="canvas-container">
        ${elements.map(processElement).join('\n')}
    </div>
    <script>
        function resizeCanvas() {
            const canvas = document.querySelector('.canvas-container');
            const scale = Math.min(
                window.innerWidth / ${editorWidth},
                window.innerHeight / ${editorHeight}
            );
            canvas.style.transform = \`scale(\${scale})\`;
        }
        window.addEventListener('load', resizeCanvas);
        window.addEventListener('resize', resizeCanvas);
    </script>
</body>
</html>`,
        css: baseStyles + cssRules.join('\n')
    };
}

module.exports = { generateHTMLAndCSS };
