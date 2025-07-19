const fs = require('fs');
const path = require('path');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator');

class CanvasController {
    static async exportCanvas(req, res, next) {
        try {
            const { elements } = req.body;

            if (!Array.isArray(elements)) {
                return res.status(400).json({ error: 'Elements must be an array.' });
            }

            const { html } = generateHTMLAndCSS(elements);
            const fileName = `canvas-export-${Date.now()}.html`;

            // Validate HTML first
            if (!html || typeof html !== 'string' || html.length < 10) {
                throw new Error('Generated HTML is invalid');
            }

            // Option 1: Direct download with proper headers
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
            res.send(html);

            // Option 2: If you want to save to file AND download
            /*
            const filePath = path.join(__dirname, '../exports', fileName);
            fs.writeFileSync(filePath, html, { encoding: 'utf8' });
            
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error('Download failed:', err);
                    fs.unlinkSync(filePath); // Clean up
                    next(err);
                }
            });
            */

        } catch (err) {
            console.error('Export Error:', err);
            next(new Error(`Failed to export canvas: ${err.message}`));
        }
    }
}

module.exports = CanvasController;
