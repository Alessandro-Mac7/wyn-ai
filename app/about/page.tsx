'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Wine,
  Brain,
  MapPin,
  TrendingUp,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

// Value propositions
const valueProps = [
  {
    icon: Brain,
    title: 'Intelligenza reale',
    description: 'AI addestrata su migliaia di vini e abbinamenti. Non indovina, sa.',
  },
  {
    icon: MapPin,
    title: 'Dove sei tu',
    description: 'Funziona ovunque. Al ristorante, in enoteca, o dal divano di casa.',
  },
  {
    icon: TrendingUp,
    title: 'Dati che contano',
    description: 'Valutazioni da Gambero Rosso, Wine Spectator, Parker. Tutto in un posto.',
  },
]

// How it works steps
const steps = [
  {
    number: '01',
    title: 'Chiedi',
    description: 'Descrivi cosa cerchi. Un rosso corposo? Bollicine per l\'aperitivo? Qualcosa sotto i 30€?',
    icon: MessageCircle,
  },
  {
    number: '02',
    title: 'Scopri',
    description: 'WYN analizza, confronta e ti propone le migliori opzioni. Con spiegazioni chiare.',
    icon: Sparkles,
  },
  {
    number: '03',
    title: 'Gusta',
    description: 'Scegli con sicurezza. Niente più "questo va bene" detto a caso.',
    icon: Wine,
  },
]

// Stats
const stats = [
  { value: '1000+', label: 'Vini analizzati' },
  { value: '50+', label: 'Locali partner' },
  { value: '24/7', label: 'Sempre disponibile' },
]

// Animated section wrapper
function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeInUp}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function AboutPage() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Track scroll position to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <main id="main-content" className="pl-0 sm:pl-16 min-h-screen">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(114,47,55,0.15) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
              }}
              animate={{
                scale: [1.1, 1, 1.1],
                x: [0, 50, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wine/10 border border-wine/20 mb-8">
                <Sparkles className="h-4 w-4 text-wine" />
                <span className="text-sm text-wine font-medium">Powered by AI</span>
              </div>
            </motion.div>

            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-wine to-wine-dark">
                  Drink Smart.
                </span>
              </h1>
              <p className="text-2xl sm:text-3xl md:text-4xl text-foreground mt-2">
                Il vino giusto, al momento giusto.
              </p>
            </motion.div>

            <motion.div
              className="mb-10 max-w-2xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                WYN è il tuo sommelier AI personale.
              </p>
              <p className="text-base md:text-lg text-muted-foreground/70 italic mt-1">
                Consigli esperti, zero pretese.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center"
            >
              <Link href="/chat">
                <Button
                  size="lg"
                  className="bg-wine hover:bg-wine-dark text-white px-8 h-12 text-base font-medium shadow-lg shadow-wine/25 hover:shadow-xl hover:shadow-wine/30 transition-all"
                >
                  Prova WYN
                  <ChevronDown className="ml-2 h-4 w-4 rotate-[-90deg]" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            </motion.div>
          </motion.div>
        </section>

        {/* Value Props Section */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Perché WYN è diverso
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Non un altro chatbot. Un vero assistente che capisce di vino.
              </p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6">
              {valueProps.map((prop, index) => (
                <AnimatedSection key={prop.title} delay={index * 0.1}>
                  <motion.div
                    className={cn(
                      'group relative p-8 rounded-2xl',
                      'bg-card/50 border border-border/50',
                      'hover:bg-card hover:border-border',
                      'transition-all duration-300'
                    )}
                    whileHover={{ y: -4 }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-wine/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-wine/10 mb-6 group-hover:bg-wine/20 transition-colors">
                        <prop.icon className="h-6 w-6 text-wine" />
                      </div>

                      <h3 className="text-xl font-semibold mb-3">{prop.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {prop.description}
                      </p>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 px-6 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Come funziona
              </h2>
              <p className="text-muted-foreground text-lg">
                Tre passaggi. Zero complicazioni.
              </p>
            </AnimatedSection>

            <div className="relative">
              {/* Connection line */}
              <div className="absolute top-24 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent hidden md:block" />

              <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                {steps.map((step, index) => (
                  <AnimatedSection key={step.number} delay={index * 0.15}>
                    <div className="relative text-center">
                      {/* Step number */}
                      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-background border border-border mb-6">
                        <span className="text-2xl font-bold text-wine">{step.number}</span>
                        <motion.div
                          className="absolute inset-0 rounded-2xl bg-wine/10"
                          initial={{ scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </div>

                      <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="text-4xl md:text-5xl font-bold text-wine mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tutto quello che serve
              </h2>
              <p className="text-muted-foreground text-lg">
                Funzionalità pensate per chi ama il vino. E per chi sta imparando.
              </p>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: 'Risposte istantanee', desc: 'AI veloce e precisa' },
                { icon: Shield, title: 'Privacy first', desc: 'I tuoi dati restano tuoi' },
                { icon: Users, title: 'Per tutti', desc: 'Dal neofita all\'esperto' },
                { icon: MapPin, title: 'Locale aware', desc: 'Conosce la carta del ristorante' },
                { icon: TrendingUp, title: 'Sempre aggiornato', desc: 'Database in continua crescita' },
                { icon: MessageCircle, title: 'Conversazionale', desc: 'Parla come parleresti tu' },
              ].map((feature, index) => (
                <AnimatedSection key={feature.title} delay={index * 0.05}>
                  <motion.div
                    className="flex items-start gap-4 p-5 rounded-xl hover:bg-secondary/50 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wine/10 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-wine" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.desc}</p>
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="relative rounded-3xl overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-wine/20 via-wine/10 to-purple-500/10" />
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm" />

                {/* Content */}
                <div className="relative p-8 md:p-12 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-wine/20 mb-6"
                  >
                    <Wine className="h-8 w-8 text-wine" />
                  </motion.div>

                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Pronto a scoprire il tuo prossimo vino preferito?
                  </h2>
                  <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                    Non serve essere esperti. Basta la curiosità.
                    <br />
                    WYN ti accompagna nella scoperta.
                  </p>

                  <Link href="/chat">
                    <Button
                      size="lg"
                      className="bg-wine hover:bg-wine-dark text-white px-10 h-12 text-base font-medium shadow-lg shadow-wine/25 hover:shadow-xl hover:shadow-wine/30 transition-all"
                    >
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Inizia a chattare
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Footer spacer */}
        <div className="h-16" />
      </main>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-20 sm:bottom-6 right-6 z-50 p-3 rounded-full bg-wine text-white shadow-lg shadow-wine/25 hover:bg-wine-dark hover:shadow-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Torna in cima"
          >
            <ChevronUp className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
