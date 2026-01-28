# PLAN-STRATEGIC-FEATURES: Feature Strategiche per WYN

| Campo | Valore |
|-------|--------|
| **ID** | PLAN-STRATEGIC-FEATURES |
| **Data** | 2026-01-11 |
| **Autore** | Architect Agent |
| **Stato** | PROPOSTA |
| **Priorita** | ALTA |
| **Ultima modifica** | 2026-01-11 - Aggiunto sistema profilo utente con registrazione |

---

## 1. EXECUTIVE SUMMARY

Questo documento analizza e propone feature strategiche per rendere WYN **indispensabile** sia per gli utenti finali (clienti al ristorante) che per i clienti B2B (ristoranti/venues). L'obiettivo e aumentare drasticamente il valore percepito dopo il primo utilizzo, creare retention positiva, e differenziare WYN dalle soluzioni puramente informative.

### Contesto Attuale
- **Stack**: Next.js 14 + TypeScript + Supabase + Tailwind
- **LLM**: Groq (dev gratuito) / Anthropic Haiku (prod)
- **Modello**: QR code -> chat AI sommelier -> raccomandazioni
- **Punto di forza attuale**: Enrichment automatico con ratings guide autorevoli

### Obiettivi Strategici
1. Aumentare valore percepito dopo primo utilizzo
2. Creare retention/dipendenza positiva (utente E venue)
3. Differenziarsi da soluzioni "solo informative"

---

## 2. ANALISI FEATURE PROPOSTE

### 2.1 RICONOSCIMENTO ETICHETTA (Stile Vivino)

#### Descrizione
Scansione foto bottiglia -> riconoscimento automatico -> estrazione info vino -> suggerimenti alternativi nel locale.

#### Problema Concreto Risolto

**Per l'utente:**
- "Ho visto questa bottiglia interessante, cosa mi dici?"
- "Questo vino al supermercato costava meno, e buono?"
- "Voglio ordinare ma non conosco questo vino in carta"

**Per il venue:**
- Aumento engagement e tempo in-app
- Dati su quali vini interessano i clienti (non solo ordinati)
- Opportunita upselling: "Questa e ottima, ma ti consiglio X che abbiamo in carta"

#### Analisi Tecnologica

**Opzione A: Vision LLM (Claude/GPT-4o)**
```
Flusso: Foto -> Resize/Compress -> LLM Vision API -> JSON (nome, cantina, annata) -> Match DB locale
```

| Aspetto | Dettaglio |
|---------|-----------|
| Accuratezza | 85-95% su etichette leggibili |
| Costo/Immagine | ~$0.002-0.01 (bassa risoluzione) |
| Latenza | 2-4 secondi |
| Sviluppo | 3-5 giorni |
| Pro | Nessuna API esterna, usa infrastruttura esistente |
| Contro | Richiede prompt engineering, possibili errori su etichette complesse |

**Opzione B: API Specializzata (API4AI Wine Recognition)**
```
Flusso: Foto -> API4AI -> JSON strutturato -> Match DB locale
```

| Aspetto | Dettaglio |
|---------|-----------|
| Accuratezza | 78-90% (benchmark Vivino-like) |
| Costo/Immagine | $0.01-0.05 (dipende tier) |
| Latenza | 1-3 secondi |
| Sviluppo | 2-3 giorni |
| Pro | API ottimizzata per vino, risultati strutturati |
| Contro | Dipendenza esterna, costi ricorrenti, coverage vini italiani incerto |

**Opzione C: Google Cloud Vision + LLM**
```
Flusso: Foto -> Cloud Vision OCR -> Testo estratto -> LLM parsing -> Match DB locale
```

| Aspetto | Dettaglio |
|---------|-----------|
| Accuratezza | 90%+ OCR + LLM parsing |
| Costo/Immagine | $0.0015 (Vision) + $0.001 (LLM) |
| Latenza | 2-3 secondi |
| Sviluppo | 4-6 giorni |
| Pro | OCR molto preciso, LLM interpreta contesto |
| Contro | Due chiamate API, complessita maggiore |

#### RACCOMANDAZIONE: Opzione A (Vision LLM)

**Motivazione:**
1. Usa infrastruttura LLM gia esistente (Groq/Anthropic)
2. Minori costi operativi a lungo termine
3. Nessuna dipendenza esterna aggiuntiva
4. Claude 3.5 Sonnet eccelle in visual reasoning
5. Puo essere esteso facilmente (menu scanning, etc.)

---

### 2.2 STORICO PERSONALE E PREFERENZE (Deprecato - vedi 6.5)

> **NOTA:** Questa sezione e stata superata dal nuovo sistema di profilo utente con registrazione (sezione 6.5). Mantenuta per riferimento storico.

#### Descrizione Originale
Sistema di profilo utente (opzionale, senza login obbligatorio) che ricorda:
- Vini assaggiati e graditi
- Preferenze di gusto (corposo/leggero, secco/dolce)
- Budget tipico
- Abbinamenti preferiti

---

### 2.3 GAMIFICATION E BADGE

#### Descrizione
Sistema di achievement e badge per incentivare esplorazione:
- "Esploratore" (provato 5 tipi diversi)
- "Intenditore" (10 vini consigliati dal sommelier)
- "Globetrotter" (vini da 5 regioni diverse)
- Badge speciali per venues (VIP, Fedele, etc.)

#### Problema Concreto Risolto

**Per l'utente:**
- Senso di progressione e achievement
- Incentivo a provare vini nuovi
- Condivisione social (opzionale)

**Per il venue:**
- Aumento visite ripetute (+23% retention con gamification)
- Dati su comportamento clienti
- Marketing: "Sblocca badge esclusivo con il nostro vino del mese"

#### Implementazione

| Aspetto | Stima |
|---------|-------|
| Schema DB (badges, user_badges) | 1 giorno |
| Logica backend | 2 giorni |
| UI badge collection | 2-3 giorni |
| Costi operativi | Trascurabili |

---

### 2.4 ANALYTICS DASHBOARD PER VENUES

#### Descrizione
Dashboard per ristoratori con insights:
- Vini piu richiesti vs venduti
- Domande frequenti dei clienti
- Trend temporali
- Performance abbinamenti suggeriti

#### Problema Concreto Risolto

**Per il venue (CRITICO per monetizzazione):**
- Capire cosa vogliono i clienti
- Ottimizzare carta dei vini
- Giustificare costo WYN con ROI misurabile
- Prendere decisioni data-driven

#### Implementazione

```sql
-- Nuova tabella per log interazioni
CREATE TABLE chat_analytics (
  id UUID PRIMARY KEY,
  venue_id UUID REFERENCES venues(id),
  wine_mentioned TEXT[],
  topics TEXT[],
  budget_range JSONB,
  created_at TIMESTAMP
);
```

| Aspetto | Stima |
|---------|-------|
| Schema DB | 1 giorno |
| Backend aggregation | 3-4 giorni |
| Dashboard FE | 4-5 giorni |
| Costi operativi | Trascurabili |

---

### 2.5 INTEGRAZIONE PRENOTAZIONE/ORDINE

#### Descrizione
Deep link con sistemi POS/prenotazione del ristorante:
- "Prenota questo vino" -> notifica al cameriere
- "Aggiungi alla comanda" -> integrazione POS
- Pre-ordine vino con la prenotazione tavolo

#### Problema Concreto Risolto

**Per l'utente:**
- Esperienza seamless
- Non deve chiamare il cameriere
- Vino pronto all'arrivo

**Per il venue:**
- Aumento vendite (frictionless ordering)
- Dati precisi su conversione consiglio->ordine
- Valore aggiunto che nessun competitor offre

#### Complessita

| Aspetto | Stima |
|---------|-------|
| API generica notifiche | 2-3 giorni |
| Integrazione POS (es. SumUp) | 2-4 settimane |
| Pre-ordine con prenotazione | 1-2 settimane |

**NOTA:** Alta complessita, dipende da integrazioni esterne. Da considerare per fase successiva.

---

## 3. ANALISI COSTI E SCALABILITA

### 3.1 Curva Costi per Riconoscimento Etichetta

#### Scenario: Opzione A (Vision LLM)

**Assunzioni:**
- 20% utenti usano scan etichetta
- Media 1.5 scan per sessione utente
- Immagine compressa ~170 tokens (bassa risoluzione)
- Claude 3.5 Sonnet: $3/1M input tokens

| Utenti/Mese | Scan/Mese | Costo LLM | Costo/Utente |
|-------------|-----------|-----------|--------------|
| 100 | 30 | ~$0.05 | $0.0005 |
| 1,000 | 300 | ~$0.50 | $0.0005 |
| 10,000 | 3,000 | ~$5.00 | $0.0005 |
| 100,000 | 30,000 | ~$50.00 | $0.0005 |

**Conclusione:** Costi estremamente contenuti, scalabilita eccellente.

#### Scenario: Opzione B (API4AI)

| Utenti/Mese | Scan/Mese | Costo API (~$0.02/call) | Costo/Utente |
|-------------|-----------|-------------------------|--------------|
| 100 | 30 | ~$0.60 | $0.006 |
| 1,000 | 300 | ~$6.00 | $0.006 |
| 10,000 | 3,000 | ~$60.00 | $0.006 |
| 100,000 | 30,000 | ~$600.00 | $0.006 |

**Conclusione:** 10x piu costoso di Opzione A, meno flessibile.

### 3.2 Costi Totali Incrementali

| Feature | Sviluppo (giorni) | Costo Dev* | Costo Ops/Mese (10K utenti) |
|---------|-------------------|------------|----------------------------|
| Label Scan (Vision LLM) | 5 | - | $5 |
| Sistema Profilo Utente | 10-12 | - | $15-25** |
| Gamification | 5 | - | $0 |
| Analytics Dashboard | 10 | - | $0 |
| Notifica Cameriere | 3 | - | $0 |

*Costo sviluppo non quantificato (dipende da team interno vs esterno)
**Include costo LLM per analisi preferenze (vedi sezione 6.5.7)

**TOTALE costi operativi a 10K utenti/mese: ~$20-30**

---

## 4. PRIORITIZZAZIONE FEATURE

### Matrice Impatto/Effort

```
IMPATTO
   ^
   |  [Analytics]        [Label Scan]
   |       *                  *
   |
   |  [Profilo Utente]   [Gamification]
   |       *                  *
   |
   |                    [Integr. POS]
   |                         *
   +---------------------------------> EFFORT
```

### Priorita Raccomandata

| Priorita | Feature | Motivazione |
|----------|---------|-------------|
| **P0** | Label Scan (Vision) | Differenziatore immediato, "wow factor", basso costo |
| **P1** | Sistema Profilo Utente | Lock-in, dati B2B, cross-venue tracking, retention |
| **P2** | Analytics Dashboard | Monetizzazione B2B, giustifica costo per venues |
| **P3** | Gamification | Retention utenti, puo aspettare MVP B2B consolidato |
| **P4** | Integrazione POS | Alta complessita, richiede partnership |

---

## 5. TRE SCENARI DI IMPLEMENTAZIONE

### SCENARIO A: SOLUZIONE RACCOMANDATA (AGGIORNATO)

**Scope:** Label Scan + Sistema Profilo Utente con Registrazione

| Aspetto | Dettaglio |
|---------|-----------|
| **PRO** | - Massimo impatto percepito con effort moderato |
| | - "Wow factor" immediato (scan etichetta) |
| | - **Lock-in positivo** (feature premium riservate a utenti registrati) |
| | - **Dati utenti reali** per venues (non anonimi) |
| | - **Cross-venue tracking** (stesso utente in piu ristoranti WYN) |
| | - **Apprendimento implicito** dai pattern conversazionali |
| | - Valore crescente nel tempo (preferenze apprese automaticamente) |
| | - Base per analytics B2B piu ricche |
| **CONTRO** | - **Friction registrazione** (alcuni utenti abbandoneranno) |
| | - **Complessita GDPR** (dati personali, consensi, retention) |
| | - Effort maggiore rispetto a localStorage (auth + DB + analisi) |
| | - Costi operativi maggiori (LLM per estrazione preferenze) |
| | - UX da progettare con cura per minimizzare abbandono |
| **Complessita** | **4-5 settimane di sviluppo** |
| **Sostenibilita** | Buona - costi marginali ma non trascurabili |
| **ROI Stimato** | +50% engagement, +35% retention Day-30, dati B2B valorizzabili |

#### Architettura Tecnica

```
Nuovo flusso (utente anonimo):
1. Utente scansiona QR / arriva su WYN
2. Chat disponibile con funzionalita limitate
3. Scan etichetta: preview risultato, storico richiede login
4. Dopo 2-3 messaggi: suggerimento soft "Registrati per salvare"

Nuovo flusso (utente registrato):
1. Login via Supabase Auth (email magic link / social)
2. Accesso completo: storico chat, preferenze apprese, scan history
3. Al termine sessione: analisi LLM estrae preferenze
4. Prossima visita: sommelier "ricorda" gusti utente

Nuove tabelle:
- user_profiles (id, user_id, display_name, created_at)
- chat_sessions (id, user_id, venue_id, messages JSONB, created_at)
- inferred_preferences (id, user_id, preferences JSONB, confidence, updated_at)
- wine_scans (id, user_id, venue_id, extracted_data JSONB, matched_wine_id, created_at)
```

#### File Coinvolti

| Area | File | Modifiche |
|------|------|-----------|
| API | `app/api/scan-label/route.ts` | Nuovo endpoint |
| API | `app/api/chat-session/route.ts` | Salvataggio sessioni |
| API | `app/api/preferences/route.ts` | Lettura/gestione preferenze |
| Lib | `lib/vision.ts` | Nuovo modulo Vision LLM |
| Lib | `lib/wine-matcher.ts` | Fuzzy matching vini |
| Lib | `lib/preference-extractor.ts` | Estrazione preferenze da chat |
| Types | `types/index.ts` | ScanResult, UserProfile, InferredPreferences |
| Components | `components/scan/ScanButton.tsx` | UI cattura foto |
| Components | `components/scan/ScanResult.tsx` | Mostra risultato |
| Components | `components/auth/RegisterPrompt.tsx` | Prompt registrazione |
| DB | `supabase/migrations/005_*.sql` | Nuove tabelle |

---

### SCENARIO B: ALTERNATIVA LOW-COST

**Scope:** Solo Label Scan + Chat anonima (no profilo)

| Aspetto | Dettaglio |
|---------|-----------|
| **PRO** | - Minimo effort (2 settimane) |
| | - Zero friction (nessuna registrazione) |
| | - Comunque "wow factor" con scan etichetta |
| | - Privacy-first (nessun dato utente) |
| **CONTRO** | - Nessun lock-in |
| | - Nessun dato utente per venues |
| | - Nessuna personalizzazione cross-sessione |
| | - Meno differenziazione da competitor |
| **Complessita** | 2 settimane di sviluppo |
| **Sostenibilita** | Eccellente |
| **ROI Stimato** | +30% engagement, +15% retention Day-30 |

---

### SCENARIO C: ALTERNATIVA PREMIUM

**Scope:** Label Scan + Profilo Utente + Analytics Dashboard + Gamification

| Aspetto | Dettaglio |
|---------|-----------|
| **PRO** | - Prodotto completo e differenziato |
| | - Valore tangibile per venues (analytics + dati utenti) |
| | - Forte retention utenti (gamification + profilo) |
| | - Giustifica pricing premium B2B |
| | - Massimo lock-in e switching cost |
| **CONTRO** | - Tempo sviluppo significativo (10-12 settimane) |
| | - Ritardo go-to-market |
| | - Maggiore complessita manutenzione |
| | - Costi ops piu alti |
| **Complessita** | 10-12 settimane di sviluppo |
| **Sostenibilita** | Buona (costi ops contenuti, ricavi B2B potenziali) |
| **ROI Stimato** | +70% engagement, +50% retention, revenue B2B significativa |

#### Roadmap Suggerita

```
Settimana 1-2: Label Scan (Vision LLM)
Settimana 3-5: Sistema Profilo Utente con registrazione
Settimana 6-7: Estrazione preferenze automatica
Settimana 8-9: Analytics Dashboard (metriche base)
Settimana 10-12: Gamification (badge sistema)
```

---

## 6. DETTAGLIO TECNICO: LABEL SCAN

### 6.1 Prompt Engineering per Vision

```typescript
// lib/vision.ts

const LABEL_SCAN_PROMPT = `Analizza questa foto di un'etichetta di vino.
Estrai le seguenti informazioni in formato JSON:

{
  "name": "Nome completo del vino",
  "producer": "Nome del produttore/cantina",
  "year": 2020,
  "wine_type": "red|white|rose|sparkling|dessert",
  "region": "Regione italiana o paese",
  "denomination": "DOC, DOCG, IGT se visibile",
  "grape_varieties": ["vitigno1", "vitigno2"],
  "confidence": 0.0-1.0
}

REGOLE:
- Se un campo non e visibile/leggibile, usa null
- confidence indica quanto sei sicuro dell'estrazione complessiva
- Per wine_type, deduci dal colore bottiglia/testo se non esplicito
- Nome vino puo includere linea/collezione (es: "Tignanello")

Rispondi SOLO con JSON valido.`

export async function scanWineLabel(imageBase64: string): Promise<ScanResult> {
  const response = await chat([
    { role: 'system', content: 'Sei un esperto sommelier. Analizza etichette di vino.' },
    {
      role: 'user',
      content: [
        { type: 'text', text: LABEL_SCAN_PROMPT },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } }
      ]
    }
  ], { model: 'claude-3-5-sonnet-20241022' })

  return JSON.parse(response.content)
}
```

### 6.2 Fuzzy Matching

```typescript
// lib/wine-matcher.ts

import Fuse from 'fuse.js'

export function findMatchingWine(
  scannedWine: ScanResult,
  venueWines: Wine[]
): WineMatch | null {
  const fuse = new Fuse(venueWines, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'producer', weight: 0.3 },
      { name: 'year', weight: 0.2 },
      { name: 'denomination', weight: 0.1 }
    ],
    threshold: 0.4,
    includeScore: true
  })

  const results = fuse.search(scannedWine.name)

  if (results.length > 0 && results[0].score < 0.3) {
    return {
      wine: results[0].item,
      confidence: 1 - results[0].score,
      exactMatch: results[0].score < 0.1
    }
  }

  return null
}
```

### 6.3 API Endpoint

```typescript
// app/api/scan-label/route.ts

export async function POST(request: NextRequest) {
  const { image, venue_slug } = await request.json()

  // 1. Valida immagine
  if (!image || !isValidBase64Image(image)) {
    return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
  }

  // 2. Comprimi se necessario
  const compressedImage = await compressImage(image, { maxWidth: 768 })

  // 3. Estrai info con Vision LLM
  const scanResult = await scanWineLabel(compressedImage)

  if (scanResult.confidence < 0.3) {
    return NextResponse.json({
      success: false,
      message: 'Non riesco a leggere bene l\'etichetta. Prova con piu luce.'
    })
  }

  // 4. Match con vini del locale (se venue_slug)
  let matchedWine = null
  let alternatives = []

  if (venue_slug) {
    const venue = await getVenueBySlug(venue_slug)
    const wines = await getWines(venue.id)

    matchedWine = findMatchingWine(scanResult, wines)

    if (!matchedWine) {
      // Suggerisci alternative simili
      alternatives = findSimilarWines(scanResult, wines, 3)
    }
  }

  // 5. Log per analytics
  await logScan(venue_slug, scanResult, matchedWine?.wine?.id)

  return NextResponse.json({
    success: true,
    scanned: scanResult,
    match: matchedWine,
    alternatives
  })
}
```

### 6.4 UI Components

Vedi mockup e linee guida in `mockup/` per design system.

---

## 6.5 SISTEMA PROFILO UTENTE

### 6.5.1 Overview

Il sistema di profilo utente con registrazione sostituisce l'approccio basato su localStorage, offrendo:
- **Storico chat** limitato (5-10 conversazioni)
- **Preferenze apprese automaticamente** dall'analisi delle chat
- **Label Scan con storico** persistente
- **Cross-venue tracking** per utenti che visitano piu ristoranti WYN

### 6.5.2 Architettura Tecnica

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA PROFILO UTENTE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     SUPABASE AUTH                            │    │
│  │   - Magic Link (email)                                       │    │
│  │   - Social OAuth (Google, Apple) [futuro]                   │    │
│  │   - auth.users tabella nativa                               │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│              ┌───────────────┼───────────────┐                      │
│              ▼               ▼               ▼                      │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐          │
│  │ user_profiles │  │ chat_sessions │  │ inferred_prefs │          │
│  │               │  │               │  │                │          │
│  │ - display_name│  │ - venue_id    │  │ - preferences  │          │
│  │ - created_at  │  │ - messages[]  │  │ - confidence   │          │
│  │ - gdpr_consent│  │ - summary     │  │ - sources[]    │          │
│  └───────────────┘  └───────────────┘  └────────────────┘          │
│                              │                                       │
│                              ▼                                       │
│              ┌───────────────────────────────┐                      │
│              │   PREFERENCE EXTRACTION JOB   │                      │
│              │   (post-session LLM analysis) │                      │
│              └───────────────────────────────┘                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.5.3 Schema Database

```sql
-- Migration: 006_user_profiles.sql

-- Profilo utente esteso
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  gdpr_consent_at TIMESTAMP WITH TIME ZONE,
  marketing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storico sessioni chat (max 10 per utente, gestito via trigger)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id),
  messages JSONB NOT NULL DEFAULT '[]',
  -- Sommario strutturato estratto da LLM
  summary JSONB,
  -- Metadati
  message_count INTEGER DEFAULT 0,
  wines_mentioned TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  analyzed_at TIMESTAMP WITH TIME ZONE
);

-- Indice per query recenti per utente
CREATE INDEX idx_chat_sessions_user_recent
  ON chat_sessions(user_id, created_at DESC);

-- Preferenze inferite (aggregate da tutte le chat)
CREATE TABLE inferred_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  -- Struttura preferences:
  -- {
  --   "wine_types": {"red": 0.8, "white": 0.5, "sparkling": 0.3},
  --   "taste_profile": {"body": "full", "sweetness": "dry", "tannins": "high"},
  --   "price_range": {"min": 20, "max": 50, "currency": "EUR"},
  --   "favorite_regions": ["Toscana", "Piemonte"],
  --   "favorite_grapes": ["Sangiovese", "Nebbiolo"],
  --   "pairing_preferences": ["carne rossa", "formaggi stagionati"],
  --   "dislikes": ["vini troppo dolci", "bollicine"]
  -- }
  confidence FLOAT DEFAULT 0.0,
  sources TEXT[] DEFAULT '{}', -- IDs delle chat da cui derivano
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storico scan etichette (per utenti registrati)
CREATE TABLE wine_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id),
  extracted_data JSONB NOT NULL,
  matched_wine_id UUID REFERENCES wines(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inferred_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE wine_scans ENABLE ROW LEVEL SECURITY;

-- Utente puo vedere/modificare solo i propri dati
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON inferred_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scans" ON wine_scans
  FOR SELECT USING (auth.uid() = user_id);

-- Trigger per limitare a 10 sessioni per utente
CREATE OR REPLACE FUNCTION limit_chat_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM chat_sessions
  WHERE id IN (
    SELECT id FROM chat_sessions
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 10
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_chat_session_limit
  AFTER INSERT ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION limit_chat_sessions();
```

### 6.5.4 Logica di Estrazione Preferenze

#### Quando Estrarre

L'estrazione preferenze avviene:
1. **Fine sessione** (utente chiude chat o inattivo 15 min)
2. **Background job** (ogni notte per sessioni non analizzate)

#### Come Estrarre

```typescript
// lib/preference-extractor.ts

const PREFERENCE_EXTRACTION_PROMPT = `Analizza questa conversazione tra un cliente e un sommelier AI.
Estrai le preferenze implicite del cliente in formato JSON strutturato.

CONVERSAZIONE:
{messages}

ESTRAI:
{
  "wine_types": {
    "red": 0.0-1.0,      // quanto preferisce rossi
    "white": 0.0-1.0,
    "rose": 0.0-1.0,
    "sparkling": 0.0-1.0,
    "dessert": 0.0-1.0
  },
  "taste_profile": {
    "body": "light|medium|full|null",
    "sweetness": "dry|off-dry|sweet|null",
    "tannins": "low|medium|high|null",
    "acidity": "low|medium|high|null"
  },
  "price_sensitivity": "budget|mid-range|premium|luxury|null",
  "price_range": {"min": number|null, "max": number|null},
  "favorite_regions": ["regione1", "regione2"],
  "favorite_grapes": ["vitigno1", "vitigno2"],
  "pairing_preferences": ["cibo1", "cibo2"],
  "dislikes": ["cosa non piace"],
  "confidence": 0.0-1.0,
  "evidence": ["frase1 che supporta", "frase2"]
}

REGOLE:
- Estrai SOLO preferenze esplicite o chiaramente implicite
- Se non ci sono evidenze sufficienti, usa null
- confidence indica quanto sei sicuro delle estrazioni complessive
- Non inventare preferenze non supportate dalla conversazione
- Ignora preferenze del sommelier, solo quelle del cliente

Rispondi SOLO con JSON valido.`

export async function extractPreferences(
  messages: ChatMessage[]
): Promise<ExtractedPreferences> {
  const formattedMessages = messages
    .map(m => `${m.role === 'user' ? 'Cliente' : 'Sommelier'}: ${m.content}`)
    .join('\n')

  const response = await chat([
    {
      role: 'system',
      content: 'Sei un analista esperto di preferenze enologiche.'
    },
    {
      role: 'user',
      content: PREFERENCE_EXTRACTION_PROMPT.replace('{messages}', formattedMessages)
    }
  ], {
    model: 'claude-3-haiku-20240307', // Modello economico per batch
    temperature: 0.1
  })

  return JSON.parse(response.content)
}

export async function mergePreferences(
  existing: InferredPreferences | null,
  newPrefs: ExtractedPreferences
): Promise<InferredPreferences> {
  // Logica di merge pesato per confidence
  // Preferenze recenti hanno peso maggiore
  // ...
}
```

### 6.5.5 Cosa Salvare: Sommario vs Chat Raw

| Approccio | Pro | Contro | Scelta |
|-----------|-----|--------|--------|
| **Chat Raw** | Piu contesto, re-analizzabile | Storage elevato, privacy | NO |
| **Solo Sommario** | Compatto, anonimizzabile | Perde sfumature | SI |
| **Ibrido** | Flessibilita | Complessita | PER DOPO |

**DECISIONE:** Salvare JSONB strutturato con:
- Summary estratto da LLM
- Lista vini menzionati
- Preferenze estratte
- NO messaggi raw (privacy + storage)

### 6.5.6 Limiti e Retention Policy

| Limite | Valore | Motivazione |
|--------|--------|-------------|
| Chat per utente | 10 max | Storage, performance, GDPR |
| Retention chat | 12 mesi | GDPR, valore decrescente |
| Retention preferenze | Illimitato (finche account attivo) | Core value |
| Retention scans | 6 mesi | Analytics, poi aggregato |

```sql
-- Cron job mensile per cleanup
DELETE FROM chat_sessions
WHERE created_at < NOW() - INTERVAL '12 months';

DELETE FROM wine_scans
WHERE created_at < NOW() - INTERVAL '6 months';
```

### 6.5.7 Stima Costi Aggiuntivi

#### Storage Supabase

| Componente | Stima/utente | Per 10K utenti |
|------------|--------------|----------------|
| user_profiles | ~0.5 KB | 5 MB |
| chat_sessions (10 max) | ~5 KB | 50 MB |
| inferred_preferences | ~2 KB | 20 MB |
| wine_scans | ~1 KB | 10 MB |
| **TOTALE** | ~8.5 KB | **85 MB** |

Costo Supabase Free Tier: 500 MB inclusi. OK fino a ~50K utenti.

#### LLM per Estrazione Preferenze

| Scenario | Chiamate/mese | Tokens/chiamata | Costo (Haiku) |
|----------|---------------|-----------------|---------------|
| 10K utenti, 50% registrati, 2 sessioni/mese | 10,000 | ~1,500 | ~$2.25 |
| 100K utenti | 100,000 | ~1,500 | ~$22.50 |

**TOTALE costi aggiuntivi (10K utenti/mese): ~$15-25**

### 6.5.8 Impatto Privacy e GDPR

#### Requisiti GDPR

| Requisito | Implementazione |
|-----------|-----------------|
| **Consenso esplicito** | Checkbox al signup + gdpr_consent_at timestamp |
| **Diritto di accesso** | API endpoint per export dati utente |
| **Diritto all'oblio** | DELETE CASCADE su auth.users elimina tutto |
| **Minimizzazione dati** | Solo sommari, no chat raw |
| **Retention limitata** | Policy automatiche (12 mesi chat, 6 mesi scan) |
| **Portabilita** | Export JSON dati utente |

#### Privacy Policy da Aggiornare

Elementi da aggiungere:
- Descrizione dati raccolti (sessioni, preferenze, scan)
- Finalita (personalizzazione raccomandazioni)
- Retention periods
- Diritti utente
- Contatto DPO

### 6.5.9 UX: Presentare Valore Registrazione

#### Strategia "Freemium Soft Gate"

```
Livello ANONIMO (senza registrazione):
- Chat illimitata (sessione corrente)
- Scan etichetta (risultato immediato, no storico)
- Nessuna personalizzazione

Livello REGISTRATO:
- Storico ultime 10 chat
- "Il sommelier ti conosce" - preferenze apprese
- Scan con storico e confronti
- Cross-venue: preferenze sincronizzate
```

#### Trigger per Registrazione (Soft Prompts)

1. **Dopo 3 messaggi in chat:**
   > "Ti sto consigliando bene? Registrati gratis e la prossima volta sapro gia cosa ti piace."

2. **Dopo scan etichetta:**
   > "Vuoi salvare questo vino nei tuoi preferiti? Crea un account in 10 secondi."

3. **Fine sessione:**
   > "E stata una bella chiacchierata! Registrati per ritrovarmi la prossima volta."

4. **Cross-venue detection:**
   > "Ciao! Ti ho gia visto da [altro ristorante]. Registrati per portare con te le tue preferenze."

#### Flusso Registrazione Minimale

```
1. Email (unico campo obbligatorio)
2. Magic link inviato
3. Click su link -> logged in
4. Opzionale: nome da visualizzare
```

Tempo target: **< 30 secondi** dalla decisione al login.

### 6.5.10 Valore Strategico B2B

#### Dati Aggregati per Venues

Con utenti registrati, i venues ottengono:

| Insight | Valore |
|---------|--------|
| **Utenti unici** | Quanti clienti reali usano WYN |
| **Utenti cross-venue** | Clienti che visitano piu ristoranti WYN |
| **Preferenze aggregate** | Cosa preferisce la clientela (anonimizzato) |
| **Retention rate** | Quanti tornano |
| **Conversion scan->ordine** | Efficacia upselling |

#### Pricing B2B Implicazioni

Giustifica tier premium per venues:
- **Base**: Solo chat + scan
- **Pro**: Analytics + dati aggregati utenti
- **Enterprise**: Cross-venue insights + API

---

## 7. TEST STRATEGY

### 7.1 Label Scan

| Tipo Test | Cosa Testare | Coverage |
|-----------|--------------|----------|
| Unit | `scanWineLabel()` con mock response | Parsing JSON |
| Unit | `findMatchingWine()` con vari scenari | Fuzzy match accuracy |
| Integration | POST /api/scan-label | End-to-end flow |
| E2E | Flusso utente completo | Happy path + errori |

### 7.2 Sistema Profilo Utente

| Tipo Test | Cosa Testare | Coverage |
|-----------|--------------|----------|
| Unit | `extractPreferences()` | Parsing, edge cases |
| Unit | `mergePreferences()` | Logica merge, pesi |
| Integration | Auth flow completo | Signup, login, logout |
| Integration | Limite 10 chat (trigger) | FIFO corretto |
| E2E | Flusso registrazione | < 30 sec target |
| E2E | Cross-venue preference sync | Preferenze persistenti |

### 7.3 Test Data

```typescript
// fixtures/scan-test-images.ts
export const TEST_LABELS = {
  CLEAR_LABEL: 'base64...', // Etichetta chiara, tutti i dati visibili
  BLURRY_LABEL: 'base64...', // Sfocata, test graceful degradation
  PARTIAL_LABEL: 'base64...', // Solo nome visibile
  NON_WINE: 'base64...' // Birra/altro, test rejection
}

// fixtures/chat-sessions.ts
export const TEST_SESSIONS = {
  CLEAR_PREFERENCES: [...], // Preferenze esplicite
  IMPLICIT_PREFERENCES: [...], // Solo implicite
  NO_PREFERENCES: [...], // Chat generica, nulla da estrarre
  CONFLICTING: [...] // Preferenze contraddittorie
}
```

---

## 8. ROLLBACK PLAN

### Label Scan
1. Feature flag `ENABLE_LABEL_SCAN=false`
2. Rimuovi route `/api/scan-label`
3. Nascondi UI scan button
4. Non richiede rollback DB (dati scan sono analytics)

### Sistema Profilo Utente
1. Feature flag `ENABLE_USER_PROFILES=false`
2. Fallback a chat anonima (no salvataggio)
3. Disabilita prompt registrazione
4. Dati esistenti persistono ma non usati
5. Job estrazione preferenze disabilitato

### Rollback Completo (worst case)
```sql
-- ATTENZIONE: Distruttivo
DROP TABLE IF EXISTS wine_scans;
DROP TABLE IF EXISTS inferred_preferences;
DROP TABLE IF EXISTS chat_sessions;
DROP TABLE IF EXISTS user_profiles;
```

---

## 9. METRICHE DI SUCCESSO

| Metrica | Target | Misurazione |
|---------|--------|-------------|
| Adoption scan | 20% utenti/sessione | Analytics events |
| Accuracy scan | 85%+ | Match rate |
| **Conversion registrazione** | 15% utenti anonimi | Funnel analytics |
| **Utenti registrati attivi** | 10% MAU | Supabase Auth |
| **Preferenze estratte con confidence > 0.6** | 70% sessioni | DB query |
| Retention D7 | +20% vs baseline | Supabase Analytics |
| Retention D30 | +15% vs baseline | Supabase Analytics |
| Tempo medio sessione | +3 minuti | Analytics |
| NPS venues | 8+ | Survey |
| **Cross-venue users** | 5% utenti registrati | DB query |

---

## 10. DECISIONE FINALE

### RACCOMANDAZIONE: SCENARIO A (AGGIORNATO)

**Implementare Label Scan + Sistema Profilo Utente con Registrazione**

**Timeline:** 4-5 settimane

**Motivazioni:**
1. Massimo differenziatore con effort ragionevole
2. **Lock-in positivo** che crea valore crescente per utente
3. **Dati reali** per venues (non anonimi)
4. **Cross-venue tracking** unico nel mercato
5. Base solida per analytics B2B premium
6. Apprendimento automatico senza friction per utente
7. "Wow factor" combinato (scan + "ti conosce")

### Rischi e Mitigazioni

| Rischio | Probabilita | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Friction registrazione | Media | Alto | UX minimale, valore chiaro, soft prompts |
| GDPR complessita | Bassa | Medio | Consulto legale, privacy by design |
| Costi LLM | Bassa | Basso | Haiku economico, batch processing |
| Preferenze inaccurate | Media | Medio | Confidence threshold, feedback loop |

### Prossimi Passi

1. [ ] Approvazione stakeholder (QUESTO PIANO AGGIORNATO)
2. [ ] Review legale GDPR / Privacy Policy
3. [ ] Creazione branch `feature/user-profiles`
4. [ ] Migrazione DB 006_user_profiles.sql
5. [ ] Implementazione auth flow
6. [ ] Implementazione lib/preference-extractor.ts
7. [ ] UI componenti registrazione
8. [ ] Implementazione Label Scan (parallelo)
9. [ ] Integration testing
10. [ ] Rollout graduale (feature flag)

---

## APPENDICE: FONTI

### Tecnologie Vision/OCR
- [ABBYY OCR for Vivino](https://www.abbyy.com/company/news/abbyys-ocr-helps-power-vivino-the-worlds-most-popular-wine-app/)
- [Wine Label Recognition Comparison](https://dev.to/api4ai/vivino-vs-tineye-vs-api4ai-vs-delectable-which-wine-label-recognition-tool-is-best-1o9m)
- [API4AI Wine Recognition](https://api4.ai/apis/wine-rec)

### Pricing API
- [Google Cloud Vision Pricing](https://cloud.google.com/vision/pricing) - $1.50/1000 requests
- [OpenAI Vision Pricing](https://openai.com/api/pricing/) - Token-based
- [Claude Pricing](https://platform.claude.com/docs/en/about-claude/pricing) - $3/1M input tokens

### Retention e Engagement
- [Mobile App Retention Benchmarks 2025](https://growth-onomics.com/mobile-app-retention-benchmarks-by-industry-2025/)
- [Restaurant App Engagement](https://www.olo.com/blog/strategies-for-maximizing-restaurant-app-engagement)
- [AI in Restaurants 2025](https://www.iorders.ca/blog/ai-revolutionizing-restaurant-operations-customer-engagement)

### GDPR e Privacy
- [GDPR.eu Official Guide](https://gdpr.eu/)
- [Supabase Auth + GDPR](https://supabase.com/docs/guides/auth)

---

**Documento creato da:** Architect Agent
**Data:** 2026-01-11
**Versione:** 2.0
**Changelog:**
- v2.0: Aggiunto sistema profilo utente con registrazione (sezione 6.5), aggiornato Scenario A, nuove stime effort e costi
- v1.0: Versione iniziale con Label Scan + Preferenze localStorage
