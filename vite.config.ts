import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // Вырезаем console.* и debugger только из прод-сборки (#29):
  // в src ~222 вызова, часть печатала id/имена игроков. В dev логи остаются.
  esbuild: command === 'build' ? { drop: ['console', 'debugger'] } : {},
  test: {
    globals: true,
    environment: 'happy-dom'
  }
}))



