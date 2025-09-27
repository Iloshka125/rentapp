#!/bin/bash

# Скрипт для деплоя бэкенда на сервер
# Запускать локально: bash deploy-backend.sh

echo "🚀 Деплой бэкенда на сервер 91.92.42.248..."

# Переменные
SERVER_IP="91.92.42.248"
SERVER_USER="root"
BACKEND_DIR="/var/www/rentapp-backend"
LOCAL_BACKEND_DIR="MP-main/server"

# Проверка существования локальной директории
if [ ! -d "$LOCAL_BACKEND_DIR" ]; then
    echo "❌ Директория $LOCAL_BACKEND_DIR не найдена!"
    exit 1
fi

# Создание архива
echo "📦 Создание архива бэкенда..."
tar -czf backend.tar.gz -C "$LOCAL_BACKEND_DIR" .

# Загрузка на сервер
echo "📤 Загрузка на сервер..."
scp backend.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# Выполнение команд на сервере
echo "🔧 Установка на сервере..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    # Создание директории
    sudo mkdir -p /var/www/rentapp-backend
    sudo chown -R root:root /var/www/rentapp-backend
    
    # Распаковка архива
    cd /var/www/rentapp-backend
    sudo tar -xzf /tmp/backend.tar.gz
    
    # Установка зависимостей
    sudo npm install
    
    # Создание директории для загрузок
    sudo mkdir -p uploads
    sudo chmod 755 uploads
    
    # Очистка временных файлов
    rm /tmp/backend.tar.gz
    
    echo "✅ Бэкенд установлен!"
EOF

# Очистка локального архива
rm backend.tar.gz

# Запуск приложения через PM2
echo "🚀 Запуск приложения..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    cd /var/www/rentapp-backend
    
    # Остановка существующего процесса
    pm2 stop rentapp-backend 2>/dev/null || true
    pm2 delete rentapp-backend 2>/dev/null || true
    
    # Запуск нового процесса
    pm2 start index.js --name "rentapp-backend" --cwd /var/www/rentapp-backend
    pm2 save
    pm2 startup
    
    echo "✅ Приложение запущено!"
    pm2 status
EOF

echo "🎉 Деплой завершен!"
echo "🔗 API доступен по адресу: https://91.92.42.248/api"
echo "📁 Загрузки доступны по адресу: https://91.92.42.248/uploads"
