# 🔒 Настройка HTTPS для проекта

## ✅ Что настроено

### 1. Конфигурация API
- Все API запросы идут через относительные пути `/api/*`
- Изображения загружаются через `/uploads/*`
- Используется проксирование через Netlify Edge Functions

### 2. Проксирование через Netlify
- **API запросы**: `/api/*` → Edge Function → `https://91.92.42.248/api/*`
- **Изображения**: `/uploads/*` → `https://91.92.42.248//api/uploads/*`
- Все запросы идут через HTTPS

### 3. Переменные окружения
```
VITE_API_BASE_URL = (пустое - для использования проксирования)
VITE_APP_ENV = production
VITE_APP_NAME = Аренда инструментов
```

## 🚀 Деплой

### 1. Загрузите в Netlify
- Перетащите папку `dist` в Netlify
- Или подключите Git репозиторий

### 2. Настройте переменные окружения
В панели Netlify → Site settings → Environment variables:
- `VITE_API_BASE_URL` = (оставить пустым)

### 3. Включите Edge Functions
В панели Netlify → Site settings → Functions:
- Убедитесь, что Edge Functions включены

## 🔍 Проверка

После деплоя проверьте:
- ✅ Сайт открывается по HTTPS
- ✅ API запросы работают без ошибок Mixed Content
- ✅ Изображения загружаются корректно
- ✅ В консоли браузера нет ошибок

## 📝 Примечания

- Все запросы теперь идут через HTTPS
- Сервер `91.92.42.248` теперь работает через HTTPS
- Edge Functions обеспечивают безопасное соединение
- Изображения также проксируются через HTTPS

## 🛠️ Файлы конфигурации

- `netlify.toml` - настройки проксирования
- `netlify/edge-functions/api-proxy.ts` - Edge Function для API
- `src/config/config.js` - конфигурация API
- `netlify.env` - переменные окружения
