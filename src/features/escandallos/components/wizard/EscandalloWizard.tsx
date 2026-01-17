import React, { useState, useMemo } from 'react';
import { Card, StepIndicator, Button } from '@shared/components';
import { useDatabase, ItemsService } from '@core';
import { useToast } from '@/utils/toast';
import { EscandalloFormData, INITIAL_FORM_DATA } from './wizard.types';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { IngredientsStep } from './steps/IngredientsStep';
import { NotesStep } from './steps/NotesStep';
import { SummaryStep } from './steps/SummaryStep';
import { QuickAddModal } from '../QuickAddModal';
import type { Escandallo, Product } from '@types';

interface EscandalloWizardProps {
    initialData?: Escandallo | null;
    onSave: (data: EscandalloFormData) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

const STEPS = [
    { label: 'Información Básica' },
    { label: 'Ingredientes' },
    { label: 'Alérgenos y Notas' },
    { label: 'Resumen' },
];

export const EscandalloWizard: React.FC<EscandalloWizardProps> = ({
    initialData,
    onSave,
    onCancel,
    loading = false,
}) => {
    const { db } = useDatabase();
    const { showToast } = useToast();
    const itemsService = useMemo(() => new ItemsService(db), [db]);

    const [wizardStep, setWizardStep] = useState(1);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [formData, setFormData] = useState<EscandalloFormData>(() => {
        if (initialData) {
            return {
                nombre: initialData.nombre,
                pvpConIVA: initialData.pvpConIVA,
                tipoIVA: initialData.tipoIVA,
                ingredientes: initialData.ingredientes,
                familia: initialData.familia || '',
                subfamilia: initialData.subfamilia || '',
                descripcion: initialData.descripcion || '',
                notas: initialData.notas || '',
                alergenos: initialData.alergenos || [],
                imagen: (initialData as any).imagen || null,
            };
        }
        return INITIAL_FORM_DATA;
    });

    // State for quick add modals
    const [showAddFamiliaModal, setShowAddFamiliaModal] = useState(false);
    const [showAddSubfamiliaModal, setShowAddSubfamiliaModal] = useState(false);

    const handleUpdate = (updates: Partial<EscandalloFormData>) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const handleNextStep = () => {
        if (wizardStep === 1 && !formData.nombre) {
            showToast({ type: 'warning', title: 'Requerido', message: 'El nombre es obligatorio' });
            return;
        }
        if (wizardStep === 2 && formData.ingredientes.length === 0) {
            showToast({ type: 'warning', title: 'Requerido', message: 'Añade al menos un ingrediente' });
            return;
        }
        if (wizardStep < STEPS.length) {
            setWizardStep(wizardStep + 1);
        }
    };

    const handlePreviousStep = () => {
        if (wizardStep > 1) {
            setWizardStep(wizardStep - 1);
        }
    };

    const availableProducts = useMemo(() => {
        if (!db.productos) return [];
        const products = db.productos as Product[];
        if (!productSearchQuery.trim()) return products;

        const query = productSearchQuery.toLowerCase().trim();
        return products.filter(p =>
            p.nombre?.toLowerCase().includes(query) ||
            p.categoria?.toLowerCase().includes(query) ||
            p.familia?.toLowerCase().includes(query)
        );
    }, [db.productos, productSearchQuery]);

    const familiasOptions = useMemo(() =>
        itemsService.getFamilias().map(f => ({ value: f.nombre, label: f.nombre })),
        [itemsService]);

    const subfamiliasOptions = useMemo(() => {
        if (!formData.familia) return [];
        const familiaId = itemsService.getFamilias().find(f => f.nombre === formData.familia)?.id;
        return itemsService.getSubfamilias(familiaId).map(sf => ({ value: sf.nombre, label: sf.nombre }));
    }, [itemsService, formData.familia]);

    return (
        <Card>
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: '600', color: 'var(--text-main)' }}>
                    {initialData ? 'Editar Escandallo' : 'Nuevo Escandallo'}
                </h2>
                <Button variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <StepIndicator
                    steps={STEPS.map((s, i) => ({
                        label: s.label,
                        completed: i + 1 < wizardStep,
                    }))}
                    currentStep={wizardStep}
                />
            </div>

            {wizardStep === 1 && (
                <BasicInfoStep
                    data={formData}
                    onChange={handleUpdate}
                    onNext={handleNextStep}
                    familias={familiasOptions}
                    subfamilias={subfamiliasOptions}
                    onAddFamilia={() => setShowAddFamiliaModal(true)}
                    onAddSubfamilia={() => setShowAddSubfamiliaModal(true)}
                />
            )}

            {wizardStep === 2 && (
                <IngredientsStep
                    data={formData}
                    onChange={handleUpdate}
                    onNext={handleNextStep}
                    onPrevious={handlePreviousStep}
                    availableProducts={availableProducts}
                    productSearchQuery={productSearchQuery}
                    setProductSearchQuery={setProductSearchQuery}
                />
            )}

            {wizardStep === 3 && (
                <NotesStep
                    data={formData}
                    onChange={handleUpdate}
                    onNext={handleNextStep}
                    onPrevious={handlePreviousStep}
                />
            )}

            {wizardStep === 4 && (
                <SummaryStep
                    data={formData}
                    onPrevious={handlePreviousStep}
                    onSubmit={() => onSave(formData)}
                    loading={loading}
                />
            )}

            {/* Modals for Quick Add */}
            <QuickAddModal
                open={showAddFamiliaModal}
                onClose={() => setShowAddFamiliaModal(false)}
                title="Añadir Nueva Familia"
                label="Nombre de la Familia"
                placeholder="Ej: Carnes, Pescados..."
                onAdd={(name) => {
                    const nueva = itemsService.addFamilia(name);
                    handleUpdate({ familia: nueva.nombre });
                    showToast({ type: 'success', title: 'Éxito', message: 'Familia añadida' });
                }}
            />

            <QuickAddModal
                open={showAddSubfamiliaModal}
                onClose={() => setShowAddSubfamiliaModal(false)}
                title="Añadir Nueva Subfamilia"
                label="Nombre de la Subfamilia"
                placeholder="Ej: Vacuno, Cerdo..."
                onAdd={(name) => {
                    const familiaId = itemsService.getFamilias().find(f => f.nombre === formData.familia)?.id;
                    if (familiaId) {
                        const nueva = itemsService.addSubfamilia(name, familiaId);
                        handleUpdate({ subfamilia: nueva.nombre });
                        showToast({ type: 'success', title: 'Éxito', message: 'Subfamilia añadida' });
                    }
                }}
            />
        </Card>
    );
};
