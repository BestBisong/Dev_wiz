function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // 1. Get the exact dimensions of your editor's canvas
    const editorWidth = 1440; // Match your editor's width
    const editorHeight = 900; // Match your editor's height

    // 2. Base styles that match your editor exactly
    const baseStyles = `
    /* Exact Editor Styles */
    html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        font-family: 'Open Sans', Arial, sans-serif;
    }
    
    /* Canvas that matches your editor */
    .editor-canvas {
        position: relative;
        width: ${editorWidth}px;
        min-height: ${editorHeight}px;
        margin: 0 auto;
        background-color: #f0f0f0;
        overflow: visible;
    }

    /* Print-specific styles */
    @media print {
        body * {
            visibility: hidden;
        }
        .editor-canvas, .editor-canvas * {
            visibility: visible;
        }
        .editor-canvas {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
        }
    }
    `;

    // 3. Process each element with pixel-perfect precision
    const elementHTML = elements.map(element => {
        const {
            id,
            label,
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            customText = '',
            imageUrl = null
        } = element;

        // Convert React styles to CSS with units
        const styleString = Object.entries(styles)
            .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                
                // Add px to numeric values (except line-height, opacity, z-index)
                if (typeof value === 'number' && !['zIndex', 'opacity', 'lineHeight', 'flex'].includes(key)) {
                    return `${cssKey}: ${value}px`;
                }
                return `${cssKey}: ${value}`;
            })
            .join('; ');

        // Position with pixel-perfect accuracy
        const positionStyle = `position: absolute; left: ${position.x}px; top: ${position.y}px;`;

        // Component-specific HTML
        let innerHTML = content || customText || '';
        if (label === 'Image' && imageUrl) {
            innerHTML = `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" 
                          onerror="this.style.display='none'">`;
        } else if (label === 'Button') {
            innerHTML = `<button style="${styleString}">${innerHTML || 'Button'}</button>`;
        } else if (label === 'Header') {
            innerHTML = `<h1 style="${styleString}">${innerHTML || 'Header'}</h1>`;
        }

        return `<div id="element-${id}" 
                    class="editor-element" 
                    style="${positionStyle} ${styleString}">
                ${innerHTML}
            </div>`;
    }).join('\n');

    // 4. Generate the final HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Exact Design</title>
    <style>
        ${baseStyles}
        
        /* Include all Google Fonts used in your editor */
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
        
        /* Element base styles */
        .editor-element {
            box-sizing: border-box;
            min-width: 20px;
            min-height: 20px;
        }
    </style>
</head>
<body>
    <div class="editor-canvas">
        ${elementHTML}
    </div>
    
    <script>
        // Optional: Add script to maintain exact sizing
        document.addEventListener('DOMContentLoaded', function() {
            const canvas = document.querySelector('.editor-canvas');
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

    return { html };
}

module.exports = { generateHTMLAndCSS };
