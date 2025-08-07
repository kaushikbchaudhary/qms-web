import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// Next.js configuration
const nextConfig: NextConfig = {
    // Your API rewrites
    async rewrites() {
        return [{
            source: '/api/:path*',
            destination: 'http://localhost:8001/api/:path*'
        }];
    },



    // Modern configuration for Next.js 15+
    // ...(isProduction ? {
    //     output: 'standalone', // Recommended for production
    //     serverExternalPackages: ['fs'], // Replaces deprecated serverComponentsExternalPackages
    //     experimental: {
    //         serverActions: true,
    //     },
    // } : {})
};

// Export the Next.js configuration
export default nextConfig;

// HTTPS configuration for production
// if (isProduction) {
//     const httpsOptions = {
//         key: fs.readFileSync(path.join(process.cwd(), '../ssl/server-key.pem')),
//         cert: fs.readFileSync(path.join(process.cwd(), '../ssl/server-cert.pem')),
//     };
//
//     // Create custom HTTPS server
//     const createHttpsServer = async () => {
//         const { createServer } = await import('https');
//         const { default: next } = await import('next');
//
//         const app = next({ dev: false });
//         const handle = app.getRequestHandler();
//
//         await app.prepare();
//         return createServer(httpsOptions, (req, res) => {
//             handle(req, res);
//         });
//     };
//
//     // Export both config and server
//     module.exports = Object.assign(nextConfig, {
//         async startServer() {
//             const server = await createHttpsServer();
//             server.listen(443, () => {
//                 console.log('> Ready on https://localhost:443');
//             });
//         }
//     });
// } else {
//     module.exports = nextConfig;
// }