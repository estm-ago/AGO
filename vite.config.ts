import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      // 告訴 Vite 忽略 __data_gen 資料夾下的所有檔案變動
      ignored: ["**/src-tauri/__data_gen/**"], 
    },
  },
});
