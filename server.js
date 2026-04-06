import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_FILE = path.join(__dirname, 'data', 'index.json');

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/api/state') {
        if (req.method === 'GET') {
            fs.readFile(DATA_FILE, 'utf8', (err, data) => {
                if (err) {
                    if (err.code === 'ENOENT') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(null));
                    } else {
                        res.writeHead(500);
                        res.end('Error reading state');
                    }
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(data || JSON.stringify(null));
                }
            });
            return;
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
                if (body.length > 5 * 1024 * 1024) { // 5MB limit
                    req.connection.destroy();
                }
            });
            req.on('end', () => {
                // Ensure data directory exists
                const dataDir = path.dirname(DATA_FILE);
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }

                // Write safely and respond
                try {
                    // Try parsing JSON to ensure it's valid before saving
                    if (body !== 'null') {
                        JSON.parse(body);
                    }
                    const tmpFile = DATA_FILE + '.tmp';
                    fs.writeFile(tmpFile, body, 'utf8', (err) => {
                        if (err) {
                            console.error('[ERROR] Failed to write temp state:', err);
                            res.writeHead(500);
                            res.end('Error saving state');
                        } else {
                            fs.rename(tmpFile, DATA_FILE, (renameErr) => {
                                if (renameErr) {
                                    console.error('[ERROR] Failed to rename temp state:', renameErr);
                                    res.writeHead(500);
                                    res.end('Error saving state');
                                } else {
                                    res.writeHead(200, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ success: true }));
                                }
                            });
                        }
                    });
                } catch (e) {
                    console.error('[ERROR] Invalid JSON payload received:', e);
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
            return;
        }
    }

    // Serve static files
    let requestUrl = req.url.split('?')[0]; // Strip query parameters
    let safePath = path.normalize(requestUrl).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(
        DIST_DIR,
        safePath === '/' || safePath === '\\' ? 'index.html' : safePath
    );

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    let extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`[INFO] Server running at http://localhost:${PORT}/`);
    console.log(`[INFO] Data will be saved to ${DATA_FILE}`);
});
