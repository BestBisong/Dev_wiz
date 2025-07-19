// utils/sanitizer.js

const sanitizeHtml = require('sanitize-html');

function sanitize(input) {
    if (typeof input !== 'string') {
        return input; // Only sanitize strings
    }

    return sanitizeHtml(input, {
        allowedTags: [ 'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span' ],
        allowedAttributes: {
            'a': [ 'href', 'name', 'target' ],
            'span': [ 'style' ]
        },
        allowedSchemes: [ 'http', 'https', 'mailto' ],
        allowedStyles: {
            '*': {
                // Allow basic text styles
                'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb/, /^rgba/],
                'font-weight': [/^\d+$/, /^bold$/],
                'text-decoration': [/^underline$/, /^line-through$/],
            }
        },
        // Remove any other unwanted HTML
        disallowedTagsMode: 'discard'
    });
}

module.exports = { sanitize };
