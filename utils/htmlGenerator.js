function generateHTMLAndCSS(elements, baseUrl = '') {
  // Validate input
  if (!Array.isArray(elements)) {
    throw new Error('Elements must be an array');
  }

  // Base styles with proper positioning context
  const baseStyles = `
  :root {
    --primary-color: #1e31e3;
    --secondary-color: #2c3e50;
    --text-color: #333333;
    --light-gray: #f8f9fa;
    --white: #ffffff;
    --shadow: 0 2px 10px rgba(0,0,0,0.1);
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
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
    min-height: 90vh;
    margin: 0 auto;
    background-color: var(--white);
    box-shadow: var(--shadow);
    padding: 30px;
    border-radius: 8px;
  }
  
  .canvas-element {
    position: absolute;
    transform: translate(0, 0); /* Ensures precise positioning */
  }`;

  const cssRules = [];
  const htmlElements = [];

  // Process each element with all collected attributes
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
      imageUrl = '',
      items = [],
      fields = [],
      columns = [],
      links = [],
      // Additional collected attributes
      placeholder = '',
      required = false,
      options = [],
      buttonText = 'Submit',
      logo = {},
      socialIcons = [],
      copyrightText = '',
      // Style-specific attributes
      backgroundColor,
      textColor,
      borderColor,
      borderRadius,
      fontSize,
      fontWeight,
      // etc... add all attributes you collect
    } = element;

    // Generate CSS with all positioning and styling
    let cssRule = `#element-${id} {\n`;
    cssRule += `  position: absolute;\n`;
    cssRule += `  left: ${position.x}px;\n`;
    cssRule += `  top: ${position.y}px;\n`;
    cssRule += `  width: ${typeof size.width === 'number' ? size.width + 'px' : size.width};\n`;
    cssRule += `  height: ${typeof size.height === 'number' ? size.height + 'px' : size.height};\n`;

    // Apply all collected styles
    const styleProperties = {
      ...styles,
      backgroundColor: backgroundColor || styles.backgroundColor,
      color: textColor || styles.color,
      borderColor: borderColor || styles.borderColor,
      borderRadius: borderRadius || styles.borderRadius,
      fontSize: fontSize || styles.fontSize,
      fontWeight: fontWeight || styles.fontWeight,
      // Add all other style mappings
    };

    Object.entries(styleProperties).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const cssProperty = key
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase();
        
        let cssValue = value;
        
        // Handle numeric values (add px where appropriate)
        if (typeof value === 'number' && 
            !['zIndex', 'opacity', 'fontWeight', 'lineHeight', 'flex'].includes(key)) {
          cssValue = `${value}px`;
        }
        
        // Handle font weights
        if (key === 'fontWeight' && typeof value === 'string') {
          cssValue = value.toLowerCase() === 'bold' ? '700' : 
                    value.toLowerCase() === 'normal' ? '400' : value;
        }
        
        cssRule += `  ${cssProperty}: ${cssValue};\n`;
      }
    });

    cssRules.push(cssRule + '}');

    // Generate HTML using all collected attributes
    let elementHtml = '';
    const elementContent = customText || content || '';

    switch (type.toLowerCase()) {
      case 'form':
        elementHtml = `
        <div id="element-${id}" class="canvas-element form-element">
          <form class="form-container">
            ${label ? `<h3 class="form-title">${label}</h3>` : ''}
            ${fields.map((field, i) => `
              <div class="form-group">
                <label for="field-${id}-${i}">${field.label || `Field ${i+1}`}</label>
                ${field.type === 'textarea' ? `
                  <textarea 
                    id="field-${id}-${i}" 
                    name="${field.name || `field-${i}`}"
                    placeholder="${field.placeholder || placeholder || ''}"
                    ${field.required || required ? 'required' : ''}
                  ></textarea>
                ` : field.type === 'select' ? `
                  <select 
                    id="field-${id}-${i}"
                    name="${field.name || `field-${i}`}"
                    ${field.required || required ? 'required' : ''}
                  >
                    ${field.options && field.options.length > 0 ? 
                      field.options.map(opt => `
                        <option value="${opt.value || opt}">${opt.label || opt}</option>
                      `).join('') : 
                      options.map(opt => `
                        <option value="${opt.value || opt}">${opt.label || opt}</option>
                      `).join('')}
                  </select>
                ` : `
                  <input 
                    type="${field.type || 'text'}"
                    id="field-${id}-${i}"
                    name="${field.name || `field-${i}`}"
                    placeholder="${field.placeholder || placeholder || ''}"
                    ${field.required || required ? 'required' : ''}
                  >
                `}
              </div>
            `).join('')}
            <button type="submit" class="form-submit">
              ${buttonText}
            </button>
          </form>
        </div>`;
        break;

      case 'navbar':
        elementHtml = `
        <div id="element-${id}" class="canvas-element navbar-element">
          <nav class="navbar-container">
            ${logo.text || logo.image ? `
              <div class="navbar-brand">
                ${logo.image ? `
                  <img src="${baseUrl}${logo.image}" alt="${logo.text || 'Logo'}" class="navbar-logo">
                ` : ''}
                ${logo.text ? `
                  <span class="navbar-logo-text">${logo.text}</span>
                ` : ''}
              </div>
            ` : ''}
            <ul class="navbar-links">
              ${items.map((item, i) => `
                <li class="nav-item">
                  <a href="${item.link || '#'}" class="nav-link">
                    ${item.icon ? `<i class="${item.icon}"></i>` : ''}
                    ${item.text || `Link ${i+1}`}
                  </a>
                </li>
              `).join('')}
            </ul>
            ${socialIcons.length > 0 ? `
              <div class="navbar-social">
                ${socialIcons.map(icon => `
                  <a href="${icon.link || '#'}" class="social-icon">
                    <i class="${icon.class || 'fab fa-' + icon.name}"></i>
                  </a>
                `).join('')}
              </div>
            ` : ''}
          </nav>
        </div>`;
        break;

      case 'footer':
        elementHtml = `
        <div id="element-${id}" class="canvas-element footer-element">
          <footer class="footer-container">
            ${columns.map((col, i) => `
              <div class="footer-column">
                <h4 class="footer-title">${col.title || `Column ${i+1}`}</h4>
                <ul class="footer-links">
                  ${col.links.map((link, j) => `
                    <li class="footer-link">
                      <a href="${link.url || '#'}">
                        ${link.icon ? `<i class="${link.icon}"></i>` : ''}
                        ${link.text || `Link ${j+1}`}
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
            ${copyrightText ? `
              <div class="footer-bottom">
                <p>${copyrightText}</p>
              </div>
            ` : ''}
          </footer>
        </div>`;
        break;

      case 'image':
        elementHtml = `
        <div id="element-${id}" class="canvas-element image-element">
          <img src="${baseUrl}${imageUrl}" alt="${label || 'Image'}" class="content-image">
          ${elementContent ? `<div class="image-caption">${elementContent}</div>` : ''}
        </div>`;
        break;

      // Add all other element types you support
      default:
        elementHtml = `
        <div id="element-${id}" class="canvas-element ${type}-element">
          ${elementContent}
        </div>`;
    }

    htmlElements.push(elementHtml);
  });

  // Add component-specific styles
  const componentStyles = `
  /* Form Styles */
  .form-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
    width: 100%;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .form-group label {
    font-weight: 600;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: inherit;
    width: 100%;
  }
  
  .form-submit {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 10px;
    align-self: flex-start;
  }

  /* Navbar Styles */
  .navbar-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 15px 20px;
  }
  
  .navbar-links {
    display: flex;
    gap: 20px;
    list-style: none;
  }
  
  .nav-link {
    text-decoration: none;
    color: inherit;
    transition: color 0.3s;
  }
  
  .nav-link:hover {
    color: var(--primary-color);
  }

  /* Footer Styles */
  .footer-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 30px;
    width: 100%;
    padding: 40px 20px;
  }
  
  .footer-links {
    list-style: none;
  }
  
  .footer-link a {
    text-decoration: none;
    color: inherit;
    transition: color 0.3s;
  }
  
  .footer-link a:hover {
    color: var(--primary-color);
  }
  
  .footer-bottom {
    grid-column: 1 / -1;
    text-align: center;
    padding-top: 20px;
    margin-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }

  /* Image Styles */
  .content-image {
    max-width: 100%;
    height: auto;
    display: block;
  }
  
  .image-caption {
    text-align: center;
    font-style: italic;
    margin-top: 8px;
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