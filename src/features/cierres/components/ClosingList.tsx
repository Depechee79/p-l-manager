/**
 * ClosingList - Cash Closings List Component
 *
 * Session 007: Updated with design system
 * - FilterCard for period filter
 * - DataCard for table and empty state
 */
import type { FC, MouseEvent } from 'react';
import {
  Pencil,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  Coins,
  Share2,
  Wallet,
  Plus,
} from 'lucide-react';
import {
  Button,
  Table,
  FilterCard,
  FilterInput,
  DataCard,
} from '@shared/components';
import { formatCurrency, formatDate } from '@utils/formatters';
import type { Cierre } from '@types';

interface ClosingListProps {
  closings: Cierre[];
  loading: boolean;
  filterPeriod: string;
  onFilterChange: (period: string) => void;
  onEditClosing: (cierre: Cierre) => void;
  onDeleteClosing: (cierre: Cierre) => void;
  onNewClosing?: () => void;
}

export const ClosingList: FC<ClosingListProps> = ({
  closings,
  loading,
  filterPeriod,
  onFilterChange,
  onEditClosing,
  onDeleteClosing,
  onNewClosing,
}) => {
  const handleShare = (cierre: Cierre) => {
    const text = `📊 Resumen Cierre - ${formatDate(cierre.fecha)} (${cierre.turno.toUpperCase()})
💰 Total Real: ${formatCurrency(cierre.totalReal)}
💳 Tarjetas: ${formatCurrency(cierre.totalDatafonos)}
💵 Efectivo: ${formatCurrency(cierre.efectivoContado)}
⚡ Descuadre: ${formatCurrency(cierre.descuadreTotal)}
${cierre.notasDescuadre ? `📝 Notas: ${cierre.notasDescuadre}` : ''}
Sent from P&L Manager`;

    const encodedText = encodeURIComponent(text);

    if (confirm(`¿Compartir resumen de ${cierre.fecha} por WhatsApp?`)) {
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
  };

  // Initialize with current month if empty
  const effectiveFilterPeriod = filterPeriod || new Date().toISOString().substring(0, 7);

  // Calculate KPIs
  const totalReal = closings.reduce((sum, c) => sum + (c.totalReal || 0), 0);
  const closingsCuadran = closings.filter(c => Math.abs(c.descuadreTotal) <= 0.05).length;

  return (
    <div className="flex flex-col gap-md">
      {/* Period Filter */}
      <FilterCard columns={2}>
        <FilterInput label="Periodo">
          <input
            type="month"
            value={effectiveFilterPeriod}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full h-[var(--app-filter-input-h)] px-3 bg-surface-muted border-none rounded-[var(--app-interactive-radius)] text-[var(--app-filter-input-size)] text-text-main outline-none"
          />
        </FilterInput>
        <div />
      </FilterCard>

      {/* Data Card */}
      {loading ? (
        <DataCard
          isEmpty
          emptyTitle="Cargando cierres..."
          emptyDescription="Por favor espera mientras se cargan los datos."
          emptyIcon={<Wallet size={32} color="var(--text-light)" strokeWidth={1.5} />}
        />
      ) : closings.length === 0 ? (
        <DataCard
          isEmpty
          emptyTitle="No hay cierres registrados"
          emptyDescription="Crea un nuevo cierre para comenzar a registrar la caja."
          emptyIcon={<Wallet size={32} color="var(--text-light)" strokeWidth={1.5} />}
          emptyAction={onNewClosing ? (
            <Button variant="primary" icon={<Plus size={16} />} onClick={onNewClosing}>
              Nuevo Cierre
            </Button>
          ) : undefined}
        />
      ) : (
        <DataCard
          kpis={[
            { label: 'Cierres', value: closings.length },
            { label: 'Total Periodo', value: formatCurrency(totalReal) },
            {
              label: 'Cuadran',
              value: `${closingsCuadran}/${closings.length}`,
              variant: closingsCuadran === closings.length ? 'success' : 'warning',
            },
          ]}
          noPadding
        >
          <Table
            data={closings}
            columns={[
              {
                key: 'fecha',
                header: 'Fecha',
                render: (_value: Cierre[keyof Cierre], cierre: Cierre) => formatDate(cierre.fecha),
                sortable: true,
              },
              {
                key: 'turno',
                header: 'Turno',
                render: (_value: Cierre[keyof Cierre], cierre: Cierre) =>
                  cierre.turno.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                sortable: true,
              },
              {
                key: 'totalReal',
                header: 'Total Real',
                render: (_value: Cierre[keyof Cierre], cierre: Cierre) => formatCurrency(cierre.totalReal),
                sortable: true,
              },
              {
                key: 'descuadreTotal',
                header: 'Estado',
                render: (_value: Cierre[keyof Cierre], cierre: Cierre) => {
                  const cuadra = Math.abs(cierre.descuadreTotal) <= 0.05;
                  return (
                    <span
                      className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full text-xs font-semibold ${cuadra ? 'bg-[var(--success-light)] text-success' : 'bg-[var(--danger-light)] text-danger'}`}
                    >
                      {cuadra ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      {cuadra ? 'CUADRA' : `${formatCurrency(Math.abs(cierre.descuadreTotal))}`}
                    </span>
                  );
                },
                sortable: true,
              },
            ]}
            hoverable
            striped
            expandedRowRender={(cierre: Cierre) => (
              <div className="p-lg">
                <div className="flex justify-end gap-sm mb-lg">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      onEditClosing(cierre);
                    }}
                  >
                    <Pencil size={14} /> Editar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleShare(cierre);
                    }}
                  >
                    <Share2 size={14} /> Compartir
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      onDeleteClosing(cierre);
                    }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </Button>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-md">
                  <div>
                    <div className="text-text-secondary text-xs mb-xs flex items-center gap-xs uppercase">
                      <Banknote size={14} /> Efectivo
                    </div>
                    <div className="font-semibold text-text-main text-lg">
                      {formatCurrency(cierre.efectivoContado)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-xs flex items-center gap-xs uppercase">
                      <CreditCard size={14} /> Tarjetas
                    </div>
                    <div className="font-semibold text-text-main text-lg">
                      {formatCurrency(cierre.totalDatafonos)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-xs flex items-center gap-xs uppercase">
                      <Coins size={14} /> Otros
                    </div>
                    <div className="font-semibold text-text-main text-lg">
                      {formatCurrency(cierre.totalOtrosMedios)}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-xs uppercase">
                      Total POS
                    </div>
                    <div className="font-semibold text-text-main text-lg">
                      {formatCurrency(cierre.totalPos)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        </DataCard>
      )}
    </div>
  );
};
