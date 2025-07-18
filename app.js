const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads/images');
fs.mkdirSync(uploadDir, { recursive: true });

// Enhanced CORS setup
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser with increased limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database connection
connectDB().catch(err => {
    console.error('Database connection failed', err);
    process.exit(1);
});

// Static files with proper caching headers
app.use('/images', express.static(uploadDir, {
    setHeaders: (res, filePath) => {
        const mimeType = express.static.mime.lookup(filePath);
        if (mimeType.startsWith('image/')) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Register routes
app.use('/layouts', require('./routes/layout.routes'));
app.use('/', require('./routes/imageUpload.route'));

// Static assets
app.use('/static', express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Enhanced error handling
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Error:`, err.stack);
    
    // Handle multer errors specifically
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
            success: false,
            error: 'File too large. Maximum 5MB allowed' 
        });
    }
    
    if (err.code === 'LIMIT_FILE_TYPE') {
        return res.status(415).json({ 
            success: false,
            error: 'Only image files are allowed (JPEG, PNG, GIF)' 
        });
    }

    res.status(500).json({ 
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 2000;
const server = app.listen(PORT, () => {
    console.log(`
    ****************************************
    * Application running on port ${PORT}     *
    * Upload directory: ${uploadDir}  *
    * Health check: http://localhost:${PORT}/health *
    ****************************************
    `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

module.exports = app;
