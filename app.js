const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Create necessary directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads/images');
const exportDir = path.join(__dirname, 'exports');

[uploadDir, exportDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Enhanced CORS setup
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

// Body parser with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database connection
connectDB().catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
});

// Configure static file serving with proper MIME types and caching
const configureStatic = (route, dir) => {
    app.use(route, express.static(dir, {
        setHeaders: (res, filePath) => {
            const ext = path.extname(filePath).toLowerCase().substring(1);
            const mimeTypes = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp',
                svg: 'image/svg+xml',
                html: 'text/html',
                css: 'text/css',
                js: 'application/javascript'
            };

            if (mimeTypes[ext]) {
                res.set('Content-Type', mimeTypes[ext]);
            }

            // Cache images for 1 year (immutable)
            if (ext.match(/(jpg|jpeg|png|gif|webp|svg)$/)) {
                res.set('Cache-Control', 'public, max-age=31536000, immutable');
            }
        }
    }));
};

// Set up static file serving
configureStatic('/images', uploadDir);
configureStatic('/exports', exportDir);
configureStatic('/static', path.join(__dirname, 'public'));

// Register routes
app.use('/layouts', require('./routes/layout.routes'));
app.use('/', require('./routes/imageUpload.route'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        directories: {
            uploads: uploadDir,
            exports: exportDir
        },
        memoryUsage: process.memoryUsage()
    });
});

// Test image endpoint
app.get('/test-image', (req, res) => {
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (fs.existsSync(testImagePath)) {
        res.sendFile(testImagePath);
    } else {
        res.status(404).json({ error: 'Test image not found' });
    }
});

// Enhanced error handling
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    
    // Handle file-related errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
            success: false,
            error: 'File too large. Maximum 50MB allowed' 
        });
    }
    
    if (err.code === 'LIMIT_FILE_TYPE') {
        return res.status(415).json({ 
            success: false,
            error: 'Only image files are allowed (JPEG, PNG, GIF, WEBP, SVG)' 
        });
    }

    res.status(500).json({ 
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 2000;
const server = app.listen(PORT, () => {
    console.log(`
    ****************************************
    * Application running on port ${PORT}     *
    * Upload directory: ${uploadDir}  *
    * Export directory: ${exportDir}  *
    * Health check: http://localhost:${PORT}/health *
    * Test image: http://localhost:${PORT}/test-image *
    ****************************************
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
});

module.exports = app;
