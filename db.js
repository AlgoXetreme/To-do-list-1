import pg from 'pg'; import 'dotenv/config';
// Neon requires SSL; the connection string already has sslmode=require
export default new pg.Pool({ connectionString: process.env.DATABASE_URL });
