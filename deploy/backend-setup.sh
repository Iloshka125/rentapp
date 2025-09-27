#!/bin/bash

# Скрипт для настройки бэкенда на сервере Ubuntu
# Запускать на сервере: bash backend-setup.sh

echo "🚀 Настройка бэкенда на сервере Ubuntu..."

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Установка nginx
sudo apt install nginx -y

# Создание директории для приложения
sudo mkdir -p /var/www/rentapp-backend
sudo chown -R root:root /var/www/rentapp-backend

# Создание пользователя для приложения
sudo useradd -r -s /bin/false rentapp || echo "Пользователь rentapp уже существует"

# Настройка PostgreSQL
sudo -u postgres psql << EOF
CREATE DATABASE postgres;
CREATE USER postgres WITH PASSWORD 'Ilias.poh125125';
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
ALTER USER postgres CREATEDB;
\q
EOF

# Настройка firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 7000
sudo ufw --force enable

echo "✅ Настройка сервера завершена!"
echo "📝 Следующие шаги:"
echo "1. Загрузите код бэкенда в /var/www/rentapp-backend"
echo "2. Установите зависимости: npm install"
echo "3. Настройте SSL сертификат"
echo "4. Настройте nginx"
