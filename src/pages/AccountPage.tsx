import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { useLang } from '../i18n/LanguageContext'

export function AccountPage() {
  const { t } = useLang()
  const { session, loading } = useSession()
  const navigate = useNavigate()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-cream text-ink-soft">…</div>
  }
  if (!session) {
    return <Navigate to="/login" replace />
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="border-b border-peach/60 bg-cream/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight text-ink">
            JOMOKTOR
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
          >
            <LogOut size={16} /> {t.account.logout}
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{t.account.title}</h1>
        <p className="mt-2 text-ink-soft">
          {t.account.hello}, <span className="font-medium text-ink">{session.user.email}</span>
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <section className="rounded-3xl border border-peach/70 bg-cream-2 p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <BookOpen size={24} />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold">{t.account.myTales}</h2>
            <p className="mt-2 text-sm text-ink-soft">{t.account.myTalesEmpty}</p>
            <Link
              to="/"
              className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-strong"
            >
              {t.account.createTale}
            </Link>
          </section>

          <section className="rounded-3xl border border-peach/70 bg-cream-2 p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Sparkles size={24} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <h2 className="font-display text-xl font-bold">{t.account.subscription}</h2>
              <span className="rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium text-brand-strong">
                {t.account.soonBadge}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{t.account.subscriptionSoon}</p>
          </section>
        </div>
      </main>
    </div>
  )
}
