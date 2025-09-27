# 🚀 Инструкция по деплою на Netlify

## Быстрый старт

### 1. Подготовка
Убедитесь, что у вас есть:
- ✅ Аккаунт на [netlify.com](https://netlify.com)
- ✅ Проект собран локально (`npm run build`)

### 2. Способы деплоя

#### Способ 1: Drag & Drop (самый простой)
1. Выполните сборку: `npm run build`
2. Перейдите на [netlify.com](https://netlify.com)
3. Перетащите папку `dist` в область "Deploy manually"
4. Готово! 🎉

#### Способ 2: Через Git (рекомендуется)
1. Загрузите код в GitHub/GitLab
2. В Netlify: "New site from Git"
3. Выберите репозиторий
4. Настройки:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 3. Настройка переменных окружения
В панели Netlify → Site settings → Environment variables:
```
VITE_API_BASE_URL = (оставить пустым для использования HTTPS проксирования)
VITE_APP_ENV = production
VITE_APP_NAME = Аренда инструментов
```

**Важно**: Оставьте `VITE_API_BASE_URL` пустым, чтобы использовать HTTPS проксирование через Netlify Edge Functions.

### 4. Проверка
После деплоя проверьте:
- ✅ Сайт открывается
- ✅ Поиск работает
- ✅ Фильтры работают
- ✅ API запросы проходят

## Файлы конфигурации

Созданы следующие файлы:
- `netlify.toml` - основная конфигурация
- `public/_redirects` - перенаправления для SPA
- `public/_headers` - заголовки безопасности
- `netlify/functions/cors-proxy.js` - функция для CORS (если нужно)

## Возможные проблемы

### CORS ошибки
Если API не работает, добавьте в `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
```

### Проблемы с роутингом
Убедитесь, что в `public/_redirects` есть:
```
/*    /index.html   200
```

## Контакты
Сервер API: `https://91.92.42.248`
