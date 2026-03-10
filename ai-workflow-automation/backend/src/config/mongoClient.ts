import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-automation';

export async function connectToMongoDB(): Promise<void> {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('❌ MongoDB error:', error);
});

export { mongoose };
