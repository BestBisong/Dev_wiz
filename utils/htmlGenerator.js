function generateHTMLAndCSS(elements) {
    if (!Array.isArray(elements)) {
        throw new Error("Elements must be an array");
    }

    // Generate CSS classes for each element
    const cssRules = [];
    const htmlElements = [];

    elements.forEach((element, index) => {
        const { label = 'div', styles = {}, position = {}, imagePreview, customText } = element;
        const elementId = `element-${index}`;
        const className = `element-${label.toLowerCase()}-${index}`;

        // Create CSS rule for this element
        let cssRule = `.${className} {\n`;
        
        // Add position styles
        cssRule += `  position: absolute;\n`;
        cssRule += `  left: ${position.x || 0}px;\n`;
        cssRule += `  top: ${position.y || 0}px;\n`;

        // Add other styles
        Object.entries(styles).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                const cssProperty = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                cssRule += `  ${cssProperty}: ${value};\n`;
            }
        });

        cssRule += `}\n\n`;
        cssRules.push(cssRule);

        // Create HTML element
        let htmlElement = `<div class="${className}" id="${elementId}">`;

        switch (label) {
            case 'Header':
                htmlElement += `<h1>${customText || 'Header'}</h1>`;
                break;
            case 'Text':
                htmlElement += `<p>${customText || 'Sample Text'}</p>`;
                break;
            case 'List':
                htmlElement += `<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>`;
                break;
            case 'Navbar':
                htmlElement += `<nav><a href="#">Home</a><a href="#">About</a><a href="#">Contact</a></nav>`;
                break;
            case 'Card':
                htmlElement += `<div class="card"><h3>Card Title</h3><p>${customText || 'Card content...'}</p></div>`;
                break;
            case 'Form':
                htmlElement += `<form><input type="text" placeholder="Name"><input type="email" placeholder="Email"><button type="submit">Submit</button></form>`;
                break;
            case 'Grid':
                htmlElement += `<div class="grid"><div>Item 1</div><div>Item 2</div><div>Item 3</div></div>`;
                break;
            case 'Button':
                htmlElement += `<button>${customText || 'Button'}</button>`;
                break;
            case 'Image':
                htmlElement += imagePreview 
                    ? `<img src="${imagePreview}" alt="User uploaded content">`
                    : `<div class="image-placeholder">Image Placeholder</div>`;
                break;
            case 'Footer':
                htmlElement += `<footer><p>© ${new Date().getFullYear()} My Website</p></footer>`;
                break;
            default:
                htmlElement += `${customText || label}`;
        }

        htmlElement += `</div>`;
        htmlElements.push(htmlElement);
    });

    // Combine all CSS rules
    const css = `/* Generated CSS */\n${cssRules.join('\n')}\n\n/* Base Styles */\n
.card { 
    border: 1px solid #ddd; 
    padding: 15px; 
    border-radius: 8px; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.grid { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 15px; 
}
nav a { 
    margin-right: 20px; 
    text-decoration: none;
    color: #333;
}
button {
    padding: 8px 16px;
    background: #1e31e3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
img {
    max-width: 100%;
    height: auto;
}
.image-placeholder {
    width: 200px;
    height: 200px;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
}`;

    // Create full HTML document
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    ${htmlElements.join('\n')}
</body>
</html>`;

    return { html, css };
}

module.exports = { generateHTMLAndCSS };