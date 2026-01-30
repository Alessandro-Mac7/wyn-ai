'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { legalContainerVariants as containerVariants, legalItemVariants as itemVariants } from '@/lib/motion'

export default function PrivacyPage() {
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
            <h1>Informativa Privacy</h1>
            <p className="text-muted-foreground">Ultimo aggiornamento: 26 gennaio 2026</p>
          </motion.div>

          <motion.section variants={itemVariants}>
            <h2>1. Titolare del Trattamento</h2>
            <p>
              <strong>WYN S.r.l.</strong><br />
              [Indirizzo da inserire]<br />
              P.IVA: [Da inserire]<br />
              Email: <a href="mailto:privacy@wyn.app">privacy@wyn.app</a>
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>2. Dati Raccolti</h2>

            <h3>Dati forniti direttamente</h3>
            <ul>
              <li>Email (per la registrazione)</li>
              <li>Nome visualizzato (opzionale)</li>
            </ul>

            <h3>Dati raccolti automaticamente</h3>
            <ul>
              <li>Sommari delle conversazioni con il sommelier AI (mai i messaggi completi)</li>
              <li>Preferenze di gusto inferite (tipologie di vino preferite, budget, regioni)</li>
              <li>Storico scansioni etichette</li>
              <li>Ristoranti WYN visitati</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>3. Finalità e Base Giuridica</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-4">Finalità</th>
                    <th className="text-left py-2 pr-4">Dati utilizzati</th>
                    <th className="text-left py-2">Base giuridica</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Erogazione del servizio</td>
                    <td className="py-2 pr-4">Email, conversazioni</td>
                    <td className="py-2">Esecuzione del contratto (Art. 6.1.b GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Personalizzazione esperienza</td>
                    <td className="py-2 pr-4">Preferenze inferite</td>
                    <td className="py-2">Consenso (Art. 6.1.a GDPR)</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-2 pr-4">Miglioramento del servizio</td>
                    <td className="py-2 pr-4">Dati aggregati anonimi</td>
                    <td className="py-2">Legittimo interesse (Art. 6.1.f GDPR)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Comunicazioni marketing</td>
                    <td className="py-2 pr-4">Email</td>
                    <td className="py-2">Consenso (Art. 6.1.a GDPR)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>4. Profilazione Automatizzata</h2>
            <p>
              WYN utilizza intelligenza artificiale per analizzare le tue conversazioni
              e inferire automaticamente le tue preferenze di gusto. Questo ci permette
              di offrirti raccomandazioni sempre più pertinenti.
            </p>
            <p>
              <strong>Puoi disattivare questa funzione</strong> in qualsiasi momento dalle
              impostazioni del tuo profilo. In tal caso, il sommelier non &quot;ricorderà&quot; i
              tuoi gusti tra una sessione e l&apos;altra.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>5. Conservazione dei Dati</h2>
            <ul>
              <li><strong>Storico conversazioni:</strong> 12 mesi</li>
              <li><strong>Scansioni etichette:</strong> 6 mesi</li>
              <li><strong>Preferenze inferite:</strong> Fino a cancellazione account</li>
              <li><strong>Account:</strong> Fino a richiesta di cancellazione</li>
            </ul>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>6. Destinatari dei Dati</h2>
            <p>I tuoi dati possono essere trattati dai seguenti fornitori di servizi:</p>
            <ul>
              <li><strong>Supabase</strong> - Database e autenticazione (EU)</li>
              <li><strong>Anthropic</strong> - Provider AI per il sommelier</li>
              <li><strong>Vercel</strong> - Hosting dell&apos;applicazione</li>
            </ul>
            <p>
              Tutti i fornitori sono vincolati da accordi di trattamento dati (DPA)
              conformi al GDPR.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>7. Trasferimenti Extra-UE</h2>
            <p>
              Alcuni dei nostri fornitori potrebbero trattare i dati al di fuori dello
              Spazio Economico Europeo. In questi casi, il trasferimento avviene sulla
              base di Clausole Contrattuali Standard approvate dalla Commissione Europea.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>8. I Tuoi Diritti</h2>
            <p>Ai sensi del GDPR, hai diritto di:</p>
            <ul>
              <li><strong>Accesso</strong> - Ottenere copia dei tuoi dati personali</li>
              <li><strong>Rettifica</strong> - Correggere dati inesatti</li>
              <li><strong>Cancellazione</strong> - Richiedere la cancellazione dei tuoi dati</li>
              <li><strong>Limitazione</strong> - Limitare il trattamento in determinate circostanze</li>
              <li><strong>Portabilità</strong> - Ricevere i tuoi dati in formato strutturato</li>
              <li><strong>Opposizione</strong> - Opporti al trattamento basato su legittimo interesse</li>
              <li><strong>Revoca del consenso</strong> - Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p>
              Per esercitare questi diritti, contattaci a: <a href="mailto:privacy@wyn.app" className="text-wine hover:text-wine-light">privacy@wyn.app</a>
            </p>
            <p>
              Puoi anche scaricare o eliminare i tuoi dati direttamente dalle
              <strong> impostazioni privacy</strong> nel tuo profilo.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>9. Reclami</h2>
            <p>
              Se ritieni che il trattamento dei tuoi dati violi il GDPR, hai diritto
              di presentare reclamo al Garante per la Protezione dei Dati Personali:
            </p>
            <p>
              <a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener noreferrer" className="text-wine hover:text-wine-light">
                www.garanteprivacy.it
              </a>
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>10. Modifiche alla Privacy Policy</h2>
            <p>
              Eventuali modifiche a questa informativa saranno pubblicate su questa
              pagina con un nuovo timestamp. Per modifiche sostanziali, ti informeremo
              via email.
            </p>
          </motion.section>

          <motion.section variants={itemVariants}>
            <h2>11. Cookie</h2>
            <p>
              Per informazioni sull&apos;utilizzo dei cookie, consulta la nostra{' '}
              <Link href="/cookie-policy" className="text-wine hover:text-wine-light">Cookie Policy</Link>.
            </p>
          </motion.section>
        </article>
      </motion.div>
    </div>
  )
}
