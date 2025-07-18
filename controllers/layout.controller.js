const archiver = require('archiver');
const { generateHTMLAndCSS } = require('../utils/htmlGenerator');
const Layout = require('../models/layout.model');
const mongoose = require('mongoose');

exports.createLayout = async (req, res) => {
    try {
        if (!req.body.elements || !Array.isArray(req.body.elements)) {
            return res.status(400).json({
                status: 'error',
                message: 'Elements array is required'
            });
        }

        const { elements, name = 'my_layout' } = req.body;
        
        // Process elements to ensure image URLs are properly formatted
        const processedElements = elements.map(element => {
            // If it's an image element and has imagePreview, use that as content
            if (element.label === 'Image' && element.imagePreview) {
                return {
                    ...element,
                    content: element.imagePreview
                };
            }
            return element;
        });

        const { html, css } = generateHTMLAndCSS(processedElements);
        
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${name.replace(/[^a-z0-9]/gi, '_')}.zip"`
        });

        archive.pipe(res);

        archive.append(html, { name: 'index.html' });
        archive.append(css, { name: 'styles.css' });

        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('Archive warning:', err);
            } else {
                throw err;
            }
        });

        archive.on('error', (err) => {
            throw err;
        });

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

exports.getLayout = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid ID format'
            });
        }

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
        console.error("Error fetching layout:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch layout',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
