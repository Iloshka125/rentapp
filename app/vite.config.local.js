import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Локальная конфигурация для внешнего доступа
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
    cors: true, // Разрешить CORS
    hmr: {
      host: 'localhost', // HMR только для localhost
    },
  },
  preview: {
    host: '0.0.0.0', // Preview также доступен с любого IP
    port: 4173,
  },
})
