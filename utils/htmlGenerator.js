function generateHTMLAndCSS(elements, baseUrl = '') {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // Simplified responsive container
    const baseStyles = `
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    body {
        font-family: Arial, sans-serif;
        background-color: #f0f0f0;
        padding: 20px;
        display: flex;
        justify-content: center;
    }
    .canvas-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        min-height: 100vh;
        background-color: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        padding: 20px;
    }
    .canvas-element {
        position: absolute;
    }
    img {
        max-width: 100%;
        height: auto;
        display: block;
    }`;

    const cssRules = [];
    const htmlElements = [];

    elements.forEach((element, index) => {
        const { id, type, styles = {}, position = {x: 0, y: 0}, content = '', imageUrl = '' } = element;
        
        // Generate CSS
        cssRules.push(`
        #element-${id} {
            left: ${position.x}px;
            top: ${position.y}px;
            ${Object.entries(styles).map(([key, value]) => 
                `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}${typeof value === 'number' ? 'px' : ''};`
                .join('\n')}
        }`);

        // Generate HTML
        if (type?.toLowerCase() === 'image') {
            const imgSrc = imageUrl.startsWith('http') ? imageUrl 
                        : imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}`
                        : `${baseUrl}/${imageUrl}`;
            
            htmlElements.push(`
            <div id="element-${id}" class="canvas-element">
                <img src="${imgSrc}" alt="Design Image" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'padding:10px;background:#eee\\'>Image not available</div>'">
            </div>`);
        } else {
            htmlElements.push(`
            <div id="element-${id}" class="canvas-element">
                ${content || 'Sample content'}
            </div>`);
        }
    });

    return {
        html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Design Export</title>
    <style>
        ${baseStyles}
        ${cssRules.join('\n')}
    </style>
</head>
<body>
    <div class="canvas-container">
        ${htmlElements.join('\n')}
    </div>
</body>
</html>`,
        css: baseStyles + cssRules.join('\n')
    };
}

module.exports = { generateHTMLAndCSS };
