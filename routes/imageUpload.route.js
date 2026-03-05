const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/images');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
    }
});

// Upload endpoint
router.post('/upload-image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                error: 'No file uploaded or invalid file type' 
            });
        }

        // Create proper URL (handles HTTP/HTTPS automatically)
        const fileUrl = new URL(`/images/${req.file.filename}`, `${req.protocol}://${req.get('host')}`).toString();
        
        res.status(200).json({ 
            success: true,
            imageUrl: fileUrl,
            filename: req.file.filename
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process image upload'
        });
    }
});

// Static files serving with proper caching
router.use('/images', express.static(path.join(__dirname, '../uploads/images'), {
    setHeaders: (res, path) => {
        // Set cache for 1 year for images
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        // Set proper content type based on file extension
        const ext = path.split('.').pop().toLowerCase();
        const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp'
        };
        
        if (mimeTypes[ext]) {
            res.set('Content-Type', mimeTypes[ext]);
        }
    }
}));

// Error handling middleware for upload routes
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            error: err.code === 'LIMIT_FILE_SIZE' 
                ? 'File too large. Maximum 50MB allowed' 
                : 'File upload error'
        });
    }
    next(err);
});

module.exports = router;
