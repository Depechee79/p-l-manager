/**
 * InvoiceLayout - Invoice/Document Display Component
 * 
 * Renders a professional invoice/document layout with editable fields.
 * Used in OCR wizard to display and edit extracted data.
 * 
 * @example
 * <InvoiceLayout 
 *   data={extractedData} 
 *   type="factura" 
 *   isEditable 
 *   onChange={handleChange} 
 * />
 */
import React from 'react';
import { Input, Table } from '@shared/components';
import { formatDate, formatCurrency } from '@utils/formatters';
import type { OCRDocumentType, ExtractedData } from '../../../types/ocr.types';

export interface InvoiceLayoutProps {
    data: ExtractedData;
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isEditable?: boolean;
    type: OCRDocumentType;
}

export const InvoiceLayout: React.FC<InvoiceLayoutProps> = ({
    data,
    onChange,
    isEditable = false,
    type
}) => {
    // Renderizar tabla de conceptos si existe
    const renderConceptosTable = () => {
        if (!data.conceptos || data.conceptos.length === 0) return null;
        return (
            <div style={{ marginBottom: '40px' }}>
                <Table
                    data={data.conceptos}
                    columns={[
                        {
                            key: 'concepto',
                            header: 'Concepto',
                            render: (_, c) => (
                                <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{c.concepto}</span>
                            ),
                        },
                        {
                            key: 'precioUnit',
                            header: 'Precio Unit.',
                            render: (_, c) => (
                                <span style={{ textAlign: 'right', display: 'block' }}>{formatCurrency(c.precioUnit)}</span>
                            ),
                        },
                        {
                            key: 'unidades',
                            header: 'Unidades',
                            render: (_, c) => (
                                <span style={{ textAlign: 'right', display: 'block' }}>{c.unidades}</span>
                            ),
                        },
                        {
                            key: 'iva',
                            header: 'IVA',
                            render: (_, c) => (
                                <span style={{ textAlign: 'right', display: 'block' }}>{c.iva}%</span>
                            ),
                        },
                        {
                            key: 'subtotal',
                            header: 'Subtotal',
                            render: (_, c) => (
                                <span style={{ textAlign: 'right', display: 'block' }}>{formatCurrency(c.subtotal)}</span>
                            ),
                        },
                        {
                            key: 'total',
                            header: 'Total',
                            render: (_, c) => (
                                <span style={{ textAlign: 'right', display: 'block', fontWeight: '600' }}>{formatCurrency(c.total)}</span>
                            ),
                        },
                    ]}
                    striped
                    emptyText="No hay conceptos"
                />
            </div>
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (onChange) onChange(e);
    };

    const Field = ({ label, name, type = "text", fullWidth = false, style = {} }: any) => {
        if (name === 'conceptos') return null;
        let value = data[name as keyof ExtractedData];
        // Never pass array to Input value
        if (Array.isArray(value)) value = '';
        if (isEditable) {
            return <Input label={label} name={name} type={type} value={value || ''} onChange={handleChange} fullWidth={fullWidth} style={style} />;
        }
        let displayValue = value;
        if (type === 'date') {
            displayValue = formatDate(displayValue as string);
        } else if (type === 'number' && (name === 'total' || name === 'baseImponible' || name === 'iva')) {
            displayValue = formatCurrency(displayValue as number);
        }
        // Never render array directly
        if (Array.isArray(displayValue)) displayValue = '';
        return (
            <div style={{ marginBottom: '8px', ...style }}>
                <div style={{ fontSize: '10px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)', minHeight: '20px' }}>
                    {displayValue || '-'}
                </div>
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: 'var(--surface)', padding: 'var(--spacing-3xl)', borderRadius: 'var(--radius)', boxShadow: isEditable ? 'none' : 'var(--shadow)', border: isEditable ? 'none' : '1px solid var(--border)', height: '100%', overflowY: 'auto' }}>

            {/* HEADER: LOGO & INVOICE INFO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2xl)', borderBottom: '2px solid var(--surface-muted)', paddingBottom: 'var(--spacing-xl)' }}>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 var(--spacing-sm) 0', color: 'var(--info)', fontSize: 'var(--font-size-2xl)', fontWeight: '800', letterSpacing: '-0.5px' }}>{type.toUpperCase()}</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {data.proveedor || 'Proveedor Desconocido'}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2xl)', alignItems: 'center' }}>
                        <Field label="Número" name="numero" style={{ textAlign: 'right' }} />
                        <Field label="Fecha Emisión" name="fecha" type="date" style={{ textAlign: 'right' }} />
                    </div>
                </div>
            </div>

            {/* ADDRESSES ROW */}
            <div style={{ display: 'flex', gap: 'var(--spacing-3xl)', marginBottom: 'var(--spacing-3xl)' }}>
                {/* LEFT: PROVIDER */}
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Proveedor</h4>
                    <div style={{ padding: '20px', backgroundColor: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Field label="Razón Social" name="proveedor" fullWidth />
                            <Field label="CIF / NIF" name="cif" fullWidth />
                            <Field label="Teléfono" name="telefono" fullWidth />
                            <Field label="Dirección Fiscal" name="direccion" fullWidth />
                        </div>
                    </div>
                </div>

                {/* RIGHT: CLIENT (MY COMPANY) */}
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Datos del Receptor</h4>
                    <div style={{ padding: '20px', backgroundColor: 'var(--surface-muted)', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                        <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>Mi Empresa S.L.</strong>
                        <div style={{ lineHeight: '1.6' }}>
                            C/ Ejemplo, 123<br />
                            08000 Barcelona<br />
                            B-12345678
                        </div>
                    </div>
                </div>
            </div>

            {/* BODY: CONCEPTS */}
            {renderConceptosTable()}

            {/* FOOTER: PAYMENT & TOTALS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '24px', paddingTop: '24px', borderTop: '2px solid var(--surface-muted)' }}>
                <div style={{ flex: 1, maxWidth: '350px' }}>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Información de Pago</h4>
                    <div style={{ display: 'grid', gap: '12px' }}>
                        <Field label="Método de Pago" name="formaPago" />
                        <Field label="IBAN / Cuenta Bancaria" name="iban" fullWidth />
                        <Field label="Fecha Vencimiento" name="fechaVencimiento" type="date" />
                        <Field label="Condiciones / Instrucciones de Pago" name="condicionesPago" fullWidth />
                    </div>
                </div>

                <div style={{ width: '300px', backgroundColor: 'var(--surface-muted)', padding: '24px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Base Imponible</span>
                        {isEditable ? (
                            <Input name="baseImponible" type="number" value={data.baseImponible || ''} onChange={handleChange} style={{ width: '100px', textAlign: 'right' }} />
                        ) : (
                            <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{formatCurrency(data.baseImponible)}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>% IVA</span>
                        {isEditable ? (
                            <Input name="tipoIva" type="number" value={data.tipoIva || ''} onChange={handleChange} style={{ width: '100px', textAlign: 'right' }} placeholder="%" />
                        ) : (
                            <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{data.tipoIva ? data.tipoIva + '%' : '-'}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>IVA</span>
                        {isEditable ? (
                            <Input name="iva" type="number" value={data.iva || ''} onChange={handleChange} style={{ width: '100px', textAlign: 'right' }} />
                        ) : (
                            <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{formatCurrency(data.iva)}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>TOTAL FACTURA</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--info)' }}>
                            {isEditable ? (
                                <Input name="total" type="number" value={data.total || ''} onChange={handleChange} style={{ width: '120px', textAlign: 'right', fontSize: '20px', fontWeight: 'bold' }} />
                            ) : (
                                formatCurrency(data.total)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
