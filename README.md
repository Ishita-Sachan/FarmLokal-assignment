🚜 FarmLokal Backend Assignment
A high-performance Node.js/TypeScript backend capable of handling 1,000,000+ product records with sub-200ms latency, featuring Redis caching, idempotent webhooks, and external API synchronization.

🚀 Features - 
1 Million Product Dataset: Seeding script using @faker-js/faker for realistic data.

Optimized Search & Filter: Instant retrieval by Name, Category, and Price Range.

Redis Caching (Memurai): Drastically reduces MySQL load by caching frequent queries.

Cursor-Based Pagination: Ensures consistent performance even when navigating deep into millions of records.

Idempotent Webhooks: Prevents duplicate event processing using Redis locks.

Reliable External Sync: Synchronous API calls with built-in timeouts and OAuth2 token caching.

🛠️ Tech Stack
Runtime: Node.js (v22+)

Language: TypeScript (NodeNext ESM)

Database: MySQL (Sequelize ORM)

Cache: Redis (Memurai for Windows)

API: Express.js

Validation: Axios for external calls

📈 Optimization Strategies
Database Indexing: Added B-Tree indexes to category, name, and price columns in MySQL to ensure searches don't require full table scans.

P95 Latency Reduction: Implemented a "Cache-Aside" pattern. API requests hit Redis first; only cache misses trigger a MySQL query.

Memory Management: Used bulkCreate in the seeder to batch inserts, preventing memory overflows while generating 1M records.

⚙️ Installation & Setup
1. Database Setup
Install MySQL and create the database:

Update the password in database.ts.

2. Install Dependencies
3. Seed the Data (1 Million Records)
4. Run the Server

🧪 Testing the API

🛡️ Reliability & Security
Idempotency: Webhooks use the SET NX command in Redis to ensure an eventId is only processed once every 24 hours.

Fault Tolerance: External API calls are protected by a 2-second timeout to prevent request hanging and resource exhaustion.

