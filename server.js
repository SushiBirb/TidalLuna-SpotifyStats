const http = require('http');
const fs = require('fs');
const path = require('path');
http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': filePath.endsWith('.json') ? 'application/json' : 'application/javascript' });
        res.end(fs.readFileSync(filePath));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
}).listen(8082, () => console.log('Listening on 8082'));
