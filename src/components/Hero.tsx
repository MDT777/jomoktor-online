import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'

export function Hero({ onCreate }: { onCreate: () => void }) {
  const { t } = useLang()

  return (
    <section id="top" className="relative overflow-hidden">
      <img
        src="/hero.jpg"
        alt="Волшебный мир JOMOKTOR: ребёнок читает книгу, рядом дракон, единорог и радуга"
        className="absolute inset-0 h-full w-full select-none object-cover"
        draggable={false}
      />
      {/* лёгкое затемнение для читаемости текста */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/35" />

      <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center sm:min-h-[86vh]">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur"
        >
          <Sparkles size={15} /> {t.hero.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-4xl font-bold leading-[1.08] text-white drop-shadow-[0_2px_12px_rgba(20,10,60,0.45)] sm:text-6xl"
        >
          {t.hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/95 drop-shadow-[0_1px_8px_rgba(20,10,60,0.5)]"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <button
            onClick={onCreate}
            className="rounded-full bg-brand px-8 py-3.5 text-base font-medium text-white shadow-lg shadow-brand/40 transition hover:scale-[1.03] hover:bg-brand-strong"
          >
            {t.hero.cta}
          </button>
          <a
            href="#examples"
            className="glass rounded-full px-8 py-3.5 text-base font-medium text-white transition hover:scale-[1.03]"
          >
            {t.hero.ctaSecondary}
          </a>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-b from-transparent to-cream" />
    </section>
  )
}
