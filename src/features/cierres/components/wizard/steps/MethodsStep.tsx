import type { FC } from 'react';
import { Card, Input, Button, Select } from '@/shared/components';
import { ArrowRight, ArrowLeft, CreditCard, Coins, Bike, Plus, X } from 'lucide-react';
import { ClosingFormData } from '../types';
import { Datafono, OtroMedio } from '@types';

interface MethodsStepProps {
    formData: ClosingFormData;
    setFormData: (data: ClosingFormData) => void;
    onNext: () => void;
    onBack: () => void;
}

export const MethodsStep: FC<MethodsStepProps> = ({
    formData,
    setFormData,
    onNext,
    onBack
}) => {

    /* --- Datáfonos Helpers --- */
    const addDatafono = () => {
        setFormData({
            ...formData,
            datafonos: [...formData.datafonos, { terminal: '', importe: 0 }]
        });
    };

    const updateDatafono = (index: number, field: keyof Datafono, value: string | number) => {
        const newDatafonos = [...formData.datafonos];
        newDatafonos[index] = { ...newDatafonos[index], [field]: value };
        const total = newDatafonos.reduce((acc, curr) => acc + curr.importe, 0);
        setFormData({ ...formData, datafonos: newDatafonos, totalDatafonos: total });
    };

    const removeDatafono = (index: number) => {
        const newDatafonos = formData.datafonos.filter((_, i) => i !== index);
        const total = newDatafonos.reduce((acc, curr) => acc + curr.importe, 0);
        setFormData({ ...formData, datafonos: newDatafonos, totalDatafonos: total });
    };

    /* --- Otros Medios Helpers --- */
    const addOtroMedio = () => {
        setFormData({
            ...formData,
            otrosMedios: [...formData.otrosMedios, { medio: '', importe: 0 }]
        });
    };

    const updateOtroMedio = (index: number, field: keyof OtroMedio, value: string | number) => {
        const newOtros = [...formData.otrosMedios];
        newOtros[index] = { ...newOtros[index], [field]: value };
        const total = newOtros.reduce((acc, curr) => acc + curr.importe, 0);
        setFormData({ ...formData, otrosMedios: newOtros, totalOtrosMedios: total });
    };

    const removeOtroMedio = (index: number) => {
        const newOtros = formData.otrosMedios.filter((_, i) => i !== index);
        const total = newOtros.reduce((acc, curr) => acc + curr.importe, 0);
        setFormData({ ...formData, otrosMedios: newOtros, totalOtrosMedios: total });
    };

    /* --- Delivery Helpers --- */
    const addDelivery = () => {
        setFormData({
            ...formData,
            deliveryBreakdown: [...formData.deliveryBreakdown, { plataforma: '', importe: 0 }]
        });
    };

    const updateDelivery = (index: number, field: string, value: string | number) => {
        const newDelivery = [...formData.deliveryBreakdown];
        newDelivery[index] = { ...newDelivery[index], [field]: value };
        const total = newDelivery.reduce((acc, curr) => acc + curr.importe, 0);
        setFormData({ ...formData, deliveryBreakdown: newDelivery, totalDelivery: total });
    };

    const removeDelivery = (index: number) => {
        const newDelivery = formData.deliveryBreakdown.filter((_, i) => i !== index);
        const total = newDelivery.reduce((acc, curr) => acc + curr.importe, 0);
        setFormData({ ...formData, deliveryBreakdown: newDelivery, totalDelivery: total });
    };

    return (
        <Card style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-xl)', fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                3. Otros Medios de Pago
            </h3>

            {/* Datáfonos */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <CreditCard size={18} /> Datáfonos
                    </h4>
                    <Button type="button" variant="secondary" size="sm" onClick={addDatafono}>
                        <Plus size={14} /> Añadir
                    </Button>
                </div>
                {formData.datafonos.map((datafono, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <Input
                            placeholder="Terminal"
                            value={datafono.terminal}
                            onChange={(e) => updateDatafono(index, 'terminal', e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Input
                            type="number"
                            placeholder="€"
                            value={datafono.importe}
                            onChange={(e) => updateDatafono(index, 'importe', parseFloat(e.target.value) || 0)}
                            style={{ width: '120px', textAlign: 'right' }}
                        />
                        <Button type="button" variant="danger" size="sm" onClick={() => removeDatafono(index)}>
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Otros Medios */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Coins size={18} /> Otros
                    </h4>
                    <Button type="button" variant="secondary" size="sm" onClick={addOtroMedio}>
                        <Plus size={14} /> Añadir
                    </Button>
                </div>
                {formData.otrosMedios.map((medio, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <Select
                            value={medio.medio}
                            onChange={(value) => updateOtroMedio(index, 'medio', value)}
                            options={[
                                { value: 'Transferencia', label: 'Transferencia' },
                                { value: 'Bizum', label: 'Bizum' },
                                { value: 'Ticket Restaurant', label: 'Ticket Restaurant' },
                                { value: 'Sodexo', label: 'Sodexo' },
                            ]}
                            placeholder="Medio..."
                            style={{ flex: 1 }}
                        />
                        <Input
                            type="number"
                            placeholder="€"
                            value={medio.importe}
                            onChange={(e) => updateOtroMedio(index, 'importe', parseFloat(e.target.value) || 0)}
                            style={{ width: '120px', textAlign: 'right' }}
                        />
                        <Button type="button" variant="danger" size="sm" onClick={() => removeOtroMedio(index)}>
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Delivery */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bike size={18} /> Delivery
                    </h4>
                    <Button type="button" variant="secondary" size="sm" onClick={addDelivery}>
                        <Plus size={14} /> Añadir
                    </Button>
                </div>
                {formData.deliveryBreakdown.map((item, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <Select
                            value={item.plataforma}
                            onChange={(value) => updateDelivery(index, 'plataforma', value)}
                            options={[
                                { value: 'Glovo', label: 'Glovo' },
                                { value: 'Just Eat', label: 'Just Eat' },
                                { value: 'Uber Eats', label: 'Uber Eats' },
                                { value: 'Deliveroo', label: 'Deliveroo' },
                                { value: 'Bolt', label: 'Bolt' },
                                { value: 'Otro', label: 'Otro' },
                            ]}
                            placeholder="Plataforma..."
                            style={{ flex: 1 }}
                        />
                        <Input
                            type="number"
                            placeholder="€"
                            value={item.importe}
                            onChange={(e) => updateDelivery(index, 'importe', parseFloat(e.target.value) || 0)}
                            style={{ width: '120px', textAlign: 'right' }}
                        />
                        <Button type="button" variant="danger" size="sm" onClick={() => removeDelivery(index)}>
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Propinas */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--surface-muted)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Propinas Declaradas</h4>
                    <Input
                        type="number"
                        placeholder="0.00 €"
                        value={formData.propina}
                        onChange={(e) => setFormData({ ...formData, propina: parseFloat(e.target.value) || 0 })}
                        style={{ width: '120px', textAlign: 'right' }}
                    />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    El importe de las propinas se restará del total real al calcular el descuadre.
                </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onBack} variant="secondary">
                    <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Anterior
                </Button>
                <Button onClick={onNext} variant="primary">
                    Siguiente <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                </Button>
            </div>
        </Card>
    );
};
