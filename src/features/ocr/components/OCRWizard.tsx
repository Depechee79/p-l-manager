/**
 * OCRWizard - Document Scanning Wizard Component
 * 
 * Manages the multi-step process of scanning, analyzing, reviewing,
 * and saving a document.
 * 
 * Steps:
 * 1. Type Selection
 * 2. File Upload
 * 3. AI Analysis (Loading)
 * 4. Data Review
 * 5. Validation & Save
 */
import React, { useState } from 'react';
import {
    FileText,
    Package,
    Coins,
    CheckCircle,
    Receipt,
    Cloud,
    Loader2,
    ArrowRight,
    ArrowLeft,
    X,
    AlertTriangle,
} from 'lucide-react';
import { Button, StepIndicator, Card } from '@shared/components';

import { compressImage, fileToBase64 } from '@utils/imageUtils';
import { OCRService } from '@services/ocr-service';
import { useDatabase } from '@hooks';
import { useToast } from '@utils/toast';
import { logger } from '@core/services/LoggerService';
import type { OCRDocumentType, ExtractedData } from '../../../types/ocr.types';
import type { Provider } from '../../../types';
import { InvoiceLayout } from './InvoiceLayout';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface OCRWizardProps {
    /** Callback to close the wizard without saving */
    onClose: () => void;
    /** Callback after successful save */
    onSaveSuccess: () => void;
    /** Initial data for edit mode */
    initialData?: ExtractedData;
    /** Initial step (defaults to 1) */
    initialStep?: WizardStep;
    /** Initial preview URL for edit mode */
    initialPreviewUrl?: string;
    /** Document type if known (for edit mode) */
    initialType?: OCRDocumentType;
}

const wizardSteps = [
    { label: 'Tipo Documento' },
    { label: 'Subir Archivo' },
    { label: 'Analizar' },
    { label: 'Revisar' },
    { label: 'Validar' },
];

export const OCRWizard: React.FC<OCRWizardProps> = ({
    onClose,
    onSaveSuccess,
    initialData,
    initialStep = 1,
    initialPreviewUrl,
    initialType = 'factura'
}) => {
    const { db } = useDatabase();
    const { showToast } = useToast();

    // Wizard State
    const [step, setStep] = useState<WizardStep>(initialStep);
    const [scanType, setScanType] = useState<OCRDocumentType>(initialType);
    const [file, setFile] = useState<File | null>(null);
    const [compressedFile, setCompressedFile] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
    const [progress, setProgress] = useState(0);
    const [formData, setFormData] = useState<ExtractedData>(initialData || {});
    const [validationStatus, setValidationStatus] = useState<{
        newProvider?: boolean;
        duplicateInvoice?: boolean;
        existingProvider?: Provider;
        duplicateId?: string | number;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- ACTIONS ---

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        if (selectedFile.type.startsWith('image/') || selectedFile.type === 'application/pdf') {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }

        try {
            let base64 = '';
            if (selectedFile.type.startsWith('image/')) {
                base64 = await compressImage(selectedFile);
            } else {
                base64 = await fileToBase64(selectedFile);
            }
            setCompressedFile(base64);
        } catch (error: unknown) {
            logger.error("Error compressing file", error instanceof Error ? error.message : String(error));
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setStep(3);
        setProgress(0);
        setError(null);

        try {
            let text = '';
            let zones = null;

            if (file.type === 'application/pdf') {
                const pdfResult = await OCRService.extractPDFText(file);
                text = pdfResult.text;
                zones = pdfResult.zones;
            } else {
                const ocrResult = await OCRService.processImage(file, setProgress);
                text = ocrResult.text;
            }

            const data = OCRService.parseOCRText(text, scanType, zones);

            const convertDate = (dateStr?: string) => {
                if (!dateStr) return '';
                const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                if (match) {
                    const [, d, m, y] = match;
                    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                return dateStr;
            };

            setFormData({
                ...data,
                fecha: convertDate(data.fecha),
                fechaVencimiento: convertDate(data.fechaVencimiento)
            });
            setStep(4);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Error al analizar documento', message);
            setError('Error al analizar: ' + message);
            setStep(2);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['baseImponible', 'iva', 'total', 'tipoIva'].includes(name) ? parseFloat(value) : value
        }));
    };

    const validateData = () => {
        const providerName = formData.proveedor?.toLowerCase().trim();
        const existingProvider = (db.proveedores as Provider[]).find((p: Provider) =>
            (p.nombre.toLowerCase().includes(providerName || '___')) ||
            (formData.cif && typeof p.cif === 'string' && p.cif === formData.cif)
        );

        let duplicate = false;
        let duplicateId: string | number | undefined;
        if (scanType === 'factura' && formData.numero) {
            const found = db.facturas.find(f =>
                f.numero === formData.numero &&
                (existingProvider ? f.proveedorId === existingProvider.id : false)
            );
            if (found) {
                duplicate = true;
                duplicateId = found.id;
            }
        }

        setValidationStatus({
            newProvider: !existingProvider && !!formData.proveedor,
            existingProvider,
            duplicateInvoice: duplicate,
            duplicateId
        });

        setStep(5);
    };

    const handleFinalSave = async () => {
        try {
            const collectionName = scanType === 'factura' ? 'facturas' :
                scanType === 'albaran' ? 'albaranes' : 'cierres';

            let finalFileData = compressedFile;
            if (!finalFileData && file) {
                if (file.type.startsWith('image/')) {
                    finalFileData = await compressImage(file);
                } else if (file.type === 'application/pdf') {
                    finalFileData = await OCRService.renderPDFToImage(file);
                } else {
                    finalFileData = await fileToBase64(file);
                }
            }

            let providerId: number | string = 0;
            if (validationStatus?.newProvider) {
                const newProv = await db.add<Provider>('proveedores', {
                    nombre: formData.proveedor || 'Nuevo Proveedor',
                    cif: formData.cif || '',
                    telefono: formData.telefono || '',
                    email: formData.email || '',
                    direccion: formData.direccion || '',
                    contacto: ''
                }, { silent: true });
                providerId = newProv.id;
            } else if (validationStatus?.existingProvider) {
                providerId = validationStatus.existingProvider.id;
            }

            const newItem: Record<string, unknown> = {
                tipo: scanType,
                numeroFactura: formData.numero || 'S/N',
                proveedor: formData.proveedor || 'Desconocido',
                proveedorId: providerId,
                fecha: formData.fecha || new Date().toISOString().split('T')[0],
                total: formData.total || 0,
                productos: [],
                confianza: 90,
                metodoPago: formData.formaPago || 'Efectivo',
                notas: `Importado OCR. Base: ${formData.baseImponible}`,
                archivo: file?.name || 'Sin nombre',
                archivoData: finalFileData || initialPreviewUrl,
                categoria: formData.categoria,
                baseImponible: formData.baseImponible,
                iva: formData.iva,
                tipoIva: formData.tipoIva,
                cif: formData.cif,
                direccion: formData.direccion || '',
                telefono: formData.telefono || '',
                email: formData.email || '',
                iban: formData.iban,
                condicionesPago: formData.condicionesPago || '',
                formaPago: formData.formaPago || '',
                fechaVencimiento: formData.fechaVencimiento,
                conceptos: formData.conceptos || []
            };

            const collectionTyped = collectionName as 'facturas' | 'albaranes' | 'cierres';

            if (validationStatus?.duplicateInvoice && validationStatus.duplicateId) {
                await db.update(collectionTyped, String(validationStatus.duplicateId), newItem, { silent: true });
            } else {
                await db.add(collectionTyped, newItem, { silent: true });
            }

            onSaveSuccess();
            showToast({
                type: 'success',
                title: 'Documento guardado',
                message: `El ${scanType} ha sido guardado correctamente`,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error('Error al guardar documento', message);
            const errorMsg = 'Error al guardar: ' + message;
            setError(errorMsg);
            showToast({
                type: 'error',
                title: 'Error',
                message: errorMsg,
            });
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{ margin: 0 }}>Escáner Inteligente</h2>
                <Button variant="secondary" onClick={onClose} icon={<X size={18} />}>Cerrar</Button>
            </div>

            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <StepIndicator
                    steps={wizardSteps}
                    currentStep={step}
                />
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'flex-start' }}>
                {/* Preview Panel - Only if file selected or in review/validation */}
                {previewUrl && step >= 2 && (
                    <div style={{
                        flex: '0 0 40%',
                        position: 'sticky',
                        top: 'var(--spacing-lg)',
                        backgroundColor: 'var(--primary)',
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h4 style={{ color: 'var(--surface)', marginTop: 0, marginBottom: '12px', fontSize: '14px' }}>Vista Previa</h4>
                        <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '8px' }}>
                            {previewUrl.startsWith('data:application/pdf') ? (
                                <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />
                            ) : (
                                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            )}
                        </div>
                    </div>
                )}

                {/* Form/Steps Container */}
                <div style={{
                    flex: '1 1 auto',
                    backgroundColor: 'var(--surface)',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: 'var(--shadow)',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: (step === 2 && !file) ? '600px' : '100%',
                    width: '100%',
                    ...(step === 2 && !file
                        ? { marginLeft: 'auto', marginRight: 'auto' }
                        : {})
                }}>

                    {error && (
                        <div style={{ padding: '12px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertTriangle size={16} /> {error}
                            </div>
                        </div>
                    )}

                    {/* STEP 1: TYPE SELECTION */}
                    {step === 1 && (
                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-base)', fontWeight: '600', color: 'var(--text-main)', textAlign: 'center' }}>
                                Selecciona el tipo de documento
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-sm)' }}>
                                {[
                                    { id: 'factura', label: 'Factura', icon: Receipt, color: 'var(--info)', bg: 'var(--info-bg)' },
                                    { id: 'albaran', label: 'Albarán', icon: Package, color: 'var(--warning)', bg: 'var(--warning-bg)' },
                                    { id: 'ticket', label: 'Ticket', icon: FileText, color: 'var(--success)', bg: 'var(--success-bg)' },
                                    { id: 'cierre', label: 'Cierre POS', icon: Coins, color: 'var(--purple)', bg: 'var(--purple-bg)' }
                                ].map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            key={item.id}
                                            onClick={() => { setScanType(item.id as OCRDocumentType); setStep(2); }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    setScanType(item.id as OCRDocumentType);
                                                    setStep(2);
                                                }
                                            }}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                gap: 'var(--spacing-xs)', padding: 'var(--spacing-md) var(--spacing-sm)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                                                backgroundColor: 'var(--surface)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s ease',
                                                width: '100%', minHeight: '80px',
                                                userSelect: 'none'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = item.color;
                                                e.currentTarget.style.backgroundColor = item.bg;
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                e.currentTarget.style.backgroundColor = 'var(--surface)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', backgroundColor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={18} />
                                            </div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '600', color: 'var(--text-main)' }}>{item.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: UPLOAD */}
                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: 'var(--font-size-xl)', fontWeight: '600' }}>
                                {file ? 'Documento Listo' : `Sube tu ${scanType}`}
                            </h3>

                            {!file && (
                                <div style={{
                                    border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-2xl)',
                                    backgroundColor: 'var(--surface-muted)', marginBottom: 'var(--spacing-lg)', transition: 'all 0.2s',
                                }}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
                                    onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const droppedFile = e.dataTransfer.files[0];
                                        if (droppedFile) {
                                            const eventMock = {
                                                target: { files: [droppedFile] }
                                            } as unknown as React.ChangeEvent<HTMLInputElement>;
                                            handleFileSelect(eventMock);
                                        }
                                    }}
                                >
                                    <input type="file" accept="image/*,.pdf" onChange={handleFileSelect} style={{ display: 'none' }} id="file-upload" />
                                    <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--accent)' }}><Cloud size={64} /></div>
                                        <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '18px', marginBottom: '4px' }}>Haz clic para elegir o arrastra</p>
                                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>PDF, JPG, PNG (Máx 10MB)</p>
                                    </label>
                                </div>
                            )}

                            {file && (
                                <Card>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', backgroundColor: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileText size={24} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: 'var(--font-size-md)' }}>{file.name}</div>
                                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                                        </div>
                                        <Button variant="danger" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); setCompressedFile(null); }}>
                                            <X size={16} />
                                        </Button>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                        <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Atrás</Button>
                                        <Button variant="primary" onClick={handleAnalyze}>Analizar Documento <ArrowRight size={16} /></Button>
                                    </div>
                                </Card>
                            )}

                            {!file && (
                                <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                    <Button variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={16} /> Atrás</Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: ANALYZING */}
                    {step === 3 && (
                        <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 0' }}>
                            <div style={{ marginBottom: '24px', animation: 'spin 1s infinite linear', color: 'var(--primary)' }}><Loader2 size={48} /></div>
                            <h3>Analizando documento...</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>Extrayendo datos con IA ({progress}%)</p>
                        </div>
                    )}

                    {/* STEP 4: REVIEW */}
                    {step === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Revisión de Datos</h3>
                                <span className="badge badge-success" style={{ padding: '6px 12px' }}>IA Confianza: 90%</span>
                            </div>
                            <div style={{ flex: 1, marginBottom: 'var(--spacing-lg)' }}>
                                <InvoiceLayout data={formData} onChange={handleInputChange} isEditable={true} type={scanType} />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'space-between' }}>
                                <Button variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={16} /> Atrás</Button>
                                <Button variant="primary" onClick={validateData} style={{ flex: 1, maxWidth: '250px' }}>
                                    <CheckCircle size={16} /> Validar y Guardar <ArrowRight size={16} />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: VALIDATION */}
                    {step === 5 && validationStatus && (
                        <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
                            {validationStatus.duplicateInvoice ? (
                                <Card>
                                    <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--warning)' }}><AlertTriangle size={48} /></div>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Factura Duplicada</h3>
                                    <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                                        Ya existe una factura nro <strong>{formData.numero}</strong> para este proveedor.
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
                                        <Button variant="secondary" onClick={() => setStep(4)}><ArrowLeft size={16} /> Volver</Button>
                                        <Button variant="danger" onClick={handleFinalSave}>Sustituir <ArrowRight size={16} /></Button>
                                    </div>
                                </Card>
                            ) : validationStatus.newProvider ? (
                                <Card>
                                    <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--info)', fontSize: '48px' }}>🆕</div>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Nuevo Proveedor</h3>
                                    <p style={{ marginBottom: 'var(--spacing-1)' }}>El proveedor <strong>{formData.proveedor}</strong> es nuevo.</p>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginBottom: 'var(--spacing-lg)' }}>Se creará una ficha automáticamente.</p>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
                                        <Button variant="secondary" onClick={() => setStep(4)}><ArrowLeft size={16} /> Volver</Button>
                                        <Button variant="primary" onClick={handleFinalSave}><CheckCircle size={16} /> Confirmar <ArrowRight size={16} /></Button>
                                    </div>
                                </Card>
                            ) : (
                                <Card>
                                    <div style={{ marginBottom: 'var(--spacing-md)', color: 'var(--success)' }}><CheckCircle size={48} /></div>
                                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Validación Correcta</h3>
                                    <p style={{ marginBottom: 'var(--spacing-1)' }}>Proveedor: <strong>{validationStatus.existingProvider?.nombre}</strong></p>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-light)', marginBottom: 'var(--spacing-lg)' }}>Todos los datos parecen correctos.</p>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
                                        <Button variant="secondary" onClick={() => setStep(4)}><ArrowLeft size={16} /> Volver</Button>
                                        <Button variant="primary" onClick={handleFinalSave}><CheckCircle size={16} /> Guadar Todo <ArrowRight size={16} /></Button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
