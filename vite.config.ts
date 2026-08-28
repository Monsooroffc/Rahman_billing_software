import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// The app runs in cloud mode only when it can see a Supabase URL + anon key.
// Vite only exposes `VITE_*` variables, but the Supabase <-> Vercel integration
// injects `SUPABASE_*` / `NEXT_PUBLIC_*` names instead. This helper resolves the
// credentials from any of those names so cloud mode works everywhere.
function resolveSupabaseEnv(env: Record<string, string | undefined>) {
  const pick = (...names: string[]) => {
    for (const name of names) {
      const value = env[name] ?? process.env[name]
      if (value) return value
    }
    return ''
  }
  return {
    url: pick('VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'VITE_NEXT_PUBLIC_SUPABASE_URL'),
    key: pick('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}

export default defineConfig(({ mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '')
  const supabaseEnv = resolveSupabaseEnv(loadedEnv)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: './',
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseEnv.url),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseEnv.key),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
