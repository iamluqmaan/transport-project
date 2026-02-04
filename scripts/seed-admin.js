const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables manually since we are running a script outside Next.js context
// Assuming .env is in the root C:\documents\transport project
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'SUPER_ADMIN' },
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Validating MongoDB connection...');

    const email = 'obalolaluqman16@gmail.com';
    const password = 'obaluqman';
    const name = 'Super Admin';

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log('Admin already exists.');
      // Optional: Update password if needed, but for now just skip
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      });
      console.log('✅ Super Admin created successfully');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
