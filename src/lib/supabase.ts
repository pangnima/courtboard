import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('.env.local에 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY를 설정하세요.')
}

export const supabase = createClient(url, key)
