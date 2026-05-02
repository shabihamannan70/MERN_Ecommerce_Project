const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        
        if (!process.env.MONGO_URL) {
            console.log("Error: .env file dosen't in  MONGO_URL!");
            return;
        }

        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Database Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Database Connection Error: ${error.message}`);
    }
};

module.exports = connectDB;