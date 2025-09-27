# 🔧 ИСПРАВЛЕНИЕ: Порядок redirects в Netlify

## Проблема
```
Response text: <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Discway</title>
```

API запросы возвращают HTML страницу вместо JSON.

## ✅ Причина и решение

### Проблема была в порядке redirects:
- **Неправильно**: `/*` → `/index.html` был ПЕРВЫМ
- **Правильно**: `/api/*` → сервер должен быть ПЕРВЫМ

### Что исправлено:

1. **netlify.toml** - переместили API redirects ВВЕРХ:
```toml
# API проксирование (ДОЛЖНО БЫТЬ ПЕРВЫМ!)
[[redirects]]
  from = "/api/*"
  to = "http://91.92.42.248/api/:splat"
  status = 200
  force = true

# SPA redirect (ДОЛЖНО БЫТЬ ПОСЛЕДНИМ!)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **public/_redirects** - аналогично исправлен порядок

## 🚀 Деплой

### 1. Пересоберите проект:
```bash
npm run build
```

### 2. Загрузите в Netlify:
- Перетащите папку `dist` в Netlify

### 3. Проверьте тестовую страницу:
- Откройте `https://your-site.netlify.app/test-api.html`
- Нажмите "Test API"
- Должен вернуться JSON, а не HTML

## 🔍 Ожидаемый результат

После исправления:
- ✅ `/api/product/getAll` → JSON данные
- ✅ `/api/user/auth` → JSON данные  
- ✅ Фото загружаются корректно
- ✅ Нет ошибок "Unexpected token '<'"

## 📝 Примечания

- Порядок redirects в Netlify критически важен
- Более специфичные правила должны идти ПЕРВЫМИ
- Общие правила (как `/*`) должны идти ПОСЛЕДНИМИ
- `force = true` гарантирует применение redirect
