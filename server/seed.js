const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waqas_medical_store';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for database seeding.');

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

    // 2. Seed Initial Products Sample if Empty
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      const sampleProducts = [
        {
          id: 'p-01',
          name: 'Panadol Extra 500mg/65mg',
          genericName: 'Paracetamol + Caffeine',
          category: 'medicines',
          price: 45.00,
          originalPrice: 50.00,
          stock: 120,
          minStock: 25,
          unit: 'Pack of 100 Tablets',
          requiresPrescription: false,
          temperatureSensitive: false,
          manufacturer: 'GSK Pakistan',
          dosageForm: 'Tablet',
          strength: '500mg/65mg',
          imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
          showOnMainScreen: true
        },
        {
          id: 'p-02',
          name: 'Augmentin 625mg',
          genericName: 'Amoxicillin + Clavulanate Potassium',
          category: 'medicines',
          price: 280.00,
          originalPrice: 310.00,
          stock: 45,
          minStock: 15,
          unit: 'Pack of 14 Tablets',
          requiresPrescription: true,
          temperatureSensitive: false,
          manufacturer: 'GSK Pakistan',
          dosageForm: 'Tablet',
          strength: '625mg',
          imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
          showOnMainScreen: true
        },
        {
          id: 'p-03',
          name: 'Insulin Mixtard 30/70 Penfill',
          genericName: 'Biphasic Isophane Insulin Injection',
          category: 'cold-chain',
          price: 1250.00,
          originalPrice: 1350.00,
          stock: 18,
          minStock: 10,
          unit: 'Pack of 5 x 3ml Cartridges',
          requiresPrescription: true,
          temperatureSensitive: true,
          manufacturer: 'Novo Nordisk',
          dosageForm: 'Injectable Penfill',
          strength: '100 IU/ml',
          imageUrl: 'https://images.unsplash.com/photo-1579165466541-71e22a308350?w=400&q=80',
          showOnMainScreen: true
        }
      ];

      await Product.insertMany(sampleProducts);
      console.log('📦 Seeded initial product catalog items into MongoDB.');
    } else {
      console.log(`ℹ️ Product collection contains ${productCount} items.`);
    }

    console.log('✅ Database seeding finished successfully.');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
