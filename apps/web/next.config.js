/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  // Enable experimental app directory features
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;