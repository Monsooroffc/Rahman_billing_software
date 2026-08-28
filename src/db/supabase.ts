import { createClient } from '@supabase/supabase-js'

// Cloud database credentials for RAHMAN XEROX & SIFY IWAY.
// The publishable key is a PUBLIC client credential (safe to embed in the app)
// and all data access is protected by Row Level Security (RLS) policies.
// These are hardcoded so the web (Vercel) and desktop (Electron) builds always
// work without depending on environment variables being configured at build time.
const SUPABASE_URL = 'https://nmogcjtdxnrormypvxfk.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_YZAgm5iMFVDzons8StlWvQ_Gj9Qep6a'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export const hasCloudDatabase = true
