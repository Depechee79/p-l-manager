export type OCRDocumentType = 'factura' | 'ticket' | 'albaran' | 'cierre';

export type ConfidenceLevel = 'alta' | 'media' | 'baja';

export interface OCRResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

export interface PDFZone {
  topLeft: Array<{ text: string; x: number; y: number }>;
  topRight: Array<{ text: string; x: number; y: number }>;
  center: Array<{ text: string; x: number; y: number }>;
  bottom: Array<{ text: string; x: number; y: number }>;
}

export interface ExtractedData {
    conceptos?: Array<{
      concepto: string;
      precioUnit: number;
      unidades: number;
      iva: number;
      subtotal: number;
      total: number;
    }>;
  proveedor?: string;
  proveedorConfidence?: ConfidenceLevel;
  cif?: string;
  cifConfidence?: ConfidenceLevel;
  numero?: string;
  numeroConfidence?: ConfidenceLevel;
  fecha?: string;
  fechaConfidence?: ConfidenceLevel;
  baseImponible?: number;
  baseConfidence?: ConfidenceLevel;
  iva?: number;
  ivaConfidence?: ConfidenceLevel;
  tipoIva?: number; // Porcentaje de IVA (e.g. 21)
  total?: number;
  totalConfidence?: ConfidenceLevel;
  categoria?: string;
  
  // Extended fields
  fechaVencimiento?: string;
  direccion?: string;
  email?: string;
  telefono?: string;
  iban?: string;
  formaPago?: string;
  condicionesPago?: string;
  
  // Ticket specific
  matricula?: string;
  litros?: number;
  precioLitro?: number;
  
  // Albaran specific
  fechaEntrega?: string;
  observaciones?: string;
}

export interface OCRDocument {
  id: string;
  tipo: OCRDocumentType;
  fileName: string;
  fileUrl?: string;
  uploadedAt: string;
  extractedData: ExtractedData;
  rawText?: string;
  processed: boolean;
}

export interface OCRFormData {
  tipo: OCRDocumentType;
  proveedor: string;
  cif: string;
  numero: string;
  fecha: string;
  categoria: string;
  baseImponible: number;
  iva: number;
  total: number;
}
