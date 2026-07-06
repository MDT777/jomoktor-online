// Отправка заявки и генерация сказки для JOMOK.
//
// Оба значения ниже ПУБЛИЧНЫЕ и безопасны для браузера:
//   - URL Edge Function — публичный эндпоинт
//   - publishable (anon) key Supabase создан для клиентского кода
// Секреты (Telegram-токен, Gemini-ключ, service-role key) живут ТОЛЬКО
// внутри Supabase Edge Functions и никогда не попадают сюда.

const SUPABASE_URL = 'https://ttjabvrcfeotmtmefodl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_g0_KKeKCaX1B1-8YKbl-Ag_30k_hSgu'

export type LeadPayload = {
  name: string
  contact: string
  childName: string
  childAge: string
  interests: string
  favoriteToy: string
  genre: string
  theme: string
}

async function callFunction(fn: string, payload: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${fn} failed (${res.status}): ${JSON.stringify(data)}`)
  }
  return data
}

export async function submitLead(payload: LeadPayload): Promise<void> {
  await callFunction('submit-lead', payload)
}

export type TaleResult = { title: string; story: string; status: string }

export async function generateTale(
  payload: Omit<LeadPayload, 'name'> & { parentName: string; language: string; childPhoto?: string },
): Promise<TaleResult | null> {
  const data = await callFunction('generate-tale', payload)
  if (!data.ok) return null // генерация недоступна (например, нет ключа)
  return {
    title: String(data.title ?? ''),
    story: String(data.story ?? ''),
    status: String(data.status ?? ''),
  }
}
