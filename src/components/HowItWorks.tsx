import { PencilLine, Wand2, Download } from 'lucide-react'
import { Reveal } from './Reveal'
import { useLang } from '../i18n/LanguageContext'

const icons = [PencilLine, Wand2, Download]

export function HowItWorks() {
  const { t } = useLang()
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal className="text-center">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.how.title}</h2>
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {t.how.steps.map((s, i) => {
          const Icon = icons[i]
          return (
            <Reveal key={i} delay={i * 0.12}>
              <div className="h-full rounded-3xl border border-peach/70 bg-cream-2 p-7 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Icon size={26} />
                </div>
                <div className="mt-3 text-sm font-semibold text-brand">{i + 1}</div>
                <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-ink-soft">{s.desc}</p>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
