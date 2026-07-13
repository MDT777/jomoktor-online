import { Camera, BookMarked } from 'lucide-react'
import { Reveal } from './Reveal'
import { useLang } from '../i18n/LanguageContext'

const icons = [Camera, BookMarked]

export function ComingSoon() {
  const { t } = useLang()
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.soon.title}</h2>
      </Reveal>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {t.soon.items.map((s, i) => {
          const Icon = icons[i]
          return (
            <Reveal key={i} delay={i * 0.1}>
              <div className="flex items-center gap-4 rounded-3xl border border-dashed border-peach-2 bg-cream-2 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={24} />
                </div>
                <div>
                  <span className="mb-1 inline-block rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium text-brand-strong">
                    {t.soon.badge}
                  </span>
                  <p className="font-medium text-ink">{s}</p>
                </div>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
