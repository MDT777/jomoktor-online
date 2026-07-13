import { Reveal } from './Reveal'
import { useLang } from '../i18n/LanguageContext'

const covers = [
  { src: '/examples/knight.jpg', pos: '50% 30%' },
  { src: '/examples/camping.jpg', pos: '62% center' },
  { src: '/examples/ballerina.jpg', pos: '50% 30%' },
  { src: '/examples/bears.jpg', pos: 'center' },
  { src: '/examples/bunnies.jpg', pos: '50% 65%' },
]

export function Examples({ onCreate }: { onCreate: () => void }) {
  const { t } = useLang()
  return (
    <section id="examples" className="bg-cream-2 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.examples.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-ink-soft">{t.examples.desc}</p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {t.examples.books.map((b, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-peach-2 shadow-lg transition-transform duration-300 group-hover:-translate-y-2">
                  <img
                    src={covers[i].src}
                    alt={b.title}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: covers[i].pos }}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent p-4 pt-12">
                    <div className="font-display text-lg font-bold leading-snug text-white drop-shadow-md">
                      {b.title}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-sm text-ink-soft">{b.caption}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mx-auto mt-12 flex max-w-2xl flex-col items-center justify-between gap-4 rounded-2xl border border-peach-2 bg-cream px-6 py-5 sm:flex-row">
            <p className="text-center font-medium text-ink sm:text-left">{t.examples.cta}</p>
            <button
              onClick={onCreate}
              className="shrink-0 rounded-full bg-brand px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-strong"
            >
              {t.nav.createBook}
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
