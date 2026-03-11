// Script to fix QuickCommerce products that have no productName
const mongoose = require('mongoose');
require('dotenv').config();
const QuickCommerceProduct = require('../models/QuickCommerceProduct');
const QuickCommercePartner = require('../models/QuickCommercePartner'); // Fix: Use QuickCommercePartner

async function fixProducts() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel_app');
    console.log('Connected to MongoDB');

    // Find or create a default partner
    let defaultPartner = await QuickCommercePartner.findOne().lean();
    if (!defaultPartner) {
      console.log('⚠ No QuickCommerce partners found, will try to use first available or skip');
      defaultPartner = null;
    } else {
      console.log(`✓ Using default partner: ${defaultPartner._id}`);
    }

    // Valid categories from schema
    const validCategories = ['groceries', 'food', 'pharmacy', 'electronics', 'fashion', 'home', 'beauty', 'sports', 'books', 'other'];

    // Find products with missing productName
    const productsWithoutName = await QuickCommerceProduct.find({
      $or: [
        { productName: null },
        { productName: undefined },
        { productName: '' }
      ]
    });

    console.log(`Found ${productsWithoutName.length} products with missing names`);

    let fixed = 0;
    let errors = 0;

    for (const product of productsWithoutName) {
      try {
        let hasChanges = false;
        
        // Set productName if missing
        if (!product.productName || !product.productName.trim()) {
          const productId = product._id.toString().slice(-8);
          product.productName = `Product - ${productId}`;
          hasChanges = true;
          console.log(`  ✓ Set productName: ${product.productName}`);
        }
        
        // Set category if missing
        if (!product.category || !validCategories.includes(product.category)) {
          product.category = 'groceries'; // Default valid category
          hasChanges = true;
          console.log(`  ✓ Set category: groceries`);
        }
        
        // Set stock if missing
        if (!product.stock || product.stock < 0) {
          product.stock = 10;
          hasChanges = true;
          console.log(`  ✓ Set stock: 10`);
        }
        
        // Set price if missing
        if (!product.price || product.price < 0) {
          product.price = 99;
          hasChanges = true;
          console.log(`  ✓ Set price: 99`);
        }
        
        // Set partnerId if missing
        if (!product.partnerId && defaultPartner) {
          product.partnerId = defaultPartner._id;
          hasChanges = true;
          console.log(`  ✓ Set partnerId: ${defaultPartner._id}`);
        } else if (!product.partnerId && !defaultPartner) {
          console.log(`  ⚠ Skipping: No partnerId and no default partner available`);
          errors++;
          continue;
        }
        
        if (hasChanges) {
          await product.save();
          fixed++;
          console.log(`✓ Fixed product ${product._id}`);
        } else {
          console.log(`✓ Product ${product._id} already valid (no changes needed)`);
          fixed++;
        }
      } catch (error) {
        errors++;
        console.error(`✗ Error fixing ${product._id}:`, error.message);
      }
    }

    console.log(`\n✓ Fixed: ${fixed}`);
    console.log(`✗ Errors: ${errors}`);
    
    // Show updated products
    const updatedProducts = await QuickCommerceProduct.find({
      _id: { $in: productsWithoutName.map(p => p._id) }
    }).select('_id productName category price');

    console.log('\nUpdated Products:');
    console.table(updatedProducts);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

fixProducts();
