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

            // Generate HTML and CSS
            const { html } = generateHTMLAndCSS(elements);

            // Create exports directory if it doesn't exist
            const outputDir = path.join(__dirname, '../exports');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Save file
            const fileName = `canvas-export-${Date.now()}.html`;
            const filePath = path.join(outputDir, fileName);
            fs.writeFileSync(filePath, html, { encoding: 'utf8' });

            // Respond with download URL
            res.json({
                success: true,
                message: 'Canvas exported successfully.',
                downloadUrl: `/exports/${fileName}`,
                fileName: fileName
            });

        } catch (err) {
            console.error('Export Error:', err);
            next(err);
        }
    }

    // Add this method if you want direct file download endpoint
    static async downloadExport(req, res, next) {
        try {
            const { filename } = req.params;
            const filePath = path.join(__dirname, '../exports', filename);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'File not found' });
            }

            res.download(filePath, filename, (err) => {
                if (err) {
                    console.error('Download Error:', err);
                    next(err);
                }
            });
        } catch (err) {
            console.error('Download Error:', err);
            next(err);
        }
    }
}

module.exports = CanvasController;
