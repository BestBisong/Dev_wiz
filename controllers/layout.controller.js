    const archiver = require('archiver');
    const { generateHTMLAndCSS } = require('../utils/htmlGenerator');
    const Layout = require('../models/layout.model');

    exports.createLayout = async (req, res) => {
    try {
        // Validate input
        if (!req.body.elements || !Array.isArray(req.body.elements)) {
        return res.status(400).json({ 
            status: 'error',
            message: 'Elements array is required'
        });
        }

        const { elements, name = 'my_layout' } = req.body;
        
        // Generate HTML and CSS
        const { html, css } = generateHTMLAndCSS(elements);
        
        // Create archive
        const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
        });

        // Set response headers
        res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name.replace(/[^a-z0-9]/gi, '_')}.zip"`
        });

        // Pipe archive to response
        archive.pipe(res);

        // Add files to archive
        archive.append(html, { name: 'index.html' });
        archive.append(css, { name: 'styles.css' });

        // Optional: Save to database
        await Layout.create({
        name,
        layoutJSON: elements,
        generatedHTML: html,
        generatedCSS: css
        });

        // Finalize the archive (this will send the response)
        await archive.finalize();

    } catch (error) {
        console.error('Error generating layout:', error);
        
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate layout',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
        }
    }
    };

        exports.getLayout = async (req, res, next) => {
        try {
            const layout = await Layout.findById(req.params.id);
            if (!layout) {
            return res.status(404).json({
                status: 'error',
                message: 'Layout not found'
            });
            }
            res.json({
            status: 'success',
            data: layout
            });
        } catch (error) {
            console.error("Download failed:", error);
        }
        
    };