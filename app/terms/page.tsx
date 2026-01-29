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

export default function TermsPage() {
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
            <h1>Termini di Servizio</h1>
            <p className="text-muted-foreground">Ultimo aggiornamento: 26 gennaio 2026</p>
          </motion.div>

          <motion.section variants={itemVariants}>
            <h2>1. Accettazione dei Termini</h2>
            <p>
              Utilizzando WYN, accetti di essere vincolato da questi Termini di Servizio.
              Se non accetti questi termini, ti preghiamo di non utilizzare il servizio.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>2. Descrizione del Servizio</h2>
            <p>
              WYN è un sommelier AI che fornisce consigli e raccomandazioni sui vini.
              Il servizio include:
            </p>
            <ul>
              <li>Chat con un assistente AI esperto di vini</li>
              <li>Raccomandazioni personalizzate basate sulle tue preferenze</li>
              <li>Scansione di etichette per identificare vini</li>
              <li>Accesso a carte dei vini di ristoranti partner</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>3. Registrazione e Account</h2>
            <p>
              Per accedere a tutte le funzionalità di WYN, potrebbe essere necessario
              creare un account fornendo un indirizzo email valido. Sei responsabile di:
            </p>
            <ul>
              <li>Mantenere la riservatezza delle tue credenziali di accesso</li>
              <li>Tutte le attività che si verificano sotto il tuo account</li>
              <li>Notificarci immediatamente qualsiasi uso non autorizzato</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>4. Uso Consentito</h2>
            <p>Ti impegni a utilizzare WYN solo per scopi legittimi. È vietato:</p>
            <ul>
              <li>Utilizzare il servizio per scopi illegali o non autorizzati</li>
              <li>Tentare di accedere a sistemi o dati non autorizzati</li>
              <li>Interferire con il funzionamento del servizio</li>
              <li>Utilizzare bot o script automatizzati senza autorizzazione</li>
              <li>Raccogliere dati di altri utenti senza consenso</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>5. Limitazioni del Servizio</h2>
            <p>
              WYN è un servizio di assistenza e le raccomandazioni fornite sono a scopo
              informativo. Ti invitiamo a:
            </p>
            <ul>
              <li>
                <strong>Verificare sempre</strong> le informazioni con il personale del
                ristorante o il rivenditore
              </li>
              <li>
                <strong>Non affidarti esclusivamente</strong> ai consigli dell&apos;AI per
                decisioni importanti
              </li>
              <li>
                <strong>Consultare un medico</strong> se hai allergie alimentari o
                condizioni di salute particolari
              </li>
            </ul>
            <p>
              <strong>WYN può commettere errori.</strong> L&apos;intelligenza artificiale,
              per quanto avanzata, non è infallibile.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>6. Proprietà Intellettuale</h2>
            <p>
              Tutti i contenuti di WYN, inclusi testi, grafica, logo, e software, sono
              di proprietà di WYN S.r.l. o dei suoi licenziatari e sono protetti dalle
              leggi sul diritto d&apos;autore.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>7. Contenuti Utente</h2>
            <p>
              Mantenendo i tuoi contenuti (conversazioni, preferenze) su WYN, ci concedi
              una licenza limitata per utilizzarli al fine di:
            </p>
            <ul>
              <li>Fornire e migliorare il servizio</li>
              <li>Personalizzare la tua esperienza</li>
              <li>Analizzare e migliorare i nostri algoritmi (in forma anonima e aggregata)</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>8. Privacy</h2>
            <p>
              Il trattamento dei tuoi dati personali è regolato dalla nostra{' '}
              <Link href="/privacy" className="text-wine hover:text-wine-light">Privacy Policy</Link>.
              Utilizzando WYN, acconsenti al trattamento come descritto nella Privacy Policy.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>9. Esclusione di Garanzie</h2>
            <p>
              WYN è fornito &quot;così com&apos;è&quot; senza garanzie di alcun tipo, esplicite o
              implicite, incluse, a titolo esemplificativo, garanzie di commerciabilità,
              idoneità per uno scopo particolare o non violazione.
            </p>
            <p>
              Non garantiamo che:
            </p>
            <ul>
              <li>Il servizio sarà sempre disponibile o privo di errori</li>
              <li>I risultati ottenuti saranno accurati o affidabili</li>
              <li>La qualità del servizio soddisferà le tue aspettative</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>10. Limitazione di Responsabilità</h2>
            <p>
              Nella misura massima consentita dalla legge, WYN S.r.l. non sarà responsabile
              per danni indiretti, incidentali, speciali, consequenziali o punitivi,
              inclusa la perdita di profitti, dati o altre perdite intangibili.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>11. Modifiche ai Termini</h2>
            <p>
              Ci riserviamo il diritto di modificare questi Termini in qualsiasi momento.
              Le modifiche entreranno in vigore al momento della pubblicazione su questa
              pagina. L&apos;uso continuato del servizio dopo le modifiche costituisce
              accettazione dei nuovi termini.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>12. Risoluzione</h2>
            <p>
              Possiamo sospendere o terminare il tuo accesso a WYN in qualsiasi momento,
              senza preavviso, per violazione di questi Termini o per qualsiasi altro
              motivo a nostra discrezione.
            </p>
            <p>
              Puoi eliminare il tuo account in qualsiasi momento dalle impostazioni
              del profilo.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>13. Legge Applicabile</h2>
            <p>
              Questi Termini sono regolati dalle leggi della Repubblica Italiana.
              Qualsiasi controversia sarà sottoposta alla giurisdizione esclusiva
              del Foro di [Città da inserire].
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>14. Contatti</h2>
            <p>
              Per domande sui Termini di Servizio, contattaci a:{' '}
              <a href="mailto:legal@wyn.app" className="text-wine hover:text-wine-light">legal@wyn.app</a>
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>15. Link Utili</h2>
            <ul>
              <li>
                <Link href="/privacy" className="text-wine hover:text-wine-light">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-wine hover:text-wine-light">Cookie Policy</Link>
              </li>
            </ul>
          </motion.section>
        </article>
      </motion.div>
    </div>
  )
}
