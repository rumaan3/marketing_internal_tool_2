import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Process and save an uploaded image
 * @param {Buffer} buffer - File buffer
 * @param {string} destination - Destination directory
 * @param {string} filename - Desired filename (without extension)
 * @param {number} maxSizeKB - Max size in KB (default 500)
 * @returns {Promise<string>} - Relative path to saved file
 */
export const processProjectIcon = async (buffer, destination, filename, maxSizeKB = 500) => {
    // Ensure destination exists
    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true });
    }

    const outputPath = path.join(destination, `${filename}.webp`);

    // Initial quality
    let quality = 80;
    let processedBuffer;

    // Convert to WebP and resize if needed (max dimension 500px for icons to save space)
    // Loop to ensure size is under limit
    do {
        processedBuffer = await sharp(buffer)
            .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

        quality -= 10;
    } while (processedBuffer.length > maxSizeKB * 1024 && quality > 10);

    fs.writeFileSync(outputPath, processedBuffer);

    return `${filename}.webp`;
};
