import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI or DATABASE_URL not found in .env');
  process.exit(1);
}

const clearData = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    }

    // Models to clear
    const modelsToClear = [
      'Booking',
      'Route',
      'Transaction',
      'Review',
      'RouteTemplate'
    ];

    console.log('⚠️  Starting data clearance...');

    for (const modelName of modelsToClear) {
      // Check if model exists in Mongoose, if not, try to import it or define a temporary schema
      // Since we just want to delete, we can get the collection directly
      const collectionName = modelName.toLowerCase() + 's'; // simplistic pluralization, but let's be safer
      
      // Better approach: Use mongoose.connection.collection(name).deleteMany({})
      // We need to know the exact collection names. usually lowercase plural.
      // Booking -> bookings
      // Route -> routes
      // Transaction -> transactions
      // Review -> reviews
      // RouteTemplate -> routetemplates (Mongoose default) or route_templates?
      
      // Let's rely on Mongoose models if we can import them, OR just use the names we saw in `src/models`
      // But importing might be tricky with paths in a standalone script without tsconfig paths aliases working in ts-node/tsx out of the box unless configured.
      // SAFE BET: Use `mongoose.connection.db.collection(name).deleteMany({})`
      
      // Let's inspect collection names first? No, let's just attempt to clear known collections.
      // In Mongoose, `Booking` usually maps to `bookings`.
      
      const collections = {
        'Booking': 'bookings',
        'Route': 'routes',
        'Transaction': 'transactions',
        'Review': 'reviews',
        'RouteTemplate': 'routetemplates' // Verify this?
      };

      // Mongoose defines collection names. 
      // Let's try to load the models dynamically??
      // To be safe and simple, I will assume standard pluralization.
    }

    // Actually, to be 100% sure, I will define minimal models or just use `mongoose.model` if I knew the schema, 
    // BUT even better, I can just list all collections and delete the ones provided.
    
    // Let's try to access the collections directly.
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Found collections:', collectionNames);

    const targetCollections = ['bookings', 'routes', 'transactions', 'reviews', 'routetemplates'];

    for (const name of collectionNames) {
      if (targetCollections.includes(name)) {
        const result = await mongoose.connection.db.collection(name).deleteMany({});
        console.log(`🗑️  Cleared ${name}: ${result.deletedCount} documents`);
      }
    }

    console.log('✅ Data clearance complete!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
    process.exit(0);
  }
};

clearData();
