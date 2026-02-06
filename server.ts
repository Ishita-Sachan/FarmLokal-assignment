import express from 'express';
import type { Request, Response } from 'express';
import { createClient } from 'redis';
import axios from 'axios';
import { Op } from 'sequelize';
// IMPORTANT: Keep the .js extension for NodeNext compatibility
import { Product, sequelize } from './database.js';

const app = express();
app.use(express.json());

// 1. Connect to Redis (Memurai)
const redisClient = createClient();
redisClient.on('error', err => console.log('Redis Client Error', err));
await redisClient.connect();

// 2. OAUTH2 TOKEN LOGIC (Requirement: Authentication & Caching)
async function getAuthToken() {
    const cacheKey = 'oauth_access_token';
    
    // Check if token is already in Redis
    const cachedToken = await redisClient.get(cacheKey);
    if (cachedToken) return cachedToken;

    // Simulate fetching from an OAuth Provider
    console.log("🔑 Fetching new OAuth token...");
    const mockToken = "farmlokal_secure_token_99";
    
    // Cache for 1 hour (3600 seconds)
    await redisClient.setEx(cacheKey, 3600, mockToken);
    return mockToken;
}

// 3. PRODUCT LISTING API (Requirement: Performance & Search/Filters)
app.get('/products', async (req: Request, res: Response) => {
    try {
        const { category, search, minPrice, maxPrice, cursor, limit = 10 } = req.query;

        // Create a unique key for this specific search result in Redis
        const cacheKey = `products:${category}:${search}:${minPrice}:${maxPrice}:${cursor}`;
        
        // Caching Strategy: Check Redis first for P95 < 200ms performance
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
            return res.json(JSON.parse(cachedResults));
        }

        // Build the dynamic WHERE clause for MySQL
        const whereClause: any = {};

        if (category) {
            whereClause.category = category;
        }

        if (search) {
            // Searches for the text anywhere in the product name
            whereClause.name = { [Op.like]: `%${search}%` };
        }

        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price[Op.gte] = Number(minPrice);
            if (maxPrice) whereClause.price[Op.lte] = Number(maxPrice);
        }

        // Cursor-based pagination (Better performance for 1M+ records than OFFSET)
        if (cursor) {
            whereClause.id = { [Op.gt]: Number(cursor) };
        }

        // Fetch from Database
        const products = await Product.findAll({
            where: whereClause,
            limit: Number(limit),
            order: [['id', 'ASC']]
        });

        // Store result in Redis for 5 minutes
        await redisClient.setEx(cacheKey, 300, JSON.stringify(products));

        res.json(products);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 4. WEBHOOK INTEGRATION (Requirement: Idempotency & Safe Retries)
app.post('/webhook', async (req: Request, res: Response) => {
    const { eventId, data } = req.body;

    if (!eventId) return res.status(400).json({ error: "Missing eventId" });

    // Idempotency: Use Redis to check if we've seen this eventId in the last 24h
    const lockKey = `webhook_event:${eventId}`;
    const isNewEvent = await redisClient.set(lockKey, 'processed', {
        NX: true, // Only set if it doesn't exist
        EX: 86400 // Expire in 24 hours
    });

    if (!isNewEvent) {
        return res.status(200).json({ message: "Event already processed (Idempotent)" });
    }

    // Process the data here
    console.log("🔔 Webhook received and processed:", data);
    res.status(200).json({ status: "success" });
});

// 5. EXTERNAL API SYNC (Requirement: Timeout & Retries)
app.get('/external-sync', async (req, res) => {
    const token = await getAuthToken();
    try {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1', {
            timeout: 2000, // 2 second timeout
            headers: { Authorization: `Bearer ${token}` }
        });
        res.json(response.data);
    } catch (error) {
        res.status(504).json({ error: "External API timed out or failed" });
    }
});

// Initialize Database and Start Server
const PORT = 3000;
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 FarmLokal Server running at http://localhost:${PORT}`);
        console.log(`📈 1 Million Product support enabled with Redis Caching.`);
    });
});