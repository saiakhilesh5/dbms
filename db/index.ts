import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Connect using DATABASE_URL from .env
const sql = neon(process.env.DATABASE_URL!);

export default sql;
