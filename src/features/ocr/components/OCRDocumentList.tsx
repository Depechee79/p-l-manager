/**
 * OCRDocumentList - Document List Component
 *
 * Session 007: Updated with V2 design system
 * - ActionHeaderV2 with TabsNavV2
 * - FilterCardV2 with search
 * - DataCardV2 for empty state
 *
 * Displays a list of OCR-scanned documents with filtering and search.
 * Supports both desktop table view and mobile card view.
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
  Clock,
  Truck,
  CreditCard,
  Calculator,
  Plus,
} from 'lucide-react';
import {
  Button,
  Table,
  type TabV2,
  ActionHeaderV2,
  FilterCardV2,
  FilterInputV2,
  FilterTextInput,
  FilterSelect,
  DataCardV2,
  ButtonV2,
} from '@shared/components';
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

const FILTER_TABS: TabV2[] = [
  { id: 'all', label: 'Todos', icon: <FileText size={16} /> },
  { id: 'recent', label: 'Recientes', icon: <Clock size={16} /> },
  { id: 'facturas', label: 'Facturas', icon: <Receipt size={16} /> },
  { id: 'albaranes', label: 'Albaranes', icon: <Truck size={16} /> },
  { id: 'tickets', label: 'Tickets', icon: <CreditCard size={16} /> },
  { id: 'cierres', label: 'Cierres', icon: <Calculator size={16} /> },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Action Header with Tabs and New Button */}
      <ActionHeaderV2
        tabs={FILTER_TABS}
        activeTab={filter}
        onTabChange={onFilterChange}
        actions={
          <ButtonV2 variant="primary" icon={<Plus size={16} />} onClick={onNewDocument}>
            Nuevo Doc
          </ButtonV2>
        }
      />

      {/* Search and Filter Row - 3 columns */}
      <FilterCardV2 columns={3}>
        <FilterInputV2 label="Buscar" grow>
          <FilterTextInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Nombre, referencia..."
            icon={<Search size={14} />}
          />
        </FilterInputV2>
        <FilterInputV2 label="Tipo">
          <FilterSelect
            value={filter}
            onChange={onFilterChange}
            options={[
              { value: 'all', label: 'Todos los tipos' },
              { value: 'facturas', label: 'Facturas' },
              { value: 'albaranes', label: 'Albaranes' },
              { value: 'tickets', label: 'Tickets' },
              { value: 'cierres', label: 'Cierres' },
            ]}
          />
        </FilterInputV2>
        <FilterInputV2 label="Fecha">
          <FilterSelect
            value="thisMonth"
            onChange={() => { }}
            options={[
              { value: 'thisMonth', label: 'Este mes' },
              { value: 'lastMonth', label: 'Mes anterior' },
              { value: 'last3Months', label: 'Últimos 3 meses' },
              { value: 'all', label: 'Todos' },
            ]}
          />
        </FilterInputV2>
      </FilterCardV2>

      {/* Documents List/Table */}
      {documents.length === 0 ? (
        <DataCardV2
          isEmpty
          emptyTitle="No hay documentos"
          emptyDescription="Escanea un documento para comenzar la gestión documental."
          emptyIcon={<FileText size={32} color="var(--text-light)" strokeWidth={1.5} />}
          emptyAction={
            <ButtonV2 variant="primary" icon={<Plus size={16} />} onClick={onNewDocument}>
              Nuevo Documento
            </ButtonV2>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden-mobile">
            <DataCardV2 noPadding>
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
                    render: (_, doc) => (
                      <span style={{ fontWeight: '600', textAlign: 'right', display: 'block' }}>
                        {formatCurrency(doc.displayAmount)}
                      </span>
                    ),
                    sortable: true,
                  },
                  {
                    key: 'status',
                    header: 'Estado',
                    render: () => (
                      <span
                        className="badge badge-success"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                      >
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
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-md)',
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: '0 0 var(--spacing-xs) 0',
                            color: 'var(--text-main)',
                            fontSize: 'var(--font-size-lg)',
                          }}
                        >
                          Detalles del Documento
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-secondary)',
                          }}
                        >
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
            </DataCardV2>
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
                  boxShadow: 'var(--shadow-sm)',
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
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius)',
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--surface)',
                    flexShrink: 0,
                  }}
                >
                  {getDocIconLarge(doc.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--spacing-xs)',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: '600',
                        color: 'var(--text-main)',
                        fontSize: 'var(--font-size-sm)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                        marginRight: 'var(--spacing-sm)',
                      }}
                    >
                      {doc.displayName}
                    </span>
                    <span
                      style={{
                        fontWeight: '700',
                        color: 'var(--accent)',
                        fontSize: 'var(--font-size-base)',
                        flexShrink: 0,
                      }}
                    >
                      {formatCurrency(doc.displayAmount)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      gap: 'var(--spacing-md)',
                    }}
                  >
                    <span>{formatDate(doc.displayDate)}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: 'var(--surface-muted)',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {doc.type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
