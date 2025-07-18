const archiver = require('archiver');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator');
const path = require('path');
const fs = require('fs');

exports.createLayout = async (req, res) => {
    try {
        // 1. Validate input
        if (!req.body.elements || !Array.isArray(req.body.elements)) {
            return res.status(400).json({
                status: 'error',
                message: 'Elements array is required'
            });
        }

        const { elements, name = 'my_layout' } = req.body;
        
        // 2. Process elements for absolute URLs and proper formatting
        const processedElements = elements.map(element => {
            const processed = { ...element };
            
            // Handle image URLs
            if (element.label === 'Image' && element.imageUrl) {
                if (!element.imageUrl.startsWith('http') && !element.imageUrl.startsWith('data:')) {
                    processed.imageUrl = `${req.protocol}://${req.get('host')}${element.imageUrl}`;
                }
            }
            
            // Ensure all styles are properly formatted
            if (element.styles) {
                processed.styles = { ...element.styles };
                
                // Convert numeric values to pixels where needed
                const pixelProps = ['width', 'height', 'fontSize', 'borderRadius', 'padding', 'margin'];
                pixelProps.forEach(prop => {
                    if (typeof processed.styles[prop] === 'number') {
                        processed.styles[prop] = `${processed.styles[prop]}px`;
                    }
                });
                
                // Ensure font family is properly quoted
                if (processed.styles.fontFamily) {
                    processed.styles.fontFamily = `"${processed.styles.fontFamily.replace(/"/g, '')}", sans-serif`;
                }
            }
            
            return processed;
        });

        // 3. Generate perfect HTML that matches the editor
        const { html } = generateHTMLAndCSS(processedElements);
        
        // 4. Create archive with all necessary files
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Error handling
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to create zip file'
                });
            }
        });

        // Set response headers
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        res.attachment(`${safeName}.zip`);
        res.setHeader('Content-Type', 'application/zip');

        // Pipe archive to response
        archive.pipe(res);

        // Add main HTML file
        archive.append(html, { name: 'index.html' });

        // Add supporting files (create these directories in your project)
        const assetsDir = path.join(__dirname, '../public/assets');
        if (fs.existsSync(assetsDir)) {
            archive.directory(assetsDir, 'assets');
        }

        // Add any required dependencies
        archive.append('<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">', 
            { name: 'fonts.html' });

        // Finalize the archive
        await archive.finalize();

    } catch (error) {
        console.error('Error generating layout:', error);
        if (!res.headersSent) {
            res.status(500).json({
                status: 'error',
                message: 'Failed to generate layout',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};
