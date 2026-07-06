import { createClient } from '@supabase/supabase-js'

// Оба значения ПУБЛИЧНЫЕ и безопасны для браузера.
// Секреты (Telegram-токен, service-role key) живут только в Supabase Edge Functions.
const SUPABASE_URL = 'https://ttjabvrcfeotmtmefodl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_g0_KKeKCaX1B1-8YKbl-Ag_30k_hSgu'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
