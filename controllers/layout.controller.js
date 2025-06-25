    const Layout = require('../models/layout.model');
    const { generateHTMLAndCSS } = require('../utils/htmlGenerator');
    const archiver = require('archiver');

    exports.createLayout = async (req, res, next) => {
    try {
        // Validate input
        if (!req.body.elements || !Array.isArray(req.body.elements)) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid elements data'
        });
        }

        const { elements, name = 'Untitled Layout' } = req.body;

        // Generate HTML and CSS
        const { html, css } = generateHTMLAndCSS(elements);

        // Create zip archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        // Handle archive errors
        archive.on('error', (err) => {
        throw new Error(`Archive error: ${err.message}`);
        });

        // Set response headers
        res.attachment(`${name.replace(/[^a-z0-9]/gi, '_')}.zip`);
        archive.pipe(res);

        // Add files to archive
        archive.append(html, { name: 'index.html' });
        archive.append(css, { name: 'styles.css' });


        const newLayout = new Layout({
        name,
        layoutJSON: elements,
        generatedHTML: html,
        generatedCSS: css
        });
        await newLayout.save();

        // Finalize the archive
        await archive.finalize();

    } catch (error) {
        next(error);
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
        next(error);
    }
    };