import Papa from 'papaparse'
import type { CsvWineRow, CsvParseResult } from '@/types'
import { validateCsvWine, getRequiredHeaders } from './csv-validator'

const REQUIRED_HEADERS = getRequiredHeaders()

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Parse a CSV file and validate wine data
 * Client-side parsing using PapaParse - no server round-trip needed
 */
export function parseCsvFile(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`Il file è troppo grande. Dimensione massima: 5MB (attuale: ${(file.size / 1024 / 1024).toFixed(2)}MB)`))
      return
    }

    Papa.parse<CsvWineRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
      complete: (results) => {
        try {
          const headers = results.meta.fields || []

          // Validate required headers exist
          const missingHeaders = REQUIRED_HEADERS.filter((h) => !headers.includes(h))
          if (missingHeaders.length > 0) {
            reject(
              new Error(
                `Colonne obbligatorie mancanti: ${missingHeaders.join(', ')}. ` +
                  `Colonne trovate: ${headers.join(', ')}`
              )
            )
            return
          }

          // Check for empty file
          if (results.data.length === 0) {
            reject(new Error('Il file CSV è vuoto'))
            return
          }

          // Parse and validate each row
          const wines = results.data.map((row, index) => {
            // rowNumber is index + 2 (1 for 0-index, 1 for header row)
            return validateCsvWine(row, index + 2)
          })

          const validCount = wines.filter((w) => w.isValid).length
          const errorCount = wines.filter((w) => !w.isValid).length

          resolve({
            wines,
            totalRows: wines.length,
            validCount,
            errorCount,
            headers,
          })
        } catch (error) {
          reject(
            new Error(
              `Errore durante l'elaborazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
            )
          )
        }
      },
      error: (error) => {
        reject(new Error(`Errore parsing CSV: ${error.message}`))
      },
    })
  })
}

/**
 * Generate a sample CSV content for download
 */
export function generateSampleCsv(): string {
  const headers = ['name', 'wine_type', 'price', 'producer', 'year', 'region', 'denomination', 'grape_varieties', 'description', 'price_glass']

  const sampleRows = [
    ['Barolo Riserva', 'red', '85', 'Giacomo Conterno', '2018', 'Piemonte', 'DOCG', 'Nebbiolo', 'Elegante e strutturato', '12'],
    ['Brunello di Montalcino', 'red', '65', 'Biondi-Santi', '2017', 'Toscana', 'DOCG', 'Sangiovese', 'Note di ciliegia e spezie', '10'],
    ['Vermentino di Sardegna', 'white', '18', 'Sella & Mosca', '2022', 'Sardegna', 'DOC', 'Vermentino', 'Fresco e minerale', '5'],
    ['Franciacorta Brut', 'sparkling', '35', 'Ca del Bosco', '', 'Lombardia', 'DOCG', 'Chardonnay, Pinot Nero', 'Bollicine fini e persistenti', '8'],
  ]

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Download sample CSV file
 */
export function downloadSampleCsv(): void {
  const csvContent = generateSampleCsv()
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'wine-import-template.csv'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
