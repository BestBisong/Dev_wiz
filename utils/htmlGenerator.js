function generateHTMLAndCSS(elements, baseUrl = '') {
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
    min-height: 90vh;
    margin: 0 auto;
    background-color: var(--white);
    box-shadow: var(--shadow);
    padding: 30px;
    border-radius: 8px;
  }

  .canvas-element {
    position: absolute;
    transform: translate(0, 0);
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
      imageUrl = '',
      items = [],
      fields = [],
      columns = [],
      links = [],
      mapUrl = '',
      placeholder = '',
      required = false,
      options = [],
      buttonText = 'Submit',
      logo = {},
      socialIcons = [],
      copyrightText = '',
      backgroundColor,
      textColor,
      borderColor,
      borderRadius,
      fontSize,
      fontWeight,
    } = element;

    let cssRule = `#element-${id} {\n`;
    cssRule += `  position: absolute;\n`;
    cssRule += `  left: ${position.x}px;\n`;
    cssRule += `  top: ${position.y}px;\n`;
    cssRule += `  width: ${typeof size.width === 'number' ? size.width + 'px' : size.width};\n`;
    cssRule += `  height: ${typeof size.height === 'number' ? size.height + 'px' : size.height};\n`;

    const styleProperties = {
      ...styles,
      backgroundColor: backgroundColor || styles.backgroundColor,
      color: textColor || styles.color,
      borderColor: borderColor || styles.borderColor,
      borderRadius: borderRadius || styles.borderRadius,
      fontSize: fontSize || styles.fontSize,
      fontWeight: fontWeight || styles.fontWeight,
    };

    Object.entries(styleProperties).forEach(([key, value]) => {
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

    // HTML Generation with IDs in ALL components
    let elementHtml = '';
    const elementContent = customText || content || '';

    switch (type.toLowerCase()) {
      case 'map':
        elementHtml = `
        <div id="element-${id}" class="canvas-element map-element">
          <iframe 
            id="map-${id}"
            src="${mapUrl}" 
            width="${typeof size.width === 'number' ? size.width + 'px' : size.width}" 
            height="${typeof size.height === 'number' ? size.height + 'px' : size.height}" 
            style="border:0;" 
            allowfullscreen 
            loading="lazy">
          </iframe>
        </div>`;
        break;

      case 'form':
        elementHtml = `
        <div id="element-${id}" class="canvas-element form-element">
          <form id="form-${id}" class="form-container">
            ${label ? `<h3 class="form-title">${label}</h3>` : ''}
            ${fields.map((field, i) => `
              <div class="form-group">
                <label for="field-${id}-${i}">${field.label || `Field ${i+1}`}</label>
                ${field.type === 'textarea' ? `
                  <textarea id="field-${id}-${i}" name="${field.name || `field-${i}`}" placeholder="${field.placeholder || placeholder}" ${field.required || required ? 'required' : ''}></textarea>
                ` : field.type === 'select' ? `
                  <select id="field-${id}-${i}" name="${field.name || `field-${i}`}" ${field.required || required ? 'required' : ''}>
                    ${(field.options || options).map(opt => `<option value="${opt.value || opt}">${opt.label || opt}</option>`).join('')}
                  </select>
                ` : `
                  <input type="${field.type || 'text'}" id="field-${id}-${i}" name="${field.name || `field-${i}`}" placeholder="${field.placeholder || placeholder}" ${field.required || required ? 'required' : ''}>
                `}
              </div>
            `).join('')}
            <button type="submit" class="form-submit" id="submit-${id}">${buttonText}</button>
          </form>
        </div>`;
        break;

      case 'navbar':
        elementHtml = `
        <div id="element-${id}" class="canvas-element navbar-element">
          <nav id="navbar-${id}" class="navbar-container">
            ${logo.text || logo.image ? `
              <div class="navbar-brand" id="navbar-brand-${id}">
                ${logo.image ? `<img src="${baseUrl}${logo.image}" alt="${logo.text || 'Logo'}" class="navbar-logo">` : ''}
                ${logo.text ? `<span class="navbar-logo-text">${logo.text}</span>` : ''}
              </div>
            ` : ''}
            <ul class="navbar-links" id="navbar-links-${id}">
              ${items.map((item, i) => `
                <li class="nav-item" id="nav-item-${id}-${i}">
                  <a href="${item.link || '#'}" class="nav-link">
                    ${item.icon ? `<i class="${item.icon}"></i>` : ''}
                    ${item.text || `Link ${i+1}`}
                  </a>
                </li>
              `).join('')}
            </ul>
            ${socialIcons.length > 0 ? `
              <div class="navbar-social" id="navbar-social-${id}">
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
          <footer id="footer-${id}" class="footer-container">
            ${columns.map((col, i) => `
              <div class="footer-column" id="footer-column-${id}-${i}">
                <h4 class="footer-title">${col.title || `Column ${i+1}`}</h4>
                <ul class="footer-links">
                  ${col.links.map((link, j) => `
                    <li class="footer-link" id="footer-link-${id}-${i}-${j}">
                      <a href="${link.url || '#'}">
                        ${link.icon ? `<i class="${link.icon}"></i>` : ''}
                        ${link.text || `Link ${j+1}`}
                      </a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
            ${copyrightText ? `<div class="footer-bottom" id="footer-bottom-${id}"><p>${copyrightText}</p></div>` : ''}
          </footer>
        </div>`;
        break;

      case 'image':
        elementHtml = `
        <div id="element-${id}" class="canvas-element image-element">
          <img id="image-${id}" src="${baseUrl}${imageUrl}" alt="${label || 'Image'}" class="content-image">
          ${elementContent ? `<div class="image-caption" id="caption-${id}">${elementContent}</div>` : ''}
        </div>`;
        break;

      default:
        elementHtml = `
        <div id="element-${id}" class="canvas-element ${type}-element">
          <div id="${type}-content-${id}">
            ${elementContent}
          </div>
        </div>`;
    }

    htmlElements.push(elementHtml);
  });

  const componentStyles = `
  .form-container { display: flex; flex-direction: column; gap: 15px; width: 100%; }
  .form-group { display: flex; flex-direction: column; gap: 8px; }
  .form-submit { background-color: var(--primary-color); color: white; border: none; padding: 12px 20px; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 10px; align-self: flex-start; }
  .navbar-container { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 15px 20px; }
  .footer-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; width: 100%; padding: 40px 20px; }
  .content-image { max-width: 100%; height: auto; display: block; }
  .image-caption { text-align: center; font-style: italic; margin-top: 8px; }
  `;

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
