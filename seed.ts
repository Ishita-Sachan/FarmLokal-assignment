import { Product, sequelize } from './database.js';
import { faker } from '@faker-js/faker';

async function seedDatabase() {
    console.log("🚀 Starting database seeding...");
    
    try {
        // This connects to MySQL and creates the table
        // 'force: true' deletes old data so you start fresh
        await sequelize.sync({ force: true }); 
        
        const totalRecords = 1000000;
        const batchSize = 10000; // We insert 10,000 at a time to keep it fast
        const categories = ['Fruits', 'Vegetables', 'Dairy', 'Grains', 'Poultry'];

        for (let i = 0; i < totalRecords; i += batchSize) {
            const products = [];
            
            for (let j = 0; j < batchSize; j++) {
                products.push({
                    name: faker.commerce.productName(),
                    price: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
                    category: categories[Math.floor(Math.random() * categories.length)],
                    description: faker.commerce.productDescription()
                });
            }

            // This sends the batch of 10k to MySQL in one go
            await Product.bulkCreate(products);
            
            const progress = (((i + batchSize) / totalRecords) * 100).toFixed(1);
            console.log(`⏳ Progress: ${progress}% (${i + batchSize} records)`);
        }

        console.log("✅ Successfully seeded 1,000,000 products!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed. Is MySQL running?", error);
        process.exit(1);
    }
}

seedDatabase();