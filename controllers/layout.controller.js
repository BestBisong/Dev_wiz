const { generateHTMLAndCSS } = require('../utils/htmlGenerator');
const archiver = require('archiver');

exports.createAndDownloadLayout = async (req, res) => {
    try {
        // Validate input
        if (!req.body || !req.body.elements) {
            return res.status(400).json({ 
                success: false,
                message: "Elements data is required" 
            });
        }

        const { name = "my_layout", elements } = req.body;

        // Generate HTML and CSS
        const { html, css } = generateHTMLAndCSS(elements);

        // Create zip archive
        const archive = archiver('zip');
        res.attachment(`${name.replace(/[^a-z0-9]/gi, '_')}.zip`);

        archive.pipe(res);
        archive.append(html, { name: 'index.html' });
        archive.append(css, { name: 'styles.css' });
        
        await archive.finalize();

    } catch (error) {
        console.error("Download failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate download",
            error: error.message
        });
    }
};