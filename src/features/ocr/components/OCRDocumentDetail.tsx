/**
 * OCRDocumentDetail - Document Detail View Component
 * 
 * Displays the details of a single OCR document, with a toggleable
 * preview of the original file and an invoice-like layout.
 * 
 * @example
 * <OCRDocumentDetail 
 *   document={selectedDoc}
 *   showPreview={showPreview}
 *   onTogglePreview={() => setShowPreview(!showPreview)}
 *   onBack={() => setViewMode('list')}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 */
import React from 'react';
import {
    FileText,
    Eye,
    Trash2,
    Pencil,
    EyeOff,
} from 'lucide-react';
import { Button } from '@shared/components';
import type { OCRDocumentType, ExtractedData } from '../../../types/ocr.types';
import { InvoiceLayout } from './InvoiceLayout';

export interface OCRDocument {
    id: string | number;
    type: string;
    archivo?: string;
    archivoData?: string;
    numeroFactura?: string;
    numero?: string;
    fecha?: string;
    displayDate?: string;
    total?: number;
    displayAmount?: number;
    direccion?: string;
    conceptos?: ExtractedData['conceptos'];
    telefono?: string;
    email?: string;
    formaPago?: string;
    condicionesPago?: string;
    tipoIva?: number;
}

export interface OCRDocumentDetailProps {
    /** The document to display */
    document: OCRDocument;
    /** Whether to show the file preview */
    showPreview: boolean;
    /** Callback to toggle preview visibility */
    onTogglePreview: () => void;
    /** Callback to return to the list */
    onBack: () => void;
    /** Callback to enter edit mode */
    onEdit: (docData: ExtractedData) => void;
    /** Callback to delete the document */
    onDelete: (id: string | number, type: string) => void;
}

export const OCRDocumentDetail: React.FC<OCRDocumentDetailProps> = ({
    document,
    showPreview,
    onTogglePreview,
    onBack,
    onEdit,
    onDelete,
}) => {
    // Map internal document structure to ExtractedData for InvoiceLayout
    const docData: ExtractedData = {
        ...document,
        numero: document.numeroFactura || document.numero,
        fecha: document.fecha || document.displayDate,
        total: document.total || document.displayAmount,
        direccion: document.direccion || '',
        conceptos: document.conceptos || [],
        telefono: document.telefono || '',
        email: document.email || '',
        formaPago: document.formaPago || '',
        condicionesPago: document.condicionesPago || '',
        tipoIva: document.tipoIva || undefined
    };

    return (
        <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1600px', margin: '0 auto', height: 'calc(100vh - var(--spacing-md))', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <Button variant="secondary" onClick={onBack}>
                        ← Volver a la lista
                    </Button>
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={onTogglePreview}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onTogglePreview(); }}
                        title={showPreview ? "Ocultar documento" : "Ver documento"}
                        style={{
                            background: 'none',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            padding: 'var(--spacing-xs) var(--spacing-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: '500',
                            backgroundColor: showPreview ? 'var(--info-bg)' : 'var(--surface)',
                            borderColor: showPreview ? 'var(--info-border)' : 'var(--border)',
                            color: showPreview ? 'var(--info)' : 'var(--text-secondary)',
                            transition: 'all 0.2s',
                            userSelect: 'none'
                        }}
                    >
                        <span>{showPreview ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                        {showPreview ? 'Ocultar Documento' : 'Ver Documento'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <Button variant="secondary" onClick={() => onEdit(docData)}>
                        <Pencil size={14} /> Editar
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(document.id, document.type)}>
                        <Trash2 size={14} /> Eliminar
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {/* LEFT: PREVIEW */}
                {showPreview && (
                    <div style={{
                        flex: '1 1 50%',
                        backgroundColor: 'var(--primary)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: 'var(--shadow)'
                    }}>
                        {document.archivoData ? (
                            document.archivoData.startsWith('data:application/pdf') ? (
                                <iframe src={document.archivoData} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                            ) : (
                                <img src={document.archivoData} alt="Documento" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            )
                        ) : (
                            <div style={{ textAlign: 'center', color: 'var(--surface)' }}>
                                <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--surface)' }}><FileText size={48} /></div>
                                <p>Vista previa no disponible</p>
                                <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7 }}>{document.archivo || 'Sin archivo adjunto'}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: INVOICE LAYOUT */}
                <div style={{ flex: showPreview ? '1 1 50%' : '1 1 100%', overflowY: 'auto', paddingRight: '4px', transition: 'flex 0.3s ease' }}>
                    <InvoiceLayout
                        data={docData}
                        type={document.type.toLowerCase() as OCRDocumentType}
                        isEditable={false}
                    />
                </div>
            </div>
        </div>
    );
};
