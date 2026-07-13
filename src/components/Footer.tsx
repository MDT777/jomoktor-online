import { useLang } from '../i18n/LanguageContext'

export function Footer() {
  const { t } = useLang()
  return (
    <footer className="border-t border-peach/70 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <div className="font-display text-xl font-bold text-ink">
          JOMOKTOR<span className="text-brand">.online</span>
        </div>
        <p className="text-sm text-ink-soft">{t.footer.tagline}</p>
        <p className="text-xs text-ink-soft">© 2026 JOMOKTOR</p>
      </div>
    </footer>
  )
}
