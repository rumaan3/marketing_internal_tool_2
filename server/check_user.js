import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');
        const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
        console.log('Superuser found:', user ? 'YES' : 'NO');
        if (user) {
            console.log('User has password:', user.password ? 'YES' : 'NO');
            await User.deleteOne({ email: 'admin@example.com' });
            console.log('Corrupted user deleted');
        }

        const newUser = new User({
            name: "Super Admin",
            email: "admin@example.com",
            password: "admin123", // Will be hashed by pre-save hook
            role: "superuser",
            isActive: true
        });

        await newUser.save();
        console.log('Superuser recreated successfully');

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
