# GDPR Compliance Checklist - WYN Project

| Campo | Valore |
|-------|--------|
| **ID** | GDPR-COMPLIANCE-CHECKLIST |
| **Data** | 2026-01-12 |
| **Autore** | Architect Agent |
| **Stato** | REVIEW RICHIESTA |
| **Contesto** | Analisi pre-implementazione sistema profilo utente (PLAN-STRATEGIC-FEATURES.md sezione 6.5) |
| **Target** | MVP Italia - Settore ristorazione |

---

## 1. EXECUTIVE SUMMARY

### Situazione Attuale

WYN attualmente **NON raccoglie dati personali degli utenti finali**. Il sistema e' completamente anonimo per i clienti dei ristoranti:
- Chat senza login (nessuna persistenza)
- Nessun profilo utente
- Nessun tracking
- Nessun cookie di profilazione

**Unici dati personali attualmente trattati:**
- Email e password degli **admin dei ristoranti** (via Supabase Auth)
- Dati dei ristoranti (non personali, B2B)

### Impatto del Piano Profilo Utente

Con l'implementazione del sistema profilo utente (PLAN-STRATEGIC-FEATURES.md 6.5), WYN iniziera' a raccogliere:

| Dato | Tipo | Base Legale Necessaria |
|------|------|------------------------|
| Email utente | Identificativo diretto | Consenso / Contratto |
| Storico chat (sommari) | Dato comportamentale | Consenso |
| Preferenze inferite (gusti vino) | Profilazione automatizzata | Consenso esplicito |
| Scan etichette | Dato comportamentale | Consenso |
| Venue visitate | Dato di localizzazione indiretta | Consenso |

### Gap Critico

| Area | Stato | Rischio |
|------|-------|---------|
| Privacy Policy | MANCANTE | **BLOCCANTE** |
| Cookie Policy | MANCANTE | **BLOCCANTE** |
| Consenso esplicito UI | MANCANTE | **BLOCCANTE** |
| Informativa trattamento | MANCANTE | **BLOCCANTE** |
| Data export API | MANCANTE | ALTO |
| Data deletion API | MANCANTE | ALTO |
| Registro trattamenti | MANCANTE | MEDIO |
| DPIA | DA VALUTARE | MEDIO |

---

## 2. CHECKLIST DETTAGLIATA PER ARTICOLO GDPR

### Art. 6 - Base Legale del Trattamento

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Identificare base legale per ogni trattamento | ❌ Mancante | P0 | Documentare in Privacy Policy |
| Consenso per profilazione automatizzata | ❌ Mancante | P0 | Implementare checkbox UI |
| Interesse legittimo (analytics aggregate) | ⚠️ Da documentare | P1 | Bilanciamento interessi |

**Base Legale Proposta:**

| Trattamento | Base Legale | Motivazione |
|-------------|-------------|-------------|
| Autenticazione (email) | Art. 6(1)(b) - Contratto | Necessario per erogare servizio |
| Storico chat | Art. 6(1)(a) - Consenso | Non strettamente necessario |
| Preferenze inferite | Art. 6(1)(a) - Consenso | Profilazione, richiede opt-in |
| Scan etichette | Art. 6(1)(a) - Consenso | Funzionalita opzionale |
| Analytics aggregate | Art. 6(1)(f) - Legittimo interesse | Miglioramento servizio |

### Art. 7 - Condizioni per il Consenso

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Consenso distinguibile da altri termini | ❌ Mancante | P0 | UI separata per consensi |
| Consenso granulare (per finalita) | ❌ Mancante | P0 | Checkbox multiple |
| Prova del consenso (timestamp) | ⚠️ Previsto | P0 | Campo `gdpr_consent_at` in DB |
| Revoca facile quanto dare consenso | ❌ Mancante | P0 | UI per gestione preferenze |
| Linguaggio chiaro e semplice | ❌ Mancante | P0 | Testi in italiano |

**Azione Richiesta:**
```
UI Registrazione deve includere:
[ ] Accetto i Termini di Servizio (link)
[ ] Accetto la Privacy Policy (link) - OBBLIGATORIO
[ ] Acconsento alla personalizzazione dell'esperienza (profilazione) - OPZIONALE
[ ] Acconsento a ricevere comunicazioni marketing - OPZIONALE
```

### Art. 12-14 - Informativa Privacy (Trasparenza)

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Privacy Policy accessibile | ❌ Mancante | P0 | Creare pagina /privacy |
| Identita titolare trattamento | ❌ Mancante | P0 | Inserire dati aziendali |
| Contatto DPO / responsabile | ❌ Mancante | P0 | Email dedicata |
| Finalita trattamento | ❌ Mancante | P0 | Elenco in Privacy Policy |
| Base giuridica per ogni finalita | ❌ Mancante | P0 | Tabella in Privacy Policy |
| Destinatari dati | ❌ Mancante | P0 | Supabase, LLM providers |
| Trasferimenti extra-UE | ⚠️ Da verificare | P0 | Verificare Supabase region, Anthropic DPA |
| Periodo conservazione | ❌ Mancante | P0 | Definire retention policy |
| Diritti interessato | ❌ Mancante | P0 | Elenco in Privacy Policy |
| Diritto reclamo Garante | ❌ Mancante | P0 | Link Garante Privacy |
| Profilazione automatizzata | ❌ Mancante | P0 | Sezione dedicata |

### Art. 15 - Diritto di Accesso

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Accesso ai propri dati | ❌ Mancante | P0 | API /api/user/data |
| Copia dati in formato leggibile | ❌ Mancante | P0 | Export JSON/CSV |
| Conferma trattamento in corso | ❌ Mancante | P1 | UI profilo utente |
| Info su categorie dati | ⚠️ Parziale | P1 | Privacy Policy |

### Art. 16 - Diritto di Rettifica

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Modifica dati inesatti | ⚠️ Parziale | P1 | UI modifica profilo |
| Integrazione dati incompleti | ⚠️ Parziale | P1 | UI modifica profilo |

**Nota:** Con Supabase Auth, l'utente puo' gia' modificare email. Servira' UI per altri dati (display_name, preferenze manuali).

### Art. 17 - Diritto all'Oblio (Cancellazione)

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Cancellazione su richiesta | ⚠️ Parziale | P0 | API DELETE /api/user |
| Cancellazione dati derivati | ⚠️ Previsto | P0 | CASCADE su FK |
| Notifica a terzi della cancellazione | ❌ Mancante | P2 | Non applicabile MVP |
| UI per richiesta cancellazione | ❌ Mancante | P0 | Bottone "Elimina account" |

**Schema DB gia' prevede CASCADE:**
```sql
-- Da PLAN-STRATEGIC-FEATURES.md
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
```

### Art. 18 - Diritto di Limitazione

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Limitare trattamento su richiesta | ❌ Mancante | P2 | Flag `processing_restricted` |
| Comunicare limitazione a terzi | ❌ Mancante | P2 | Non applicabile MVP |

**Nota:** Per MVP, implementare via cancellazione account. Limitazione completa e' P2.

### Art. 20 - Portabilita dei Dati

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Export in formato strutturato | ❌ Mancante | P0 | API /api/user/export |
| Formato machine-readable (JSON) | ❌ Mancante | P0 | Endpoint export |
| Trasferimento diretto a altro titolare | ❌ Mancante | P2 | Non richiesto MVP |

### Art. 25 - Privacy by Design e Default

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Minimizzazione dati | ⚠️ Previsto | P0 | Solo sommari, no chat raw |
| Pseudonimizzazione | ⚠️ Parziale | P1 | UUID invece di dati diretti |
| Privacy by default | ❌ Mancante | P0 | Opt-in per profilazione |
| Retention limitata | ⚠️ Previsto | P0 | 12 mesi chat, 6 mesi scan |

**Buone pratiche gia' previste in PLAN-STRATEGIC-FEATURES.md:**
- Solo sommari chat, NO messaggi raw
- Retention 12 mesi chat, 6 mesi scan
- Max 10 sessioni per utente

### Art. 30 - Registro Trattamenti

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Registro attivita di trattamento | ❌ Mancante | P1 | Documento interno |
| Categorie interessati | ❌ Mancante | P1 | Utenti finali, admin venues |
| Categorie dati | ❌ Mancante | P1 | Da Privacy Policy |
| Finalita | ❌ Mancante | P1 | Da Privacy Policy |
| Misure sicurezza | ❌ Mancante | P1 | Documentare |

**Nota:** Obbligatorio se > 250 dipendenti O trattamento non occasionale. WYN rientra nel secondo caso.

### Art. 32 - Sicurezza del Trattamento

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Cifratura dati in transito | ✅ OK | - | HTTPS via Vercel |
| Cifratura dati at rest | ✅ OK | - | Supabase encryption |
| Pseudonimizzazione | ⚠️ Parziale | P1 | Valutare hashing aggiuntivo |
| Controllo accessi | ✅ OK | - | RLS Supabase, middleware auth |
| Logging accessi | ⚠️ Parziale | P1 | Supabase audit log |
| Test sicurezza periodici | ❌ Mancante | P2 | Pianificare penetration test |

### Art. 33-34 - Data Breach

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Procedura notifica Garante (72h) | ❌ Mancante | P1 | Documentare procedura |
| Procedura notifica interessati | ❌ Mancante | P1 | Template email |
| Registro violazioni | ❌ Mancante | P1 | Documento interno |

### Art. 35 - DPIA (Valutazione Impatto)

| Requisito | Stato | Priorita | Azione |
|-----------|-------|----------|--------|
| Valutare necessita DPIA | ⚠️ Da valutare | P1 | Analisi sotto |

**Analisi necessita DPIA:**

La DPIA e' obbligatoria quando il trattamento "puo' presentare un rischio elevato". Criteri rilevanti per WYN:

| Criterio | Applicabile a WYN? |
|----------|-------------------|
| Profilazione sistematica | ✅ SI - Preferenze inferite automaticamente |
| Dati su larga scala | ❌ NO - MVP limitato |
| Categorie particolari | ❌ NO - No dati sensibili |
| Monitoraggio sistematico | ⚠️ PARZIALE - Tracking comportamento |
| Nuove tecnologie (AI) | ✅ SI - LLM per estrazione preferenze |

**RACCOMANDAZIONE:** Eseguire DPIA semplificata per:
1. Profilazione automatizzata (preferenze inferite da LLM)
2. Uso di AI per analisi comportamentale

---

## 3. COOKIE POLICY

### Analisi Cookie Attuali

| Cookie/Storage | Tipo | Scopo | Consenso Richiesto |
|----------------|------|-------|-------------------|
| Supabase Auth session | Tecnico essenziale | Autenticazione | NO (Art. 5(3) ePrivacy) |
| (futuro) Preferenze UI | Tecnico essenziale | Funzionamento | NO |
| (futuro) Analytics | Profilazione | Metriche | SI |

### Azioni Richieste

| Azione | Priorita |
|--------|----------|
| Creare pagina /cookie-policy | P0 |
| Cookie banner (se analytics) | P1 |
| Gestione preferenze cookie | P1 |

**Nota MVP:** Se WYN usa SOLO cookie tecnici essenziali (auth), il banner NON e' obbligatorio. Serve comunque Cookie Policy informativa.

---

## 4. DELIVERABLES MANCANTI - LISTA COMPLETA

### 4.1 Documenti Legali (P0 - BLOCCANTI)

| Documento | Formato | Pagina |
|-----------|---------|--------|
| Privacy Policy | Pagina web | /privacy |
| Cookie Policy | Pagina web | /cookie-policy |
| Termini di Servizio | Pagina web | /terms |

### 4.2 Componenti UI (P0 - BLOCCANTI)

| Componente | Descrizione |
|------------|-------------|
| `ConsentCheckbox.tsx` | Checkbox con link a policy |
| `RegistrationForm.tsx` | Form con consensi granulari |
| `CookieBanner.tsx` | Banner consenso cookie (se analytics) |
| `PrivacySettings.tsx` | Gestione preferenze privacy |
| `DeleteAccountButton.tsx` | Richiesta cancellazione |
| `DataExportButton.tsx` | Download dati personali |

### 4.3 API Endpoints (P0 - ALTO)

| Endpoint | Metodo | Scopo |
|----------|--------|-------|
| `/api/user/data` | GET | Export dati utente (JSON) |
| `/api/user/delete` | DELETE | Cancellazione account |
| `/api/user/consent` | PUT | Aggiorna consensi |
| `/api/user/preferences` | GET/PUT | Gestione preferenze privacy |

### 4.4 Modifiche Database (P0)

```sql
-- Aggiungere a user_profiles (gia' previsto in PLAN-STRATEGIC-FEATURES.md)
gdpr_consent_at TIMESTAMP WITH TIME ZONE,      -- Timestamp consenso privacy
marketing_consent BOOLEAN DEFAULT false,        -- Consenso marketing
profiling_consent BOOLEAN DEFAULT false,        -- Consenso profilazione (NUOVO)
consent_version VARCHAR(20),                    -- Versione policy accettata
```

### 4.5 Documenti Interni (P1)

| Documento | Scopo |
|-----------|-------|
| Registro Trattamenti | Art. 30 compliance |
| Procedura Data Breach | Art. 33-34 compliance |
| DPIA Semplificata | Art. 35 compliance |

---

## 5. TEMPLATE TESTI LEGALI (BOZZE)

### 5.1 Privacy Policy - Struttura Minima

```markdown
# Informativa Privacy - WYN

Ultimo aggiornamento: [DATA]

## 1. Titolare del Trattamento
[NOME AZIENDA]
[INDIRIZZO]
Email: privacy@wyn.app

## 2. Dati Raccolti

### Dati forniti direttamente
- Email (per registrazione)
- Nome visualizzato (opzionale)

### Dati raccolti automaticamente
- Sommari delle conversazioni con il sommelier AI
- Preferenze di gusto inferite (vini preferiti, budget, regioni)
- Storico scansioni etichette
- Ristoranti WYN visitati

## 3. Finalita e Base Giuridica

| Finalita | Dati | Base Giuridica |
|----------|------|----------------|
| Erogazione servizio | Email, conversazioni | Contratto (Art. 6.1.b) |
| Personalizzazione esperienza | Preferenze inferite | Consenso (Art. 6.1.a) |
| Miglioramento servizio | Dati aggregati anonimi | Legittimo interesse (Art. 6.1.f) |
| Comunicazioni marketing | Email | Consenso (Art. 6.1.a) |

## 4. Profilazione Automatizzata

WYN utilizza intelligenza artificiale per analizzare le tue conversazioni
e inferire automaticamente le tue preferenze di gusto. Questo ci permette
di offrirti raccomandazioni sempre piu' pertinenti.

Puoi disattivare questa funzione in qualsiasi momento dalle impostazioni
del tuo profilo. In tal caso, il sommelier non "ricordera'" i tuoi gusti
tra una sessione e l'altra.

## 5. Conservazione Dati

| Dato | Periodo |
|------|---------|
| Storico conversazioni | 12 mesi |
| Scansioni etichette | 6 mesi |
| Preferenze | Fino a cancellazione account |
| Account | Fino a richiesta cancellazione |

## 6. Destinatari

I tuoi dati possono essere trattati da:
- Supabase (database hosting) - [LINK DPA]
- Anthropic (AI provider) - [LINK DPA]
- Vercel (hosting) - [LINK DPA]

## 7. Trasferimenti Extra-UE

[DA VERIFICARE - Dipende da region Supabase e DPA Anthropic]

## 8. I Tuoi Diritti

Hai diritto di:
- Accedere ai tuoi dati
- Rettificare dati inesatti
- Cancellare i tuoi dati ("diritto all'oblio")
- Limitare il trattamento
- Portabilita' dei dati (export)
- Revocare il consenso in qualsiasi momento

Per esercitare questi diritti: privacy@wyn.app

## 9. Reclami

Puoi presentare reclamo al Garante per la Protezione dei Dati Personali:
https://www.garanteprivacy.it/

## 10. Modifiche

Eventuali modifiche saranno pubblicate su questa pagina con nuovo
timestamp. Per modifiche sostanziali, ti informeremo via email.
```

### 5.2 Testo Consenso Registrazione

```
Registrandoti dichiari di aver letto e accettato:
- [x] Termini di Servizio (link) [OBBLIGATORIO]
- [x] Privacy Policy (link) [OBBLIGATORIO]
- [ ] Acconsento alla personalizzazione dell'esperienza basata
      sull'analisi delle mie conversazioni [OPZIONALE]
- [ ] Acconsento a ricevere comunicazioni su novita' e offerte [OPZIONALE]
```

### 5.3 Testo Cookie Banner (se necessario)

```
Utilizziamo cookie tecnici essenziali per il funzionamento del servizio.
[Scopri di piu'] [Accetta]
```

---

## 6. PIANO IMPLEMENTAZIONE

### Fase 1 - Documenti Legali (Settimana 1)

| Task | Owner | Effort |
|------|-------|--------|
| Redigere Privacy Policy definitiva | Legal / Stakeholder | 2-3 giorni |
| Redigere Cookie Policy | Legal / Stakeholder | 1 giorno |
| Redigere Terms of Service | Legal / Stakeholder | 2-3 giorni |
| Creare pagine /privacy, /cookie-policy, /terms | FE Implementer | 0.5 giorni |

### Fase 2 - UI Consensi (Settimana 2)

| Task | Owner | Effort |
|------|-------|--------|
| Componente ConsentCheckbox | FE Implementer | 0.5 giorni |
| Modifica form registrazione | FE Implementer | 1 giorno |
| Pagina impostazioni privacy | FE Implementer | 1 giorno |
| Aggiunta link privacy in Sidebar/Footer | FE Implementer | 0.5 giorni |

### Fase 3 - API e Backend (Settimana 2-3)

| Task | Owner | Effort |
|------|-------|--------|
| Migrazione DB (consent fields) | BE Implementer | 0.5 giorni |
| API /api/user/data (export) | BE Implementer | 1 giorno |
| API /api/user/delete | BE Implementer | 1 giorno |
| API /api/user/consent | BE Implementer | 0.5 giorni |
| Test API | BE Implementer | 1 giorno |

### Fase 4 - Documenti Interni (Settimana 3)

| Task | Owner | Effort |
|------|-------|--------|
| Registro trattamenti | Architect / Legal | 1 giorno |
| Procedura data breach | Architect / Legal | 0.5 giorni |
| DPIA semplificata | Architect / Legal | 1 giorno |

### Effort Totale Stimato

| Area | Giorni |
|------|--------|
| Documenti legali (contenuti) | 5-6 |
| Implementazione tecnica | 6-7 |
| Documenti interni | 2.5 |
| **TOTALE** | **13-16 giorni** |

---

## 7. VERIFICHE PRE-LAUNCH

### Checklist Go-Live

- [ ] Privacy Policy pubblicata e accessibile
- [ ] Cookie Policy pubblicata e accessibile
- [ ] Terms of Service pubblicati e accessibili
- [ ] Link a policy in footer/sidebar
- [ ] Form registrazione con consensi granulari
- [ ] Checkbox consenso profilazione (opt-in)
- [ ] Checkbox consenso marketing (opt-in)
- [ ] Timestamp consenso salvato in DB
- [ ] API export dati funzionante
- [ ] API cancellazione account funzionante
- [ ] UI impostazioni privacy funzionante
- [ ] Registro trattamenti compilato
- [ ] Procedura data breach documentata
- [ ] DPA verificati con Supabase, Anthropic, Vercel
- [ ] DPIA completata (se necessaria)

---

## 8. TRASFERIMENTI EXTRA-UE - VERIFICHE NECESSARIE

### Supabase

| Verifica | Stato | Azione |
|----------|-------|--------|
| Region del progetto | DA VERIFICARE | Preferire eu-west |
| DPA firmato | DA VERIFICARE | Richiedere se non presente |
| SCCs (Standard Contractual Clauses) | DA VERIFICARE | Se region US |

### Anthropic (Claude)

| Verifica | Stato | Azione |
|----------|-------|--------|
| DPA disponibile | DA VERIFICARE | https://www.anthropic.com/dpa |
| SCCs | DA VERIFICARE | Verificare nel DPA |
| Trattamento dati | DA VERIFICARE | Verificare data retention policy |

### Vercel

| Verifica | Stato | Azione |
|----------|-------|--------|
| DPA disponibile | DA VERIFICARE | https://vercel.com/legal/dpa |
| Region deployment | DA VERIFICARE | Preferire EU |

---

## 9. RISCHI E MITIGAZIONI

| Rischio | Probabilita | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Lancio senza Privacy Policy | Bassa | CRITICO | P0 bloccante |
| Consenso non granulare | Media | Alto | UI con checkbox separate |
| No export dati | Media | Alto | API prioritaria |
| No cancellazione account | Media | Alto | DELETE CASCADE gia' previsto |
| DPA mancanti con provider | Media | Medio | Verificare prima del lancio |
| Trasferimento extra-UE non conforme | Media | Alto | Verificare region, SCCs |
| Data breach senza procedura | Bassa | Critico | Documentare procedura |

---

## 10. PROSSIMI PASSI

### Azioni Immediate (P0)

1. **Stakeholder Decision Required:**
   - [ ] Confermare dati aziendali per Privacy Policy (ragione sociale, indirizzo, P.IVA)
   - [ ] Decidere email per richieste privacy (es: privacy@wyn.app)
   - [ ] Verificare necessita consulenza legale esterna

2. **Verifiche Tecniche:**
   - [ ] Verificare region Supabase progetto
   - [ ] Ottenere DPA Anthropic
   - [ ] Verificare DPA Vercel

3. **Pianificazione:**
   - [ ] Schedulare implementazione UI consensi con FE team
   - [ ] Schedulare implementazione API GDPR con BE team

### Prima della Feature Profilo Utente

La feature "Sistema Profilo Utente" (PLAN-STRATEGIC-FEATURES.md 6.5) **NON deve essere rilasciata** fino a completamento di:
- Privacy Policy pubblicata
- Form registrazione con consensi
- API export dati
- API cancellazione account

---

## APPENDICE A - Riferimenti Normativi

| Normativa | Link |
|-----------|------|
| GDPR (Regolamento UE 2016/679) | https://eur-lex.europa.eu/eli/reg/2016/679/oj |
| Codice Privacy IT (D.Lgs. 196/2003 aggiornato) | https://www.garanteprivacy.it/codice |
| ePrivacy Directive | https://eur-lex.europa.eu/eli/dir/2002/58/oj |
| Linee Guida Garante su Cookie | https://www.garanteprivacy.it/cookie |
| Linee Guida EDPB su Consenso | https://edpb.europa.eu/our-work-tools/general-guidance/gdpr-guidelines-recommendations-best-practices_en |

## APPENDICE B - Contatti Garante Privacy

Garante per la Protezione dei Dati Personali
Piazza Venezia, 11 - 00187 Roma
https://www.garanteprivacy.it/
Email: garante@gpdp.it
PEC: protocollo@pec.gpdp.it

---

**Documento creato da:** Architect Agent
**Data:** 2026-01-12
**Versione:** 1.0
**Status:** In attesa review stakeholder e/o consulente legale
