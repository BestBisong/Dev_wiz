const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS setup
app.use(cors({
    origin: '*',
    credentials: true
}));

// JSON Body parser (for large payloads like website layouts)
app.use(express.json({ limit: '1GB' }));

// Initialize database connection
connectDB().catch(err => {
    console.error('Database connection failed', err);
});

// Register routes
app.use('/layouts', require('./routes/layout.routes')); 
app.use('/', require('./routes/imageUpload.route'));    // Image upload route with /upload-image and /images


app.use('/static', express.static(path.join(__dirname, 'public'))); 

// Error handling middleware (should be after all other routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => console.log(`***Application is starting on http://localhost:${PORT}`));
