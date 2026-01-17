/**
 * OCR Configuration - Centralized settings for Tesseract OCR
 * 
 * Modify these settings to tune OCR accuracy for different document types.
 * 
 * @example
 * import { OCR_CONFIG } from '@/shared/config/ocr.config';
 */

// =============================================================================
// TESSERACT CONFIGURATION
// =============================================================================

/**
 * Languages to load for OCR recognition
 * Order matters: primary language first
 */
export const OCR_LANGUAGES = 'spa+cat+eng';

/**
 * Page segmentation modes (tessedit_pageseg_mode)
 * 0 = OSD only
 * 1 = Automatic with OSD
 * 3 = Fully automatic (recommended for invoices)
 * 4 = Single column
 * 6 = Single uniform block
 * 11 = Sparse text
 */
export const OCR_PAGE_SEG_MODE = 3;

/**
 * Character whitelist for OCR
 * Limits recognized characters to improve accuracy
 */
export const OCR_CHAR_WHITELIST =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚáéíóúÑñÜü' +
    '0123456789.,:;€$%-/()@#&*+= ';

// =============================================================================
// IMAGE PREPROCESSING
// =============================================================================

/**
 * Contrast multiplier for preprocessing (1.0 = no change)
 * Higher values = more contrast, helps with low-quality scans
 */
export const OCR_CONTRAST = 1.2;

/**
 * PDF rendering scale for OCR
 * Higher = better quality but slower
 */
export const OCR_PDF_SCALE = 2.0;

/**
 * Minimum text length threshold for PDF text layer
 * Below this, PDF is treated as scanned and OCR is applied
 */
export const OCR_PDF_TEXT_THRESHOLD = 50;

// =============================================================================
// EXTRACTION PATTERNS
// =============================================================================

/**
 * Common provider suffixes for company name extraction
 */
export const PROVIDER_SUFFIXES = [
    'S.L.', 'S.L', 'SL',
    'S.A.', 'S.A', 'SA',
    'S.L.U.', 'S.L.U', 'SLU',
    'S.COOP.', 'SCOOP', 'S.Coop',
];

/**
 * CIF/NIF patterns (Spanish tax ID)
 */
export const CIF_PATTERNS = [
    /(?:CIF|NIF|C\.I\.F|N\.I\.F)[:\s]*([A-Z]\d{8})/i,
    /(?:CIF|NIF)[:\s]*(\d{8}[A-Z])/i,
    /\b([A-Z]\d{7}[A-Z0-9])\b/, // Corporate CIF
    /\b(\d{8}[A-Z])\b/, // Personal NIF
];

/**
 * Invoice number patterns
 */
export const INVOICE_PATTERNS = [
    /(?:N[úu]mero|N[°º]|Factura|Fra|F[-.\/])?[\s:]*(?:FA|FV|FR|F)?[-\/\s]?(\d{4,10}[-\/]?\d*)/i,
    /(?:Albar[aá]n|Alb|A[-.\/])[\s:]*(\d{4,10}[-\/]?\d*)/i,
    /\b(FA\d{6,})\b/i,
    /\b(F-\d{4,})\b/i,
];

/**
 * Date patterns (DD/MM/YYYY, DD-MM-YYYY, etc.)
 */
export const DATE_PATTERNS = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/, // ISO format
];

/**
 * Total amount patterns
 */
export const TOTAL_PATTERNS = [
    /(?:TOTAL|IMPORTE TOTAL|TOTAL FACTURA)[:\s]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*€?/i,
    /(?:BASE\s*IMPONIBLE)[:\s]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i,
    /(?:IVA\s*INCLUIDO)[:\s]*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i,
];

// =============================================================================
// CONFIDENCE THRESHOLDS
// =============================================================================

/**
 * Confidence levels for extracted data
 */
export const CONFIDENCE_THRESHOLDS = {
    HIGH: 85,    // High confidence - auto-accept
    MEDIUM: 60,  // Medium - review recommended  
    LOW: 40,     // Low - manual verification needed
};

// =============================================================================
// EXPORT AGGREGATED CONFIG
// =============================================================================

export const OCR_CONFIG = {
    languages: OCR_LANGUAGES,
    pageSegMode: OCR_PAGE_SEG_MODE,
    charWhitelist: OCR_CHAR_WHITELIST,
    contrast: OCR_CONTRAST,
    pdfScale: OCR_PDF_SCALE,
    pdfTextThreshold: OCR_PDF_TEXT_THRESHOLD,
    patterns: {
        providerSuffixes: PROVIDER_SUFFIXES,
        cif: CIF_PATTERNS,
        invoice: INVOICE_PATTERNS,
        date: DATE_PATTERNS,
        total: TOTAL_PATTERNS,
    },
    confidence: CONFIDENCE_THRESHOLDS,
} as const;
