function generateHTMLAndCSS(elements, baseUrl = '', customTexts = {}) {
  if (!Array.isArray(elements)) {
    throw new Error('Elements must be an array');
  }

  const baseStyles = `
  :root {
    --primary-color: #1e31e3;
    --secondary-color: #2c3e50;
    --text-color: #333333;
    --light-gray: #f8f9fa;
    --white: #ffffff;
    --shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    color: var(--text-color);
    background-color: var(--light-gray);
    line-height: 1.6;
    padding: 20px;
    position: relative;
    min-height: 100vh;
  }

  .canvas-container {
    position: relative;
    width: 100%;
    max-width: 1200px;
    min-height: 100vh;
    margin: 0 auto;
    background-color: var(--white);
    box-shadow: var(--shadow);
    padding: 30px;
    border-radius: 8px;
  }

  .canvas-element {
    position: absolute;
    transform: translate(0, 0);
    min-height: auto;
    padding: 8px;
    box-sizing: border-box;
  }`;

  const cssRules = [];
  const htmlElements = [];

  elements.forEach((element) => {
    const {
      id,
      type = 'div',
      label = '',
      styles = {},
      position = { x: 0, y: 0 },
      size = { width: 'auto', height: 'auto' },
      content = '',
      customText = '',
      mapUrl = '',
    } = element;

    // Use customTexts if available, otherwise fall back to element's customText or content
    const elementContent = customTexts[id] || customText || content || label || '';

    // CSS Generation
    let cssRule = `#element-${id} {\n`;
    cssRule += `  position: absolute;\n`;
    cssRule += `  left: ${position.x}px;\n`;
    cssRule += `  top: ${position.y}px;\n`;
    cssRule += `  width: ${typeof size.width === 'number' ? size.width + 'px' : size.width};\n`;
    cssRule += `  height: ${typeof size.height === 'number' ? size.height + 'px' : size.height};\n`;

    // Convert style object to CSS
    Object.entries(styles).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        let cssValue = value;

        if (typeof value === 'number' && !['zIndex', 'opacity', 'fontWeight', 'lineHeight', 'flex'].includes(key)) {
          cssValue = `${value}px`;
        }

        if (key === 'fontWeight' && typeof value === 'string') {
          cssValue = value.toLowerCase() === 'bold' ? '700' :
                     value.toLowerCase() === 'normal' ? '400' : value;
        }

        cssRule += `  ${cssProperty}: ${cssValue};\n`;
      }
    });

    cssRules.push(cssRule + '}');

    // HTML Generation
    let elementHtml = '';
    
    switch (type.toLowerCase()) {
      case 'text':
        elementHtml = `
        <div id="element-${id}" class="canvas-element text-element">
          <p>${elementContent}</p>
        </div>`;
        break;

      case 'header':
        elementHtml = `
        <div id="element-${id}" class="canvas-element header-element">
          <h1>${elementContent}</h1>
        </div>`;
        break;

      case 'button':
        elementHtml = `
        <div id="element-${id}" class="canvas-element button-element">
          <button class="styled-button">${elementContent}</button>
        </div>`;
        break;

      case 'input':
        elementHtml = `
        <div id="element-${id}" class="canvas-element input-element">
          <input type="text" value="${elementContent}" placeholder="${elementContent || 'Enter text'}" />
        </div>`;
        break;

      case 'map':
        elementHtml = `
        <div id="element-${id}" class="canvas-element map-element">
          ${mapUrl ? `
          <iframe 
            src="${mapUrl.startsWith('http') ? mapUrl : `https://${mapUrl}`}" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
          ` : '<div class="map-placeholder">Map URL not provided</div>'}
        </div>`;
        break;

      case 'section':
        elementHtml = `
        <div id="element-${id}" class="canvas-element section-element">
          <div class="section-content">${elementContent}</div>
        </div>`;
        break;

      case 'navbar':
        elementHtml = `
        <div id="element-${id}" class="canvas-element navbar-element">
          <nav>
            <div class="logo">${elementContent || 'Logo'}</div>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </nav>
        </div>`;
        break;

      // Add cases for all your other component types...

      default:
        elementHtml = `
        <div id="element-${id}" class="canvas-element default-element">
          <div>${elementContent}</div>
        </div>`;
    }

    htmlElements.push(elementHtml);
  });

  const componentStyles = `
  /* Text elements */
  .text-element p {
    margin: 0;
    white-space: pre-wrap;
  }

  /* Header elements */
  .header-element h1 {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
  }

  /* Button elements */
  .styled-button {
    padding: 8px 16px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: inherit;
    font-family: inherit;
  }

  /* Input elements */
  .input-element input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: inherit;
    font-family: inherit;
  }

  /* Section elements */
  .section-element {
    border: 1px dashed #ccc;
    background-color: rgba(240, 240, 240, 0.5);
  }

  /* Navbar elements */
  .navbar-element nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #f8f9fa;
    width: 100%;
  }
  .navbar-element ul {
    display: flex;
    list-style: none;
    gap: 15px;
    margin: 0;
    padding: 0;
  }
  .navbar-element a {
    text-decoration: none;
    color: inherit;
  }

  /* Map elements */
  .map-element {
    background-color: #f0f0f0;
  }
  .map-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #666;
  }`;

  return {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <style>
    ${baseStyles}
    ${componentStyles}
    ${cssRules.join('\n')}
  </style>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
</head>
<body>
  <div class="canvas-container">
    ${htmlElements.join('\n')}
  </div>
</body>
</html>`,
    css: baseStyles + componentStyles + cssRules.join('\n')
  };
}

module.exports = { generateHTMLAndCSS };