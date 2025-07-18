function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const ids = [];

    // Base styles that match the editor's preview
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
        position: relative;
        background-color: #f0f0f0;
        margin: 0;
        padding: 0;
    }

    .canvas-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        background-color: #f0f0f0;
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

    /* Specific component styles */
    .drag-button {
        padding: 10px 15px;
        background-color: #1e31e3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

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

    .form-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        background-color: white;
    }

    .input-field {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .drag-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .grid-1 {
        background-color: #ddd;
        min-height: 50px;
    }

    .dragnav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background-color: #333;
        color: white;
    }

    .dragnav ul {
        display: flex;
        list-style: none;
        gap: 20px;
        margin: 0;
        padding: 0;
    }

    .drag-footer {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        padding: 20px;
        background-color: #333;
        color: white;
    }

    .drag-card {
        padding: 15px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    `;

    function processElement(element, index) {
        const {
            id = `element-${index}`,
            label = 'div',
            styles = {},
            position = { x: 0, y: 0 },
            content = '',
            children = [],
            imageUrl = null
        } = element;

        ids.push(id);

        const className = `element-${id}`;

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
            width: styles.width ? `${styles.width}px` : 'auto',
            height: styles.height ? `${styles.height}px` : 'auto',
            border: selectedItem?.id === item.id ? '2px solid #1e31e3' : '1px solid transparent'
        };

        Object.entries(styleMap).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                cssRule += `  ${key}: ${value};\n`;
            }
        });

        cssRule += `}`;

        cssRules.push(cssRule);

        let childHTML = '';
        if (Array.isArray(children) && children.length > 0) {
            childHTML = children.map((child, idx) => processElement(child, idx)).join('\n');
        }

        let elementHTML = '';
        switch (label.toLowerCase()) {
            case 'header':
                elementHTML = `<header class="${className} drag-item">${content || 'Header'}</header>`;
                break;
            case 'image':
                elementHTML = `<div class="${className} drag-item drag-image">
                    <img src="${imageUrl || '#'}" alt="User Image" style="width:100%;height:100%;object-fit:cover;">
                </div>`;
                break;
            case 'section':
                elementHTML = `<section class="${className} drag-item">${content || ''}</section>`;
                break;
            case 'input':
                elementHTML = `<input class="${className} drag-item input-field" type="text" placeholder="${content || 'Input field'}" />`;
                break;
            case 'card':
                elementHTML = `<div class="${className} drag-item drag-card">${content || 'Card content'}</div>`;
                break;
            case 'grid':
                elementHTML = `<div class="${className} drag-item drag-grid">
                    <div class="grid-1"></div>
                    <div class="grid-1"></div>
                    <div class="grid-1"></div>
                    <div class="grid-1"></div>
                </div>`;
                break;
            case 'form':
                elementHTML = `<div class="${className} drag-item form-container">
                    <input type="text" class="input-field" placeholder="First name" />
                    <input type="text" class="input-field" placeholder="Last name" />
                    <input type="email" class="input-field" placeholder="Email" />
                    <textarea class="input-field" placeholder="Message"></textarea>
                    <button class="drag-button">Submit</button>
                </div>`;
                break;
            case 'navbar':
                elementHTML = `<nav class="${className} drag-item dragnav">
                    <div class="draglogo">${content || 'Logo'}</div>
                    <ul>
                        <li>Link 1</li>
                        <li>Link 2</li>
                        <li>Link 3</li>
                    </ul>
                </nav>`;
                break;
            case 'footer':
                elementHTML = `<footer class="${className} drag-item drag-footer">
                    <div>
                        <h4>Company</h4>
                        <ul>
                            <li>About</li>
                            <li>Careers</li>
                            <li>Contact</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Support</h4>
                        <ul>
                            <li>Help Center</li>
                            <li>Terms</li>
                            <li>Privacy</li>
                        </ul>
                    </div>
                    <div>
                        <h4>Follow Us</h4>
                        <ul>
                            <li>Twitter</li>
                            <li>Facebook</li>
                            <li>Instagram</li>
                        </ul>
                    </div>
                </footer>`;
                break;
            case 'button':
                elementHTML = `<button class="${className} drag-item drag-button">${content || 'Button'}</button>`;
                break;
            case 'text':
                elementHTML = `<p class="${className} drag-item">${content || 'Text content'}</p>`;
                break;
            case 'list':
                elementHTML = `<ul class="${className} drag-item">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>`;
                break;
            default:
                elementHTML = `<div class="${className} drag-item">${content || ''}</div>`;
        }

        return elementHTML;
    }

    const htmlElements = elements.map((el, idx) => processElement(el, idx));

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
        ${htmlElements.join('\n        ')}
    </div>
</body>
</html>`;

    return { html, css: `${baseStyles}\n${cssRules.join('\n')}`, ids };
}

module.exports = { generateHTMLAndCSS };
