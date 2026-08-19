import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173 },
  // amazon-cognito-identity-js espera el `global` de Node; Vite no lo define
  // en el navegador (a diferencia de Webpack), asi que lo mapeamos a nosotros.
  define: { global: 'globalThis' },
});
