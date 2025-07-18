const archiver = require('archiver');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator');

exports.createLayout = async (req, res) => {
    try {
        if (!req.body.elements || !Array.isArray(req.body.elements)) {
            return res.status(400).json({
                status: 'error',
                message: 'Elements array is required'
            });
        }

        const { elements, name = 'my_layout' } = req.body;
        
        // Process elements to ensure image URLs are absolute
        const processedElements = elements.map(element => {
            if (element.label === 'Image' && element.imageUrl && !element.imageUrl.startsWith('http')) {
                return {
                    ...element,
                    imageUrl: `${req.protocol}://${req.get('host')}${element.imageUrl}`
                };
            }
            return element;
        });

        const { html, css } = generateHTMLAndCSS(processedElements);
        
        // Create archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to create zip file'
                });
            }
        });

        // Set response headers before piping
        res.attachment(`${name.replace(/[^a-z0-9]/gi, '_')}.zip`);
        res.setHeader('Content-Type', 'application/zip');

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
