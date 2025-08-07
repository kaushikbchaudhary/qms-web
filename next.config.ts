import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

console.log('process.env.NODE_ENV',process.env.NODE_ENV)
const isProduction = process.env.NODE_ENV === 'production';
console.log('isProduction:', isProduction);
const getHttpsConfig = () => {
    if (!isProduction) return undefined;

    try {
        const sslPath = path.join(process.cwd(), '../ssl');
        console.log(`ssl server running on ${sslPath}`);
        return {
            key: fs.readFileSync(path.join(sslPath, 'server-key.pem')),
            cert: fs.readFileSync(path.join(sslPath, 'server-cert.pem')),
        };
    } catch (error) {
        console.warn('HTTPS config failed to load, falling back to HTTP');
        return undefined;
    }
};

const nextConfig: NextConfig = {
    async rewrites() {
        return [{
            source: '/api/:path*',
            destination: 'http://localhost:8001/api/:path*'
        }];
    },
    ...(isProduction ? {
        server: {
            https: getHttpsConfig()
        }
    } : {})
};

export default nextConfig;