import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// 1. Create the connection
// Replace 'yourpassword' with your actual MySQL password
export const sequelize = new Sequelize('farmlokal_db', 'root', process.env.DB_PASSWORD, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false // This keeps the terminal clean
});

// 2. Define the Product model
export const Product = sequelize.define('Product', {
    name: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    price: { 
        type: DataTypes.FLOAT, 
        allowNull: false 
    },
    category: { 
        type: DataTypes.STRING 
    },
    description: { 
        type: DataTypes.TEXT 
    }
}, {
    // These indexes make searching 1 million records fast!
    indexes: [
        { fields: ['category'] },
        { fields: ['name'] }
    ]
});