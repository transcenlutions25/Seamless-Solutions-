module.exports = {
  apps: [
    {
      name: 'seamless-api',
      cwd: './apps/api',
      script: 'npx',
      args: 'tsx src/index.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'seamless-web',
      cwd: './apps/web',
      script: 'npx',
      args: 'next start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://localhost:4000'
      }
    }
  ]
};