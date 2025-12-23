// server.ts
import https from 'https';
import http from 'http';
import next from 'next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IncomingMessage, ServerResponse } from 'http';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const httpsOptions = {
    key: readFileSync(join(__dirname, '../ssl/server-key.pem')),
    cert: readFileSync(join(__dirname, '../ssl/server-cert.pem')),
};

app.prepare().then(() => {
    // HTTPS Server
    https.createServer(httpsOptions, (req: IncomingMessage, res: ServerResponse) => {
        handle(req, res);
    }).listen(443, () => {
        console.log(`> Ready on https://${hostname}:443`);
    });

    // HTTP → HTTPS Redirect
    http.createServer((req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(301, {
            Location: `https://${req.headers.host}${req.url}`
        });
        res.end();
    }).listen(port);
});
