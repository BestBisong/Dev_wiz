function generateHTMLAndCSS(elements, baseUrl = '') {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // Complete base styles with all component styling
    const baseStyles = `
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    body {
        font-family: 'Segoe UI', Arial, sans-serif;
        background-color: #f8f9fa;
        padding: 20px;
        display: flex;
        justify-content: center;
        min-height: 100vh;
    }
    .canvas-container {
        position: relative;
        width: 100%;
        max-width: 1200px;
        min-height: 90vh;
        background-color: white;
        box-shadow: 0 0 15px rgba(0,0,0,0.05);
        padding: 30px;
        margin: 20px 0;
    }
    .canvas-element {
        position: absolute;
    }

    /* Form Styles */
    .form-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 100%;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .form-row {
        display: flex;
        gap: 15px;
        width: 100%;
    }
    .form-group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    .form-group label {
        font-weight: 600;
        color: #333;
    }
    .form-group input,
    .form-group textarea,
    .form-group select {
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
    }
    .form-group textarea {
        min-height: 100px;
        resize: vertical;
    }
    .form-submit {
        background: #1e31e3;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 10px;
        font-weight: 600;
    }

    /* Navbar Styles */
    .navbar-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 15px 20px;
        background: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .navbar-logo {
        font-size: 20px;
        font-weight: bold;
        color: #1e31e3;
    }
    .navbar-links {
        display: flex;
        gap: 20px;
        list-style: none;
    }
    .navbar-link {
        color: #333;
        text-decoration: none;
        font-weight: 500;
    }
    .navbar-link:hover {
        color: #1e31e3;
    }

    /* List Styles */
    .list-container {
        width: 100%;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .list-item {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
        font-weight: 400;
    }
    .list-item:last-child {
        border-bottom: none;
    }

    /* Grid Styles */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        width: 100%;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .grid-item {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 4px;
        font-weight: 400;
    }

    /* Footer Styles */
    .footer-container {
        display: flex;
        flex-wrap: wrap;
        gap: 40px;
        width: 100%;
        padding: 40px 20px;
        background: #2c3e50;
        color: white;
    }
    .footer-column {
        flex: 1;
        min-width: 200px;
    }
    .footer-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 15px;
        color: #ecf0f1;
    }
    .footer-links {
        list-style: none;
    }
    .footer-link {
        margin-bottom: 10px;
    }
    .footer-link a {
        color: #bdc3c7;
        text-decoration: none;
        font-weight: 400;
    }
    .footer-link a:hover {
        color: #ecf0f1;
    }

    /* Font Weight Fixes */
    h1, h2, h3, h4, h5, h6 {
        font-weight: 600;
    }
    strong, b {
        font-weight: 700;
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
            customText = '',
            items = [],
            fields = [],
            columns = []
        } = element;
        
        // Generate CSS with font-weight support
        let cssRule = `#element-${id} {\n`;
        cssRule += `    left: ${position.x}px;\n`;
        cssRule += `    top: ${position.y}px;\n`;
        
        // Apply all styles including font-weight
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                let cssValue = value;
                
                // Special handling for font weights
                if (cssProperty === 'font-weight') {
                    if (typeof value === 'string') {
                        cssValue = value.toLowerCase() === 'bold' ? '700' : 
                                  value.toLowerCase() === 'normal' ? '400' : value;
                    }
                }
                
                // Convert numbers to px for relevant properties
                if (typeof value === 'number' && 
                    !['zIndex', 'opacity', 'fontWeight', 'lineHeight'].includes(key)) {
                    cssValue = `${value}px`;
                }
                
                cssRule += `    ${cssProperty}: ${cssValue};\n`;
            }
        });
        
        cssRules.push(cssRule + '}');

        // Generate HTML
        let elementHtml = '';
        const elementContent = customText || content || '';
        
        switch (String(type).toLowerCase()) {
            case 'form':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <div class="form-container">
                        ${fields.map(field => `
                            <div class="form-group">
                                <label>${field.label || 'Field'}</label>
                                ${field.type === 'textarea' ? `
                                    <textarea placeholder="${field.placeholder || ''}"></textarea>
                                ` : `
                                    <input type="${field.type || 'text'}" 
                                           placeholder="${field.placeholder || ''}">
                                `}
                            </div>
                        `).join('')}
                        <button class="form-submit" type="submit">Submit</button>
                    </div>
                </div>`;
                break;

            case 'navbar':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <nav class="navbar-container">
                        <div class="navbar-logo">${label || 'Logo'}</div>
                        <ul class="navbar-links">
                            ${items.map((item, i) => `
                                <li><a href="#" class="navbar-link">${item.text || `Link ${i+1}`}</a></li>
                            `).join('')}
                        </ul>
                    </nav>
                </div>`;
                break;

            case 'list':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <div class="list-container">
                        ${label ? `<h3>${label}</h3>` : ''}
                        <ul>
                            ${items.map((item, i) => `
                                <li class="list-item">${item.text || `Item ${i+1}`}</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>`;
                break;

            case 'grid':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <div class="grid-container">
                        ${items.map((item, i) => `
                            <div class="grid-item">
                                ${item.text || `Grid Item ${i+1}`}
                            </div>
                        `).join('')}
                    </div>
                </div>`;
                break;

            case 'footer':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <footer class="footer-container">
                        ${columns.map((col, i) => `
                            <div class="footer-column">
                                <h4 class="footer-title">${col.title || `Column ${i+1}`}</h4>
                                <ul class="footer-links">
                                    ${col.links.map(link => `
                                        <li class="footer-link">
                                            <a href="#">${link.text || `Link`}</a>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </footer>
                </div>`;
                break;

            default:
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${elementContent}
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
    <title>Design Export</title>
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
