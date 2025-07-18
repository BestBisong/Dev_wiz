function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error('Elements must be an array');
    }

    const cssRules = [];
    const ids = [];

    const baseStyles = `
    /* Base Styles */
    body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        position: relative;
        font-family: Arial, sans-serif;
    }

    .canvas-container {
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow: auto;
        background: #f0f0f0;
    }

    .canvas-container img {
        max-width: 100%;
        height: auto;
        display: block;
    }

    /* Additional base styles for form elements */
    input, textarea, select {
        padding: 8px;
        margin: 5px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 100%;
        box-sizing: border-box;
    }

    button {
        padding: 10px 15px;
        background-color: #1e31e3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .form-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        background-color: white;
        border-radius: 8px;
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

    .drag-footer ul {
        list-style: none;
        padding: 0;
        margin: 0;
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

        const className = `element-${label.toLowerCase().replace(/\s+/g, '-')}-${id}`;

        let cssRule = `.${className} {\n`;
        cssRule += `  position: absolute;\n`;
        cssRule += `  left: ${position.x}px;\n`;
        cssRule += `  top: ${position.y}px;\n`;

        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                cssRule += `  ${cssProperty}: ${value};\n`;
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
                elementHTML = `<header class="${className}">${content || 'Header'}\n${childHTML}</header>`;
                break;
            case 'image':
                elementHTML = `<img class="${className}" src="${imageUrl || '#'}" alt="User Image">`;
                break;
            case 'section':
                elementHTML = `<section class="${className}">${content || ''}\n${childHTML}</section>`;
                break;
            case 'input':
                elementHTML = `<input class="${className}" type="text" placeholder="${content || 'Input field'}" />`;
                break;
            case 'card':
                elementHTML = `<div class="${className} drag-card">${content || 'Card content'}\n${childHTML}</div>`;
                break;
            case 'grid':
                elementHTML = `<div class="${className} drag-grid">
                    <div class="grid-1"></div>
                    <div class="grid-1"></div>
                    <div class="grid-1"></div>
                    <div class="grid-1"></div>
                </div>`;
                break;
            case 'form':
                elementHTML = `<div class="${className} form-container">
                    <input type="text" placeholder="First name" />
                    <input type="text" placeholder="Last name" />
                    <input type="email" placeholder="Email" />
                    <textarea placeholder="Message"></textarea>
                    <button type="submit">Submit</button>
                </div>`;
                break;
            case 'navbar':
                elementHTML = `<nav class="${className} dragnav">
                    <div class="draglogo">${content || 'Logo'}</div>
                    <ul>
                        <li>Link 1</li>
                        <li>Link 2</li>
                        <li>Link 3</li>
                    </ul>
                </nav>`;
                break;
            case 'footer':
                elementHTML = `<footer class="${className} drag-footer">
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
                elementHTML = `<button class="${className}">${content || 'Button'}</button>`;
                break;
            case 'text':
                elementHTML = `<p class="${className}">${content || 'Text content'}</p>`;
                break;
            case 'list':
                elementHTML = `<ul class="${className}">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>`;
                break;
            default:
                elementHTML = `<div class="${className}">${content || ''}\n${childHTML}</div>`;
        }

        return elementHTML;
    }

    const htmlElements = elements.map((el, idx) => processElement(el, idx));

    const css = `${baseStyles}\n${cssRules.join('\n')}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <style>${css}</style>
</head>
<body>
    <div class="canvas-container">
        ${htmlElements.join('\n        ')}
    </div>
</body>
</html>`;

    return { html, css, ids };
}

module.exports = { generateHTMLAndCSS };
