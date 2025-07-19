const { generateHTMLAndCSS } = require('../utils/htmlGenerator');

class CanvasController {
    static async exportCanvas(req, res, next) {
        try {
            // Validate input
            if (!req.body.elements) {
                return res.status(400).json({ error: 'Missing elements data' });
            }

            const { elements, baseUrl } = req.body;
            
            // Force elements to be an array
            const elementsArray = Array.isArray(elements) ? elements : [elements];
            
            // Generate HTML with fallback URL
            const { html } = generateHTMLAndCSS(
                elementsArray,
                baseUrl || `${req.protocol}://${req.get('host')}`
            );

            // Validate HTML output
            if (!html || typeof html !== 'string') {
                throw new Error('Failed to generate HTML');
            }

            // Send response
            res.set({
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': 'attachment; filename="design-export.html"',
                'Content-Length': Buffer.byteLength(html)
            });
            
            return res.send(html);

        } catch (err) {
            console.error('Export Error:', err);
            return res.status(500).json({ 
                error: 'Export failed',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    }
}

module.exports = CanvasController;
