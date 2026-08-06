const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 80;
const ADMIN_DIR = path.join(__dirname, 'admin', 'dist');
const MOBILE_DIR = path.join(__dirname, 'mobile', 'dist');
const UPLOADS_DIR = path.join(__dirname, 'backend', 'uploads');
const LOG_FILE = path.join(__dirname, 'logs', 'proxy.log');
const API_TARGET = { host: '127.0.0.1', port: 3001 };

function log(msg) {
  try {
    const line = `[${new Date().toISOString()}] ${msg}`;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (e) {}
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

function serveFile(res, filePath) {
  try {
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not Found'); return; }
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      if (fs.existsSync(idx)) return serveFile(res, idx);
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
    log(`[200] ${filePath} (${data.length}b)`);
  } catch (err) {
    log(`[ERROR] ${err.message}`);
    if (!res.headersSent) { res.writeHead(500); res.end('Error'); }
  }
}

function proxyToAPI(req, res, pathname) {
  const options = {
    ...API_TARGET,
    path: pathname + (url.parse(req.url).search || ''),
    method: req.method,
    headers: { ...req.headers, host: '127.0.0.1:3001' },
  };
  log(`[API-PROXY] ${req.method} ${options.path}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    log(`[API-RESP] ${pathname} -> ${proxyRes.statusCode}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    log(`[API-ERR] ${err.message}`);
    if (!res.headersSent) { res.writeHead(502); res.end('Backend Error: ' + err.message); }
  });
  
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const ip = req.socket.remoteAddress;
  const parsedUrl = url.parse(req.url);
  const pathname = decodedURI(parsedUrl.pathname);
  
  // Log EVERY request immediately
  log(`>>> [${ip}] ${req.method} ${req.url} (raw: ${pathname})`);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  try {
    // API routes
    if (pathname.startsWith('/api')) { return proxyToAPI(req, res, pathname); }
    
    // Uploads
    if (pathname.startsWith('/uploads')) {
      return serveFile(res, path.join(UPLOADS_DIR, pathname.replace('/uploads', '') || '/'));
    }
    
    // Admin (SPA with fallback)
    if (pathname.startsWith('/admin')) {
      const sub = pathname.replace(/^\/admin/, '') || '/index.html';
      const target = path.join(ADMIN_DIR, sub);
      if (fs.existsSync(target) && fs.statSync(target).isFile()) return serveFile(res, target);
      // SPA fallback: no file extension => serve index.html
      if (!path.extname(sub)) return serveFile(res, path.join(ADMIN_DIR, 'index.html'));
      res.writeHead(404); res.end('Not Found'); return;
    }
    
    // Mobile (SPA with fallback)
    if (pathname.startsWith('/mobile')) {
      const sub = pathname.replace(/^\/mobile/, '') || '/index.html';
      const target = path.join(MOBILE_DIR, sub);
      if (fs.existsSync(target) && fs.statSync(target).isFile()) return serveFile(res, target);
      // SPA fallback: no file extension => serve index.html
      if (!path.extname(sub)) return serveFile(res, path.join(MOBILE_DIR, 'index.html'));
      res.writeHead(404); res.end('Not Found'); return;
    }
    
    // Assets (for both admin and mobile) - legacy absolute /assets/ path
    if (pathname.startsWith('/assets/')) {
      const aPath = path.join(ADMIN_DIR, pathname);
      if (fs.existsSync(aPath)) return serveFile(res, aPath);
      const mPath = path.join(MOBILE_DIR, pathname);
      if (fs.existsSync(mPath)) return serveFile(res, mPath);
      res.writeHead(404); res.end('Asset Not Found'); return;
    }
    
    // Root -> redirect to admin
    if (pathname === '/') { res.writeHead(302, { Location: '/admin' }); res.end(); return; }
    
    res.writeHead(404); res.end('Not Found');
  } catch (err) {
    log(`[FATAL] ${err.stack}`);
    if (!res.headersSent) { res.writeHead(500); res.end('Server Error'); }
  }
});

server.on('error', (err) => log(`[SRV-ERR] ${err.code}: ${err.message}`));

// Clear old log
try { fs.writeFileSync(LOG_FILE, ''); } catch(e) {}

server.listen(PORT, '0.0.0.0', () => {
  log('============================================');
  log('NEW Proxy Server Started on 0.0.0.0:' + PORT);
  log('============================================');
});

function decodedURI(uri) {
  try { return decodeURIComponent(uri); } catch { return uri; }
}
