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
        
        // Validate generated content
        if (!html || !css) {
        throw new Error('Generated HTML or CSS is empty');
        }

        // First save to database
        const savedLayout = await Layout.create({
        name,
        layoutJSON: elements,
        generatedHTML: html,
        generatedCSS: css
        });

        // Create archive
        const archive = archiver('zip', {
        zlib: { level: 9 }
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

        // Event handlers
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

        res.on('close', () => {
        console.log('Archive wrote %d bytes', archive.pointer());
        });

        // Finalize and wait for completion
        await new Promise((resolve, reject) => {
        archive.on('end', resolve);
        archive.on('error', reject);
        archive.finalize();
        });

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