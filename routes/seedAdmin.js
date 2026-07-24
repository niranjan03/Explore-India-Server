require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const DB_NAME = 'explore_india';

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🍃 Connected to MongoDB...');
    const db = client.db(DB_NAME);
    const adminsCollection = db.collection('admins');

    const adminEmail = 'admin@exploreindia.com';
    const rawPassword = 'SuperSecretAdminPassword123'; // Change this to your desired password

    // Check if the admin account already exists
    const existingAdmin = await adminsCollection.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists in the database.');
      process.exit(0);
    }

    // Hash password with 10 salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    // Insert admin record into the 'admins' collection
    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await adminsCollection.insertOne(adminUser);
    console.log(`✅ Admin user successfully created with ID: ${result.insertedId}`);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedAdmin();