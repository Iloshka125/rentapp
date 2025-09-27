import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // Доступ с любого IP
    port: 5173, // Порт по умолчанию
    strictPort: false, // Автоматически искать свободный порт
    open: false, // Не открывать браузер автоматически
  },
  build: {
    // Настройки для продакшена
    outDir: 'dist',
    sourcemap: false, // Отключаем source maps для продакшена
    minify: 'terser', // Минификация
    rollupOptions: {
      output: {
        // Оптимизация чанков
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  // Настройки для продакшена
  define: {
    // Заменяем переменные окружения на статические значения для продакшена
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'https://91.92.42.248/api'),
  },
})
