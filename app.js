    const express = require('express');
    const connectDB = require('./config/db');
    const cors= require('cors');

    const app = express();

    app.use(cors({
        origin: '*',
        credentials:true
        }));

    app.use(express.json({ limit: '100mb' })); // or even higher



    // Initialize database connection
    connectDB().catch(err => {
    console.error('Database connection failed', err);

    });



    app.use('/layouts', require('./routes/layout.routes'));

    // Error handling middleware (should be after all other middleware/routes)
    app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
    });

    // Server setup
    const PORT = process.env.PORT||2000;
    app.listen(PORT, () => console.log(`***Application is starting on http://localhost:${PORT}`));
