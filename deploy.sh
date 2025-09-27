#!/bin/bash

# Быстрый скрипт для деплоя всего приложения
# Использование: ./deploy.sh [frontend|backend|all]

set -e

echo "🚀 Скрипт деплоя приложения RentApp"

# Функция для деплоя фронтенда
deploy_frontend() {
    echo "📱 Деплой фронтенда на Netlify..."
    
    cd app
    
    # Сборка проекта
    echo "🔨 Сборка проекта..."
    npm run build
    
    # Проверка сборки
    if [ ! -d "dist" ]; then
        echo "❌ Ошибка сборки - папка dist не найдена"
        exit 1
    fi
    
    echo "✅ Фронтенд собран успешно!"
    echo "📝 Следующие шаги:"
    echo "1. Зайдите на netlify.com"
    echo "2. Создайте новый сайт"
    echo "3. Загрузите папку 'dist' или подключите GitHub"
    echo "4. Настройте переменные окружения:"
    echo "   - VITE_API_BASE_URL = https://91.92.42.248/api"
    
    cd ..
}

# Функция для деплоя бэкенда
deploy_backend() {
    echo "🔧 Деплой бэкенда на сервер..."
    
    # Проверка существования скриптов
    if [ ! -f "deploy/deploy-backend.sh" ]; then
        echo "❌ Скрипт deploy-backend.sh не найден"
        exit 1
    fi
    
    # Запуск деплоя
    chmod +x deploy/deploy-backend.sh
    ./deploy/deploy-backend.sh
}

# Функция для полного деплоя
deploy_all() {
    echo "🌐 Полный деплой приложения..."
    
    deploy_backend
    echo ""
    deploy_frontend
    
    echo ""
    echo "🎉 Деплой завершен!"
    echo "🔗 URL приложения: https://your-netlify-app.netlify.app"
    echo "🔗 API: https://91.92.42.248/api"
}

# Обработка аргументов
case "${1:-all}" in
    "frontend")
        deploy_frontend
        ;;
    "backend")
        deploy_backend
        ;;
    "all")
        deploy_all
        ;;
    *)
        echo "Использование: $0 [frontend|backend|all]"
        echo "  frontend - деплой только фронтенда"
        echo "  backend  - деплой только бэкенда"
        echo "  all      - полный деплой (по умолчанию)"
        exit 1
        ;;
esac
