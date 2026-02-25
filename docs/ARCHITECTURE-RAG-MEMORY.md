# WYN - Architettura RAG, Knowledge e Memory

> Riferimento tecnico per le feature implementate nelle Phase 1-3.

---

## Indice

1. [Il problema risolto](#1-il-problema-risolto)
2. [Embeddings: come funzionano](#2-embeddings)
3. [pgvector: vettori in PostgreSQL](#3-pgvector)
4. [RAG: Retrieval-Augmented Generation](#4-rag)
5. [Pipeline di indicizzazione](#5-pipeline-di-indicizzazione)
6. [Pipeline di ricerca (chat)](#6-pipeline-di-ricerca)
7. [Wine Knowledge (Phase 2)](#7-wine-knowledge)
8. [Memory System (Phase 3)](#8-memory-system)
9. [Riepilogo visuale](#9-riepilogo-visuale)
10. [File di riferimento](#10-file-di-riferimento)
11. [Variabili d'ambiente richieste](#11-variabili-dambiente)
12. [Migration SQL da applicare](#12-migration-sql)

---

## 1. Il problema risolto

Prima delle Phase 1-3, in venue mode **tutti i vini del locale** venivano inseriti nel system prompt del LLM:

| Scenario | Token per messaggio | Costo stimato |
|----------|-------------------|---------------|
| 50 vini | ~10K token | Accettabile |
| 500 vini | ~150K token | Troppo costoso, troppo lento |
| 1000+ vini | ~300K+ token | Impossibile |

Problemi aggiuntivi:
- **"Lost in the middle"**: il LLM perde informazioni nel mezzo di testi lunghi
- **Latenza**: piu' token = risposta piu' lenta
- **Nessuna personalizzazione**: il LLM non ricorda nulla tra sessioni

**Dopo Phase 1-3**: ~3K token per messaggio indipendentemente dal numero di vini, con personalizzazione cross-venue.

---

## 2. Embeddings

Un embedding trasforma un testo nel suo **significato numerico**: un vettore di 1536 numeri.

```
"Barolo corposo, ideale con carni rosse"
    --> OpenAI text-embedding-3-small
    --> [0.023, -0.041, 0.087, ..., 0.012]  (1536 float)
```

**Proprieta' chiave**: testi semanticamente simili producono vettori vicini nello spazio.

```
"rosso corposo per bistecca"     --> vettore A
"Barolo strutturato, carni"     --> vettore B  (cosine similarity: 0.89 = VICINO)
"Prosecco leggero, aperitivo"   --> vettore C  (cosine similarity: 0.23 = LONTANO)
```

Non e' keyword matching. E' **meaning matching**: "corposo per bistecca" matcha "strutturato con carni" anche senza parole in comune.

**API usata**: OpenAI `text-embedding-3-small` (1536 dimensioni, ~$0.02/1M token).

---

## 3. pgvector

Estensione PostgreSQL che aggiunge:

| Cosa | Descrizione |
|------|-------------|
| `vector(1536)` | Tipo dato per salvare embeddings |
| Indice **HNSW** | Ricerca approssimata veloce (~10ms su 100K vettori) |
| `<=>` operatore | Cosine distance tra due vettori |

Gli embeddings vivono **dentro Supabase**, nella tabella `wine_embeddings`. Non serve un database vettoriale separato (Pinecone, Weaviate, etc.).

### Funzioni SQL create

- **`match_wines(query_embedding, venue_id, ...)`**: ricerca ibrida vino per similarity + filtri SQL (tipo, prezzo, disponibilita')
- **`match_memories(query_embedding, user_id, ...)`**: ricerca memorie utente con peso (weight-adjusted similarity)
- **`decay_memory_weights()`**: riduce peso memorie stale

---

## 4. RAG

**Retrieval-Augmented Generation**: invece di dare tutto al LLM, recuperi solo i dati rilevanti.

```
PRIMA (full context):
  500 vini nel prompt --> 150K token --> risposta generica

DOPO (RAG):
  Domanda --> embedding --> top 8 vini simili --> 3K token --> risposta precisa
```

**Soglia**: il RAG si attiva solo per venue con >50 vini (`RAG_THRESHOLD`). Venue piccole usano ancora il full context (piu' semplice, nessun rischio di omissione).

---

## 5. Pipeline di indicizzazione

Quando un vino viene creato, modificato, o arricchito:

```
Vino (DB)
  |
  v
wineToChunkTextWithKnowledge(wine, knowledge)    [lib/wine-chunks.ts]
  --> "Barolo Biondi-Santi (2018)
       Tipo: Rosso
       Prezzo: EUR85/bottiglia
       Produttore: Biondi-Santi
       Regione: Piemonte
       Vitigni: Nebbiolo
       Valutazioni: Gambero Rosso: 3 Bicchieri
       Storia del Produttore: Fondata nel 1869..."
  |
  v
embedText(chunkText)                              [lib/embeddings.ts]
  --> chiama OpenAI API
  --> [0.023, -0.041, 0.087, ..., 0.012]
  |
  v
embedWine(wineId)                                  [lib/embedding-pipeline.ts]
  --> calcola content_hash (SHA-256 del testo)
  --> se hash invariato, SKIP (nessun costo)
  --> se cambiato, UPSERT in wine_embeddings
```

**Trigger automatici**:
- Creazione vino --> embedding
- Modifica vino --> re-embedding (se contenuto cambiato)
- Enrichment completato --> re-embedding (nuovi dati)
- Knowledge generato --> re-embedding (conoscenza profonda inclusa)
- Toggle disponibilita' --> aggiorna solo flag `available` (no re-embedding)

---

## 6. Pipeline di ricerca

Quando l'utente scrive un messaggio in venue mode:

```
Utente: "rosso corposo per bistecca"
  |
  v
[Controllo] Quanti vini ha il locale?
  - <= 50: vecchio metodo (full context, nessun embedding)
  - > 50: RAG path (continua sotto)
  |
  v
parseQueryIntent(message)                          [lib/query-parser.ts]
  --> { wineType: "red", maxPrice: null }
  (regex parser, zero costo, zero latenza)
  |
  v
searchWinesRAG({venueId, query, topK: 8, ...})    [lib/rag.ts]
  --> embedText("rosso corposo per bistecca")
  --> chiama match_wines() su PostgreSQL:
      "vini di questo locale, embedding simile,
       disponibili, tipo rosso, top 8"
  --> restituisce 8 WineWithRatings ordinati per similarity
  |
  v
getVenueSystemPromptRAG(venue, ragContext, 500)    [lib/prompts.ts]
  --> "Sei un sommelier. Il locale ha 500 vini.
       Ecco i piu' rilevanti:
       1. Barolo Biondi-Santi 2018, EUR85 (sim: 0.89)
       2. Barbaresco Gaja 2019, EUR72 (sim: 0.85)
       ..."
  |
  v
LLM risponde basandosi solo sui vini rilevanti
```

---

## 7. Wine Knowledge

Per ogni vino, generiamo conoscenza da sommelier tramite LLM (`lib/wine-knowledge.ts`):

| Campo | Esempio |
|-------|---------|
| `producer_history` | "Biondi-Santi, fondata nel 1869, pionieri del Brunello..." |
| `producer_philosophy` | "Approccio tradizionale, fermentazione in botti grandi..." |
| `terroir_description` | "Collina di Montalcino, 400m slm, esposizione sud..." |
| `soil_type` | "Calcareo-argilloso" |
| `climate` | "Mediterraneo con escursioni termiche" |
| `vinification_process` | "Fermentazione in acciaio, malolattica spontanea..." |
| `aging_method` | "Botti grandi di rovere di Slavonia" |
| `aging_duration` | "36 mesi in botte + 12 in bottiglia" |
| `food_pairings` | [{category: "Carni rosse", dishes: ["Bistecca fiorentina", ...]}] |
| `serving_temperature` | "18°C" |
| `glass_type` | "Ballon ampio" |
| `curiosities` | ["Il primo Brunello della storia fu un Biondi-Santi 1888"] |

**Come si integra**: la knowledge viene inclusa nel chunk text per gli embeddings. Quindi cercare "vino con storia interessante" matcha anche su `producer_history` e `curiosities`.

**Flusso**: enrichment completo --> trigger knowledge generation (async) --> re-embedding con knowledge inclusa.

**Admin review**: l'admin puo' rivedere, correggere e approvare la knowledge generata dall'AI (tab "Conoscenza" nel pannello admin).

---

## 8. Memory System

Il LLM e' stateless: non ricorda nulla tra sessioni. Il memory system aggiunge persistenza.

### 8.1 Estrazione (post-sessione)

Dopo una conversazione, il LLM estrae frammenti discreti:

```
Conversazione:
U: "Mi piace il Barolo, non sopporto i vini dolci"
A: "Ecco 3 Baroli disponibili..."
U: "Perfetto, e' per una cena di anniversario"

    --> extractMemories(messages, userId)
    --> LLM estrae:

[
  {type: "preference", content: "Preferisce Barolo e rossi strutturati"},
  {type: "dislike",    content: "Non gradisce vini dolci"},
  {type: "occasion",   content: "Cena di anniversario"}
]
```

**Tipi di frammento**: `preference`, `dislike`, `purchase`, `feedback`, `context`, `occasion`.

Ogni frammento viene embeddato e salvato in `memory_fragments` con:
- `weight`: 1.0 iniziale, decade nel tempo
- `source_venue_id`: traccia l'origine ma non limita il recupero
- `last_relevant_at`: aggiornato quando la memoria viene usata

### 8.2 Deduplicazione semantica

Prima di creare un nuovo frammento, il sistema cerca duplicati (similarity > 0.9). Se trovato, aggiorna il peso del frammento esistente invece di crearne uno nuovo.

### 8.3 Recupero (alla prossima chat)

```
Utente (settimane dopo, altro ristorante): "Cosa mi consigli?"

    --> retrieveRelevantMemories(userId, "Cosa mi consigli?")
    --> embedding della domanda
    --> match_memories(): cerca memorie simili, pesate per weight
    --> Risultato: "Preferisce Barolo", "Non gradisce vini dolci"

    --> Inietta nel system prompt:
        "## Ricordi dell'utente
         **Preferenze:** Preferisce Barolo e rossi strutturati
         **Non gradisce:** Vini dolci"

    --> LLM risponde con personalizzazione
```

**Cross-venue**: le memorie sono legate all'utente, non al locale. Preferenze espresse al Locale A influenzano raccomandazioni al Locale B.

### 8.4 Decay (cron settimanale)

```
Ogni domenica alle 3:00 UTC:
  decay_memory_weights(decay_factor=0.05, stale_days=30, min_weight=0.1)

  - Memorie non usate da 30+ giorni: peso -= 5%
  - Peso minimo: 0.1 (mai cancellate del tutto)
  - Memorie usate di recente: peso intatto (last_relevant_at aggiornato)
```

### 8.5 GDPR

- Solo per utenti autenticati con `profiling_consent = true` (RULE-009)
- `GET /api/user/memories`: l'utente vede tutti i suoi ricordi
- `DELETE /api/user/memories`: cancella singolo o tutti
- Export dati include memorie (`GET /api/user/export`)

---

## 9. Riepilogo visuale

```
=== INDICIZZAZIONE (per vino, una tantum) ===

Vino --> Chunk text --> Embedding --> wine_embeddings (Supabase)
                 |
                 +-- include wine_knowledge se disponibile


=== CHAT (ogni messaggio) ===

Domanda utente
  --> [se >50 vini] Embedding query --> match_wines() --> Top 8 vini
  --> [se <=50 vini] Tutti i vini nel prompt
  --> [se utente autenticato + consent] match_memories() --> Memorie rilevanti
  --> System prompt (vini + memorie) --> LLM --> Risposta


=== KNOWLEDGE (per vino, una tantum) ===

Enrichment completo
  --> LLM genera conoscenza --> wine_knowledge
  --> Chunk text arricchito --> Re-embedding


=== MEMORY (per utente autenticato) ===

Fine sessione --> LLM estrae frammenti --> Embedding --> memory_fragments
Nuova chat --> Embedding domanda --> match_memories() --> Inietta nel prompt
Cron settimanale --> decay_memory_weights() --> Riduce peso memorie stale
```

---

## 10. File di riferimento

### Phase 1: RAG Foundation

| File | Ruolo |
|------|-------|
| `lib/embeddings.ts` | Client OpenAI per embedding (embedText, embedTexts, isEmbeddingAvailable) |
| `lib/wine-chunks.ts` | Converte vino in testo ottimizzato per embedding |
| `lib/embedding-pipeline.ts` | Orchestratore: embedWine, embedVenueWines, syncEmbedding |
| `lib/rag.ts` | Ricerca semantica: searchWinesRAG |
| `lib/query-parser.ts` | Parser regex per intent (tipo vino, prezzo, regione) |
| `lib/prompts.ts` | getVenueSystemPromptRAG (prompt RAG-aware) |
| `app/api/chat/route.ts` | Logica decisionale RAG vs full context |
| `app/api/embeddings/route.ts` | API per embedding batch |
| `app/api/embeddings/sync/route.ts` | API per sync singolo vino |
| `app/api/embeddings/backfill/route.ts` | API per backfill vini esistenti |
| `config/constants.ts` | RAG_THRESHOLD=50, RAG_TOP_K=8, RAG_SIMILARITY_THRESHOLD=0.4 |

### Phase 2: Wine Knowledge

| File | Ruolo |
|------|-------|
| `lib/wine-knowledge.ts` | Generazione e recupero knowledge via LLM |
| `lib/wine-chunks.ts` | wineToChunkTextWithKnowledge (chunk arricchito) |
| `lib/enrichment.ts` | Trigger knowledge generation dopo enrichment |
| `app/api/admin/wines/[wineId]/knowledge/route.ts` | API admin per review knowledge |
| `components/admin/WineKnowledgePanel.tsx` | UI admin per review knowledge |

### Phase 3: User Memory

| File | Ruolo |
|------|-------|
| `lib/memory.ts` | extractMemories, retrieveRelevantMemories, formatMemoriesForPrompt |
| `app/api/chat/route.ts` | Iniezione memorie nel prompt (RULE-009) |
| `app/api/chat-session/analyze/route.ts` | Estrazione memorie post-sessione |
| `app/api/user/memories/route.ts` | GDPR: lista e cancellazione memorie |
| `app/api/user/export/route.ts` | Export dati include memorie |
| `app/api/cron/memory-decay/route.ts` | Cron settimanale per decay peso |
| `config/constants.ts` | MEMORY_SIMILARITY_THRESHOLD=0.3, MEMORY_TOP_K=5, etc. |

---

## 11. Variabili d'ambiente

```env
# Obbligatoria per embeddings (Phase 1-3)
OPENAI_API_KEY=sk-...

# Obbligatoria per cron memory decay (Phase 3)
CRON_SECRET=...

# Gia' esistenti
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GROQ_API_KEY=...
```

---

## 12. Migration SQL

Da eseguire in ordine su Supabase SQL Editor:

| # | File | Phase | Cosa crea |
|---|------|-------|-----------|
| 007 | `007_pgvector_wine_embeddings.sql` | 1 | pgvector, wine_embeddings, match_wines() |
| 008 | `008_wine_knowledge.sql` | 2 | wine_knowledge, trigger updated_at |
| 009 | `009_memory_fragments.sql` | 3 | memory_fragments, match_memories(), decay_memory_weights() |

**Dopo le migration**: chiamare `POST /api/embeddings/backfill` per popolare embeddings dei vini esistenti.
