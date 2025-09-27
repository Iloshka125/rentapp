const {Sequelize} = require('sequelize')

// Временное решение - прямое указание значений
const DB_CONFIG = {
    database: process.env.DB_NAME || 'postgres',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Ilias.poh125125',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432
};

console.log('🔍 Конфигурация БД:', {
    database: DB_CONFIG.database,
    username: DB_CONFIG.username,
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    password: DB_CONFIG.password ? '***' : 'undefined'
});

module.exports = new Sequelize (
    DB_CONFIG.database,
    DB_CONFIG.username,
    DB_CONFIG.password,
    {
        dialect: 'postgres',
        host: DB_CONFIG.host,
        port: DB_CONFIG.port
    }
)