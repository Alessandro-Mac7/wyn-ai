import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termini di Servizio - WYN',
  description: 'Termini e condizioni di utilizzo di WYN - AI Sommelier',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Termini di Servizio - WYN
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-amber-500 bg-amber-500/10 px-4 py-3 rounded-lg">
            Ultimo aggiornamento: [DATA] - Documento in fase di finalizzazione
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              1. Accettazione dei Termini
            </h2>
            <p>
              Utilizzando WYN, accetti i presenti Termini di Servizio. Se non accetti
              questi termini, ti preghiamo di non utilizzare il servizio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              2. Descrizione del Servizio
            </h2>
            <p>
              WYN è una piattaforma di sommelier AI che fornisce:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Consulenza enologica tramite intelligenza artificiale</li>
              <li>Raccomandazioni personalizzate sui vini</li>
              <li>Scansione e riconoscimento etichette</li>
              <li>Accesso alla carta dei vini dei ristoranti partner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              3. Uso del Servizio
            </h2>
            <p>Ti impegni a:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Utilizzare il servizio in modo lecito e rispettoso</li>
              <li>Non tentare di accedere a dati non autorizzati</li>
              <li>Non utilizzare il servizio per scopi commerciali non autorizzati</li>
              <li>Non abusare delle funzionalità AI con richieste inappropriate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              4. Account Utente
            </h2>
            <p>
              Se crei un account:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Sei responsabile della riservatezza delle tue credenziali</li>
              <li>Devi fornire informazioni accurate e aggiornate</li>
              <li>Devi avere almeno 18 anni per la creazione dell&apos;account</li>
              <li>Puoi eliminare il tuo account in qualsiasi momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              5. Contenuti AI
            </h2>
            <p>
              Le raccomandazioni fornite dal sommelier AI sono generate automaticamente
              e hanno scopo puramente informativo. WYN:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Non garantisce l&apos;accuratezza al 100% delle informazioni</li>
              <li>Non si sostituisce al parere di un sommelier professionista</li>
              <li>Non è responsabile per allergie o intolleranze non comunicate</li>
              <li>Basa le raccomandazioni sui dati forniti dai ristoranti partner</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              6. Proprietà Intellettuale
            </h2>
            <p>
              Tutti i contenuti di WYN (logo, design, codice, testi) sono di proprietà
              esclusiva di [NOME AZIENDA] e protetti dalle leggi sul diritto d&apos;autore.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              7. Limitazione di Responsabilità
            </h2>
            <p>
              WYN è fornito &quot;così com&apos;è&quot;. Non garantiamo che il servizio sia
              sempre disponibile, privo di errori o virus. Non siamo responsabili per:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Danni derivanti dall&apos;uso del servizio</li>
              <li>Perdita di dati</li>
              <li>Decisioni prese basandosi sulle raccomandazioni AI</li>
              <li>Interruzioni del servizio</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              8. Modifiche al Servizio
            </h2>
            <p>
              Ci riserviamo il diritto di modificare, sospendere o interrompere
              il servizio in qualsiasi momento, con o senza preavviso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              9. Modifiche ai Termini
            </h2>
            <p>
              Possiamo modificare questi Termini in qualsiasi momento. Le modifiche
              saranno effettive dalla pubblicazione su questa pagina. L&apos;uso continuato
              del servizio costituisce accettazione dei nuovi termini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              10. Legge Applicabile
            </h2>
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi
              controversia sarà competente il Foro di [CITTÀ].
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              11. Contatti
            </h2>
            <p>
              Per domande sui Termini di Servizio:{' '}
              <a href="mailto:info@wyn.app" className="text-wine hover:underline">
                info@wyn.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
