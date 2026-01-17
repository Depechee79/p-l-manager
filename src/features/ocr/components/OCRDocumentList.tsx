/**
 * OCRDocumentList - Document List Component
 * 
 * Displays a list of OCR-scanned documents with filtering and search.
 * Supports both desktop table view and mobile card view.
 * 
 * @example
 * <OCRDocumentList 
 *   documents={filteredDocs}
 *   onNewDocument={startWizard}
 *   onViewDocument={handleView}
 *   onDeleteDocument={handleDelete}
 * />
 */
import React from 'react';
import {
    FileText,
    Package,
    Coins,
    Eye,
    Trash2,
    CheckCircle,
    Receipt,
    Search,
} from 'lucide-react';
import { Button, Input, Select, Table } from '@shared/components';
import { formatDate, formatCurrency } from '@utils/formatters';

export interface OCRDocument {
    id: string | number;
    type: 'Factura' | 'Albarán' | 'Cierre';
    displayDate?: string;
    displayName?: string;
    displayAmount?: number;
    createdAt?: string;
}

export interface OCRDocumentListProps {
    /** Documents to display */
    documents: OCRDocument[];
    /** Search query value */
    searchQuery: string;
    /** Filter value */
    filter: string;
    /** Callback when search changes */
    onSearchChange: (value: string) => void;
    /** Callback when filter changes */
    onFilterChange: (value: string) => void;
    /** Callback to start new document wizard */
    onNewDocument: () => void;
    /** Callback when viewing a document */
    onViewDocument: (doc: OCRDocument) => void;
    /** Callback when deleting a document */
    onDeleteDocument: (doc: OCRDocument) => void;
}

const filterOptions = [
    { value: 'all', label: 'Todos los documentos' },
    { value: 'recent', label: 'Últimos 7 días' },
    { value: 'facturas', label: 'Facturas' },
    { value: 'albaranes', label: 'Albaranes' },
    { value: 'tickets', label: 'Tickets compra' },
    { value: 'cierres', label: 'Cierres' }
];

const getDocIcon = (type: string) => {
    switch (type) {
        case 'Factura': return <Receipt size={18} />;
        case 'Albarán': return <Package size={18} />;
        default: return <Coins size={18} />;
    }
};

const getDocIconLarge = (type: string) => {
    switch (type) {
        case 'Factura': return <Receipt size={20} />;
        case 'Albarán': return <Package size={20} />;
        default: return <Coins size={20} />;
    }
};

export const OCRDocumentList: React.FC<OCRDocumentListProps> = ({
    documents,
    searchQuery,
    filter,
    onSearchChange,
    onFilterChange,
    onNewDocument,
    onViewDocument,
    onDeleteDocument,
}) => {
    return (
        <div style={{ padding: 'var(--spacing-lg)', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    <h2 style={{ margin: 0, fontSize: 'var(--font-size-3xl)', fontWeight: '600', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                        Documentos Escáner
                    </h2>
                    <Button variant="primary" onClick={onNewDocument}>
                        <FileText size={16} /> <span className="hidden-mobile">Nuevo Documento</span>
                        <span className="visible-mobile">Nuevo</span>
                    </Button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <Input
                        type="text"
                        placeholder="Buscar en todos los campos..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        fullWidth
                        icon={<Search size={18} />}
                        iconPosition="left"
                    />
                    <Select
                        value={filter}
                        onChange={onFilterChange}
                        fullWidth
                        options={filterOptions}
                    />
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden-mobile">
                <Table
                    data={documents}
                    columns={[
                        {
                            key: 'type',
                            header: 'Tipo',
                            render: (_, doc) => (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    {getDocIcon(doc.type)}
                                    <span>{doc.type}</span>
                                </span>
                            ),
                            sortable: true,
                        },
                        {
                            key: 'displayDate',
                            header: 'Fecha',
                            render: (_, doc) => formatDate(doc.displayDate),
                            sortable: true,
                        },
                        {
                            key: 'displayName',
                            header: 'Proveedor / Concepto',
                            render: (_, doc) => <span style={{ fontWeight: '500' }}>{doc.displayName}</span>,
                            sortable: true,
                        },
                        {
                            key: 'displayAmount',
                            header: 'Importe',
                            render: (_, doc) => <span style={{ fontWeight: '600', textAlign: 'right', display: 'block' }}>{formatCurrency(doc.displayAmount)}</span>,
                            sortable: true,
                        },
                        {
                            key: 'status',
                            header: 'Estado',
                            render: () => (
                                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                    <CheckCircle size={12} /> Procesado
                                </span>
                            ),
                            sortable: false,
                        },
                    ]}
                    onRowClick={onViewDocument}
                    hoverable
                    striped
                    emptyText="No hay documentos para mostrar"
                    expandedRowRender={(doc) => (
                        <div style={{ padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 var(--spacing-xs) 0', color: 'var(--text-main)', fontSize: 'var(--font-size-lg)' }}>
                                        Detalles del Documento
                                    </h4>
                                    <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                                        ID: {doc.id} • Creado: {formatDate(doc.createdAt)}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewDocument(doc);
                                        }}
                                    >
                                        <Eye size={14} /> Ver Completo
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteDocument(doc);
                                        }}
                                    >
                                        <Trash2 size={14} /> Eliminar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                />
            </div>

            {/* Mobile Cards */}
            <div className="visible-mobile" style={{ flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {documents.map((doc, idx) => (
                    <div
                        key={idx}
                        onClick={() => onViewDocument(doc)}
                        style={{
                            backgroundColor: 'var(--surface)',
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius)',
                            boxShadow: 'var(--shadow)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface-muted)';
                            e.currentTarget.style.borderColor = 'var(--border-focus)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--surface)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow)';
                        }}
                    >
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: 'var(--radius)',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--surface)',
                            flexShrink: 0
                        }}>
                            {getDocIconLarge(doc.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)', alignItems: 'center' }}>
                                <span style={{
                                    fontWeight: '600',
                                    color: 'var(--text-main)',
                                    fontSize: 'var(--font-size-sm)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    flex: 1,
                                    marginRight: 'var(--spacing-sm)'
                                }}>
                                    {doc.displayName}
                                </span>
                                <span style={{
                                    fontWeight: '700',
                                    color: 'var(--accent)',
                                    fontSize: 'var(--font-size-base)',
                                    flexShrink: 0
                                }}>
                                    {formatCurrency(doc.displayAmount)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', gap: 'var(--spacing-md)' }}>
                                <span>{formatDate(doc.displayDate)}</span>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'var(--surface-muted)',
                                    fontSize: 'var(--font-size-xxs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {doc.type}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {documents.length === 0 && (
                    <div style={{
                        padding: 'var(--spacing-3xl) var(--spacing-2xl)',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        background: 'var(--surface)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: '500', color: 'var(--text-main)' }}>No hay documentos</div>
                        <div style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                            Escanea un documento para comenzar
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
