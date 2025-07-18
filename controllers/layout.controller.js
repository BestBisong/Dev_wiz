const fs = require('fs');
const path = require('path');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator'); // adjust the path if needed

class CanvasController {
    static async exportCanvas(req, res, next) {
        try {
            const { elements } = req.body;

            if (!Array.isArray(elements)) {
                return res.status(400).json({ error: 'Elements must be an array.' });
            }

            // Generate HTML and CSS
            const { html } = generateHTMLAndCSS(elements);

            // Optional: Save to file (e.g., for download later)
            const outputDir = path.join(__dirname, '../exports');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir);
            }

            const fileName = `canvas-${Date.now()}.html`;
            const filePath = path.join(outputDir, fileName);

            fs.writeFileSync(filePath, html, 'utf8');

            // Send back the file URL or HTML directly
            res.json({
                message: 'Canvas exported successfully.',
                fileUrl: `/exports/${fileName}`, // Assumes /exports is a static folder served by Express
                htmlPreview: html // Optional: Return the HTML directly for preview in frontend
            });

        } catch (err) {
            console.error('Export Error:', err);
            next(err);
        }
    }
}

module.exports = CanvasController;
