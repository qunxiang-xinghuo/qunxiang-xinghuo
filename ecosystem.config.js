module.exports = {
  apps: [
    {
      name: 'qunxiang-xinghuo',
      script: 'node_modules/.bin/tsx',
      args: 'src/server.ts',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
        DATABASE_URL: 'file:./prisma/dev.db',
        AUTH_SECRET: process.env.AUTH_SECRET || 'xinghuo-secret-key-2024',
        ZHIHU_API_KEY: process.env.ZHIHU_API_KEY || '',
      },
    },
  ],
};
