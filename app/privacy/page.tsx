import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - WYN',
  description: 'Informativa sulla privacy di WYN - AI Sommelier',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Informativa Privacy - WYN
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-amber-500 bg-amber-500/10 px-4 py-3 rounded-lg">
            Ultimo aggiornamento: [DATA] - Documento in fase di finalizzazione
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              1. Titolare del Trattamento
            </h2>
            <p>
              [NOME AZIENDA]<br />
              [INDIRIZZO]<br />
              Email: <a href="mailto:privacy@wyn.app" className="text-wine hover:underline">privacy@wyn.app</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              2. Dati Raccolti
            </h2>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
              Dati forniti direttamente
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Email (per registrazione, se applicabile)</li>
              <li>Nome visualizzato (opzionale)</li>
            </ul>

            <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
              Dati raccolti automaticamente
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Sommari delle conversazioni con il sommelier AI</li>
              <li>Preferenze di gusto inferite (vini preferiti, budget, regioni)</li>
              <li>Storico scansioni etichette</li>
              <li>Ristoranti WYN visitati</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              3. Finalità e Base Giuridica
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-card">
                  <tr>
                    <th className="text-left p-3 border-b border-border">Finalità</th>
                    <th className="text-left p-3 border-b border-border">Dati</th>
                    <th className="text-left p-3 border-b border-border">Base Giuridica</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b border-border">Erogazione servizio</td>
                    <td className="p-3 border-b border-border">Email, conversazioni</td>
                    <td className="p-3 border-b border-border">Contratto (Art. 6.1.b)</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-border">Personalizzazione esperienza</td>
                    <td className="p-3 border-b border-border">Preferenze inferite</td>
                    <td className="p-3 border-b border-border">Consenso (Art. 6.1.a)</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-border">Miglioramento servizio</td>
                    <td className="p-3 border-b border-border">Dati aggregati anonimi</td>
                    <td className="p-3 border-b border-border">Legittimo interesse (Art. 6.1.f)</td>
                  </tr>
                  <tr>
                    <td className="p-3">Comunicazioni marketing</td>
                    <td className="p-3">Email</td>
                    <td className="p-3">Consenso (Art. 6.1.a)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              4. Profilazione Automatizzata
            </h2>
            <p>
              WYN utilizza intelligenza artificiale per analizzare le tue conversazioni
              e inferire automaticamente le tue preferenze di gusto. Questo ci permette
              di offrirti raccomandazioni sempre più pertinenti.
            </p>
            <p className="mt-3">
              Puoi disattivare questa funzione in qualsiasi momento dalle impostazioni
              del tuo profilo. In tal caso, il sommelier non &quot;ricorderà&quot; i tuoi gusti
              tra una sessione e l&apos;altra.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              5. Conservazione Dati
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-card">
                  <tr>
                    <th className="text-left p-3 border-b border-border">Dato</th>
                    <th className="text-left p-3 border-b border-border">Periodo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-b border-border">Storico conversazioni</td>
                    <td className="p-3 border-b border-border">12 mesi</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-border">Scansioni etichette</td>
                    <td className="p-3 border-b border-border">6 mesi</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-border">Preferenze</td>
                    <td className="p-3 border-b border-border">Fino a cancellazione account</td>
                  </tr>
                  <tr>
                    <td className="p-3">Account</td>
                    <td className="p-3">Fino a richiesta cancellazione</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              6. Destinatari
            </h2>
            <p>I tuoi dati possono essere trattati da:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Supabase (database hosting)</li>
              <li>Anthropic (AI provider)</li>
              <li>Vercel (hosting)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              7. Trasferimenti Extra-UE
            </h2>
            <p>
              [Sezione da completare dopo verifica DPA con fornitori]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              8. I Tuoi Diritti
            </h2>
            <p>Hai diritto di:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Accedere ai tuoi dati</li>
              <li>Rettificare dati inesatti</li>
              <li>Cancellare i tuoi dati (&quot;diritto all&apos;oblio&quot;)</li>
              <li>Limitare il trattamento</li>
              <li>Portabilità dei dati (export)</li>
              <li>Revocare il consenso in qualsiasi momento</li>
            </ul>
            <p className="mt-3">
              Per esercitare questi diritti:{' '}
              <a href="mailto:privacy@wyn.app" className="text-wine hover:underline">
                privacy@wyn.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              9. Reclami
            </h2>
            <p>
              Puoi presentare reclamo al Garante per la Protezione dei Dati Personali:{' '}
              <a
                href="https://www.garanteprivacy.it/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-wine hover:underline"
              >
                www.garanteprivacy.it
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              10. Modifiche
            </h2>
            <p>
              Eventuali modifiche saranno pubblicate su questa pagina con nuovo
              timestamp. Per modifiche sostanziali, ti informeremo via email.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
