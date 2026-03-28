/**
 * DocsPage (formerly OCRPage) - Unified Document Management
 *
 * Session 004: Renamed to Docs, unified view for all document types
 * Types: facturas, albaranes, tickets, recibos, cierres, nominas
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../utils/toast';
import type { OCRDocumentType, ExtractedData } from '../types/ocr.types';
import { useDatabase } from '../hooks';
import { formatDate, formatCurrency } from '../utils/formatters';
import { PageContainer } from '@shared/components';
import { logger } from '@core/services/LoggerService';

// Import extracted components
import { OCRDocumentList, OCRDocumentDetail, OCRWizard, type OCRListItem } from '../features/ocr';

type ViewMode = 'list' | 'detail' | 'wizard';

/** Internal doc representation for the unified list */
interface OCRPageDocument {
  id: string | number;
  type: string;
  displayDate?: string;
  displayName?: string;
  displayAmount?: number;
  createdAt?: string;
  archivoData?: string;
  proveedor?: string;
  numeroFactura?: string;
  numero?: string;
  [key: string]: unknown;
}

export const OCRPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();

  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDoc, setSelectedDoc] = useState<OCRPageDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // List State
  const [listFilter, setListFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentDocs, setRecentDocs] = useState<OCRPageDocument[]>([]);

  // Wizard State - For initial values when editing or starting
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [scanType, setScanType] = useState<OCRDocumentType>('factura');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExtractedData>({});

  // --- LOAD DATA ---
  useEffect(() => {
    // Auto-sync on mount to ensure data is fresh
    const initData = async () => {
      try {
        await db.syncFromCloud();
        loadDocuments();
      } catch (error: unknown) {
        logger.error("Auto-sync failed", error instanceof Error ? error.message : String(error));
      }
    };
    initData();
  }, [db]);

  const loadDocuments = () => {
    const docs: OCRPageDocument[] = [];

    const mapDoc = <T extends { id: string | number }>(doc: T, type: string): OCRPageDocument => {
      const d = doc as T & Record<string, unknown>;
      return {
        ...d,
        id: doc.id,
        type,
        displayDate: (d.fecha || d.fechaFactura || d.fechaAlbaran || d.periodo) as string | undefined,
        displayAmount: (d.total || d.totalFactura || d.totalAlbaran || d.totalReal || d.importeBruto) as number | undefined,
        displayName: (d.proveedor || d.proveedorNombre ||
          (type === 'Cierre' ? d.turno : null) ||
          (type === 'Nomina' ? d.empleadoNombre : null) ||
          'Desconocido') as string,
      };
    };

    // Helper to check if doc is synced
    const isSynced = <T extends { id: string | number; _synced?: boolean }>(d: T) =>
      d._synced === true || (d.id && typeof d.id === 'string' && d.id.length > 10);

    // Load all document types
    if (db.facturas) {
      db.facturas.filter(isSynced).forEach(d => docs.push(mapDoc(d, 'Factura')));
    }
    if (db.albaranes) {
      db.albaranes.filter(isSynced).forEach(d => docs.push(mapDoc(d, 'Albarán')));
    }
    if (db.cierres) {
      db.cierres.filter(isSynced).forEach(d => docs.push(mapDoc(d, 'Cierre')));
    }
    // Session 004: Include nominas in unified docs view
    if (db.nominas) {
      (db.nominas as Array<{ id: string | number; _synced?: boolean }>).filter(isSynced).forEach(d => docs.push(mapDoc(d, 'Nomina')));
    }

    docs.sort((a, b) => {
      // Try to sort by ID if numeric (timestamp based)
      if (typeof a.id === 'number' && typeof b.id === 'number') {
        return b.id - a.id;
      }
      // Fallback to createdAt if available
      if (a.createdAt && b.createdAt) {
        const timeA = new Date(a.createdAt as string | number).getTime();
        const timeB = new Date(b.createdAt as string | number).getTime();
        return timeB - timeA;
      }
      // Fallback to string comparison of ID
      return String(b.id).localeCompare(String(a.id));
    });
    setRecentDocs(docs);
  };

  // --- WIZARD ACTIONS ---

  const startWizard = () => {
    setViewMode('wizard');
    setWizardStep(1);
    setPreviewUrl(null);
    setFormData({});
  };

  // --- WIZARD ACTIONS ---


  // --- RENDERERS ---

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let docs = recentDocs;

    // Filter by type
    if (listFilter !== 'all') {
      if (listFilter === 'recent') {
        // Last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        docs = docs.filter(doc => {
          const dateStr = String(doc.displayDate || doc.createdAt || '');
          const docDate = new Date(dateStr);
          return docDate >= weekAgo;
        });
      } else {
        // Match filter to document type
        const filterMap: Record<string, string> = {
          'facturas': 'factura',
          'albaranes': 'albarán',
          'cierres': 'cierre',
          'nominas': 'nomina',
        };
        const targetType = filterMap[listFilter] || listFilter.replace('s', '');
        docs = docs.filter(doc =>
          doc.type.toLowerCase().includes(targetType.toLowerCase())
        );
      }
    }

    // Universal search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      docs = docs.filter(doc => {
        const searchableFields = [
          doc.displayName,
          doc.proveedor,
          doc.numeroFactura,
          doc.numero,
          formatCurrency(doc.displayAmount),
          formatDate(doc.displayDate),
          doc.type,
        ].filter(Boolean).map(f => String(f).toLowerCase());

        return searchableFields.some(field => field.includes(query));
      });
    }

    return docs;
  }, [recentDocs, listFilter, searchQuery]) as OCRPageDocument[];

  const renderList = () => {
    const handleDeleteDocument = (doc: { id: string | number, type: string }) => {
      if (window.confirm('¿Eliminar este documento?')) {
        try {
          const collection = doc.type === 'Factura' ? 'facturas' : doc.type === 'Albarán' ? 'albaranes' : 'cierres';
          db.delete(collection as 'facturas' | 'albaranes' | 'cierres', doc.id);
          loadDocuments();
          showToast({
            type: 'success',
            title: 'Documento eliminado',
            message: 'El documento ha sido eliminado correctamente',
          });
        } catch (error: unknown) {
          logger.error('Error al eliminar documento', error instanceof Error ? error.message : String(error));
          showToast({
            type: 'error',
            title: 'Error',
            message: 'No se pudo eliminar el documento',
          });
        }
      }
    };

    return (
      <OCRDocumentList
        documents={filteredDocs as OCRListItem[]}
        searchQuery={searchQuery}
        filter={listFilter}
        onSearchChange={setSearchQuery}
        onFilterChange={setListFilter}
        onNewDocument={startWizard}
        onViewDocument={(doc) => {
          setSelectedDoc(doc as OCRPageDocument);
          setViewMode('detail');
        }}
        onDeleteDocument={handleDeleteDocument}
      />
    );
  };

  const renderDetail = () => {
    if (!selectedDoc) return null;

    const handleEdit = (docData: ExtractedData) => {
      setFormData(docData);
      setPreviewUrl(selectedDoc.archivoData || null);
      setWizardStep(4);
      setViewMode('wizard');
      setScanType(selectedDoc.type.toLowerCase() as OCRDocumentType); // Set scan type based on selected doc
    };

    const handleDelete = async (id: string | number, type: string) => {
      const collection = type.toLowerCase() === 'factura' ? 'facturas' :
        type.toLowerCase() === 'albarán' ? 'albaranes' : 'cierres';
      db.delete(collection as 'facturas' | 'albaranes' | 'cierres', id);
      setViewMode('list');
      setSelectedDoc(null);
      loadDocuments();
    };

    return (
      <OCRDocumentDetail
        document={selectedDoc}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onBack={() => setViewMode('list')}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  };

  const renderWizard = () => {
    return (
      <OCRWizard
        onClose={() => setViewMode('list')}
        onSaveSuccess={() => {
          loadDocuments();
          setViewMode('list');
        }}
        initialData={formData}
        initialStep={wizardStep as 1 | 2 | 3 | 4 | 5}
        initialPreviewUrl={previewUrl || undefined}
        initialType={scanType}
      />
    );
  };

  return (
    <PageContainer>
      {viewMode === 'list' && renderList()}
      {viewMode === 'detail' && renderDetail()}
      {viewMode === 'wizard' && renderWizard()}
    </PageContainer>
  );
};

