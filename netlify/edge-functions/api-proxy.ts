// Netlify Edge Function для проксирования API запросов
export default async (request: Request) => {
  // Настройки CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  // Обработка preflight запросов
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Получаем путь API из URL
    const url = new URL(request.url);
    const apiPath = url.pathname; // Оставляем полный путь включая /api
    
    // Убеждаемся, что путь начинается с /api
    const finalPath = apiPath.startsWith('/api') ? apiPath : `/api${apiPath}`;
    const apiUrl = `http://91.92.42.248${finalPath}`;
    
    console.log(`🔄 Проксируем запрос: ${request.method} ${apiUrl}`);
    console.log(`🔄 Исходный путь: ${apiPath}, Финальный путь: ${finalPath}`);
    
    // Подготавливаем заголовки для запроса к API
    const requestHeaders = new Headers();
    requestHeaders.set('Content-Type', 'application/json');
    requestHeaders.set('Accept', 'application/json');
    
    // Копируем важные заголовки
    if (request.headers.get('authorization')) {
      requestHeaders.set('Authorization', request.headers.get('authorization')!);
    }
    
    if (request.headers.get('x-requested-with')) {
      requestHeaders.set('X-Requested-With', request.headers.get('x-requested-with')!);
    }

    // Выполняем запрос к API
    const response = await fetch(apiUrl, {
      method: request.method,
      headers: requestHeaders,
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const responseText = await response.text();
    
    console.log(`✅ Ответ от API: ${response.status} ${response.statusText}`);

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Ошибка при проксировании API:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Ошибка при обращении к API',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
};
