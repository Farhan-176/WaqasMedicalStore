const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waqas_medical_store';

function loadFullCatalog() {
  try {
    const mockDataPath = path.join(__dirname, '../src/mockData.js');
    const content = fs.readFileSync(mockDataPath, 'utf8');
    const match = content.match(/export const MOCK_PRODUCTS = (\[[\s\S]*?\]);/);
    if (match && match[1]) {
      const products = JSON.parse(match[1]);
      return products.map(p => ({
        id: p.id,
        name: p.name,
        genericName: p.genericName || p.name,
        category: p.category || 'medicines',
        price: p.price || 100,
        originalPrice: p.originalPrice || p.price || 100,
        stock: p.stock || 50,
        minStock: 10,
        unit: p.unit || 'Unit',
        requiresPrescription: Boolean(p.requiresPrescription),
        temperatureSensitive: Boolean(p.coldStorage),
        imageUrl: p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
        showOnMainScreen: p.showOnMainScreen !== false
      }));
    }
  } catch (err) {
    console.warn('⚠️ Could not parse full mockData.js catalog:', err.message);
  }
  return null;
}

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas for database seeding.');

    // 1. Seed Default Admin User
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      const adminUser = new User({
        username: 'admin',
        passwordHash,
        name: 'Dr. Waqas (Chief Pharmacist)',
        role: 'Pharmacist Admin',
        email: 'admin@waqasmedical.com'
      });
      await adminUser.save();
      console.log('🔑 Created default admin user ("admin" / "admin123" securely hashed)');
    } else {
      console.log('ℹ️ Admin user already exists in database.');
    }

    // 2. Seed Full Product Catalog Dataset
    const fullProducts = loadFullCatalog();
    if (fullProducts && fullProducts.length > 0) {
      await Product.deleteMany({}); // Refresh catalog with full dataset
      await Product.insertMany(fullProducts);
      console.log(`📦 Successfully seeded ALL ${fullProducts.length} products from official catalog into MongoDB Atlas!`);
    } else {
      console.log('ℹ️ Catalog dataset ready.');
    }

    console.log('✅ Database seeding finished successfully.');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
