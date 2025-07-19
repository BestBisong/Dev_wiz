function generateHTMLAndCSS(elements, baseUrl = '') {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // Enhanced base styles with default form styling
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
    }
    input, textarea, button {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: inherit;
        font-size: inherit;
    }
    input:focus, textarea:focus {
        outline: none;
        border-color: #1e31e3;
    }`;

    const cssRules = [];
    const htmlElements = [];

    elements.forEach((element) => {
        const { 
            id, 
            type = 'div', 
            label = '', 
            styles = {}, 
            position = {x: 0, y: 0}, 
            content = '', 
            imageUrl = '',
            customText = ''
        } = element;
        
        // Generate CSS
        let cssRule = `#element-${id} {\n`;
        cssRule += `    left: ${position.x}px;\n`;
        cssRule += `    top: ${position.y}px;\n`;
        
        // Apply styles with defaults
        const defaultStyles = {
            color: '#000000',
            fontSize: '16px',
            backgroundColor: 'transparent',
            width: 'auto',
            height: 'auto',
            ...styles // User-defined styles override defaults
        };
        
        Object.entries(defaultStyles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                const cssValue = typeof value === 'number' ? `${value}px` : value;
                cssRule += `    ${cssProperty}: ${cssValue};\n`;
            }
        });
        
        cssRules.push(cssRule + '}');

        // Generate HTML based on element type
        let elementHtml = '';
        const elementContent = customText || content;
        
        switch (String(type).toLowerCase()) {
            case 'input':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <input type="text" value="${elementContent || ''}" placeholder="${label || 'Input field'}" />
                </div>`;
                break;
                
            case 'textarea':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <textarea placeholder="${label || 'Text area'}">${elementContent || ''}</textarea>
                </div>`;
                break;
                
            case 'button':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <button>${elementContent || label || 'Button'}</button>
                </div>`;
                break;
                
            case 'image':
                let imgSrc = '';
                if (imageUrl) {
                    imgSrc = imageUrl.startsWith('http') 
                        ? imageUrl 
                        : imageUrl.startsWith('/') 
                            ? `${baseUrl}${imageUrl}`
                            : `${baseUrl}/${imageUrl}`;
                }
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <img src="${imgSrc}" alt="${label || 'Image'}" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\"padding:10px;background:#eee\">Image not available</div>'">
                </div>`;
                break;
                
            default:
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${elementContent || label || 'Content'}
                </div>`;
        }
        
        htmlElements.push(elementHtml);
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
