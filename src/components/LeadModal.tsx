import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Camera } from 'lucide-react'
import { useLang } from '../i18n/LanguageContext'
import { submitLead, generateTale } from '../lib/leads'

type Form = {
  parentName: string
  contact: string
  childName: string
  childAge: string
  interests: string
  favoriteToy: string
  genre: string
  theme: string
}

const empty: Form = {
  parentName: '',
  contact: '',
  childName: '',
  childAge: '',
  interests: '',
  favoriteToy: '',
  genre: 'adventure',
  theme: '',
}

export function LeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLang()
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [photo, setPhoto] = useState('')

  // Сжимаем фото на устройстве до 800px JPEG — быстро грузится и не тащим лишние мегабайты
  const handlePhoto = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const max = 800
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        setPhoto(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(false)

    const genreLabel = t.lead.genres.find((g) => g.key === form.genre)?.label ?? form.genre
    const payload = {
      name: form.parentName,
      contact: form.contact,
      childName: form.childName,
      childAge: form.childAge,
      interests: form.interests,
      favoriteToy: form.favoriteToy,
      genre: genreLabel,
      theme: form.theme,
    }

    try {
      await submitLead(payload)
      // Генерация уходит в фон: сказка сохраняется в БД и летит владелице
      // в Telegram на проверку. Клиент получит её по почте после одобрения.
      generateTale({
        parentName: form.parentName,
        contact: form.contact,
        childName: form.childName,
        childAge: form.childAge,
        interests: form.interests,
        favoriteToy: form.favoriteToy,
        genre: genreLabel,
        theme: form.theme,
        language: lang,
        childPhoto: photo || undefined,
      }).catch((err) => console.error('generation failed:', err))
      setSent(true)
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    onClose()
    setTimeout(() => {
      setSent(false)
      setError(false)
      setSubmitting(false)
      setForm(empty)
      setPhoto('')
    }, 250)
  }

  const inputCls =
    'w-full rounded-xl border border-peach-2 bg-white px-4 py-3 text-ink outline-none transition-colors focus:border-brand'

  const fields: { k: keyof Form; ph: string; required: boolean; type: string }[] = [
    { k: 'parentName', ph: t.lead.parentName, required: true, type: 'text' },
    { k: 'contact', ph: t.lead.contact, required: true, type: 'email' },
    { k: 'childName', ph: t.lead.childName, required: true, type: 'text' },
    { k: 'childAge', ph: t.lead.childAge, required: true, type: 'text' },
    { k: 'interests', ph: t.lead.interests, required: false, type: 'text' },
    { k: 'favoriteToy', ph: t.lead.favoriteToy, required: false, type: 'text' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-cream p-7 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold">{t.lead.title}</h3>
              <button onClick={close} aria-label="✕" className="text-ink-soft hover:text-ink">
                <X size={22} />
              </button>
            </div>

            {sent ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Check size={30} />
                </div>
                <p className="text-lg font-medium">{t.lead.success}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {fields.map((f) => (
                  <input
                    key={f.k}
                    type={f.type}
                    required={f.required}
                    placeholder={f.ph}
                    value={form[f.k]}
                    onChange={(e) => setForm({ ...form, [f.k]: e.target.value })}
                    className={inputCls}
                  />
                ))}

                <div>
                  <label className="mb-1.5 block px-1 text-sm text-ink-soft">{t.lead.photoLabel}</label>
                  {photo ? (
                    <div className="flex items-center gap-3 rounded-xl border border-peach-2 bg-white px-4 py-2.5">
                      <img
                        src={photo}
                        alt="Фото ребёнка"
                        className="h-14 w-14 rounded-lg border border-peach-2 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhoto('')}
                        className="text-sm text-brand hover:text-brand-strong"
                      >
                        {t.lead.photoRemove}
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-dashed border-peach-2 bg-white px-4 py-3 text-sm text-ink-soft transition-colors hover:border-brand">
                      <Camera size={18} className="mt-0.5 shrink-0 text-brand" />
                      <span>{t.lead.photoHint}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block px-1 text-sm text-ink-soft">{t.lead.genreLabel}</label>
                  <div className="flex flex-wrap gap-2">
                    {t.lead.genres.map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setForm({ ...form, genre: g.key })}
                        className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                          form.genre === g.key
                            ? 'border-brand bg-brand text-white'
                            : 'border-peach-2 bg-white text-ink-soft hover:border-brand hover:text-ink'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  placeholder={t.lead.theme}
                  value={form.theme}
                  onChange={(e) => setForm({ ...form, theme: e.target.value })}
                  rows={2}
                  className={inputCls}
                />
                {error && <p className="text-center text-sm text-red-500">{t.lead.error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-brand py-3.5 font-medium text-white transition hover:bg-brand-strong disabled:opacity-60"
                >
                  {submitting ? t.lead.submitting : t.lead.submit}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
