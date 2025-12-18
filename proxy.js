// proxy.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const httpProxy = require('http-proxy');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');

const proxy = httpProxy.createProxyServer({});

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

https
    .createServer(options, (req, res) => {
        proxy.web(req, res, { target: 'http://localhost:3005' });
    })
    .listen(3005, () => {
        console.log('🔐 HTTPS Proxy running at https://0.0.0.0:3005');
    });
