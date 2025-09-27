# 🏠 RentApp - Полнофункциональная платформа аренды товаров

> **Современная веб-платформа для аренды и проката товаров между пользователями**

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-black.svg)](https://expressjs.com/)
[![Netlify](https://img.shields.io/badge/Frontend-Netlify-00C7B7.svg)](https://netlify.com/)
[![Ubuntu](https://img.shields.io/badge/Backend-Ubuntu%20Server-orange.svg)](https://ubuntu.com/)

## 📋 О проекте

**RentApp** — это полнофункциональная платформа для аренды товаров, где пользователи могут:
- 📱 Выставлять свои товары в аренду
- 🔍 Искать и фильтровать товары по категориям и городам
- ⭐ Оставлять отзывы и оценки
- 💬 Общаться с владельцами товаров
- 🔔 Получать уведомления о новых сообщениях и заказах
- 🏙️ Фильтровать товары по городам (как Avito)

## ✨ Основные возможности

### 🏪 Для владельцев товаров
- Загрузка фотографий товаров
- Управление каталогом товаров
- Просмотр заказов и сообщений
- Система рейтингов и отзывов
- Фильтрация по городам

### 🛒 Для арендаторов
- Поиск товаров по категориям
- Фильтрация по городам (текущий город + другие города)
- Просмотр детальной информации
- Система избранного
- Оформление заказов
- Отображение "Нет отзывов" для новых пользователей/товаров

### 🔧 Административные функции
- Управление категориями товаров
- Модерация контента
- Статистика и аналитика

## 🛠 Технологический стек

### Frontend
- **React 18.2.0** - UI библиотека
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - стилизация
- **DaisyUI** - UI компоненты
- **React Router** - маршрутизация
- **Context API** - управление состоянием

### Backend
- **Node.js** - серверная платформа
- **Express.js** - веб-фреймворк
- **PostgreSQL** - база данных
- **Sequelize** - ORM
- **JWT** - аутентификация
- **Multer** - загрузка файлов
- **PM2** - менеджер процессов

### Инфраструктура
- **Netlify** - хостинг фронтенда
- **Ubuntu Server** - хостинг бэкенда
- **Nginx** - веб-сервер
- **SSL** - защищенное соединение
- **PM2** - управление процессами

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+
- PostgreSQL 15+
- npm или yarn

### Установка

1. **Клонируйте репозиторий**
```bash
git clone https://github.com/your-username/rentapp.git
cd rentapp
```

2. **Установите зависимости фронтенда**
```bash
cd app
npm install
```

3. **Установите зависимости бэкенда**
```bash
cd ../MP-main/server
npm install
```

4. **Настройте базу данных**
```bash
# Создайте базу данных PostgreSQL
createdb postgres

# Импортируйте схему
psql postgres < BASE_FULL.sql
```

5. **Настройте переменные окружения**
```bash
# В MP-main/server/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

6. **Запустите приложение**
```bash
# Запуск бэкенда
cd MP-main/server
npm start

# Запуск фронтенда (в новом терминале)
cd app
npm run dev
```

## 📁 Структура проекта

```
rentapp/
├── app/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # React компоненты (25+)
│   │   ├── services/       # API сервисы
│   │   ├── context/        # React Context
│   │   └── config/         # Конфигурация
│   ├── public/             # Статические файлы
│   ├── dist/               # Собранный фронтенд
│   └── netlify.toml        # Настройки Netlify
├── MP-main/
│   └── server/             # Backend (Node.js + Express)
│       ├── controllers/    # Контроллеры (6 файлов)
│       ├── models/         # Модели Sequelize
│       ├── routes/         # Маршруты API (7 файлов)
│       ├── middleware/     # Middleware функции
│       ├── services/       # Бизнес-логика
│       ├── uploads/        # Загруженные файлы
│       └── package.json    # Зависимости бэкенда
├── deploy/                 # Скрипты развертывания
│   ├── backend-setup.sh    # Установка бэкенда
│   ├── ssl-setup.sh        # Настройка SSL
│   └── deploy-backend.sh   # Развертывание
├── BASE_FULL.sql          # Схема базы данных
├── DEPLOYMENT.md          # Инструкции развертывания
└── README.md              # Документация
```

## 🌐 Развертывание

### Frontend (Netlify)
1. Подключите репозиторий к Netlify
2. Настройте build команду: `npm run build`
3. Укажите папку публикации: `app/dist`
4. Настройте переменные окружения

### Backend (Ubuntu Server)
```bash
# Используйте скрипты из папки deploy/
./deploy/backend-setup.sh
./deploy/ssl-setup.sh
./deploy/deploy-backend.sh
```

**Домен:** `iloosip.online`  
**Порт:** 7000 (для API)  
**SSL:** Самоподписанный сертификат

## 📊 API Endpoints

### Аутентификация
- `POST /api/user/registration` - Регистрация
- `POST /api/user/login` - Вход
- `GET /api/user/auth` - Проверка токена

### Товары
- `GET /api/product` - Список товаров (с фильтрацией по городам)
- `GET /api/product/:id` - Детали товара
- `POST /api/product` - Создание товара
- `PUT /api/product/:id` - Обновление товара

### Заказы
- `GET /api/order` - Список заказов
- `POST /api/order` - Создание заказа
- `PUT /api/order/:id` - Обновление заказа

### Отзывы
- `GET /api/review` - Список отзывов
- `POST /api/review` - Создание отзыва
- `GET /api/review/product/:id` - Отзывы о товаре
- `GET /api/review/user/:id` - Отзывы пользователя

### Уведомления
- `GET /api/notification` - Список уведомлений
- `PUT /api/notification/:id` - Отметить как прочитанное

## 🎯 Ключевые особенности

### 🌍 Фильтрация по городам
- Товары текущего города отображаются первыми
- Товары других городов показываются ниже (как в Avito)
- Возможность переключения между городами

### ⭐ Система рейтингов
- Отображение "Нет отзывов" для новых пользователей/товаров
- Рейтинги от 1 до 5 звезд
- Детальная статистика отзывов

### 🔔 Уведомления
- Индикатор непрочитанных уведомлений в сайдбаре
- Уведомления о новых заказах и сообщениях
- Автоматическое обновление счетчика

### 📱 Адаптивный дизайн
- Полностью адаптивный интерфейс
- Современный UI/UX дизайн
- Быстрая загрузка и отзывчивость

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature ветку (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 👥 Авторы

- **Илья** - *Полная разработка Frontend + Backend* - [GitHub](https://github.com/your-username)

## 🙏 Благодарности

- React команде за отличную библиотеку
- Tailwind CSS за удобную систему стилей
- Netlify за простой хостинг
- PostgreSQL сообществу за надежную БД
- Express.js за мощный backend фреймворк

---

⭐ **Если проект понравился, поставьте звездочку!** ⭐

## 📈 Статистика проекта

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Node.js + Express + PostgreSQL  
- **Файлов:** 150+
- **Строк кода:** 20,000+
- **Компонентов:** 25+ React компонентов
- **API endpoints:** 25+ REST API
- **База данных:** 10+ таблиц
- **Middleware:** 5+ middleware функций