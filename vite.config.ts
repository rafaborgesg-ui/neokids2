import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default ({ mode }) => {
  // Carrega o arquivo .env do diretório raiz
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          navigateFallback: '/index.html',
        },
        manifest: {
          name: 'Neokids - Sistema de Gestão Pediátrica',
          short_name: 'Neokids',
          description: 'Sistema completo de gestão para clínicas pediátricas',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
    // Injeta as variáveis de ambiente no código da aplicação
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    publicDir: 'public', // Define explicitamente a pasta public
    build: {
      target: 'es2020',
    },
    server: {
      port: 3000,
      open: true,
      hmr: {
        host: 'localhost',
        protocol: 'ws',
        clientPort: 3000,
      },
    },
  });
};