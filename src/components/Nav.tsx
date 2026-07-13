import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Globe } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { useSession } from '../lib/useSession'

export function Nav({ onCreate }: { onCreate: () => void }) {
  const { t, lang, setLang } = useLang()
  const { session } = useSession()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#how', label: t.nav.how },
    { href: '#examples', label: t.nav.examples },
    { href: '#library', label: t.nav.library },
    { href: '#faq', label: t.nav.faq },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-peach/60 bg-cream/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <a href="#top" className="font-display text-2xl font-bold tracking-tight text-ink">
          JOMOKTOR
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setLang(lang === 'ru' ? 'ky' : 'ru')}
            className="flex items-center gap-1 rounded-full border border-peach-2 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
            aria-label="Сменить язык"
          >
            <Globe size={14} /> {lang === 'ru' ? 'RU' : 'KG'}
          </button>
          <Link
            to={session ? '/account' : '/login'}
            className="hidden text-sm text-ink-soft transition-colors hover:text-ink sm:block"
          >
            {session ? t.nav.account : t.nav.login}
          </Link>
          <button
            onClick={onCreate}
            className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-strong"
          >
            {t.nav.createBook}
          </button>
          <button
            className="text-ink md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Меню"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-peach/60 bg-cream px-5 py-3 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-ink-soft"
            >
              {l.label}
            </a>
          ))}
          <Link
            to={session ? '/account' : '/login'}
            onClick={() => setOpen(false)}
            className="block py-2 font-medium text-brand"
          >
            {session ? t.nav.account : t.nav.login}
          </Link>
        </div>
      )}
    </header>
  )
}
