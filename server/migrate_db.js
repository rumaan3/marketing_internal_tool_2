
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Client from './models/Client.js';
import Project from './models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const sourceURI = "mongodb://localhost:27017/admin_panel";
const destURI = process.env.MONGODB_URI;

if (!destURI) {
    console.error("MONGODB_URI is missing in .env");
    process.exit(1);
}

async function migrate() {
    console.log("Starting migration...");

    // 1. Fetch from Source
    console.log(`1. Connecting to Source: mongodb://localhost:27017/admin_panel`);
    await mongoose.connect(sourceURI);

    console.log("   Fetching data...");
    const users = await User.find().lean();
    const clients = await Client.find().lean();
    const projects = await Project.find().lean();

    console.log(`   Fetched: ${users.length} users, ${clients.length} clients, ${projects.length} projects`);

    await mongoose.disconnect();
    console.log("   Disconnected from Source.");

    // 2. Insert into Destination
    console.log("2. Connecting to Destination (Atlas)...");
    await mongoose.connect(destURI);

    // Optional: Clear destination to prevent duplicates if running multiple times
    // await User.deleteMany({});
    // await Client.deleteMany({});
    // await Project.deleteMany({});

    console.log("   Inserting data...");

    if (users.length > 0) {
        try {
            await User.collection.insertMany(users);
            console.log(`   ✅ Inserted ${users.length} users`);
        } catch (e) {
            console.error(`   ❌ Error inserting users: ${e.message}`);
        }
    }

    if (clients.length > 0) {
        try {
            await Client.collection.insertMany(clients);
            console.log(`   ✅ Inserted ${clients.length} clients`);
        } catch (e) {
            console.error(`   ❌ Error inserting clients: ${e.message}`);
        }
    }

    if (projects.length > 0) {
        try {
            await Project.collection.insertMany(projects);
            console.log(`   ✅ Inserted ${projects.length} projects`);
        } catch (e) {
            console.error(`   ❌ Error inserting projects: ${e.message}`);
        }
    }

    console.log("Migration complete!");
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration unexpected error:", err);
    process.exit(1);
});
