# Инструкция по деплою приложения

## 🚀 Деплой фронтенда на Netlify

### 1. Подготовка фронтенда
```bash
cd app
npm install
npm run build
```

### 2. Деплой на Netlify
1. Зайдите на [netlify.com](https://netlify.com)
2. Создайте новый сайт
3. Выберите "Deploy manually" или подключите GitHub репозиторий
4. Загрузите папку `dist` или подключите репозиторий
5. Настройки сборки:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

### 3. Настройка переменных окружения
В настройках сайта Netlify добавьте:
- `VITE_API_BASE_URL` = `https://91.92.42.248`

## 🔧 Деплой бэкенда на сервер Ubuntu

### 1. Первоначальная настройка сервера
```bash
# На сервере выполните:
wget https://raw.githubusercontent.com/your-repo/deploy/backend-setup.sh
chmod +x backend-setup.sh
sudo ./backend-setup.sh
```

### 2. Настройка SSL сертификата
```bash
# На сервере выполните:
wget https://raw.githubusercontent.com/your-repo/deploy/ssl-setup.sh
chmod +x ssl-setup.sh
sudo ./ssl-setup.sh
```

### 3. Деплой кода
```bash
# Локально выполните:
chmod +x deploy/deploy-backend.sh
./deploy/deploy-backend.sh
```

### 4. Проверка работы
```bash
# Проверка статуса приложения
ssh root@91.92.42.248 "pm2 status"

# Проверка логов
ssh root@91.92.42.248 "pm2 logs rentapp-backend"

# Проверка nginx
ssh root@91.92.42.248 "sudo nginx -t"
```

## 🔐 Настройка SSL сертификата

### Самоподписанный сертификат (уже настроен)
- Сертификат: `/etc/ssl/certs/rentapp-selfsigned.crt`
- Ключ: `/etc/ssl/private/rentapp-selfsigned.key`
- Действителен: 365 дней

### Для продакшена рекомендуется Let's Encrypt
```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Мониторинг и управление

### PM2 команды
```bash
# Статус приложений
pm2 status

# Перезапуск
pm2 restart rentapp-backend

# Остановка
pm2 stop rentapp-backend

# Логи
pm2 logs rentapp-backend

# Мониторинг
pm2 monit
```

### Nginx команды
```bash
# Проверка конфигурации
sudo nginx -t

# Перезапуск
sudo systemctl restart nginx

# Статус
sudo systemctl status nginx
```

## 🔧 Устранение неполадок

### Проблемы с CORS
- Проверьте настройки CORS в nginx конфигурации
- Убедитесь, что домен фронтенда добавлен в allowed origins

### Проблемы с SSL
- Проверьте права доступа к сертификатам
- Убедитесь, что nginx может читать файлы сертификатов

### Проблемы с базой данных
- Проверьте подключение к PostgreSQL
- Убедитесь, что пользователь имеет права на базу данных

### Проблемы с загрузкой файлов
- Проверьте права доступа к папке uploads
- Убедитесь, что nginx может обслуживать статические файлы

## 📝 Полезные команды

### Проверка портов
```bash
sudo netstat -tlnp | grep :7000
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :80
```

### Проверка логов
```bash
# Логи nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Логи приложения
pm2 logs rentapp-backend --lines 100
```

### Обновление приложения
```bash
# Остановка
pm2 stop rentapp-backend

# Обновление кода (через deploy-backend.sh)
./deploy/deploy-backend.sh

# Или вручную:
# 1. Загрузите новый код
# 2. npm install
# 3. pm2 restart rentapp-backend
```

## 🌐 Финальные URL

- **Фронтенд**: `https://your-netlify-app.netlify.app`
- **API**: `https://91.92.42.248/api`
- **Загрузки**: `https://91.92.42.248/uploads`

## ⚠️ Важные замечания

1. **Безопасность**: Смените пароли по умолчанию
2. **Firewall**: Настройте правила firewall для безопасности
3. **Backup**: Настройте регулярное резервное копирование базы данных
4. **Monitoring**: Настройте мониторинг сервера
5. **SSL**: Для продакшена используйте Let's Encrypt вместо самоподписанного сертификата
