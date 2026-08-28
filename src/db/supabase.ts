import { createClient } from '@supabase/supabase-js'

// `vite.config.ts` maps the different Supabase env variable names (VITE_*,
// SUPABASE_* from the Vercel integration, NEXT_PUBLIC_*) into VITE_SUPABASE_URL
// and VITE_SUPABASE_ANON_KEY at build time. The extra fallbacks below keep this
// working in dev mode too, no matter which name is used.
const env = import.meta.env as Record<string, string | undefined>

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = url && key ? createClient(url, key) : null

// When true, the app stores everything in Supabase. When false it falls back to
// the local SQLite database (Electron) or browser localStorage (web preview).
export const hasCloudDatabase = Boolean(supabase)
