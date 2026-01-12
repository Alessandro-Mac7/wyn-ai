import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy - WYN',
  description: 'Informativa sui cookie di WYN - AI Sommelier',
}

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Cookie Policy - WYN
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-amber-500 bg-amber-500/10 px-4 py-3 rounded-lg">
            Ultimo aggiornamento: [DATA] - Documento in fase di finalizzazione
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              1. Cosa sono i Cookie
            </h2>
            <p>
              I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo
              durante la navigazione. Sono utilizzati per memorizzare informazioni utili
              a migliorare l&apos;esperienza dell&apos;utente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              2. Cookie Utilizzati da WYN
            </h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
              Cookie Tecnici Essenziali
            </h3>
            <p>
              Questi cookie sono necessari per il funzionamento del sito e non possono
              essere disattivati. Non richiedono consenso ai sensi dell&apos;Art. 5(3) della
              Direttiva ePrivacy.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-card">
                  <tr>
                    <th className="text-left p-3 border-b border-border">Cookie</th>
                    <th className="text-left p-3 border-b border-border">Scopo</th>
                    <th className="text-left p-3 border-b border-border">Durata</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b border-border font-mono text-xs">sb-*-auth-token</td>
                    <td className="p-3 border-b border-border">Sessione di autenticazione Supabase</td>
                    <td className="p-3 border-b border-border">7 giorni</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">__vercel_*</td>
                    <td className="p-3">Cookie tecnici Vercel per il funzionamento</td>
                    <td className="p-3">Sessione</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
              Cookie di Analisi (Opzionali)
            </h3>
            <p>
              Attualmente WYN <strong>non utilizza</strong> cookie di analisi o profilazione.
              In caso di future implementazioni, sarai informato e ti verrà richiesto
              il consenso esplicito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              3. Local Storage
            </h2>
            <p>
              Oltre ai cookie, WYN può utilizzare il Local Storage del browser per
              memorizzare preferenze locali come:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Preferenze di interfaccia</li>
              <li>Stato della sidebar</li>
              <li>Ultima venue visitata (per comodità)</li>
            </ul>
            <p className="mt-3">
              Questi dati rimangono solo sul tuo dispositivo e non vengono trasmessi
              ai nostri server.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              4. Come Gestire i Cookie
            </h2>
            <p>
              Puoi gestire o disabilitare i cookie attraverso le impostazioni del tuo browser.
              Tieni presente che disabilitare i cookie tecnici essenziali potrebbe compromettere
              il funzionamento del servizio.
            </p>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
              Guide per i principali browser
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/it-it/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine hover:underline"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              5. Contatti
            </h2>
            <p>
              Per domande relative ai cookie, contattaci a:{' '}
              <a href="mailto:privacy@wyn.app" className="text-wine hover:underline">
                privacy@wyn.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              6. Modifiche
            </h2>
            <p>
              Questa Cookie Policy può essere aggiornata periodicamente.
              Ti invitiamo a consultarla regolarmente.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
