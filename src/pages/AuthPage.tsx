import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLang } from '../i18n/LanguageContext'

export function AuthPage() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/account')
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          navigate('/account')
        } else {
          setMessage({ kind: 'info', text: t.auth.checkEmail })
        }
      }
    } catch (err) {
      console.error(err)
      setMessage({ kind: 'error', text: t.auth.error })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-peach/60 bg-cream/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink">
            JOMOKTOR
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
            <ArrowLeft size={16} /> {t.auth.backHome}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-14">
        <div className="w-full max-w-md rounded-3xl border border-peach/70 bg-white/70 p-8">
          <h1 className="font-display text-3xl font-bold">
            {mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle}
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={t.auth.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-peach-2 bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-brand"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={t.auth.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-peach-2 bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-brand"
            />

            {message && (
              <p
                className={`text-center text-sm ${message.kind === 'error' ? 'text-red-500' : 'text-ink-soft'}`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-brand py-3.5 font-medium text-white transition hover:bg-brand-strong disabled:opacity-60"
            >
              {busy ? t.auth.loading : mode === 'login' ? t.auth.loginBtn : t.auth.signupBtn}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setMessage(null)
            }}
            className="mt-5 w-full text-center text-sm text-brand hover:text-brand-strong"
          >
            {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
          </button>
        </div>
      </main>
    </div>
  )
}
