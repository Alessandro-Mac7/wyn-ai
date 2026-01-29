'use client'

import { useState, FormEvent } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Wine, Sparkles, CheckCircle2, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  name: string
  email: string
  restaurant: string
  phone: string
  message: string
}

const initialFormData: FormData = {
  name: '',
  email: '',
  restaurant: '',
  phone: '',
  message: '',
}

const benefits = [
  {
    icon: Wine,
    title: 'Sommelier AI Dedicato',
    description: 'Un assistente virtuale che conosce la tua carta dei vini',
  },
  {
    icon: Sparkles,
    title: 'Esperienza Premium',
    description: 'I tuoi clienti ameranno scoprire i vini con WYN',
  },
  {
    icon: Building2,
    title: 'Setup Personalizzato',
    description: 'Configurazione su misura per il tuo locale',
  },
]

export default function ContactsPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.restaurant) return

    setIsSubmitting(true)

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setIsSubmitted(true)
    setFormData(initialFormData)
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      {/* Main content */}
      <main id="main-content" className="pl-0 sm:pl-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <motion.div
                  className="absolute -inset-4 rounded-full bg-wine/20 blur-xl"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <Image
                  src="/wyn-icon.ico"
                  alt="WYN"
                  width={64}
                  height={64}
                  className="w-16 h-16 relative z-10"
                />
              </div>
            </div>
            <h1 className="mina-bold text-3xl sm:text-4xl mb-3">
              Porta WYN nel Tuo Ristorante
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Trasforma l&apos;esperienza enologica dei tuoi clienti con il sommelier AI più avanzato
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="sticky top-8">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-wine" />
                  Perché Scegliere WYN
                </h2>

                <div className="space-y-4 mb-8">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={benefit.title}
                      className="flex gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-wine/30 transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                    >
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-wine/10 flex items-center justify-center">
                        <benefit.icon className="h-6 w-6 text-wine" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Contact Info */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-wine/10 to-transparent border border-wine/20">
                  <h3 className="font-medium mb-4">Contattaci Direttamente</h3>
                  <div className="space-y-3 text-sm">
                    <a
                      href="mailto:info@wyn.wine"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-4 w-4 text-wine" />
                      info@wyn.wine
                    </a>
                    <a
                      href="tel:+390123456789"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-4 w-4 text-wine" />
                      +39 012 345 6789
                    </a>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="h-4 w-4 text-wine" />
                      Milano, Italia
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {isSubmitted ? (
                <motion.div
                  className="p-8 rounded-2xl bg-card border border-border text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1, type: 'spring' }}
                  >
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2">Messaggio Inviato!</h3>
                  <p className="text-muted-foreground mb-6">
                    Ti contatteremo presto per discutere come WYN può aiutare il tuo locale.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-wine hover:underline text-sm"
                  >
                    Invia un altro messaggio
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-card border border-border">
                  <h2 className="text-xl font-semibold mb-6">Richiedi Informazioni</h2>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome e Cognome <span className="text-wine">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Mario Rossi"
                        required
                        className={cn(
                          'w-full h-11 px-4 rounded-lg',
                          'bg-secondary border-0',
                          'text-sm placeholder:text-muted-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-wine'
                        )}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email <span className="text-wine">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="mario@ristorante.it"
                        required
                        className={cn(
                          'w-full h-11 px-4 rounded-lg',
                          'bg-secondary border-0',
                          'text-sm placeholder:text-muted-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-wine'
                        )}
                      />
                    </div>

                    {/* Restaurant */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome del Ristorante <span className="text-wine">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.restaurant}
                        onChange={(e) => handleChange('restaurant', e.target.value)}
                        placeholder="Osteria del Vino"
                        required
                        className={cn(
                          'w-full h-11 px-4 rounded-lg',
                          'bg-secondary border-0',
                          'text-sm placeholder:text-muted-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-wine'
                        )}
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Telefono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+39 333 123 4567"
                        className={cn(
                          'w-full h-11 px-4 rounded-lg',
                          'bg-secondary border-0',
                          'text-sm placeholder:text-muted-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-wine'
                        )}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Messaggio
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder="Raccontaci del tuo ristorante e cosa ti piacerebbe ottenere con WYN..."
                        rows={4}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg resize-none',
                          'bg-secondary border-0',
                          'text-sm placeholder:text-muted-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-wine'
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.restaurant}
                    className={cn(
                      'w-full mt-6 h-12 rounded-lg font-medium',
                      'flex items-center justify-center gap-2',
                      'bg-wine text-white',
                      'hover:bg-wine-dark',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-colors duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-wine focus:ring-offset-2 focus:ring-offset-card'
                    )}
                    whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.99 }}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Invia Richiesta
                      </>
                    )}
                  </motion.button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Ti risponderemo entro 24 ore lavorative
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
