import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

const verify = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGODB_URI!);
    }

    if (!mongoose.connection.db) {
        throw new Error('Database connection failed to initialize');
    }
    const db = mongoose.connection.db;

    const collections = ['bookings', 'routes', 'transactions', 'reviews', 'routetemplates'];
    console.log('--- Verification Report ---');
    for (const name of collections) {
        const count = await db.collection(name).countDocuments();
        console.log(`${name}: ${count}`);
    }
    console.log('---------------------------');
    await mongoose.disconnect();
};

verify();
