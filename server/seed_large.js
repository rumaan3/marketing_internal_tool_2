
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Client from './models/Client.js';
import Project from './models/Project.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const BATCH_SIZE = 5000;

async function seed() {
    console.log("Starting large seed...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    // 1. Create Staff Members
    console.log("Generating 1000 Staff Members...");
    const staffDocs = [];
    const passwordHash = await bcrypt.hash("password123", 10);

    for (let i = 0; i < BATCH_SIZE; i++) {
        staffDocs.push({
            name: `Staff Member ${i + 1}`,
            email: `staff${i + 1}_${Date.now()}@test.com`,
            password: passwordHash,
            role: 'staff',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    // Insert Users
    const staffResult = await User.insertMany(staffDocs);
    const staffIds = staffResult.map(u => u._id);
    console.log(`✅ Inserted ${staffResult.length} staff members.`);

    // 2. Create Clients
    console.log("Generating 1000 Clients...");
    const clientDocs = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        const randomStaffId = staffIds[Math.floor(Math.random() * staffIds.length)];
        clientDocs.push({
            name: `Client Company ${i + 1}`,
            email: `client${i + 1}_${Date.now()}@company.com`,
            phone: `555-000-${String(i).padStart(4, '0')}`,
            company: `Company ${i + 1} Inc`,
            address: `123 Test St, City ${i}`,
            isActive: true,
            createdBy: randomStaffId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    // Insert Clients
    const clientResult = await Client.insertMany(clientDocs);
    const clientIds = clientResult.map(c => c._id);
    console.log(`✅ Inserted ${clientResult.length} clients.`);

    // 3. Create Projects
    console.log("Generating 1000 Projects...");
    const projectDocs = [];
    const statuses = ["pending", "in-progress", "completed", "on-hold"];

    for (let i = 0; i < BATCH_SIZE; i++) {
        const randomClientId = clientIds[Math.floor(Math.random() * clientIds.length)];
        const randomStaffId = staffIds[Math.floor(Math.random() * staffIds.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        projectDocs.push({
            name: `Project Alpha ${i + 1}`,
            description: `This is a sample description for project ${i + 1}`,
            client: randomClientId,
            status: status,
            isActive: Math.random() > 0.1, // 90% active
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
            createdBy: randomStaffId,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    // Insert Projects
    const projectResult = await Project.insertMany(projectDocs);
    console.log(`✅ Inserted ${projectResult.length} projects.`);

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
