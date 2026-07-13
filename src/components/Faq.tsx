import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reveal } from './Reveal'
import { useLang } from '../i18n/LanguageContext'

export function Faq() {
  const { t } = useLang()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="bg-cream-2 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t.faq.title}</h2>
        </Reveal>
        <div className="mt-12 space-y-3">
          {t.faq.items.map((it, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="overflow-hidden rounded-2xl border border-peach/70 bg-cream">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-medium text-ink">{it.q}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-brand transition-transform ${open === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-6 pb-5 text-ink-soft">{it.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
