/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    // Type checking is handled by the build process
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint is handled by the build process
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;