# 🔍 Диагностика проблемы с API

## Проблема
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

Сервер возвращает HTML вместо JSON.

## 🔧 Добавлена отладка

### 1. В apiService добавлена детальная отладка:
- URL запроса
- Статус ответа
- Заголовки ответа
- Содержимое ответа (первые 200 символов)

### 2. Создан тестовый файл:
- `public/test-api.html` - для тестирования API напрямую
- Откройте `https://your-site.netlify.app/test-api.html`
- Нажмите "Test API" для проверки

## 🚀 Деплой и тестирование

### 1. Загрузите в Netlify:
- Перетащите папку `dist` в Netlify

### 2. Проверьте в консоли браузера:
```
🔧 Fetching URL: /api/product/getAll
🔧 Response status: 200
🔧 Response headers: {...}
🔧 Response text preview: {"products":[...]}
```

### 3. Если все еще HTML:
- Проверьте, что в настройках Netlify `VITE_API_BASE_URL` пустая
- Проверьте, что redirects работают в `netlify.toml`
- Откройте `https://your-site.netlify.app/test-api.html`

## 🔍 Возможные причины

### 1. Переменная окружения не очищена:
- В Netlify: Site settings → Environment variables
- Удалите `VITE_API_BASE_URL` или установите пустое значение

### 2. Redirects не работают:
- Проверьте `netlify.toml`
- Убедитесь, что используется `http://` а не `https://`

### 3. Сервер недоступен:
- Проверьте, что `http://91.92.42.248` доступен
- Возможно, сервер не отвечает на `/api/product/getAll`

## 📝 Следующие шаги

1. Загрузите обновленный проект
2. Проверьте консоль браузера на детальную отладку
3. Откройте тестовую страницу для проверки API
4. Сообщите результаты отладки
