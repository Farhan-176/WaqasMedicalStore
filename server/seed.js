const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Retailer = require('./models/Retailer');

const DEFAULT_RETAILERS = [
  { 
    name: 'Waqas Partner Retailer', 
    username: 'demo_retailer', 
    password: 'retailer123', 
    licenseNo: '04-DL-3390', 
    area: 'Clifton / DHA, Karachi',
    discountTier: 'Wholesale Trade Price (12-15% OFF)',
    role: 'retailer'
  },
  { 
    name: 'Ali Medicos & Pharmacy', 
    username: 'ali_pharmacy', 
    password: 'retailer123', 
    licenseNo: '04-DL-1982', 
    area: 'Denso Hall / Saddar, Karachi',
    discountTier: 'Wholesale Trade Price (12-15% OFF)',
    role: 'retailer'
  },
  { 
    name: 'City Care Clinic & Med', 
    username: 'city_clinic', 
    password: 'retailer123', 
    licenseNo: '04-DL-2415', 
    area: 'Gulshan-e-Iqbal, Karachi',
    discountTier: 'Wholesale Trade Price (12-15% OFF)',
    role: 'retailer'
  }
];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/waqas_medical_store';

function loadFullCatalog() {
  try {
    const mockDataPath = path.join(__dirname, '../src/mockData.js');
    const content = fs.readFileSync(mockDataPath, 'utf8');
    const match = content.match(/export const MOCK_PRODUCTS = (\[[\s\S]*?\]);/);
    if (match && match[1]) {
      const products = JSON.parse(match[1]);
      return products.map((p, idx) => {
        const rawCode = p.code ? String(p.code).trim() : '';
        const formattedCode = rawCode 
          ? (/^\d+$/.test(rawCode) ? rawCode.padStart(4, '0') : rawCode)
          : String(idx + 1).padStart(4, '0');

        const strips = Math.max(1, p.stripsPerPack || 10);
        const stripPrice = p.stripPrice || (p.price ? Math.round((p.price / strips) * 100) / 100 : null);

        return {
          code: formattedCode,
          name: p.name,
          genericName: p.genericName || p.name,
          category: p.category || 'medicines',
          price: p.price || 100,
          originalPrice: p.originalPrice || p.price || 100,
          discountPercent: p.discountPercent || 0,
          packagingMode: p.packagingMode || (p.hasStripOption ? 'both' : 'pack'),
          stripsPerPack: strips,
          stripPrice: stripPrice,
          unit: p.unit || 'Pack',
          stock: p.stock || 50,
          reservedStock: 0,
          requiresPrescription: Boolean(p.requiresPrescription),
          coldStorage: Boolean(p.coldStorage),
          image: p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80',
          showOnMainScreen: p.showOnMainScreen !== false,
          batches: [
            {
              batchNo: `BATCH-${formattedCode}`,
              mfgDate: new Date('2025-01-01'),
              expiryDate: new Date('2028-12-31'),
              purchaseCost: Math.round((p.price || 100) * 0.85 * 100) / 100,
              sellingPrice: p.price || 100,
              stockQuantity: p.stock || 50
            }
          ]
        };
      });
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
        email: 'admin@waqasmedical.com',
        pharmacistLicenseNo: 'DRAP-LIC-78921'
      });
      await adminUser.save();
      console.log('🔑 Created default admin user ("admin" / "admin123" securely hashed)');
    } else {
      console.log('ℹ️ Admin user already exists in database.');
    }

    // 2. Seed Full Product Catalog Dataset
    const fullProducts = loadFullCatalog();
    if (fullProducts && fullProducts.length > 0) {
      await Product.deleteMany({}); // Refresh catalog with full dataset including item codes
      await Product.insertMany(fullProducts);
      console.log(`📦 Successfully seeded ALL ${fullProducts.length} products with official item CODES into MongoDB Atlas!`);
    } else {
      console.log('ℹ️ Catalog dataset ready.');
    }

    // 3. Seed Default B2B Retailers
    for (const ret of DEFAULT_RETAILERS) {
      const existingRet = await Retailer.findOne({ username: ret.username });
      if (!existingRet) {
        await Retailer.create(ret);
        console.log(`🏢 Created B2B Retailer Partner: ${ret.name} ("${ret.username}" / "${ret.password}")`);
      } else {
        console.log(`ℹ️ Retailer partner "${ret.username}" already exists.`);
      }
    }

    console.log('✅ Database seeding finished successfully.');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
