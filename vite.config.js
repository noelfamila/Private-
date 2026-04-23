import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // ブルアカ非公式APIへのCORS回避プロキシ
      '/api/buruaka': {
        target: 'https://api.ennead.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/buruaka/, '/buruaka'),
      },
      // 公式ニュースAPIへのCORS回避プロキシ
      '/api/news': {
        target: 'https://api-web.bluearchive.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '/api/news'),
      },
      // SchaleDB Raw JSONへのプロキシ（総力戦・大決戦スケジュール）
      '/api/schaledb': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/schaledb/, '/SchaleDB/SchaleDB/main/data'),
      },
      // arona-archive notices.jsonへのプロキシ（全スケジュール情報の完全なデータベース）
      '/api/arona': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/arona/, '/arona-archive/blue-archive-event-calendar/main/src/_data'),
      },
    },
  },
})
