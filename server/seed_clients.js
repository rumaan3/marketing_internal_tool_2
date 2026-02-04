import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Client from './models/Client.js';
import User from './models/User.js';

dotenv.config();

const seedClients = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find a user to assign the clients to
        const user = await User.findOne();
        if (!user) {
            console.error('No user found! Please create a user first.');
            process.exit(1);
        }
        console.log(`Assigning clients to user: ${user.email} (${user._id})`);

        const clients = [];
        const companies = ['TechCorp', 'SoftSystems', 'InnovateInc', 'DataDynamics', 'CloudNet'];
        const domains = ['example.com', 'test.com', 'demo.org', 'sample.net'];

        for (let i = 1; i <= 500; i++) {
            const company = companies[Math.floor(Math.random() * companies.length)];
            const domain = domains[Math.floor(Math.random() * domains.length)];

            clients.push({
                name: `Client Name ${i}`,
                email: `client${i}.${Date.now()}@${domain}`, // Ensure uniqueness
                phone: `+1-555-${String(Math.floor(1000000 + Math.random() * 9000000))}`, // Random 7 digit
                company: company,
                address: `${Math.floor(Math.random() * 1000)} Main St, City ${i}, State`,
                createdBy: user._id,
                isActive: Math.random() > 0.1 // 90% active
            });
        }

        await Client.insertMany(clients);
        console.log('Successfully seeded 500 clients!');

        process.exit();
    } catch (error) {
        console.error('Error seeding clients:', error);
        process.exit(1);
    }
};

seedClients();
