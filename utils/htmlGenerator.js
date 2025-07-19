function generateHTMLAndCSS(elements, baseUrl = '') {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    // Enhanced base styles with component-specific styles
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
        transition: all 0.2s ease;
    }
    img {
        max-width: 100%;
        height: auto;
        display: block;
        object-fit: contain;
    }
    input, textarea, select {
        padding: 10px 15px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-family: inherit;
        font-size: 16px;
        width: 100%;
        margin: 5px 0;
    }
    button {
        padding: 10px 20px;
        background-color: #1e31e3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
    }
    button:hover {
        background-color: #1727b3;
    }
    input:focus, textarea:focus {
        outline: none;
        border-color: #1e31e3;
        box-shadow: 0 0 0 2px rgba(30, 49, 227, 0.2);
    }

    /* Navbar Styles */
    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background-color: #f8f9fa;
        width: 100%;
    }
    .navbar-items {
        display: flex;
        list-style: none;
        gap: 1.5rem;
        margin: 0;
        padding: 0;
    }
    .nav-link {
        text-decoration: none;
        color: #333;
        padding: 0.5rem 1rem;
    }
    .nav-link:hover {
        color: #1e31e3;
    }

    /* List Styles */
    .styled-list {
        list-style-position: inside;
        padding-left: 0;
        margin: 0;
    }
    .list-item {
        padding: 0.5rem 1rem;
        border-bottom: 1px solid #eee;
    }

    /* Form Styles */
    .custom-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .form-group label {
        font-weight: 600;
    }

    @media (max-width: 768px) {
        body {
            padding: 10px;
        }
        .canvas-container {
            padding: 15px;
        }
        .navbar {
            flex-direction: column;
            gap: 1rem;
        }
        .navbar-items {
            flex-direction: column;
            gap: 0.5rem;
        }
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
            placeholder = '',
            items = [],  // For navbars and lists
            fields = [], // For forms
            options = [] // For selects
        } = element;
        
        // Generate CSS
        let cssRule = `#element-${id} {\n`;
        cssRule += `    left: ${position.x}px;\n`;
        cssRule += `    top: ${position.y}px;\n`;
        
        // Apply styles with defaults
        const defaultStyles = {
            color: '#212529',
            fontSize: '16px',
            backgroundColor: 'transparent',
            width: 'auto',
            height: 'auto',
            ...styles
        };
        
        Object.entries(defaultStyles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                const cssValue = typeof value === 'number' ? `${value}px` : value;
                cssRule += `    ${cssProperty}: ${cssValue};\n`;
            }
        });
        
        cssRules.push(cssRule + '}');

        // Generate HTML with full component support
        let elementHtml = '';
        const elementContent = customText || content || '';
        const safeContent = elementContent
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        switch (String(type).toLowerCase()) {
            case 'input':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${label ? `<label>${label}</label>` : ''}
                    <input type="text" value="${safeContent}" 
                           placeholder="${placeholder || label || 'Enter text'}" />
                </div>`;
                break;
                
            case 'textarea':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${label ? `<label>${label}</label>` : ''}
                    <textarea placeholder="${placeholder || label || 'Enter text'}">${safeContent}</textarea>
                </div>`;
                break;
                
            case 'button':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <button>${safeContent || label || 'Click Me'}</button>
                </div>`;
                break;
                
            case 'image':
                let imgSrc = '';
                let errorMessage = '<div style="padding:15px;background:#f8f9fa;color:#6c757d;border:1px dashed #ced4da">Image not available</div>';
                
                if (imageUrl) {
                    try {
                        if (imageUrl.startsWith('http') || imageUrl.startsWith('//')) {
                            imgSrc = imageUrl;
                        } else if (imageUrl.startsWith('/')) {
                            imgSrc = new URL(imageUrl, baseUrl).toString();
                        } else {
                            imgSrc = new URL('/' + imageUrl, baseUrl).toString();
                        }
                    } catch (e) {
                        console.error('Invalid image URL:', imageUrl);
                        imgSrc = '';
                    }
                }
                
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${imgSrc 
                        ? `<img src="${imgSrc}" alt="${label || 'Image'}" 
                              onerror="this.onerror=null;this.replaceWith(document.createRange().createContextualFragment('${errorMessage.replace(/'/g, "\\'")}'))">`
                        : errorMessage}
                </div>`;
                break;
                
            case 'navbar':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <nav class="navbar">
                        <div class="navbar-brand">${label || 'Logo'}</div>
                        <ul class="navbar-items">
                            ${items.map((item, index) => `
                                <li class="nav-item">
                                    <a href="#" class="nav-link">${item.text || `Link ${index + 1}`}</a>
                                </li>
                            `).join('')}
                        </ul>
                    </nav>
                </div>`;
                break;

            case 'list':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${label ? `<h3>${label}</h3>` : ''}
                    <ul class="styled-list">
                        ${items.map((item, index) => `
                            <li class="list-item">${item.text || `Item ${index + 1}`}</li>
                        `).join('')}
                    </ul>
                </div>`;
                break;

            case 'form':
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    <form class="custom-form">
                        ${label ? `<h3>${label}</h3>` : ''}
                        ${fields.map((field, index) => {
                            const fieldId = `field-${id}-${index}`;
                            return `
                            <div class="form-group">
                                ${field.label ? `<label for="${fieldId}">${field.label}</label>` : ''}
                                ${field.type === 'textarea' ? `
                                    <textarea id="${fieldId}" 
                                        placeholder="${field.placeholder || ''}">${field.value || ''}</textarea>
                                ` : field.type === 'select' ? `
                                    <select id="${fieldId}">
                                        ${(field.options || []).map(opt => `
                                            <option value="${opt.value || opt.text}"
                                                ${opt.selected ? 'selected' : ''}>
                                                ${opt.text}
                                            </option>
                                        `).join('')}
                                    </select>
                                ` : `
                                    <input type="${field.type || 'text'}" id="${fieldId}"
                                        value="${field.value || ''}"
                                        placeholder="${field.placeholder || ''}">
                                `}
                            </div>`;
                        }).join('')}
                        <button type="submit">${element.submitText || 'Submit'}</button>
                    </form>
                </div>`;
                break;
                
            default:
                elementHtml = `
                <div id="element-${id}" class="canvas-element">
                    ${label ? `<h3>${label}</h3>` : ''}
                    <div>${safeContent}</div>
                </div>`;
        }
        
        htmlElements.push(elementHtml);
    });

    return {
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Design Export - ${new Date().toLocaleDateString()}</title>
    <style>
        ${baseStyles}
        ${cssRules.join('\n')}
    </style>
</head>
<body>
    <div class="canvas-container">
        ${htmlElements.join('\n')}
    </div>
    <script>
        // Basic responsive scaling
        function adjustLayout() {
            const container = document.querySelector('.canvas-container');
            if (container) {
                const scale = Math.min(
                    window.innerWidth / 1200,
                    window.innerHeight / 900
                );
                container.style.transform = \`scale(\${Math.min(scale, 1)})\`;
            }
        }
        
        window.addEventListener('load', adjustLayout);
        window.addEventListener('resize', adjustLayout);
    </script>
</body>
</html>`,
        css: baseStyles + cssRules.join('\n')
    };
}

module.exports = { generateHTMLAndCSS };
