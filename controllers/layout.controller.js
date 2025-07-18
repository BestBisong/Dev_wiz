const archiver = require('archiver');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator');
const Layout = require('../models/layout.model');

exports.createLayout = async (req, res) => {
    try {
        if (!req.body.elements || !Array.isArray(req.body.elements)) {
            return res.status(400).json({
                status: 'error',
                message: 'Elements array is required'
            });
        }

        const { elements, name = 'my_layout' } = req.body;
        
        // Process elements to ensure proper image URLs
        const processedElements = elements.map(element => {
            if (element.label === 'Image' && element.imagePreview) {
                return {
                    ...element,
                    content: element.imagePreview // Ensure imagePreview is used as content
                };
            }
            return element;
        });

        const { html, css } = generateHTMLAndCSS(processedElements);
        
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Set proper headers before piping
        res.attachment(`${name.replace(/[^a-z0-9]/gi, '_')}.zip`);
        res.setHeader('Content-Type', 'application/zip');

        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('Archive warning:', err);
            } else {
                console.error('Archive error:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        status: 'error',
                        message: 'Archive creation failed'
                    });
                }
            }
        });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'error',
                    message: 'Archive creation failed'
                });
            }
        });

        // Pipe archive to response
        archive.pipe(res);

        // Add files to archive
        archive.append(html, { name: 'index.html' });
        archive.append(css, { name: 'styles.css' });

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
