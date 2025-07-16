const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Setup multer storage for images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/images');
        fs.mkdirSync(uploadDir, { recursive: true }); // Ensure folder exists
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeType = allowedTypes.test(file.mimetype);
        const extName = allowedTypes.test(ext);
        if (mimeType && extName) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Route to handle image uploads
router.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/images/${req.file.filename}`;
    res.status(200).json({ message: 'Image uploaded successfully', url: fileUrl });
});

// Static files handler
router.use('/images', express.static(path.join(__dirname, '../uploads/images')));

module.exports = router;
