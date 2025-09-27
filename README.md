# RentApp - Frontend

## Конфигурация

### Файл конфигурации (`src/config/config.js`)

Все URL сервера и API endpoints находятся в файле `src/config/config.js`:

```javascript
export const config = {
  serverUrl: 'http://localhost:7000',
  api: {
    baseUrl: 'http://localhost:7000/api',
    uploads: 'http://localhost:7000/uploads'
  }
};
```

**Для изменения URL сервера редактируйте только этот файл!**

## Система алертов

### Компоненты

- **`Alert.jsx`** - Отдельный алерт с анимацией
- **`AlertContainer.jsx`** - Контейнер для всех алертов
- **`AlertContext.jsx`** - Контекст для управления алертами

### Хук `useAlertContext`

Используйте хук `useAlertContext` в компонентах для показа алертов:

```javascript
import { useAlertContext } from '../contexts/AlertContext';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useAlertContext();
  
  const handleSuccess = () => {
    showSuccess('Операция выполнена успешно!');
  };
  
  const handleError = () => {
    showError('Произошла ошибка!');
  };
  
  const handleWarning = () => {
    showWarning('Внимание!');
  };
  
  const handleInfo = () => {
    showInfo('Информационное сообщение');
  };
};
```

### Типы алертов

- **`success`** - Успешные операции (зеленый)
- **`error`** - Ошибки (красный)
- **`warning`** - Предупреждения (желтый)
- **`info`** - Информация (синий)

### Параметры

```javascript
showSuccess(message, duration); // duration в миллисекундах (по умолчанию 2000)
showError(message, duration);
showWarning(message, duration);
showInfo(message, duration);
```

## Использование конфигурации

### Для API запросов

```javascript
import { getApiUrl } from '../config/config';

const apiUrl = getApiUrl('/product/create');
// Результат: http://localhost:7000/api/product/create
```

### Для загруженных файлов

```javascript
import { getUploadUrl } from '../config/config';

const imageUrl = getUploadUrl('filename.jpg');
// Результат: http://localhost:7000/uploads/filename.jpg
```

## Примеры использования

### В компонентах

```javascript
import { useAlertContext } from '../contexts/AlertContext';
import { getUploadUrl } from '../config/config';

export const ProductCard = ({ product }) => {
  const { showSuccess, showError } = useAlertContext();
  
  const handleAddToFavorites = async () => {
    try {
      await favouriteService.addToFavourites(product.id);
      showSuccess('Товар добавлен в избранное!');
    } catch (error) {
      showError('Не удалось добавить товар в избранное');
    }
  };
  
  return (
    <div>
      <img src={getUploadUrl(product.photo)} alt={product.name} />
      <button onClick={handleAddToFavorites}>В избранное</button>
    </div>
  );
};
```

### В сервисах

```javascript
import { config } from '../config/config';

class ProductService {
  async getAllProducts() {
    const response = await fetch(`${config.api.baseUrl}/product/all`);
    return response.json();
  }
}
```

## Структура файлов

```
src/
├── config/
│   └── config.js          # Конфигурация приложения
├── components/
│   ├── Alert.jsx          # Компонент алерта
│   ├── AlertContainer.jsx # Контейнер алертов
│   └── ...
├── contexts/
│   └── AlertContext.jsx   # Контекст алертов
├── hooks/
│   └── useAlert.js        # Хук для управления алертами
└── services/
    └── api.js             # API сервис (использует config)
```

## Миграция с хардкода

Если в компоненте есть хардкод URL:

```javascript
// Было
const imageUrl = `http://localhost:7000/uploads/${product.photo}`;

// Стало
import { getUploadUrl } from '../config/config';
const imageUrl = getUploadUrl(product.photo);
```

## Примечания

1. **Всегда используйте функции из config** вместо хардкода URL
2. **Алерты автоматически исчезают** через 2 секунды (можно настроить)
3. **Алерты можно закрыть вручную** кликом на крестик
4. **Контекст алертов доступен во всем приложении** через `AlertProvider`
