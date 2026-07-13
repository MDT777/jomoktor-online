import { Crown, BookOpen, Heart, Moon } from 'lucide-react'
import { Reveal } from './Reveal'
import { useLang } from '../i18n/LanguageContext'

const icons = [Crown, BookOpen, Heart, Moon]

export function Benefits() {
  const { t } = useLang()
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.benefits.title}</h2>
      </Reveal>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {t.benefits.items.map((b, i) => {
          const Icon = icons[i]
          return (
            <Reveal key={i} delay={i * 0.1}>
              <div className="h-full rounded-3xl border border-peach/70 bg-cream-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{b.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{b.desc}</p>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
