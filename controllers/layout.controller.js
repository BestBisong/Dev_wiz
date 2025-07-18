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
        
        // Process elements to ensure image URLs are absolute
        const processedElements = elements.map(element => {
            if (element.type === 'image' && element.imageUrl) {
                // Handle both relative and absolute URLs
                if (!element.imageUrl.startsWith('http') && !element.imageUrl.startsWith('/')) {
                    return {
                        ...element,
                        imageUrl: `${req.protocol}://${req.get('host')}/images/${element.imageUrl}`
                    };
                }
                if (element.imageUrl.startsWith('/') && !element.imageUrl.startsWith('//')) {
                    return {
                        ...element,
                        imageUrl: `${req.protocol}://${req.get('host')}${element.imageUrl}`
                    };
                }
            }
            return element;
        });

        // Generate HTML and CSS with proper error handling
        let html, css;
        try {
            const result = generateHTMLAndCSS(processedElements);
            html = result.html;
            css = result.css;
        } catch (error) {
            console.error('HTML/CSS generation error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to generate HTML/CSS'
            });
        }

        // Create archive
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        // Set response headers before piping
        res.attachment(`${name.replace(/[^a-z0-9]/gi, '_')}.zip`);
        
        // Handle archive events
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('Archive warning:', err);
            } else {
                throw err;
            }
        });

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to create zip file'
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