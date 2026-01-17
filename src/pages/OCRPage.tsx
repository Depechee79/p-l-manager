import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../utils/toast';
import type { OCRDocumentType, ExtractedData } from '../types/ocr.types';
import { useDatabase } from '../hooks';
import { formatDate, formatCurrency } from '../utils/formatters';

// Import extracted components
import { OCRDocumentList, OCRDocumentDetail, OCRWizard } from '../features/ocr';

type ViewMode = 'list' | 'detail' | 'wizard';

export const OCRPage: React.FC = () => {
  const { db } = useDatabase();
  const { showToast } = useToast();

  // Navigation State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // List State
  const [listFilter, setListFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentDocs, setRecentDocs] = useState<any[]>([]);

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
      } catch (err) {
        console.error("Auto-sync failed", err);
      }
    };
    initData();
  }, [db]);

  const loadDocuments = () => {
    const docs: any[] = [];
    const mapDoc = (doc: any, type: string) => ({
      ...doc,
      type,
      displayDate: doc.fecha || doc.fechaFactura || doc.fechaAlbaran,
      displayAmount: doc.total || doc.totalFactura || doc.totalAlbaran || doc.totalReal,
      displayName: doc.proveedor || doc.proveedorNombre || (type === 'Cierre' ? doc.turno : 'Desconocido')
    });

    // Only load documents that are synced from Firebase
    if (db.facturas) {
      db.facturas
        .filter(d => d._synced === true || (d.id && typeof d.id === 'string' && d.id.length > 10))
        .forEach(d => docs.push(mapDoc(d, 'Factura')));
    }
    if (db.albaranes) {
      db.albaranes
        .filter(d => d._synced === true || (d.id && typeof d.id === 'string' && d.id.length > 10))
        .forEach(d => docs.push(mapDoc(d, 'Albarán')));
    }
    if (db.cierres) {
      db.cierres
        .filter(d => d._synced === true || (d.id && typeof d.id === 'string' && d.id.length > 10))
        .forEach(d => docs.push(mapDoc(d, 'Cierre')));
    }

    docs.sort((a, b) => {
      // Try to sort by ID if numeric (timestamp based)
      if (typeof a.id === 'number' && typeof b.id === 'number') {
        return b.id - a.id;
      }
      // Fallback to createdAt if available
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
          const docDate = new Date(doc.displayDate || doc.createdAt || '');
          return docDate >= weekAgo;
        });
      } else {
        docs = docs.filter(doc =>
          doc.type.toLowerCase().includes(listFilter.replace('s', '').toLowerCase())
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
  }, [recentDocs, listFilter, searchQuery]);

  const renderList = () => {
    const handleDeleteDocument = (doc: any) => {
      if (window.confirm('¿Eliminar este documento?')) {
        try {
          const collection = doc.type === 'Factura' ? 'facturas' : doc.type === 'Albarán' ? 'albaranes' : 'cierres';
          db.delete(collection as any, doc.id);
          loadDocuments();
          showToast({
            type: 'success',
            title: 'Documento eliminado',
            message: 'El documento ha sido eliminado correctamente',
          });
        } catch (err) {
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
        documents={filteredDocs}
        searchQuery={searchQuery}
        filter={listFilter}
        onSearchChange={setSearchQuery}
        onFilterChange={setListFilter}
        onNewDocument={startWizard}
        onViewDocument={(doc) => {
          setSelectedDoc(doc);
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
      db.delete(collection as any, id);
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
        initialStep={wizardStep as any}
        initialPreviewUrl={previewUrl || undefined}
        initialType={scanType}
      />
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {viewMode === 'list' && renderList()}
      {viewMode === 'detail' && renderDetail()}
      {viewMode === 'wizard' && renderWizard()}
    </div>
  );
};

