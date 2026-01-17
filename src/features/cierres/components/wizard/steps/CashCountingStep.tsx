/**
 * CashCountingStep - Step 2 of Closing Wizard
 * 
 * Counts cash by denomination with:
 * - Collapsible sections for Bills and Coins
 * - Sticky navigation footer (mobile-first UX)
 * - Auto-calculated running total
 * 
 * @audit AUDIT-03 - Optimized for less scrolling
 */
import React, { useState } from 'react';
import { Card, Input, Button } from '@/shared/components';
import { ArrowRight, ArrowLeft, Banknote, ChevronDown, ChevronUp, Coins } from 'lucide-react';
import { ClosingFormData } from '../types';
import { CashBreakdown } from '@types';
import { formatCurrency } from '@/utils/formatters';

interface CashCountingStepProps {
    formData: ClosingFormData;
    setFormData: (data: ClosingFormData) => void;
    onNext: () => void;
    onBack: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    subtotal: number;
    children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    isOpen,
    onToggle,
    subtotal,
    children,
}) => (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <button
            type="button"
            onClick={onToggle}
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: isOpen ? 'var(--radius) var(--radius) 0 0' : 'var(--radius)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                {icon}
                <span style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-secondary)',
                }}>
                    {title}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                <span style={{
                    fontWeight: '600',
                    color: subtotal > 0 ? 'var(--success)' : 'var(--text-light)',
                }}>
                    {formatCurrency(subtotal)}
                </span>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
        </button>
        {isOpen && (
            <div style={{
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderTop: 'none',
                borderRadius: '0 0 var(--radius) var(--radius)',
            }}>
                {children}
            </div>
        )}
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const CashCountingStep: React.FC<CashCountingStepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack
}) => {
    // Collapsible state - bills open by default, coins collapsed
    const [billsOpen, setBillsOpen] = useState(true);
    const [coinsOpen, setCoinsOpen] = useState(false);

    const billDenominations = [500, 200, 100, 50, 20, 10, 5];
    const coinDenominations = [
        { id: 'm2', label: '2 €', value: 2 },
        { id: 'm1', label: '1 €', value: 1 },
        { id: 'm050', label: '0.50 €', value: 0.5 },
        { id: 'm020', label: '0.20 €', value: 0.2 },
        { id: 'm010', label: '0.10 €', value: 0.1 },
        { id: 'm005', label: '0.05 €', value: 0.05 },
        { id: 'm002', label: '0.02 €', value: 0.02 },
        { id: 'm001', label: '0.01 €', value: 0.01 },
    ];

    const updateCashBreakdown = (denom: keyof CashBreakdown, value: number) => {
        const newDesglose = { ...formData.desgloseEfectivo, [denom]: value };

        // Calculate total cash
        const total = Object.entries(newDesglose).reduce((acc, [key, val]) => {
            let realMultiplier = 0;
            if (key.startsWith('b')) realMultiplier = parseInt(key.substring(1));
            else if (key === 'm2') realMultiplier = 2;
            else if (key === 'm1') realMultiplier = 1;
            else if (key === 'm050') realMultiplier = 0.5;
            else if (key === 'm020') realMultiplier = 0.2;
            else if (key === 'm010') realMultiplier = 0.1;
            else if (key === 'm005') realMultiplier = 0.05;
            else if (key === 'm002') realMultiplier = 0.02;
            else if (key === 'm001') realMultiplier = 0.01;

            return acc + (Number(val) * realMultiplier);
        }, 0);

        setFormData({
            ...formData,
            desgloseEfectivo: newDesglose,
            efectivoContado: total
        });
    };

    // Calculate subtotals for sections
    const billsSubtotal = billDenominations.reduce((sum, b) => {
        const count = formData.desgloseEfectivo[`b${b}` as keyof CashBreakdown] || 0;
        return sum + (Number(count) * b);
    }, 0);

    const coinsSubtotal = coinDenominations.reduce((sum, c) => {
        const count = formData.desgloseEfectivo[c.id as keyof CashBreakdown] || 0;
        return sum + (Number(count) * c.value);
    }, 0);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100%',
            paddingBottom: '100px', // Space for sticky footer
        }}>
            <Card style={{ padding: 'var(--spacing-lg)', flex: 1 }}>
                <h3 style={{
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                }}>
                    <Banknote size={20} /> 2. Conteo de Efectivo
                </h3>

                {/* Bills Section - Collapsible */}
                <CollapsibleSection
                    title="Billetes"
                    icon={<Banknote size={16} />}
                    isOpen={billsOpen}
                    onToggle={() => setBillsOpen(!billsOpen)}
                    subtotal={billsSubtotal}
                >
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {billDenominations.map(b => (
                            <div key={b} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                backgroundColor: 'var(--surface-muted)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <span style={{
                                    fontSize: 'var(--font-size-base)',
                                    width: '45px',
                                    fontWeight: 500
                                }}>
                                    {b} €
                                </span>
                                <Input
                                    type="number"
                                    value={formData.desgloseEfectivo[`b${b}` as keyof CashBreakdown] || 0}
                                    onChange={(e) => updateCashBreakdown(
                                        `b${b}` as keyof CashBreakdown,
                                        parseInt(e.target.value) || 0
                                    )}
                                    style={{ textAlign: 'right' }}
                                />
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Coins Section - Collapsible */}
                <CollapsibleSection
                    title="Monedas"
                    icon={<Coins size={16} />}
                    isOpen={coinsOpen}
                    onToggle={() => setCoinsOpen(!coinsOpen)}
                    subtotal={coinsSubtotal}
                >
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: 'var(--spacing-sm)'
                    }}>
                        {coinDenominations.map(m => (
                            <div key={m.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                backgroundColor: 'var(--surface-muted)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <span style={{
                                    fontSize: 'var(--font-size-base)',
                                    width: '50px',
                                    fontWeight: 500
                                }}>
                                    {m.label}
                                </span>
                                <Input
                                    type="number"
                                    value={formData.desgloseEfectivo[m.id as keyof CashBreakdown] || 0}
                                    onChange={(e) => updateCashBreakdown(
                                        m.id as keyof CashBreakdown,
                                        parseInt(e.target.value) || 0
                                    )}
                                    style={{ textAlign: 'right' }}
                                />
                            </div>
                        ))}
                    </div>
                </CollapsibleSection>

                {/* Total Display */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'var(--surface-muted)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '2px solid var(--border)',
                }}>
                    <span style={{
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        Total Efectivo
                    </span>
                    <span style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: '700',
                        color: 'var(--text-main)'
                    }}>
                        {formatCurrency(formData.efectivoContado)}
                    </span>
                </div>
            </Card>

            {/* STICKY NAVIGATION FOOTER - Fixed at bottom */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 'var(--z-sticky)',
            }}>
                <Button onClick={onBack} variant="secondary">
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Anterior
                </Button>
                <div style={{
                    fontWeight: '600',
                    fontSize: 'var(--font-size-lg)',
                    color: 'var(--text-main)',
                }}>
                    {formatCurrency(formData.efectivoContado)}
                </div>
                <Button onClick={onNext} variant="primary">
                    Siguiente <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                </Button>
            </div>
        </div>
    );
};
