#!/bin/bash

# Скрипт для создания самоподписанного SSL сертификата
# Запускать на сервере: bash ssl-setup.sh

echo "🔐 Создание самоподписанного SSL сертификата..."

# Создание директории для сертификатов
sudo mkdir -p /etc/ssl/private
sudo mkdir -p /etc/ssl/certs

# Создание самоподписанного сертификата
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/rentapp-selfsigned.key \
    -out /etc/ssl/certs/rentapp-selfsigned.crt \
    -subj "/C=RU/ST=Moscow/L=Moscow/O=RentApp/OU=IT/CN=91.92.42.248"

# Установка прав доступа
sudo chmod 600 /etc/ssl/private/rentapp-selfsigned.key
sudo chmod 644 /etc/ssl/certs/rentapp-selfsigned.crt

# Создание конфигурации nginx
sudo tee /etc/nginx/sites-available/rentapp-backend > /dev/null << 'EOF'
server {
    listen 80;
    server_name 91.92.42.248;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 91.92.42.248;

    ssl_certificate /etc/ssl/certs/rentapp-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/rentapp-selfsigned.key;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # CORS заголовки
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range' always;

    # Обработка preflight запросов
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' 0;
        return 204;
    }

    # Проксирование на Node.js приложение
    location / {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Статические файлы
    location /uploads/ {
        alias /var/www/rentapp-backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Активация сайта
sudo ln -sf /etc/nginx/sites-available/rentapp-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации nginx
sudo nginx -t

# Перезапуск nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ SSL сертификат создан и nginx настроен!"
echo "🔗 Сервер доступен по адресу: https://91.92.42.248"
echo "⚠️  Браузер будет показывать предупреждение о самоподписанном сертификате - это нормально"
