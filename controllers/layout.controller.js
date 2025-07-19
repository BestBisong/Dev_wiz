const fs = require('fs');
const path = require('path');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator');

class CanvasController {
    static async exportCanvas(req, res, next) {
        try {
            const { elements, baseUrl } = req.body; // Add baseUrl from frontend

            if (!Array.isArray(elements)) {
                return res.status(400).json({ error: 'Elements must be an array.' });
            }

            // Generate HTML with absolute URLs if needed
            const { html } = generateHTMLAndCSS(elements, baseUrl || req.protocol + '://' + req.get('host'));

            // Validate HTML
            if (!html || typeof html !== 'string' || html.length < 10) {
                throw new Error('Generated HTML is invalid');
            }

            // Set proper headers
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="canvas-export-${Date.now()}.html"`);
            res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
            
            // Send the file
            res.send(html);

        } catch (err) {
            console.error('Export Error:', err);
            next(new Error(`Failed to export canvas: ${err.message}`));
        }
    }
}

module.exports = CanvasController;
