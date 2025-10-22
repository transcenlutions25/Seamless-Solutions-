/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable if you need app directory features
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
}

module.exports = nextConfig