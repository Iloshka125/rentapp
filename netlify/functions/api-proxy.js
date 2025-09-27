exports.handler = async (event, context) => {
  // Разрешаем CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Обрабатываем preflight запросы
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Получаем путь API из URL
    const apiPath = event.path.replace('/api-proxy', '');
    const targetUrl = `http://91.92.42.248:7000/api${apiPath}`;

    console.log(`🔍 Proxying ${event.httpMethod} ${apiPath} to ${targetUrl}`);

    // Подготавливаем запрос
    const requestOptions = {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Добавляем тело запроса для POST/PUT/DELETE
    if (event.body && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.httpMethod)) {
      requestOptions.body = event.body;
    }

    // Копируем заголовки авторизации
    if (event.headers.authorization) {
      requestOptions.headers.Authorization = event.headers.authorization;
    }

    // Выполняем запрос к серверу
    const response = await fetch(targetUrl, requestOptions);
    const responseText = await response.text();

    console.log(`🔍 Response status: ${response.status}`);

    return {
      statusCode: response.status,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: responseText,
    };
  } catch (error) {
    console.error('🔍 Proxy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Proxy error' }),
    };
  }
};