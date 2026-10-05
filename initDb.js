// Run once: npm run db:init  (creates the tables)
import fs from 'fs'; import pool from './db.js';
await pool.query(fs.readFileSync('./schema.sql', 'utf8'));
console.log('Tables ready'); process.exit(0);
