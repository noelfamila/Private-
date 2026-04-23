import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 公式ニュースAPI (JP) へのCORS回避プロキシ
      // キャンペーン情報のパースに使用
      '/api/news': {
        target: 'https://api-web.bluearchive.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '/api/news'),
      },
      // arona-archive notices.json へのCORS回避プロキシ
      // イベント・ガチャ・総力戦・大決戦・制約解除決戦などの全スケジュール情報
      '/api/arona': {
        target: 'https://raw.githubusercontent.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/arona/, '/arona-archive/blue-archive-event-calendar/main/src/_data'),
      },
    },
  },
})
