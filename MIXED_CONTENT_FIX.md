# 🔧 Решение проблемы Mixed Content

## Проблема
```
Mixed Content: The page at 'https://discway.netlify.app/' was loaded over HTTPS, 
but requested an insecure resource 'https://91.92.42.248/api/product/getAll'. 
This request has been blocked; the content must be served over HTTPS.
```

## ✅ Решение

### 1. Настроено проксирование через Netlify Functions
- Создан файл `netlify/functions/api-proxy.js`
- Обновлен `netlify.toml` для перенаправления `/api/*` на функцию
- API запросы теперь идут через HTTPS

### 2. Обновлена конфигурация API
- `src/config/config.js` теперь использует относительные пути в продакшене
- Переменная `VITE_API_BASE_URL` должна быть пустой в Netlify

### 3. Настройки для Netlify
В панели Netlify → Site settings → Environment variables:
```
VITE_API_BASE_URL = (оставить пустым)
VITE_APP_ENV = production
VITE_APP_NAME = Аренда инструментов
```

## 🚀 Как применить исправления

### Вариант 1: Пересборка и передеплой
1. Выполните сборку: `npm run build`
2. Загрузите папку `dist` в Netlify
3. Убедитесь, что переменная `VITE_API_BASE_URL` пустая

### Вариант 2: Автоматический деплой
1. Загрузите изменения в Git
2. Netlify автоматически пересоберет проект
3. Убедитесь, что переменная `VITE_API_BASE_URL` пустая

## 🔍 Проверка
После деплоя проверьте в консоли браузера:
- ✅ Нет ошибок Mixed Content
- ✅ API запросы идут на `/api/*` (относительные пути)
- ✅ Данные загружаются корректно

## 📝 Примечания
- Проксирование работает только для API запросов
- Загрузка изображений по-прежнему идет напрямую на сервер
- Если нужно HTTPS для изображений, настройте SSL на сервере `91.92.42.248`
