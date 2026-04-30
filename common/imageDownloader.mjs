import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_FOLDER = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(ASSETS_FOLDER)) {
    fs.mkdirSync(ASSETS_FOLDER, { recursive: true });
}

export async function downloadAndSaveImage(imageUrl, gameName) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Invalid image URL');
    }

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        return imageUrl; // Already a local path
    }

    try {
        const sanitizedName = gameName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 30);
        
        const ext = getImageExtension(imageUrl);
        const filename = `${sanitizedName}-${Date.now()}${ext}`;
        const filepath = path.join(ASSETS_FOLDER, filename);
        const relativePath = `/assets/${filename}`;

        await downloadFile(imageUrl, filepath);

        console.log(`✓ Image downloaded: ${relativePath}`);
        return relativePath;
    } catch (error) {
        console.error(`✗ Failed to download image from ${imageUrl}:`, error.message);
        return imageUrl;
    }
}


function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const file = fs.createWriteStream(filepath);
        
        const request = protocol.get(url, { timeout: 10000 }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                fs.unlink(filepath, () => {});
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                fs.unlink(filepath, () => {});
                reject(new Error(`Server responded with ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });

            file.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        });

        request.on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });

        request.on('timeout', () => {
            request.destroy();
            fs.unlink(filepath, () => {});
            reject(new Error('Download timeout'));
        });
    });
}

function getImageExtension(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname.toLowerCase();
        
        if (pathname.includes('.jpg') || pathname.includes('.jpeg')) return '.jpg';
        if (pathname.includes('.png')) return '.png';
        if (pathname.includes('.gif')) return '.gif';
        if (pathname.includes('.webp')) return '.webp';
        
        return '.jpg';
    } catch {
        return '.jpg';
    }
}

export function deleteLocalImage(imagePath) {
    if (!imagePath || imagePath.startsWith('http')) {
        return;
    }

    try {
        const filepath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log(`✓ Image deleted: ${imagePath}`);
        }
    } catch (error) {
        console.error(`✗ Failed to delete image ${imagePath}:`, error.message);
    }
}
