
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, 'connection_test.log');

dotenv.config({ path: path.join(__dirname, '.env') });

fs.writeFileSync(logFile, "Starting test...\n");

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        const msg = "SUCCESS: Connected to MongoDB Atlas!";
        console.log(msg);
        fs.appendFileSync(logFile, msg + "\n");
        process.exit(0);
    })
    .catch((err) => {
        const msg = "ERROR: Connection failed: " + err.message;
        console.error(msg);
        fs.appendFileSync(logFile, msg + "\n");
        if (err.cause) fs.appendFileSync(logFile, "Cause: " + JSON.stringify(err.cause) + "\n");
        process.exit(1);
    });
