import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '9000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/**' },
      { protocol: 'http', hostname: 'host.docker.internal', port: '9000', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: '36.64.236.3', port: '8080', pathname: '/**' },
      { protocol: 'http', hostname: '36.64.236.3', port: '9100', pathname: '/**' },
    ],
  },
};

export default nextConfig;
