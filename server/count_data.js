
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Project from './models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkData() {
    console.log("Checking data in:", process.env.MONGODB_URI.split('@')[1]); // Log part of URI to confirm Atlas
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Project.countDocuments();
    console.log(`Total Projects in DB: ${count}`);
    process.exit(0);
}

checkData().catch(console.error);
