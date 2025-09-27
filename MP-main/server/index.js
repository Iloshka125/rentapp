// Захардкоженные переменные окружения
process.env.PORT = '7000';
process.env.DB_NAME = 'postgres';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'Ilias.poh125125';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.SECRET_KEY = 'FKDSjka231asdd';

console.log('🔍 Переменные окружения захардкожены:');
console.log('PORT:', process.env.PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('SECRET_KEY:', process.env.SECRET_KEY ? '***' : 'undefined');

const express = require('express');
const PORT = process.env.PORT || 7000;
const sequelize = require('./db');
const models = require('./models/models');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const router = require('./routes/index');
const errorHandler = require('./middleware/ErrorHandlingMiddleware');
const path = require('path');

const app = express();
app.use(cors());

// express-fileupload ДОЛЖЕН быть ПЕРЕД express.json и express.urlencoded
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    abortOnLimit: true,
    useTempFiles: false,
    debug: true,
    parseNested: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статический роут для доступа к загруженным файлам
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

app.use('/api', router);
app.use(errorHandler);

const start = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Подключение к базе данных успешно');
        await sequelize.sync();
        console.log('✅ Синхронизация моделей завершена');
        app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
    } catch (e) {
        console.error('❌ Ошибка запуска сервера:', e);
    }
};

start();