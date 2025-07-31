import type { NextConfig } from "next";

// @ts-ignore
const nextConfig: NextConfig = {
    // Disable Fast Refresh
    // fastRefresh: false,
    async rewrites() {
        return [{
            source: '/api/:path*',
            destination: 'http://localhost:8001/api/:path*'
        }];
    },
    // async headers() {
    //     return [{
    //         source: '/:path*',
    //         headers: [
    //             { key: 'Access-Control-Allow-Credentials', value: 'true' },
    //             { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
    //             { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' }
    //         ]
    //     }];
    // }
};

export default nextConfig;
