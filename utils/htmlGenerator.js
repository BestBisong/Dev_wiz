    function generateHTML(node) {
    if (typeof node === 'string') return node;

    const { type, props = {}, children = [] } = node;
    const attrString = Object.entries(props)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');

    const childrenHTML = children.map(generateHTML).join('');
    return `<${type} ${attrString}>${childrenHTML}</${type}>`;
    }

    function wrapWithHTMLPage(bodyHTML, css = "") {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Generated Layout</title>
    <style>~${css}</style>
    </head>
    <body>
    ${bodyHTML}
    </body>
    </html>
    `;
    }

    module.exports = { generateHTML, wrapWithHTMLPage };
