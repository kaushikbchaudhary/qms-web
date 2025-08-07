import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
console.log(isProduction);
// @ts-ignore
const nextConfig: NextConfig = {
    // Your API rewrites
    async rewrites() {
        return [{
            source: '/api/:path*',
            destination: 'http://localhost:8001/api/:path*'
        }];
    },

    // Modern HTTPS configuration
    ...(isProduction ? {
        experimental: {
            serverActions: true,
            // HTTPS configuration
            serverComponentsExternalPackages: ['fs'],
        },
        webpack: (config, { isServer }) => {
            if (isServer && isProduction) {
                config.resolve.fallback = {
                    ...config.resolve.fallback,
                    fs: false // Properly handle fs module
                };

                // Add HTTPS middleware
                config.plugins.push(
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    new (require('webpack').DefinePlugin({
                            'process.env.SSL_KEY': JSON.stringify(
                                fs.readFileSync(path.join(process.cwd(), '../ssl/server-key.pem'), 'utf8')
                            ),
                            'process.env.SSL_CERT': JSON.stringify(
                                fs.readFileSync(path.join(process.cwd(), '../ssl/server-cert.pem'), 'utf8')
                            )
                        }))
                    );
            }
            return config;
        }
    } : {})
};

// Custom server setup for production
if (isProduction) {
    const httpsOptions = {
        key: fs.readFileSync(path.join(process.cwd(), '../ssl/server-key.pem')),
        cert: fs.readFileSync(path.join(process.cwd(), '../ssl/server-cert.pem'))
    };

    module.exports = Object.assign(nextConfig, {
        // Custom server configuration
        async startServer() {
            const { createServer } = await import('https');
            const { default: next } = await import('next');
            const app = next({ dev: false });
            const handle = app.getRequestHandler();

            await app.prepare();
            createServer(httpsOptions, (req, res) => {
                handle(req, res);
            }).listen(443, () => {
                console.log('> Ready on https://localhost:443');
            });
        }
    });
} else {
    module.exports = nextConfig;
}