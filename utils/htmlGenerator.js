function generateHTML(elements) {
    if (!Array.isArray(elements)) return '';

    return elements.map(element => {
        const { label, styles = {}, position = {}, imagePreview, customText } = element;
        
        // Convert styles object to CSS string
        let styleString = Object.entries(styles)
            .map(([key, value]) => {
                // Convert camelCase to kebab-case
                const cssProperty = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
                return `${cssProperty}:${value}`;
            })
            .join(';');

        // Add positioning if exists
        if (position.x || position.y) {
            styleString += `;position:absolute;left:${position.x}px;top:${position.y}px`;
        }

        // Handle different element types
        const content = customText || '';
        
        switch (label) {
            case 'Header':
                return `<h1 style="${styleString}">${content || 'Header'}</h1>`;
            case 'Text':
                return `<p style="${styleString}">${content || 'Sample Text'}</p>`;
            case 'List':
                return `<ul style="${styleString}">
                    <li>Item 1</li>
                    <li>Item 2</li>
                    <li>Item 3</li>
                </ul>`;
            case 'Navbar':
                return `<nav style="${styleString}">
                    <a href="#">Home</a>
                    <a href="#">About</a>
                    <a href="#">Contact</a>
                </nav>`;
            case 'Card':
                return `<div style="${styleString}">
                    <div class="card">
                        <h3>Card Title</h3>
                        <p>${content || 'Card content...'}</p>
                    </div>
                </div>`;
            case 'Form':
                return `<form style="${styleString}">
                    <input type="text" placeholder="Name">
                    <input type="email" placeholder="Email">
                    <button type="submit">Submit</button>
                </form>`;
            case 'Grid':
                return `<div style="${styleString}">
                    <div class="grid">
                        <div>Item 1</div>
                        <div>Item 2</div>
                        <div>Item 3</div>
                    </div>
                </div>`;
            case 'Button':
                return `<button style="${styleString}">${content || 'Button'}</button>`;
            case 'Image':
                return imagePreview 
                    ? `<img style="${styleString}" src="${imagePreview}" alt="Uploaded content">`
                    : `<div style="${styleString}">Image Placeholder</div>`;
            case 'Footer':
                return `<footer style="${styleString}">
                    <p>© ${new Date().getFullYear()} My Website</p>
                </footer>`;
            default:
                return `<div style="${styleString}">${content || label}</div>`;
        }
    }).join('\n');
}

function wrapWithHTMLPage(bodyHTML) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Layout</title>
    <style>
        body { margin: 0; padding: 0; min-height: 100vh; position: relative; }
        .card { border: 1px solid #ccc; padding: 10px; border-radius: 8px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        nav a { margin-right: 20px; text-decoration: none; }
    </style>
</head>
<body>
    ${bodyHTML}
</body>
</html>`;
}

module.exports = { generateHTML, wrapWithHTMLPage };