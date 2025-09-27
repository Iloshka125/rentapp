const path = require('path');

const uploadMiddleware = (req, res, next) => {
    try {
        // Проверяем, есть ли файлы
        if (!req.files || Object.keys(req.files).length === 0) {
            return next();
        }
        
        // Получаем все загруженные файлы
        const files = Array.isArray(req.files.photo) ? req.files.photo : [req.files.photo];
        
        // Если нет файлов для обработки
        if (files.length === 0) {
            return next();
        }
        
        // Обрабатываем каждый файл асинхронно
        const processFile = (file, index) => {
            return new Promise((resolve, reject) => {
                if (file && file.name) {
                    // Генерируем уникальное имя файла
                    const timestamp = Date.now();
                    const random = Math.random().toString(36).substring(2);
                    const fileName = `${timestamp}_${random}_${index}${path.extname(file.name)}`;
                    
                    // Путь для сохранения файла
                    const uploadPath = path.resolve(__dirname, '..', 'uploads', fileName);
                    
                    // Перемещаем файл в папку uploads
                    file.mv(uploadPath, (err) => {
                        if (err) {
                            console.error('Ошибка при загрузке файла:', err);
                            reject(err);
                            return;
                        }
                        
                        resolve({ fileName, index });
                    });
                } else {
                    resolve(null);
                }
            });
        };
        
        // Обрабатываем все файлы параллельно
        Promise.all(files.map((file, index) => processFile(file, index)))
            .then(results => {
                // Фильтруем null результаты
                const validResults = results.filter(result => result !== null);
                
                if (validResults.length > 0) {
                    // Первый файл становится основным фото
                    req.uploadedFileName = validResults[0].fileName;
                    
                    // Остальные файлы сохраняем для дополнительных изображений
                    if (validResults.length > 1) {
                        const additionalImages = validResults.slice(1).map(result => result.fileName);
                        req.additionalImages = additionalImages;
                    } else {
                        req.additionalImages = [];
                    }
                } else {
                    // Если нет файлов, устанавливаем пустые значения
                    req.uploadedFileName = null;
                    req.additionalImages = [];
                }
                
                next();
            })
            .catch(error => {
                console.error('Ошибка при обработке файлов:', error);
                return res.status(500).json({ message: 'Ошибка при загрузке файлов' });
            });
        
    } catch (error) {
        console.error('Ошибка в uploadMiddleware:', error);
        return res.status(500).json({ message: 'Ошибка при обработке файла' });
    }
};

module.exports = uploadMiddleware;
