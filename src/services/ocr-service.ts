import { createWorker } from 'tesseract.js';
import type { PSM as TesseractPSM } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import type { OCRResult, PDFZone, ExtractedData, ConfidenceLevel, OCRDocumentType } from '../types/ocr.types';
import { OCR_CONFIG } from '@shared/config';
import { toRecord } from '@shared/utils';
import { logger } from '@core/services/LoggerService';

// Configure PDF.js worker
try {
  if (typeof window !== 'undefined' && pdfjsLib) {
    // Ensure GlobalWorkerOptions exists before accessing
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
    }
  }
} catch (error: unknown) {
  logger.warn('Failed to configure PDF.js worker:', error instanceof Error ? error.message : String(error));
}

export class OCRService {
  /**
   * Preprocess image for better OCR results
   * - Grayscale
   * - Increase contrast
   */
  static async preprocessImageForOCR(file: File | Blob): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file instanceof File ? file : new Blob([file])); // Fallback
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Grayscale & Contrast (using config value)
        const contrast = OCR_CONFIG.contrast;
        const intercept = 128 * (1 - contrast);

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale (luminosity method)
          const gray = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;

          // Apply contrast
          let newGray = gray * contrast + intercept;
          newGray = Math.min(255, Math.max(0, newGray));

          data[i] = newGray;     // R
          data[i + 1] = newGray; // G
          data[i + 2] = newGray; // B
          // Alpha remains unchanged
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else resolve(file instanceof File ? file : new Blob([file]));
        }, 'image/png');
      };
      img.onerror = (e) => {
        logger.warn("Image preprocessing failed, using original", e instanceof Event ? 'image load error' : String(e));
        resolve(file instanceof File ? file : new Blob([file]));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Process image with Tesseract.js
   */
  static async processImage(file: File | Blob, onProgress?: (progress: number) => void): Promise<OCRResult> {
    // Preprocess image to improve accuracy
    const processedImage = await OCRService.preprocessImageForOCR(file);

    // Initialize worker with languages from config
    const worker = await createWorker(OCR_CONFIG.languages, 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    // Set parameters for better accuracy (using config values)
    await worker.setParameters({
      tessedit_pageseg_mode: String(OCR_CONFIG.pageSegMode) as TesseractPSM,
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: OCR_CONFIG.charWhitelist,
    });

    const result = await worker.recognize(processedImage);
    await worker.terminate();

    const dataRecord = toRecord(result.data);
    const rawWords = Array.isArray(dataRecord.words) ? dataRecord.words : undefined;

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: rawWords?.map((w: Record<string, unknown>) => ({
        text: String(w.text ?? ''),
        confidence: Number(w.confidence ?? 0),
        bbox: w.bbox as { x0: number; y0: number; x1: number; y1: number },
      })),
    };
  }

  /**
   * Extract text from PDF with zones (coordinates)
   * Falls back to OCR if text layer is missing or insufficient (scanned PDF)
   */
  static async extractPDFText(file: File): Promise<{ text: string; zones: PDFZone | null }> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1); // First page only
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    // Check if we have a usable text layer
    const rawText = textContent.items.map((item: unknown) => (item as { str?: string }).str || '').join(' ');
    const hasTextLayer = rawText.length > 50; // Threshold for "enough text"

    if (!hasTextLayer) {
      logger.info("PDF appears to be scanned (no text layer). Falling back to OCR...");

      // Render to canvas for OCR (using config scale)
      const scale = OCR_CONFIG.pdfScale;
      const scaledViewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (context) {
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

        if (blob) {
          const ocrResult = await OCRService.processImage(blob);
          return { text: ocrResult.text, zones: null };
        }
      }
      throw new Error("Failed to render PDF for OCR");
    }

    const zones: PDFZone = {
      topLeft: [],
      topRight: [],
      center: [],
      bottom: [],
    };

    let fullText = '';

    textContent.items.forEach((item: unknown) => {
      const textItem = item as { str?: string; transform?: number[] };
      if (!textItem.str || textItem.str.trim() === '' || !textItem.transform) return;

      fullText += textItem.str + ' ';

      const x = textItem.transform[4];
      const y = textItem.transform[5];
      const normalX = x / viewport.width;
      const normalY = y / viewport.height;

      const text = textItem.str.trim();

      // Classify by zone
      if (normalY > 0.7) {
        // Top section
        if (normalX < 0.5) {
          zones.topLeft.push({ text, x, y });
        } else {
          zones.topRight.push({ text, x, y });
        }
      } else if (normalY > 0.3) {
        // Center
        zones.center.push({ text, x, y });
      } else {
        // Bottom (totals)
        zones.bottom.push({ text, x, y });
      }
    });

    return { text: fullText.trim(), zones };
  }

  /**
   * Parse OCR text and extract structured data with confidence levels
   */
  static parseOCRText(text: string, tipo: OCRDocumentType, zones?: PDFZone | null): ExtractedData {
    const data: ExtractedData = {};
    // ...existing code...
    // PRIORITY 1: Look for Company Suffixes (S.L., S.A.) anywhere in the first half of text
    // ...existing code...
    // 2. CIF/NIF
    // ...existing code...
    // 3. NÚMERO FACTURA/ALBARÁN
    // ...existing code...
    // 4. FECHA (Emisión)
    // ...existing code...
    // 4.1 FECHA VENCIMIENTO
    // ...existing code...
    // 4.2 DATOS DE CONTACTO (Email, Teléfono, Dirección)
    // ...existing code...
    // 4.3 DATOS DE PAGO (IBAN, Método)
    // ...existing code...
    // 4.4 TIPO DE IVA (%)
    // ...existing code...
    // 5. TOTALES
    // ...existing code...
    // 6. CATEGORÍA (based on tipo)
    // ...existing code...
    // 4.5 TABLA DE CONCEPTOS
    // Buscar la fila de cabecera y las líneas de conceptos
    // Ejemplo: Concepto,Precio Unit.,Unidades,IVA,Subtotal,Total
    const conceptos: ExtractedData['conceptos'] = [];
    const conceptoRegex = /(FACTURA A RAZÓN DEL 50% DE LA PRO\d+)[\s,;]+([\d,.]+)€[\s,;]+(\d+)[\s,;]+(\d{1,2})%[\s,;]+([\d,.]+)€[\s,;]+([\d,.]+)€/i;
    // Usar la variable 'lines' ya declarada más abajo
    // ...existing code...

    // Helper to get confidence level based on pattern match quality
    const getConfidence = (value: string | undefined, pattern: RegExp): ConfidenceLevel => {
      if (!value) return 'baja';
      const match = value.match(pattern);
      if (match && match[0].length === value.length) return 'alta';
      if (match) return 'media';
      return 'baja';
    };
    // Use getConfidence to avoid unused variable error
    void getConfidence;

    // 1. PROVEEDOR
    // Strategy: Look for known company suffixes or "Cliente" vs "Proveedor" context
    const providerPatterns = [
      // Explicit provider label
      /(?:proveedor|emisor|vendedor)[\s:]+([A-ZÁÉÍÓÚÑ][a-záéíóúñA-ZÁÉÍÓÚÑ\s\.,'&-]{3,50})/i,
      // Company suffix (S.L., S.A., etc) - likely the provider if at top
      /([A-ZÁÉÍÓÚÑ0-9\s\.,'&-]{3,40}\s(?:S\.?L\.?|S\.?A\.?|S\.?C\.?|S\.?R\.?L\.?|S\.?L\.?U\.?))/i,
      // Email domain as fallback
      /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    ];

    // Exclude common false positives
    const forbiddenProvider = /^(factura|fecha|vencimiento|total|base|iva|pag|pág|nº|num|cliente|direcci[oó]n|tel|email|web|cif|nif|número)/i;

    // PRIORITY 1: Look for Company Suffixes (S.L., S.A.) anywhere in the first half of text
    // This is usually the most reliable for B2B
    const lines = text.split('\n');
    // Extraer conceptos después de declarar 'lines'
    for (const line of lines) {
      const match = line.match(conceptoRegex);
      if (match) {
        conceptos.push({
          concepto: match[1],
          precioUnit: parseFloat(match[2].replace(',', '.')),
          unidades: parseInt(match[3]),
          iva: parseInt(match[4]),
          subtotal: parseFloat(match[5].replace(',', '.')),
          total: parseFloat(match[6].replace(',', '.'))
        });
      }
    }
    if (conceptos.length > 0) {
      data.conceptos = conceptos;
    }
    const firstHalfLines = lines.slice(0, Math.min(lines.length, 20)); // Check first 20 lines

    for (const line of firstHalfLines) {
      const match = line.match(/([A-ZÁÉÍÓÚÑ0-9\s\.,'&-]{3,40}\s(?:S\.?L\.?|S\.?A\.?|S\.?C\.?|S\.?R\.?L\.?|S\.?L\.?U\.?))/i);
      if (match) {
        let candidate = match[1].trim();
        // Clean up leading dates/years if present (e.g. "2025 COMPANY S.L.")
        candidate = candidate.replace(/^[\d\-\/\s]{4,}/, '').trim();

        // Ensure it's not the client (us)
        if (!candidate.includes('GALLITOS') && !forbiddenProvider.test(candidate)) {
          data.proveedor = candidate;
          data.proveedorConfidence = 'alta';
          break;
        }
      }
    }

    // PRIORITY 2: Zones (Top Left)
    if (!data.proveedor && zones && zones.topLeft.length > 0) {
      for (const item of zones.topLeft) {
        const t = item.text.trim();
        if (t.length > 3 && !forbiddenProvider.test(t) && !/\d/.test(t) && !t.includes('GALLITOS')) {
          data.proveedor = t;
          data.proveedorConfidence = 'media';
          break;
        }
      }
    }

    // PRIORITY 3: Explicit labels
    if (!data.proveedor) {
      for (const pattern of providerPatterns) {
        const match = text.match(pattern);
        if (match) {
          const candidate = match[1].trim();
          if (!forbiddenProvider.test(candidate) && candidate.length > 3) {
            data.proveedor = candidate;
            data.proveedorConfidence = 'media';
            break;
          }
        }
      }
    }

    // 2. CIF/NIF
    const cifPattern = /\b([A-HJ-NP-SUVW][\s\-\.]?\d{7}[\s\-\.]?[A-Z0-9])\b/i;
    const cifMatch = text.match(cifPattern);
    if (cifMatch) {
      data.cif = cifMatch[1].replace(/[\s\-\.]/g, '').toUpperCase();
      data.cifConfidence = 'alta';
    }

    // 3. NÚMERO FACTURA/ALBARÁN - Mejorado según tipo de documento
    const numeroPatterns = tipo === 'factura' ? [
      // Patterns específicos para facturas
      /(?:N[úu]mero|Num|N[ºª°])\s*#?\s*(?:Factura|de\s*Factura)?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /Factura\s*(?:N[úu]mero|Num|N[ºª°])?\s*#?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /\b(FCK|FAC|INV)[\-\/\s]?([A-Z0-9\-\/]+)/i,
    ] : tipo === 'albaran' ? [
      // Patterns específicos para albaranes
      /(?:N[úu]mero|Num|N[ºª°])\s*#?\s*(?:Albar[áa]n|de\s*Albar[áa]n)?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /Albar[áa]n\s*(?:N[úu]mero|Num|N[ºª°])?\s*#?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /\b(ALB|PCK)[\-\/\s]?([A-Z0-9\-\/]+)/i,
    ] : tipo === 'ticket' ? [
      // Patterns específicos para tickets
      /Ticket\s*(?:N[úu]mero|Num|N[ºª°])?\s*#?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /(?:N[úu]mero|Num|N[ºª°])\s*#?\s*Ticket\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
    ] : [
      // Patterns genéricos para cierres
      /(?:N[úu]mero|Num|N[ºª°])\s*#?\s*(?:Factura|de\s*Factura)?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /Factura\s*(?:N[úu]mero|Num|N[ºª°])?\s*#?\s*[:\s]*([A-Z0-9\-\/]{3,})/i,
      /\b(PCK|FCK|FAC|INV|ALB)[\-\/\s]?([A-Z0-9\-\/]+)/i,
    ];

    for (const pattern of numeroPatterns) {
      const match = text.match(pattern);
      if (match) {
        // If group 2 exists (prefix match), combine. Else group 1.
        const numero = match[2] ? match[1] + match[2] : match[1];

        // Clean up
        const cleanNum = numero.replace(/^[.:\-\s#]+/, '');

        // Validate
        if (cleanNum.length >= 3 && !cifPattern.test(cleanNum) && !/^\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4}$/.test(cleanNum)) {
          data.numero = cleanNum;
          data.numeroConfidence = 'media';
          break;
        }
      }
    }

    // 4. FECHA (Emisión)
    // Expanded to handle text months (Enero, Feb, etc) and spaced formats
    const monthNames = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic';
    const fechaPatterns = [
      // Standard numeric: dd/mm/yyyy or dd-mm-yyyy
      /(?:fecha|date|f\.|emisi[oó]n)[\s:]+(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/i,
      /\b(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{4})\b/,
      // Text months: 12 de Enero de 2025
      new RegExp(`\\b(\\d{1,2})\\s*(?:de|-|\\/)?\\s*(${monthNames})\\s*(?:de|-|\\/)?\\s*(\\d{2,4})\\b`, 'i'),
      // Spaced numeric: 12 / 05 / 2025
      /\b(\d{1,2})\s*[\-\/]\s*(\d{1,2})\s*[\-\/]\s*(\d{4})\b/
    ];

    for (const pattern of fechaPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match.length === 4) {
          // It's a split date (day, month, year)
          data.fecha = `${match[1]}/${match[2]}/${match[3]}`;
        } else {
          data.fecha = match[1];
        }
        data.fechaConfidence = 'alta';
        break;
      }
    }

    // 4.1 FECHA VENCIMIENTO
    const vencimientoPatterns = [
      /(?:vencimiento|vto|pagar\s+antes\s+de)[\s:]+(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/i,
      // Text months for due date
      new RegExp(`(?:vencimiento|vto|pagar\\s+antes\\s+de)[\\s:]+(\\d{1,2})\\s*(?:de|-|\\/)?\\s*(${monthNames})\\s*(?:de|-|\\/)?\\s*(\\d{2,4})`, 'i'),
      // Spaced numeric for due date
      /(?:vencimiento|vto|pagar\s+antes\s+de)[\s:]+(\d{1,2})\s*[\-\/]\s*(\d{1,2})\s*[\-\/]\s*(\d{4})/i
    ];

    for (const pattern of vencimientoPatterns) {
      const match = text.match(pattern);
      if (match) {
        if (match.length === 4) {
          data.fechaVencimiento = `${match[1]}/${match[2]}/${match[3]}`;
        } else {
          data.fechaVencimiento = match[1];
        }
        break;
      }
    }

    // 4.2 DATOS DE CONTACTO (Email, Teléfono, Dirección)
    // Email
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    if (emailMatch) {
      data.email = emailMatch[1];
    }

    // Teléfono (Spanish format mostly)
    const phoneMatch = text.match(/(?:tel|tfno|m[oó]vil)[\s.:]*(\+34\s?)?(\d{3}[\s.-]?\d{2,3}[\s.-]?\d{2,3})/i);
    if (phoneMatch) {
      data.telefono = (phoneMatch[1] || '') + phoneMatch[2];
    } else {
      // Fallback: look for 9 digits starting with 6,7,8,9 isolated
      const simplePhone = text.match(/\b([6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/);
      if (simplePhone) data.telefono = simplePhone[1];
    }

    // Dirección (Heuristic: Look for C/ or Calle or Avda followed by text and a zip code)
    // Refinar extracción de dirección fiscal: buscar en las primeras líneas y evitar cliente
    const addressPatterns = [
      /((?:Carrer|Calle|C\/|Avda|Avenida|Plaza|Paseo|Via|Pol[ií]gono|P\.I\.|Ronda|Rambla|Camino|Urbanización|Pg\.|Pl\.|Travesía|Trv\.)[\s\w'\.\-]+\d{1,4}[\s,\w'\.\-]*\(\d{5}\)[\s,\w'\.\-]*)/i,
      /((?:Carrer|Calle|C\/|Avda|Avenida|Plaza|Paseo|Via|Pol[ií]gono|P\.I\.|Ronda|Rambla|Camino|Urbanización|Pg\.|Pl\.|Travesía|Trv\.)[\s\w'\.\-]+\d{1,4}[\s,\w'\.\-]*\d{5}[\s,\w'\.\-]*)/i,
      /Direcci[oó]n:\s*([\wÀ-ÿ'\.\-\s,]+\d{1,4}[\s,\w'\.\-]*\d{5}[\s,\w'\.\-]*)/i,
      // Fallback: just look for a zip code and assume the line is an address if it has street keywords
      /([^\n]*\d{5}[^\n]*)/
    ];
    // (Eliminada variable direccionFiscal, no se usa)
    const clientKeywords = /cliente|destinatario|gallitos|env[ií]o|entrega|ship|to:/i;
    // Usar solo las primeras 20 líneas
    const addressSearchLines = lines.slice(0, 20);
    // Si se detectó proveedor, buscar dirección cerca de esa línea
    let providerLineIdx = -1;
    if (typeof data.proveedor === 'string' && data.proveedor.length > 0) {
      providerLineIdx = addressSearchLines.findIndex(l => typeof l === 'string' && l.includes(data.proveedor as string));
    }
    let foundAddress = '';
    // Buscar primero cerca del proveedor
    if (providerLineIdx >= 0) {
      for (let offset = 0; offset <= 5; offset++) { // Look forward from provider
        const idx = providerLineIdx + offset;
        if (idx >= 0 && idx < addressSearchLines.length) {
          const line = addressSearchLines[idx];
          if (clientKeywords.test(line)) continue;

          // Check if line looks like an address
          const isAddressLike = /(Carrer|Calle|C\/|Avda|Avenida|Plaza|Paseo|Via|Pol[ií]gono|P\.I\.|Ronda|Rambla|Camino|Urbanización|Pg\.|Pl\.|Travesía|Trv\.|08\d{3}|\d{5})/i.test(line);

          if (isAddressLike && !/(FACTURA|TOTAL|IVA|SUBTOTAL|ARAZ)/i.test(line)) {
            // If it has a zip code, it's a strong candidate
            if (/\d{5}/.test(line)) {
              foundAddress = line.trim();
              // Try to append next line if it looks like city/country
              if (idx + 1 < addressSearchLines.length) {
                const nextLine = addressSearchLines[idx + 1];
                if (/(Barcelona|Madrid|España|Spain)/i.test(nextLine)) {
                  foundAddress += ", " + nextLine.trim();
                }
              }
              // Try to prepend previous line if it looks like street
              if (idx - 1 >= 0) {
                const prevLine = addressSearchLines[idx - 1];
                if (/(Carrer|Calle|C\/|Avda|Avenida|Plaza|Paseo|Via)/i.test(prevLine)) {
                  foundAddress = prevLine.trim() + ", " + foundAddress;
                }
              }
              break;
            }
            // If it has street prefix but NO zip code, check next line for zip code
            if (/(Carrer|Calle|C\/|Avda|Avenida|Plaza|Paseo|Via)/i.test(line) && !/\d{5}/.test(line)) {
              if (idx + 1 < addressSearchLines.length) {
                const nextLine = addressSearchLines[idx + 1];
                if (/\d{5}/.test(nextLine)) {
                  foundAddress = line.trim() + ", " + nextLine.trim();
                  // Check one more line for city/country
                  if (idx + 2 < addressSearchLines.length) {
                    const nextNextLine = addressSearchLines[idx + 2];
                    if (/(Barcelona|Madrid|España|Spain)/i.test(nextNextLine)) {
                      foundAddress += ", " + nextNextLine.trim();
                    }
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Si no se encontró cerca del proveedor, buscar en las primeras líneas excluyendo cliente
    if (!foundAddress) {
      for (let i = 0; i < addressSearchLines.length; i++) {
        const line = addressSearchLines[i];
        if (clientKeywords.test(line)) continue;

        // Check for multi-line address pattern: Street line followed by Zip line
        if (/(Carrer|Calle|C\/|Avda|Avenida|Plaza|Paseo|Via)/i.test(line) && !/\d{5}/.test(line)) {
          if (i + 1 < addressSearchLines.length) {
            const nextLine = addressSearchLines[i + 1];
            if (/\d{5}/.test(nextLine)) {
              foundAddress = line.trim() + ", " + nextLine.trim();
              break;
            }
          }
        }

        for (const pattern of addressPatterns) {
          const match = line.match(pattern);
          if (match) {
            // Check if it's not just a zip code but has some text
            if (match[0].length > 10) {
              foundAddress = match[0].replace(/\s+/g, ' ').trim();
              break;
            }
          }
        }
        if (foundAddress) break;
      }
    }
    // Validar que no contiene palabras irrelevantes
    if (foundAddress && !/(FACTURA|TOTAL|IVA|SUBTOTAL|ARAZ)/i.test(foundAddress)) {
      data.direccion = foundAddress;
    }      // 4.3 DATOS DE PAGO (IBAN, Método)
    // IBAN - aceptar formato español: ES + 22 dígitos, permitiendo espacios
    const ibanRegex = /ES\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/i;
    const ibanMatch = text.match(ibanRegex);
    if (ibanMatch) {
      const candidate = ibanMatch[0].replace(/\s+/g, '');
      if (!/(TOTAL|FACTURA|ARAZ|SUBTOTAL)/i.test(candidate)) {
        data.iban = ibanMatch[0]; // Mantener formato con espacios para visualización
      }
    }

    // Método de Pago y condiciones
    const metodoPagoMatch = text.match(/Método:\s*([^\n]+)/i);
    if (metodoPagoMatch) {
      data.formaPago = metodoPagoMatch[1].trim();
    } else {
      if (/transferencia/i.test(text)) data.formaPago = 'Transferencia';
      else if (/tarjeta|visa|mastercard/i.test(text)) data.formaPago = 'Tarjeta';
      else if (/efectivo|contado/i.test(text)) data.formaPago = 'Efectivo';
      else if (/domicilia/i.test(text)) data.formaPago = 'Domiciliación';
    }
    // Instrucciones de pago
    const instruccionesMatch = text.match(/Instrucciones:\s*([^\n]+)/i);
    if (instruccionesMatch) {
      data.condicionesPago = instruccionesMatch[1].trim();
    } else {
      // Fallback: condiciones de pago
      const condicionesMatch = text.match(/(?:condiciones|forma)\s+de\s+pago[\s:]+([^\n]+)/i);
      if (condicionesMatch) {
        data.condicionesPago = condicionesMatch[1].trim();
      }
    }

    // 4.4 TIPO DE IVA (%)
    // Look for explicit percentages like "21%", "10%", "4%"
    // Prioritize those near "IVA"
    const validRates = [21, 10, 4];
    const ivaRateMatch = text.match(/IVA.*?(\d{1,2})[\s]*%/i);

    if (ivaRateMatch) {
      const rate = parseInt(ivaRateMatch[1]);
      if (validRates.includes(rate)) {
        data.tipoIva = rate;
      }
    }

    if (!data.tipoIva) {
      // Fallback: just look for the percentage anywhere
      // We use a global regex to find all matches and pick the first valid one
      const allPercentages = text.matchAll(/\b(\d{1,2})[\s]*%/g);
      for (const match of allPercentages) {
        const rate = parseInt(match[1]);
        if (validRates.includes(rate)) {
          data.tipoIva = rate;
          break;
        }
      }
    }

    // 5. TOTALES
    const findAmount = (labels: string[]): number | undefined => {
      const labelPart = labels.join('|');
      // Allow up to 30 chars between label and amount (e.g. "IVA 21% ... 100.00")
      const regex = new RegExp(`(?:${labelPart}).{0,30}?(\\d{1,3}(?:[.,]\\d{3})*[.,]\\d{2})`, 'gi');

      let bestMatch: number | undefined;
      let match;

      while ((match = regex.exec(text)) !== null) {
        let numStr = match[1];
        if (numStr.includes(',') && numStr.includes('.')) {
          numStr = numStr.replace(/\./g, '').replace(',', '.');
        } else if (numStr.includes(',')) {
          numStr = numStr.replace(',', '.');
        }

        const val = parseFloat(numStr);
        if (!isNaN(val)) {
          bestMatch = val;
        }
      }
      return bestMatch;
    };

    data.baseImponible = findAmount(['base\\s*imponible', 'base', 'subtotal', 'neto', 'bi']);
    data.iva = findAmount(['iva', 'cuota', 'impuestos']);
    data.total = findAmount(['total', 'importe\\s*total', 'a\\s*pagar', 'suma']);

    // Heuristic: If Total is missing but Base and IVA exist, sum them
    if (!data.total && data.baseImponible && data.iva) {
      data.total = parseFloat((data.baseImponible + data.iva).toFixed(2));
      data.totalConfidence = 'media';
    }

    if (data.baseImponible) data.baseConfidence = 'alta';
    if (data.iva) data.ivaConfidence = 'media';
    if (data.total) data.totalConfidence = 'alta';

    // 6. CATEGORÍA (based on tipo)
    if (tipo === 'factura') {
      data.categoria = 'Compras';
    } else if (tipo === 'albaran') {
      data.categoria = 'Albarán';
    }

    return data;
  }

  /**
   * Get confidence badge color
   */
  static getConfidenceBadge(level: ConfidenceLevel): { color: string; label: string } {
    switch (level) {
      case 'alta':
        return { color: '#27ae60', label: 'Alta Confianza' };
      case 'media':
        return { color: '#f39c12', label: 'Media Confianza' };
      case 'baja':
        return { color: '#e74c3c', label: 'Baja Confianza' };
    }
  }

  /**
   * Render first page of PDF to image (base64 jpeg) for storage
   */
  static async renderPDFToImage(file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // Get original dimensions
    const originalViewport = page.getViewport({ scale: 1 });

    // Calculate scale to fit maxWidth
    const scale = Math.min(1, maxWidth / originalViewport.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) throw new Error("Canvas context not available");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    return canvas.toDataURL('image/jpeg', quality);
  }
}
