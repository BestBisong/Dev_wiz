    const mongoose = require ('mongoose');

    const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI||"mongodb+srv://Dev-Wiz:Y1blPjysyzdmgn9I@cluster0.exugexz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
        });
        console.log('database Connected');
    } catch (err) {
        console.error(err.message);
    }
    };

    module.exports = connectDB;
