import type { NextConfig } from "next";

module.exports = {
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "video/mp4",
          },
        ],
      },
    ];
  },
};

// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};


const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
