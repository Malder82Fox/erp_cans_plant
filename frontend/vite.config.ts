import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // не включать тестовые файлы в граф сборки
      external: [/\.test\.(t|j)sx?$/, /__tests__/]
    }
  }
})
