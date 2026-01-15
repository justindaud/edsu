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
      { protocol: 'https', hostname: 'api.edsu-house.com', pathname: '/**' },
      { protocol: 'https', hostname: 'media.edsu-house.com', pathname: '/**' },
      { protocol: 'https', hostname: 'imgproxy.edsu-house.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
