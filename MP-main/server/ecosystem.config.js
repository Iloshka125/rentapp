module.exports = {
  apps: [{
    name: 'rentapp-backend',
    script: 'index.js',
    cwd: '/var/www/rentapp-backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 7000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 7000,
      DB_NAME: 'postgres',
      DB_USER: 'postgres',
      DB_PASSWORD: 'Ilias.poh125125',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      SECRET_KEY: 'FKDSjka231asdd'
    },
    error_file: '/var/log/rentapp-backend/error.log',
    out_file: '/var/log/rentapp-backend/out.log',
    log_file: '/var/log/rentapp-backend/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
