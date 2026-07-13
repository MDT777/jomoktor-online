import { Lock } from 'lucide-react'
import { Reveal } from './Reveal'
import { useLang } from '../i18n/LanguageContext'

const spines = ['#f28a5b', '#7bb6ff', '#c79bff', '#7be0c0', '#ffd36b', '#ff8ab3', '#f28a5b', '#a0d468']

export function Library({ onCreate }: { onCreate: () => void }) {
  const { t } = useLang()
  return (
    <section id="library" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-twilight to-twilight-violet p-8 sm:p-12">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Lock size={13} /> {t.library.badge}
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
              {t.library.title}
            </h2>
            <p className="mt-4 max-w-md text-white/80">{t.library.desc}</p>
            <button
              onClick={onCreate}
              className="mt-7 rounded-full bg-white px-7 py-3 font-medium text-twilight transition hover:scale-[1.03]"
            >
              {t.library.cta}
            </button>
          </Reveal>
          <Reveal delay={0.15}>
            <div
              className="flex items-end justify-center gap-2 rounded-2xl bg-white/10 p-6"
              style={{ minHeight: 190 }}
            >
              {spines.map((c, i) => (
                <div
                  key={i}
                  className="rounded-md shadow-md transition-transform duration-300 hover:-translate-y-3"
                  style={{ width: 26, height: 84 + (i % 3) * 26, background: c }}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
