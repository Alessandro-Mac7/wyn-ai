'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

// Staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <motion.div
        className="max-w-3xl mx-auto px-4 py-8 sm:py-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back link */}
        <motion.div variants={itemVariants}>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla chat
          </Link>
        </motion.div>

        <article className="prose prose-invert prose-wine max-w-none">
          <motion.div variants={itemVariants}>
            <h1>Cookie Policy</h1>
            <p className="text-muted-foreground">Ultimo aggiornamento: 26 gennaio 2026</p>
          </motion.div>

          <motion.section variants={itemVariants}>
            <h2>1. Cosa sono i Cookie</h2>
            <p>
              I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo
              per ricordare le tue preferenze e migliorare la tua esperienza di navigazione.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>2. Cookie Utilizzati da WYN</h2>

            <h3>Cookie Tecnici Essenziali</h3>
            <p>
              Questi cookie sono necessari per il funzionamento del sito e non possono
              essere disattivati. Includono:
            </p>
            <ul>
              <li>
                <strong>Sessione di autenticazione</strong> (Supabase Auth) - Mantiene
                il tuo accesso mentre navighi
              </li>
              <li>
                <strong>Preferenze locali</strong> - Salva le tue impostazioni di sessione
              </li>
            </ul>
            <p>
              <em>Base giuridica:</em> Questi cookie non richiedono consenso in quanto
              strettamente necessari per erogare il servizio richiesto (Art. 5(3) Direttiva ePrivacy).
            </p>

            <h3>Local Storage</h3>
            <p>
              WYN utilizza il Local Storage del browser per salvare temporaneamente:
            </p>
            <ul>
              <li>Stato della conversazione corrente</li>
              <li>Preferenze di interfaccia</li>
              <li>Cache dei dati per migliorare le prestazioni</li>
            </ul>
            <p>
              Questi dati rimangono sul tuo dispositivo e non vengono trasmessi ai nostri server.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>3. Cookie di Terze Parti</h2>
            <p>
              Al momento, WYN <strong>non utilizza cookie di profilazione o analytics</strong> di
              terze parti. Non utilizziamo Google Analytics, Facebook Pixel o altri
              strumenti di tracciamento.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>4. Come Gestire i Cookie</h2>
            <p>
              Puoi gestire o eliminare i cookie attraverso le impostazioni del tuo browser:
            </p>
            <ul>
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-wine hover:text-wine-light">
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-wine hover:text-wine-light">
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-wine hover:text-wine-light">
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-wine hover:text-wine-light">
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p>
              <strong>Nota:</strong> Disabilitare i cookie tecnici essenziali potrebbe
              impedire il corretto funzionamento di WYN.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>5. Aggiornamenti</h2>
            <p>
              Questa Cookie Policy potrebbe essere aggiornata periodicamente. Ti invitiamo
              a consultarla regolarmente per eventuali modifiche.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>6. Contatti</h2>
            <p>
              Per domande sulla nostra Cookie Policy, contattaci a:{' '}
              <a href="mailto:privacy@wyn.app" className="text-wine hover:text-wine-light">privacy@wyn.app</a>
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>7. Link Utili</h2>
            <ul>
              <li>
                <Link href="/privacy" className="text-wine hover:text-wine-light">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-wine hover:text-wine-light">Termini di Servizio</Link>
              </li>
            </ul>
          </motion.section>
        </article>
      </motion.div>
    </div>
  )
}
