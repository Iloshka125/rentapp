// Production configuration for server
module.exports = {
  // Server settings
  port: process.env.PORT || 7000,
  host: '0.0.0.0', // Listen on all interfaces
  
  // Database settings
  database: {
    name: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Ilias.poh125125',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Disable SQL logging in production
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // JWT settings
  jwt: {
    secret: process.env.SECRET_KEY || 'FKDSjka231asdd',
    expiresIn: '24h'
  },
  
  // CORS settings
  cors: {
    origin: [
      'https://your-netlify-app.netlify.app',
      'https://91.92.42.248'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },
  
  // File upload settings
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    uploadPath: '/var/www/rentapp-backend/uploads'
  },
  
  // SSL settings
  ssl: {
    enabled: true,
    certPath: '/etc/ssl/certs/rentapp-selfsigned.crt',
    keyPath: '/etc/ssl/private/rentapp-selfsigned.key'
  }
};
