import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default ({ mode }) => {
  // Carrega o arquivo .env do diretório raiz
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [react()],
    // Injeta as variáveis de ambiente no código da aplicação
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
    },
    server: {
      port: 3000,
      open: true,
    },
  });
};