import { Database } from './core/database.js';

// ===============================================
// APP
// ===============================================
export class App {
    constructor() {
        this.db = new Database();
        this.currentView = 'ocr';
        this.currentPeriod = 'mes';
        this.currentFilters = null;
        this.inventarioState = {
            hasEditingLine: false,
            editingLineId: null,
            tempProductoAltaRapida: null // Para cuando se crea producto desde inventario
        };
        
        // Estado de ordenación para las tablas
        this.sortState = {
            escandallos: { column: 'nombre', direction: 'asc' },
            cierres: { column: 'fecha', direction: 'desc' },
            facturas: { column: 'fecha', direction: 'desc' },
            albaranes: { column: 'fecha', direction: 'desc' },
            inventarios: { column: 'fecha', direction: 'desc' },
            delivery: { column: 'fecha', direction: 'desc' },
            productos: { column: 'nombre', direction: 'asc' },
            proveedores: { column: 'nombreFiscal', direction: 'asc' }
        };

        // IMPORTANTE: Cerrar SOLO modales bloqueados al inicio (antes de que app esté lista)
        // Después de 100ms, marcar que la app ya está inicializada
        this.appInicializada = false;
        setTimeout(() => {
            document.querySelectorAll('.modal, .modal-overlay').forEach(m => {
                m.classList.remove('show');
                m.style.display = 'none';
            });
            this.appInicializada = true; // Ahora los modales pueden abrirse normalmente
        }, 100);
        
        // Variables OCR mejoradas
        this.currentPDFText = null;
        this.isPDFWithEmbeddedText = false;

        // Ocultar opciones de escaneo si est�n abiertas
        const scanOptionsCard = document.getElementById('scanOptionsCard');
        if (scanOptionsCard) {
             scanOptionsCard.classList.add('hidden');
             scanOptionsCard.style.display = 'none';
        }

        // Mostrar listas de nuevo
        const listaFacturas = document.getElementById('listaFacturas');
        const listaAlbaranes = document.getElementById('listaAlbaranes');
        const recentDocs = document.getElementById('recentDocumentsList');
        if (listaFacturas) listaFacturas.classList.remove('hidden');
        if (listaAlbaranes) listaAlbaranes.classList.remove('hidden');
        if (recentDocs) recentDocs.classList.remove('hidden');
        this.initializeEventListeners();
        this.render();
    }

    // --- HELPER VISUALES ---
    getConfidenceBadge(conf) {
        // Si no hay confianza (edición manual), no mostrar nada
        if (conf === undefined || conf === null) return '';
        
        let cls = 'low';
        let icon = '🔴';
        let texto = 'Corregir';
        
        if (conf >= 85) { cls = 'high'; icon = '🟢'; texto = 'Alta confianza'; }
        else if (conf >= 60) { cls = 'medium'; icon = '🟡'; texto = 'Revisar'; }
        
        return `<span class="field-confidence ${cls}" title="${texto}: ${Math.round(conf)}%">${icon}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        // Si ya viene en formato DD/MM/YYYY, devolver tal cual
        if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Método robusto para colapsar formularios (usa múltiples estrategias)
    collapseForm(type) {
        const formCard = document.getElementById(`${type}FormCard`);
        // Intenta encontrar el botón por ID exacto o busca dentro de headerActions
        let toggleBtn = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
        
        const labels = {
            'cierre': '+ Nuevo Cierre',
            'proveedor': '+ Nuevo Proveedor',
            'producto': '+ Nuevo Producto',
            'escandallo': '+ Nuevo Escandallo',
            'inventario': '+ Nuevo Inventario',
            'delivery': '+ Nuevo Registro'
        };

        if (formCard) {
            formCard.classList.add('hidden');
            formCard.style.display = 'none';
            
            // Limpiar estado de edición
            const form = document.getElementById(`${type}Form`);
            if (form) {
                form.reset();
                delete form.dataset.editId;
                // Resetear título si existe
                const title = formCard.querySelector('h3, .card-title');
                if (title) title.textContent = labels[type].replace('+ ', '');
            }
        }
        
        if (toggleBtn) {
            toggleBtn.textContent = labels[type] || `+ Nuevo ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            toggleBtn.style.display = ''; // Restaurar visibilidad (por si se ocultó)
        }

        // Restaurar lista de cierres si se ocultó
        if (type === 'cierre') {
            const lista = document.getElementById('listaCierres');
            if (lista) lista.style.display = 'block';
            
            // Resetear pasos del formulario de cierre
            this.resetCierreForm();
        }

        // Restaurar lista de inventarios si se ocultó
        if (type === 'inventario') {
            const lista = document.getElementById('listaInventarios');
            if (lista) lista.style.display = 'block';
            
            // Resetear pasos del formulario de inventario
            const step1 = document.getElementById('inventarioStep1');
            const form = document.getElementById('inventarioForm');
            if (step1) step1.classList.remove('hidden');
            if (form) form.classList.add('hidden');
            
            // Limpiar contenedor de productos
            const container = document.getElementById('inventarioProductosContainer');
            if (container) container.innerHTML = '';
            
            // Resetear estado de inventario
            this.inventarioState.hasEditingLine = false;
            this.inventarioState.editingLineId = null;
            const addBtn = document.getElementById('addProductoInventario');
            if (addBtn) addBtn.disabled = false;
        }
    }

    // Método robusto para expandir formularios
    expandForm(type) {
        try {
            const formCard = document.getElementById(`${type}FormCard`);
            let toggleBtn = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
            
            if (formCard) {
                const isHidden = formCard.classList.contains('hidden') || formCard.style.display === 'none';
                
                if (isHidden) {
                    formCard.classList.remove('hidden');
                    formCard.style.display = 'block';
                    
                    // Lógica específica por tipo
                    if (type === 'cierre' || type === 'inventario') {
                        // Ocultar botón "Nuevo Cierre/Inventario" y la lista para evitar conflictos
                        if (toggleBtn) toggleBtn.style.display = 'none';
                        const lista = document.getElementById(type === 'cierre' ? 'listaCierres' : 'listaInventarios');
                        if (lista) lista.style.display = 'none';
                    } else {
                        if (toggleBtn) toggleBtn.textContent = '− Cancelar';
                    }
                    
                    // Resetear formulario al abrir (si no es edición, que se gestiona aparte)
                    const form = document.getElementById(`${type}Form`);
                    if (form && !form.dataset.editId) {
                        form.reset();
                    }
                    
                    // Inicializar dropdowns inteligentes
                    this.updateSmartDropdowns(type);
                    
                    if (type === 'cierre') {
                        setTimeout(() => this.conectarEventosCierre(), 100); // Pequeño delay para asegurar DOM
                    }
                } else {
                    this.collapseForm(type);
                }
            } else {
                console.warn(`Formulario no encontrado: ${type}FormCard`);
                this.showToast('Error: Formulario no encontrado', 'error');
            }
        } catch (error) {
            console.error('Error en expandForm:', error);
            this.showToast('Error al abrir formulario', 'error');
        }
    }

    // Toggle form unificado
    toggleForm(type) {
        this.expandForm(type);
    }

    initializeEventListeners() {
        // Helper para añadir eventos de forma segura
        const addSafeListener = (id, event, handler) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, handler);
        };

        // --- GLOBAL CLICK LISTENER (Cerrar Dropdowns al hacer click fuera) ---
        document.addEventListener('click', (e) => {
            // 1. Document Filter Dropdown
            const docFilterWrapper = document.getElementById('documentFilterWrapper');
            if (docFilterWrapper && !docFilterWrapper.contains(e.target)) {
                const options = document.getElementById('documentFilterOptions');
                const trigger = docFilterWrapper.querySelector('.custom-select-trigger');
                if (options && !options.classList.contains('hidden')) {
                    options.classList.add('hidden');
                    if (trigger) trigger.classList.remove('active');
                    options.classList.remove('open-up');
                }
            }

            // 2. Smart Dropdowns (Cerrar si se hace click fuera)
            // Nota: Los smart dropdowns ya usan 'blur' en el input, pero esto es un refuerzo
            // para asegurar que se cierran si el foco no cambia correctamente.
            if (!e.target.closest('.smart-dropdown-container')) {
                document.querySelectorAll('.smart-dropdown-list').forEach(list => {
                    if (list.style.display === 'block') {
                        list.style.display = 'none';
                        // Resetear input si es necesario (lógica simplificada aquí, el blur maneja el valor)
                    }
                });
            }
        });

        // Mobile Menu Toggle
        addSafeListener('mobileMenuBtn', 'click', () => {
            const navMenu = document.querySelector('.nav-menu');
            if (navMenu) navMenu.classList.toggle('open');
        });

        // OCR - Toggle Scan Options
        addSafeListener('btnShowScanOptions', 'click', () => {
            const optionsCard = document.getElementById('scanOptionsCard');
            const listaFacturas = document.getElementById('listaFacturas');
            const listaAlbaranes = document.getElementById('listaAlbaranes');
            const recentDocs = document.getElementById('recentDocumentsList');
            const tableControls = document.getElementById('ocrTableControls');
            
            if (optionsCard) {
                optionsCard.classList.remove('hidden');
                optionsCard.style.display = 'block';
            }
            if (listaFacturas) listaFacturas.classList.add('hidden');
            if (listaAlbaranes) listaAlbaranes.classList.add('hidden');
            if (recentDocs) recentDocs.classList.add('hidden');
            if (tableControls) tableControls.classList.add('hidden');
        });

        addSafeListener('btnCancelScan', 'click', () => {
            const optionsCard = document.getElementById('scanOptionsCard');
            const listaFacturas = document.getElementById('listaFacturas');
            const listaAlbaranes = document.getElementById('listaAlbaranes');
            const recentDocs = document.getElementById('recentDocumentsList');
            const tableControls = document.getElementById('ocrTableControls');

            if (optionsCard) {
                optionsCard.classList.add('hidden');
                optionsCard.style.display = 'none';
            }
            if (listaFacturas) listaFacturas.classList.remove('hidden');
            if (listaAlbaranes) listaAlbaranes.classList.remove('hidden');
            if (recentDocs) recentDocs.classList.remove('hidden');
            if (tableControls) tableControls.classList.remove('hidden');
        });

        // --- DELEGACIÓN DE EVENTOS GLOBAL (CRÍTICO) ---
        // Este oyente maneja todos los botones con 'window.app'
        document.body.addEventListener('click', (e) => {
            
            // 1. Navegación (Sidebar)
            if (e.target.classList.contains('nav-item')) {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.render();

                // Close mobile menu if open
                const navMenu = document.querySelector('.nav-menu');
                if (navMenu && navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                }
            }

            // 2. OCR - Selector de Tipo (Factura, Ticket, etc.)
            const ocrBtn = e.target.closest('.ocr-tipo-btn');
            if (ocrBtn) {
                document.querySelectorAll('.ocr-tipo-btn').forEach(b => b.classList.remove('active'));
                ocrBtn.classList.add('active');
                this.currentOCRType = ocrBtn.dataset.tipo;
                
                // --- FIX CRÍTICO: FORZAR VISTA DE CARGA ---
                const uploadCard = document.getElementById('ocrUploadCard');
                const dataCard = document.getElementById('ocrDataCard');
                if (uploadCard) {
                    uploadCard.classList.remove('hidden');
                    this.renderRecentDocuments(); // Renderizar documentos recientes al mostrar la tarjeta
                }
                if (dataCard) {
                    dataCard.classList.add('hidden'); // Ocultar formulario de datos
                }
                
                console.log(`✅ TIPO SELECCIONADO: ${this.currentOCRType}. Tarjeta de carga activada.`);
                return; // Detener propagación
            }
            
            // 3. Botones de Acción (Añadir Nuevo)
            // Eliminamos la delegación automática por ID para evitar doble ejecución
            // ya que los botones generados en render() tienen onclick explícito.
            /*
            const btn = e.target.closest('button');
            if (btn) {
                if (btn.id === 'toggleCierreForm') window.app.expandForm('cierre');
                if (btn.id === 'toggleProveedorForm') window.app.toggleForm('proveedor');
                if (btn.id === 'toggleProductoForm') window.app.toggleForm('producto');
                if (btn.id === 'toggleEscandalloForm') window.app.expandForm('escandallo');
                if (btn.id === 'btnCrearInventario') window.app.expandForm('inventario');
                if (btn.id === 'btnCalcularCOGS') window.app.calcularCOGS();
            }
            */

            // 4. Botones de Stock (Legacy IDs check just in case)
            // if (e.target.id === 'btnCrearInventario') window.app.expandForm('inventario');
            // if (e.target.id === 'btnCalcularCOGS') window.app.calcularCOGS();
            
            // 5. Botones de Edición Dinámicos (Clases ya existentes)
            if (e.target.classList.contains('btn-edit')) {
                 const onclickAttr = e.target.getAttribute('onclick');
                 const match = onclickAttr.match(/editItem\('([^']+)'\s*,\s*(\d+)\)/);
                 if (match) this.editItem(match[1], parseInt(match[2]));
                 return;
            }
            if (e.target.classList.contains('btn-delete')) {
                 const onclickAttr = e.target.getAttribute('onclick');
                 const match = onclickAttr.match(/deleteItem\('([^']+)'\s*,\s*(\d+)\)/);
                 if (match) this.deleteItem(match[1], parseInt(match[2]));
                 return;
            }
        });

        // Selectores y otros inputs fijos
        addSafeListener('periodSelector', 'change', (e) => {
            this.currentPeriod = e.target.value;
            this.render();
        });

        // OCR
        addSafeListener('ocrFile', 'change', (e) => {
            if (e.target.files[0]) this.handleOCRImageUpload(e.target.files[0]);
        });
        addSafeListener('ocrAnalyzeBtn', 'click', () => this.analyzeOCRDocument());
        addSafeListener('ocrSaveBtn', 'click', () => this.saveOCRData());
        addSafeListener('ocrCancelBtn', 'click', () => this.resetOCRForm());
        addSafeListener('ocrCancelUploadBtn', 'click', () => this.resetOCRForm()); // Nuevo botón cancelar
        addSafeListener('btnRemoveFile', 'click', () => {
            document.getElementById('ocrFile').value = '';
            document.getElementById('fileSelectedInfo').classList.add('hidden');
            document.getElementById('ocrPreviewContainer').classList.add('hidden');
            
            // Mostrar drag & drop de nuevo
            const uploadZone = document.querySelector('.file-upload-zone');
            if (uploadZone) uploadZone.style.display = 'block';
            
            // Mostrar botón cancelar carga de nuevo
            const cancelContainer = document.getElementById('ocrUploadCancelContainer');
            if (cancelContainer) cancelContainer.classList.remove('hidden');
            
            this.currentImageData = null;
        });

        // Listeners para Cierres (Filas dinámicas)
        addSafeListener('addDatafono', 'click', () => this.addDatafonoRow());
        addSafeListener('addOtroMedio', 'click', () => this.addOtroMedioRow());

        // Listeners para cálculos en tiempo real (Cierres)
        document.querySelectorAll('.billete-input').forEach(input => {
            input.addEventListener('input', () => {
                this.calcularTotalEfectivo();
                this.calcularResumenCierre();
            });
        });
        
        ['posEfectivo', 'posTarjetas', 'posBizum', 'posTransferencias'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.calcularResumenCierre());
        });

        // Submits de Formularios
        // (Mantenemos los listeners de submit existentes aquí abajo...)
        const forms = ['cierreForm', 'proveedorForm', 'productoForm', 'escandalloForm', 'inventarioForm', 'deliveryForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                // Clonar para limpiar listeners previos
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
                
                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    // Enrutamiento de submit según ID
                    if (formId === 'cierreForm') this.handleCierreSubmit(e);
                    if (formId === 'proveedorForm') this.handleProveedorSubmit(e); // Necesitas crear estos handlers o mover lógica
                    if (formId === 'productoForm') this.handleProductoSubmit(e);
                    if (formId === 'escandalloForm') this.handleEscandalloSubmit(e);
                    if (formId === 'inventarioForm') this.handleInventarioSubmit(e);
                    if (formId === 'deliveryForm') this.handleDeliverySubmit(e);
                });
            }
        });

        // Global click listener for custom dropdowns (Close when clicking outside)
        document.addEventListener('click', (e) => {
            const wrapper = document.querySelector('.custom-select-wrapper');
            const options = document.getElementById('customSelectOptions');
            // If click is outside wrapper and options are visible
            if (wrapper && !wrapper.contains(e.target) && options && !options.classList.contains('hidden')) {
                options.classList.add('hidden');
                options.classList.remove('open-up');
            }
        });
    }

    // --- NUEVAS FUNCIONES ---

    populateInventarioFilters() {
        const familias = new Set();
        const subfamilias = new Set();
        
        this.db.productos.forEach(p => {
            if (p.familia) familias.add(p.familia);
            if (p.subfamilia) subfamilias.add(p.subfamilia);
        });

        const famSelect = document.getElementById('invFamiliaFilter');
        famSelect.innerHTML = '<option value="">Todas las Familias</option>' + 
            Array.from(familias).map(f => `<option value="${f}">${f}</option>`).join('');

        // Subfamilias se actualizarán al cambiar familia, pero inicialmente cargamos todas o vacías
        // Para simplificar, cargamos todas las subfamilias disponibles inicialmente
        this.updateSubfamiliaFilter();
    }

    updateSubfamiliaFilter() {
        const selectedFam = document.getElementById('invFamiliaFilter').value;
        const subSelect = document.getElementById('invSubfamiliaFilter');
        const subfamilias = new Set();

        this.db.productos.forEach(p => {
            if (!selectedFam || p.familia === selectedFam) {
                if (p.subfamilia) subfamilias.add(p.subfamilia);
            }
        });

        subSelect.innerHTML = '<option value="">Todas las Subfamilias</option>' + 
            Array.from(subfamilias).map(s => `<option value="${s}">${s}</option>`).join('');
    }

    filterInventarioTable() {
        const search = document.getElementById('invSearch').value.toLowerCase();
        const familia = document.getElementById('invFamiliaFilter').value;
        const subfamilia = document.getElementById('invSubfamiliaFilter').value;

        const filtered = this.db.productos.filter(p => {
            const matchSearch = p.nombre.toLowerCase().includes(search);
            const matchFam = !familia || p.familia === familia;
            const matchSub = !subfamilia || p.subfamilia === subfamilia;
            return matchSearch && matchFam && matchSub;
        });

        this.renderInventarioTable(filtered);
    }

    renderInventarioTable(products) {
        const tbody = document.getElementById('inventarioTableBody');
        if (!tbody) return;

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No se encontraron productos</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => {
            const counted = this.inventarioState.counts[p.id];
            const hasCount = counted !== undefined;
            const stockTeorico = p.stockActualUnidades || 0;
            
            return `
            <tr onclick="window.app.openInventarioCounter(${p.id})" style="cursor:pointer; background-color: ${hasCount ? '#e8f6f3' : 'white'}; border-bottom: 1px solid #eee;">
                <td style="padding: 12px;">
                    <div style="font-weight:600; color:#2c3e50;">${p.nombre}</div>
                    <div style="font-size:0.85em; color:#7f8c8d;">${p.unidadBase} ${p.esEmpaquetado ? `(Pack x${p.unidadesPorEmpaque})` : ''}</div>
                </td>
                <td style="padding: 12px; text-align: right;">${stockTeorico.toFixed(2)}</td>
                <td style="padding: 12px; text-align: right; font-weight:bold; color:${hasCount ? '#27ae60' : '#95a5a6'};">
                    ${hasCount ? counted.toFixed(2) : '-'}
                </td>
                <td style="padding: 12px; text-align: center;">
                    ${hasCount ? '✅' : '⬜'}
                </td>
            </tr>
            `;
        }).join('');
    }

    openInventarioCounter(productId) {
        const product = this.db.productos.find(p => p.id === productId);
        if (!product) return;

        this.inventarioState.currentProduct = product;
        const currentCount = this.inventarioState.counts[productId];

        // Detectar si es móvil (ancho < 768px)
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // MODO MÓVIL: Pantalla completa con Numpad
            document.getElementById('invCounterTitle').textContent = product.nombre;
            document.getElementById('invCounterTeorico').textContent = (product.stockActualUnidades || 0).toFixed(2) + ' ' + product.unidadBase;
            
            const input = document.getElementById('invCounterInput');
            input.value = currentCount !== undefined ? currentCount : '';
            
            const modal = document.getElementById('inventarioCounterModal');
            modal.style.display = 'block'; // Block para ocupar todo
            // Asegurar que esté arriba del todo
            window.scrollTo(0, 0);
        } else {
            // MODO ESCRITORIO: Desplegar fila abajo
            
            // 1. Cerrar cualquier otra fila de contador abierta
            const existingRows = document.querySelectorAll('.inv-counter-row');
            existingRows.forEach(row => row.remove());

            // 2. Encontrar la fila del producto
            // Nota: renderInventarioTable no pone IDs a las filas, vamos a buscarlas por el onclick o regenerar
            // Para hacerlo robusto, vamos a buscar el tr que contiene el onclick con este ID
            const rows = document.querySelectorAll('#inventarioTableBody tr');
            let targetRow = null;
            rows.forEach(row => {
                if (row.getAttribute('onclick') && row.getAttribute('onclick').includes(`(${productId})`)) {
                    targetRow = row;
                }
            });

            if (targetRow) {
                // 3. Insertar nueva fila
                const newRow = document.createElement('tr');
                newRow.className = 'inv-counter-row';
                newRow.style.background = '#f8f9fa';
                newRow.innerHTML = `
                    <td colspan="4" style="padding: 15px; border-bottom: 1px solid #ddd;">
                        <div style="display: flex; align-items: center; gap: 20px; justify-content: flex-start;">
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-size: 0.85em; color: #666;">Stock Teórico</span>
                                <strong style="font-size: 1.1em;">${(product.stockActualUnidades || 0).toFixed(2)} ${product.unidadBase}</strong>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <label style="font-weight: 600;">Cantidad Real:</label>
                                <input type="number" id="inv-desktop-input-${productId}" class="form-control" 
                                    style="width: 120px; padding: 8px; font-size: 1.1em; border: 2px solid #3498db; border-radius: 6px;" 
                                    value="${currentCount !== undefined ? currentCount : ''}" step="any">
                                <span style="color: #666;">${product.unidadBase}</span>
                            </div>

                            <div style="display: flex; gap: 10px; margin-left: auto;">
                                <button class="btn-secondary" onclick="window.app.closeInventarioCounter()">Cancelar</button>
                                <button class="btn-primary" onclick="window.app.confirmInventarioCount(${productId}, 'desktop')">Confirmar</button>
                            </div>
                        </div>
                    </td>
                `;
                targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
                
                // Focus al input
                setTimeout(() => {
                    const input = document.getElementById(`inv-desktop-input-${productId}`);
                    if (input) input.focus();
                }, 50);
            }
        }
    }

    closeInventarioCounter() {
        // Cerrar modal móvil
        const modal = document.getElementById('inventarioCounterModal');
        if (modal) modal.style.display = 'none';
        
        // Cerrar fila escritorio
        const existingRows = document.querySelectorAll('.inv-counter-row');
        existingRows.forEach(row => row.remove());
        
        this.inventarioState.currentProduct = null;
    }

    confirmInventarioCount(productId = null, mode = 'mobile') {
        let val;
        let product = this.inventarioState.currentProduct;

        if (mode === 'desktop' && productId) {
            const input = document.getElementById(`inv-desktop-input-${productId}`);
            val = parseFloat(input.value);
            // Si venimos de desktop, el currentProduct puede no estar set si se abrió otro, 
            // pero aquí pasamos el ID explícito, así que buscamos el producto
            product = this.db.productos.find(p => p.id === productId);
        } else {
            // Mobile
            const input = document.getElementById('invCounterInput');
            val = parseFloat(input.value);
        }
        
        if (isNaN(val)) {
            this.showToast('⚠️ Introduce una cantidad válida', true);
            return;
        }

        if (product) {
            this.inventarioState.counts[product.id] = val;
            this.filterInventarioTable(); // Re-render to show update (esto borrará la fila expandida también)
            this.closeInventarioCounter(); // Asegurar limpieza
            this.showToast(`✓ ${product.nombre}: ${val} ${product.unidadBase}`);
        }
    }

    numpadInput(val) {
        const input = document.getElementById('invCounterInput');
        if (val === '.' && input.value.includes('.')) return;
        input.value = input.value + val;
    }

    numpadBackspace() {
        const input = document.getElementById('invCounterInput');
        input.value = input.value.slice(0, -1);
    }

    resetOCRForm() {
        // Limpiar input file
        const fileInput = document.getElementById('ocrFile');
        if(fileInput) fileInput.value = '';
        
        // Resetear UI
        document.querySelectorAll('.ocr-tipo-btn').forEach(btn => btn.classList.remove('active'));
        
        // Ocultar paneles
        const uploadCard = document.getElementById('ocrUploadCard');
        const previewContainer = document.getElementById('ocrPreviewContainer');
        const progressBar = document.getElementById('ocrProgressBar');
        const dataCard = document.getElementById('ocrDataCard');
        const fileInfo = document.getElementById('fileSelectedInfo');
        
        if(uploadCard) uploadCard.classList.add('hidden');
        if(previewContainer) previewContainer.classList.add('hidden');
        if(progressBar) progressBar.classList.add('hidden');
        if(dataCard) dataCard.classList.add('hidden');
        if(fileInfo) fileInfo.classList.add('hidden');
        
        // Mostrar drag & drop de nuevo
        const uploadZone = document.querySelector('.file-upload-zone');
        if (uploadZone) uploadZone.style.display = 'block';
        
        // Resetear bot�n cancelar (asegurar que est� visible para la pr�xima vez)
        const cancelContainer = document.getElementById('ocrUploadCancelContainer');
        if (cancelContainer) cancelContainer.classList.remove('hidden');
        
        // Resetear variables estado
        this.currentImageData = null;
        this.currentOCRType = null;
        this.currentOCRExtractedData = null;
        this.currentPDFText = null;
        this.isPDFWithEmbeddedText = false;

        // Ocultar opciones de escaneo si est�n abiertas
        const scanOptionsCard = document.getElementById('scanOptionsCard');
        if (scanOptionsCard) {
             scanOptionsCard.classList.add('hidden');
             scanOptionsCard.style.display = 'none';
        }

        // Mostrar listas de nuevo
        const listaFacturas = document.getElementById('listaFacturas');
        const listaAlbaranes = document.getElementById('listaAlbaranes');
        const recentDocs = document.getElementById('recentDocumentsList');
        if (listaFacturas) listaFacturas.classList.remove('hidden');
        if (listaAlbaranes) listaAlbaranes.classList.remove('hidden');
        if (recentDocs) recentDocs.classList.remove('hidden');
        
        this.showToast('🔄 Escáner reiniciado');
    }

    async testFirebaseConnection() {
        console.log('🔥 Probando conexión Firebase...');
        try {
            const testDoc = await this.firestoreService.add('test_connection', {
                timestamp: new Date(),
                agent: navigator.userAgent
            });
            console.log('✅ Escritura exitosa:', testDoc.id);
            this.showToast('✅ Firebase Conectado: Escritura OK');
            
            const docs = await this.firestoreService.getAll('test_connection');
            console.log('✅ Lectura exitosa:', docs.length, 'documentos');
            this.showToast('✅ Firebase Conectado: Lectura OK');
            
        } catch (error) {
            console.error('❌ Error Firebase:', error);
            this.showToast('❌ Error Firebase: ' + error.message, true);
        }
    }

    // --- FUNCIONES EXISTENTES ---

    toggleEmpaqueFields() {
        const esEmpaquetado = document.getElementById('productoEsEmpaquetado').value === 'true';
        const fields = document.getElementById('empaqueFields');
        if (esEmpaquetado) {
            fields.classList.remove('hidden');
            this.updateResumenEmpaque();
        } else {
            fields.classList.add('hidden');
            document.getElementById('resumenEmpaque').style.display = 'none';
        }
    }

    updateResumenEmpaque() {
        // Actualizar resumen visual de empaque en tiempo real
        const tipoEmpaque = document.getElementById('productoTipoEmpaque').value;
        const unidadesPorEmpaque = parseFloat(document.getElementById('productoUnidadesPorEmpaque').value);
        const unidadBase = document.getElementById('productoUnidadBase').value;
        
        const resumenDiv = document.getElementById('resumenEmpaque');
        const resumenTexto = document.getElementById('resumenEmpaqueTexto');
        
        if (unidadesPorEmpaque && unidadesPorEmpaque > 0) {
            resumenTexto.textContent = `1 ${tipoEmpaque} = ${unidadesPorEmpaque} ${unidadBase}`;
            resumenDiv.style.display = 'block';
        } else {
            resumenDiv.style.display = 'none';
        }
    }

    addProductoInventario() {
        // Bloqueo: no permitir si ya hay una línea en edición
        if (this.inventarioState.hasEditingLine) {
            this.showToast('⚠️ Termina de contar el producto actual antes de añadir otro', true);
            return;
        }

        const container = document.getElementById('inventarioProductosContainer');
        const rowId = Date.now();
        
        const productosOptions = this.db.productos.map(p => 
            `<option value="${p.id}">${p.nombre} (${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</option>`
        ).join('');

        const row = document.createElement('div');
        row.className = 'inventario-producto-item inventario-editing';
        row.dataset.id = rowId;
        row.dataset.isEditing = 'true';
        row.innerHTML = `
            <div class="inventario-producto-select-wrapper">
                <div class="form-group">
                    <label>Producto *</label>
                    <input type="text" class="inventario-producto-search" placeholder="Buscar o crear producto..." 
                           oninput="app.searchProductoInventario(${rowId})" 
                           onfocus="app.showProductoDropdown(${rowId})"
                           autocomplete="off">
                    <input type="hidden" class="inventario-producto-id" required>
                    <div class="inventario-producto-dropdown hidden"></div>
                </div>
            </div>
            <div class="inventario-producto-info hidden" style="background: #e8f5e9; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 13px;"></div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo Conteo *</label>
                    <select class="inventario-tipo-conteo form-select" onchange="app.updateTipoConteoInventario(${rowId})" required>
                        <option value="">Seleccionar...</option>
                        <option value="solo-unidad">Solo unidad base</option>
                        <option value="solo-empaques">Solo empaques</option>
                        <option value="empaques-sueltas">Empaques + sueltas</option>
                    </select>
                </div>
            </div>
            <div class="inventario-conteo-solo-unidad hidden">
                <div class="form-group">
                    <label>Stock Real (unidad base) *</label>
                    <input type="number" step="0.001" class="inventario-stock-real" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                </div>
            </div>
            <div class="inventario-conteo-solo-empaques hidden">
                <div class="form-group">
                    <label>Nº Empaques Completos *</label>
                    <input type="number" step="1" class="inventario-num-empaques-solo" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                </div>
                <div class="form-group">
                    <label>Stock Real Calculado (unidad base)</label>
                    <input type="number" class="inventario-stock-calculado" readonly style="background: #f0f0f0;">
                </div>
            </div>
            <div class="inventario-conteo-empaques-sueltas hidden">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº Empaques Completos *</label>
                        <input type="number" step="1" class="inventario-num-empaques" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                    </div>
                    <div class="form-group">
                        <label>Unidades Sueltas *</label>
                        <input type="number" step="0.001" class="inventario-unidades-sueltas" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Stock Real Calculado (unidad base)</label>
                    <input type="number" class="inventario-stock-calculado" readonly style="background: #f0f0f0;">
                </div>
            </div>
            <div class="inventario-resumen hidden">
                <div style="background: #fff; border: 2px solid #e3e8ef; border-radius: 8px; padding: 12px; margin: 15px 0;">
                    <h5 style="margin: 0 0 10px 0; color: #1f2d3d; font-size: 14px;">📊 Resumen de Conteo</h5>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
                        <div>
                            <div style="color: #7f8c8d;">Teórico</div>
                            <div style="font-weight: 600; color: #1f2d3d;" class="inventario-stock-teorico">-</div>
                        </div>
                        <div>
                            <div style="color: #7f8c8d;">Contado</div>
                            <div style="font-weight: 600, color: #1f2d3d;" class="inventario-stock-contado">-</div>
                        </div>
                        <div>
                            <div style="color: #7f8c8d;">Diferencia</div>
                            <div style="font-weight: 700;" class="inventario-diferencia">-</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button type="button" class="btn-success inventario-btn-validar" onclick="window.app.validarLineaInventario(${rowId})">✓ Validar Conteo</button>
                <button type="button" class="btn-delete" onclick="window.app.removeProductoInventario(${rowId})">🗑️ Quitar</button>
            </div>
        `;
        container.appendChild(row);

        // Marcar como línea en edición
        this.inventarioState.hasEditingLine = true;
        this.inventarioState.editingLineId = rowId;

        // Deshabilitar botón de añadir
        document.getElementById('addProductoInventario').disabled = true;
    }

    searchProductoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const searchInput = row.querySelector('.inventario-producto-search');
        const dropdown = row.querySelector('.inventario-producto-dropdown');
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            dropdown.classList.add('hidden');
            return;
        }

        const productosMatch = this.db.productos.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm)
        );

        let html = '';
        productosMatch.forEach(p => {
            html += `<div class="inventario-producto-option" onclick="window.app.selectProductoInventario(${rowId}, ${p.id})">
                ${p.nombre} <span style="color: #7f8c8d; font-size: 12px;">(${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</span>
            </div>`;
        });

        // Opción de alta rápida
        if (searchTerm.length > 2) {
            html += `<div class="inventario-producto-option inventario-alta-rapida" onclick="window.app.abrirModalAltaRapida('${searchTerm.replace(/'/g, "\\'")}', ${rowId})">
                ➕ Crear producto rápido "<strong>${searchTerm}</strong>"
            </div>`;
        }

        dropdown.innerHTML = html || '<div style="padding: 10px; color: #7f8c8d; font-size: 13px;">No hay coincidencias</div>';
        dropdown.classList.remove('hidden');
    }

    showProductoDropdown(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const dropdown = row.querySelector('.inventario-producto-dropdown');
        const searchInput = row.querySelector('.inventario-producto-search');

        if (!searchInput.value.trim()) {
            // Mostrar todos los productos
            let html = '';
            this.db.productos.forEach(p => {
                html += `<div class="inventario-producto-option" onclick="window.app.selectProductoInventario(${rowId}, ${p.id})">
                    ${p.nombre} <span style="color: #7f8c8d; font-size: 12px;">(${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</span>
                </div>`;
            });
            dropdown.innerHTML = html;
            dropdown.classList.remove('hidden');
        }
    }

    selectProductoInventario(rowId, productoId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const producto = this.db.productos.find(p => p.id === productoId);

        if (!producto) return;

        // Rellenar campos
        row.querySelector('.inventario-producto-search').value = producto.nombre;
        row.querySelector('.inventario-producto-id').value = productoId;
        row.querySelector('.inventario-producto-dropdown').classList.add('hidden');

        // Mostrar info del producto con formato claro
        const infoDiv = row.querySelector('.inventario-producto-info');
        let infoHTML = `<strong>${producto.nombre}</strong><br>`;
        infoHTML += `📦 Unidad base: <strong>${producto.unidadBase}</strong>`;
        if (producto.esEmpaquetado && producto.unidadesPorEmpaque > 0) {
            infoHTML += `<br>📐 <strong>1 ${producto.tipoEmpaque} = ${producto.unidadesPorEmpaque} ${producto.unidadBase}</strong>`;
            infoHTML += `<br><small style="color: #7f8c8d;">Puedes contar empaques completos + unidades sueltas</small>`;
        } else {
            infoHTML += '<br><span style="color: #ff9800;">⚠️ Este producto no tiene empaque definido - solo conteo en unidad base</span>';
        }
        infoDiv.innerHTML = infoHTML;
        infoDiv.classList.remove('hidden');

        // Pre-seleccionar tipo de conteo según producto
        const tipoConteoSelect = row.querySelector('.inventario-tipo-conteo');
        if (producto.esEmpaquetado) {
            tipoConteoSelect.value = 'empaques-sueltas';
        } else {
            tipoConteoSelect.value = 'solo-unidad';
        }
        this.updateTipoConteoInventario(rowId);
    }

    abrirModalAltaRapida(nombreSugerido, rowId) {
        this.inventarioState.tempProductoAltaRapida = { rowId, nombreSugerido };
        document.getElementById('altaRapidaNombre').value = nombreSugerido;
        document.getElementById('modalAltaRapidaProducto').classList.remove('hidden');
        
        // Cerrar dropdown
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        row.querySelector('.inventario-producto-dropdown').classList.add('hidden');
    }

    toggleAltaRapidaEmpaque() {
        const esEmpaquetado = document.getElementById('altaRapidaEsEmpaquetado').value === 'true';
        const fields = document.getElementById('altaRapidaEmpaqueFields');
        if (esEmpaquetado) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    }

    guardarAltaRapidaProducto() {
        const nombre = document.getElementById('altaRapidaNombre').value.trim();
        const unidadBase = document.getElementById('altaRapidaUnidadBase').value;
        const esEmpaquetado = document.getElementById('altaRapidaEsEmpaquetado').value === 'true';

        if (!nombre || !unidadBase) {
            this.showToast('❌ Completa nombre y unidad base', true);
            return;
        }

        if (esEmpaquetado) {
            const unidadesPorEmpaque = parseFloat(document.getElementById('altaRapidaUnidadesPorEmpaque').value);
            if (!unidadesPorEmpaque || unidadesPorEmpaque <= 0) {
                this.showToast('❌ Especifica las unidades por empaque', true);
                return;
            }
        }

        const producto = {
            nombre,
            unidadBase,
            esEmpaquetado,
            tipoEmpaque: esEmpaquetado ? document.getElementById('altaRapidaTipoEmpaque').value : '',
            unidadesPorEmpaque: esEmpaquetado ? parseFloat(document.getElementById('altaRapidaUnidadesPorEmpaque').value) : 0,
            precioPromedioNeto: parseFloat(document.getElementById('altaRapidaPrecioNeto').value) || 0,
            stockActualUnidades: 0,
            cantidadTotal: 0
        };

        const nuevoProducto = this.db.add('productos', producto);
        this.showToast(`✓ Producto "${nombre}" creado correctamente`);

        // Seleccionar automáticamente en la línea de inventario
        if (this.inventarioState.tempProductoAltaRapida) {
            const rowId = this.inventarioState.tempProductoAltaRapida.rowId;
            this.selectProductoInventario(rowId, nuevoProducto.id);
        }

        // Cerrar modal y limpiar
        this.cerrarModalAltaRapida();
        this.render(); // Actualizar listas
    }

    cerrarModalAltaRapida() {
        document.getElementById('modalAltaRapidaProducto').classList.add('hidden');
        document.getElementById('altaRapidaProductoForm').reset();
        document.getElementById('altaRapidaEmpaqueFields').classList.add('hidden');
        this.inventarioState.tempProductoAltaRapida = null;
    }

    updateTipoConteoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        const producto = this.db.productos.find(p => p.id === productoId);

        // Ocultar todos
        row.querySelector('.inventario-conteo-solo-unidad').classList.add('hidden');
        row.querySelector('.inventario-conteo-solo-empaques').classList.add('hidden');
        row.querySelector('.inventario-conteo-empaques-sueltas').classList.add('hidden');

        if (!tipo) return;

        // Validar si producto tiene empaque cuando se necesita
        if ((tipo === 'solo-empaques' || tipo === 'empaques-sueltas') && producto && !producto.esEmpaquetado) {
            this.showToast('⚠️ Este producto no tiene unidades por empaque definidas. Cuenta en unidad base o configúralo primero.', true);
            row.querySelector('.inventario-tipo-conteo').value = 'solo-unidad';
            row.querySelector('.inventario-conteo-solo-unidad').classList.remove('hidden');
            return;
        }

        // Mostrar el tipo correcto
        if (tipo === 'solo-unidad') {
            row.querySelector('.inventario-conteo-solo-unidad').classList.remove('hidden');
        } else if (tipo === 'solo-empaques') {
            row.querySelector('.inventario-conteo-solo-empaques').classList.remove('hidden');
        } else if (tipo === 'empaques-sueltas') {
            row.querySelector('.inventario-conteo-empaques-sueltas').classList.remove('hidden');
        }

        this.calcularDiferenciaInventario(rowId);
    }

    calcularDiferenciaInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        const producto = this.db.productos.find(p => p.id === productoId);

        if (!producto) return;

        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        let stockContado = 0;

        if (tipo === 'solo-unidad') {
            stockContado = parseFloat(row.querySelector('.inventario-stock-real').value) || 0;
        } else if (tipo === 'solo-empaques') {
            const numEmpaques = parseFloat(row.querySelector('.inventario-num-empaques-solo').value) || 0;
            stockContado = numEmpaques * (producto.unidadesPorEmpaque || 0);
            row.querySelector('.inventario-stock-calculado').value = stockContado.toFixed(3);
        } else if (tipo === 'empaques-sueltas') {
            const numEmpaques = parseFloat(row.querySelector('.inventario-num-empaques').value) || 0;
            const unidadesSueltas = parseFloat(row.querySelector('.inventario-unidades-sueltas').value) || 0;
            stockContado = (numEmpaques * (producto.unidadesPorEmpaque || 0)) + unidadesSueltas;
            row.querySelector('.inventario-stock-calculado').value = stockContado.toFixed(3);
        }

        const stockTeorico = producto.stockActualUnidades || 0;
        const diferencia = stockContado - stockTeorico;

        // Mostrar resumen mejorado con stock teórico vs real
        const resumenDiv = row.querySelector('.inventario-resumen');
        resumenDiv.classList.remove('hidden');
        
        row.querySelector('.inventario-stock-teorico').textContent = `${stockTeorico.toFixed(2)} ${producto.unidadBase}`;
        row.querySelector('.inventario-stock-contado').textContent = `${stockContado.toFixed(2)} ${producto.unidadBase}`;
        
        const diferenciaEl = row.querySelector('.inventario-diferencia');
        const diferenciaText = diferencia >= 0 ? `+${diferencia.toFixed(2)}` : diferencia.toFixed(2);
        diferenciaEl.textContent = `${diferenciaText} ${producto.unidadBase}`;
        
        // Color semántico: verde si cuadra, azul si sobra, rojo si falta
        if (Math.abs(diferencia) < 0.01) {
            diferenciaEl.style.color = '#34c759';
            diferenciaEl.textContent = `✓ Cuadra (${diferencia.toFixed(2)} ${producto.unidadBase})`;
        } else {
            diferenciaEl.style.color = diferencia > 0 ? '#1171ef' : '#ff3b30';
            const tipoAjuste = diferencia > 0 ? 'Sobra' : 'Falta';
            diferenciaEl.textContent = `${tipoAjuste}: ${Math.abs(diferencia).toFixed(2)} ${producto.unidadBase}`;
        }
    }

    validarLineaInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        
        // Validar producto seleccionado
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        if (!productoId) {
            this.showToast('❌ Selecciona un producto', true);
            return;
        }

        // Validar tipo de conteo
        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        if (!tipo) {
            this.showToast('❌ Selecciona el tipo de conteo', true);
            return;
        }

        // Validar conteo según tipo
        let valid = false;
        if (tipo === 'solo-unidad') {
            const stockReal = row.querySelector('.inventario-stock-real').value;
            valid = stockReal && parseFloat(stockReal) >= 0;
        } else if (tipo === 'solo-empaques') {
            const numEmpaques = row.querySelector('.inventario-num-empaques-solo').value;
            valid = numEmpaques && parseFloat(numEmpaques) >= 0;
        } else if (tipo === 'empaques-sueltas') {
            const numEmpaques = row.querySelector('.inventario-num-empaques').value;
            const sueltas = row.querySelector('.inventario-unidades-sueltas').value;
            valid = numEmpaques !== '' && sueltas !== '' && 
                   parseFloat(numEmpaques) >= 0 && parseFloat(sueltas) >= 0;
        }

        if (!valid) {
            this.showToast('❌ Completa el conteo correctamente', true);
            return;
        }

        // Marcar como validada
        row.classList.remove('inventario-editing');
        row.classList.add('inventario-validated');
        row.dataset.isEditing = 'false';

        // Deshabilitar edición en los campos
        row.querySelectorAll('input, select').forEach(input => {
            input.disabled = true;
        });

        // Ocultar botón validar
        row.querySelector('.inventario-btn-validar').style.display = 'none';

        // Actualizar estado
        this.inventarioState.hasEditingLine = false;
        this.inventarioState.editingLineId = null;

        // Habilitar botón de añadir producto
        document.getElementById('addProductoInventario').disabled = false;

        this.showToast('✓ Conteo validado correctamente');
    }

    removeProductoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        if (!row) return;

        const isEditing = row.dataset.isEditing === 'true';
        
        row.remove();

        // Si era la línea en edición, liberar el estado
        if (isEditing) {
            this.inventarioState.hasEditingLine = false;
            this.inventarioState.editingLineId = null;
            document.getElementById('addProductoInventario').disabled = false;
        }
    }

    render() {
        const titles = {
            'ocr': 'Escáner de Documentos',
            'cierres': '🧾 Cierres de Caja',
            'compras': '📦 Compras',
            'proveedores': '🏢 Proveedores',
            'productos': '🥘 Productos',
            'escandallos': '📋 Escandallos',
            'inventario': '📦 Control de Stock',
            'delivery': '🛵 Delivery',
            'pnl': '💰 Cuenta de Explotación'
        };

        // 1. Gestión de Vistas
        document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
        const viewMap = {
            'ocr': 'ocrView', 'cierres': 'cierresView', 'compras': 'comprasView',
            'proveedores': 'proveedoresView', 'productos': 'productosView',
            'escandallos': 'escandallosView', 'inventario': 'inventarioView',
            'delivery': 'deliveryView', 'pnl': 'pnlView'
        };
        const currentViewId = viewMap[this.currentView];
        if(document.getElementById(currentViewId)) document.getElementById(currentViewId).classList.remove('hidden');

        // 2. Gestión de Cabecera y BOTONES DE ACCIÓN
        const mainHeader = document.querySelector('.header');
        if (this.currentView === 'ocr') {
            if(mainHeader) mainHeader.style.display = 'none';
        } else {
            if(mainHeader) {
                mainHeader.style.display = 'flex';
                document.getElementById('viewTitle').textContent = titles[this.currentView];
                
                // INYECCIÓN DE BOTONES (Restauración)
                const actionsDiv = document.getElementById('headerActions');
                if (actionsDiv) {
                    let btnHtml = '';
                    switch(this.currentView) {
                        case 'cierres':
                            // Usa expandForm porque el formulario YA existe en el HTML
                            btnHtml = `<button id="toggleCierreForm" class="btn-primary" onclick="window.app.expandForm('cierre')">+ Nuevo Cierre</button>`;
                            break;
                        case 'proveedores':
                            // Usa toggleForm para mostrar/ocultar el div
                            btnHtml = `<button id="toggleProveedorForm" class="btn-primary" onclick="window.app.toggleForm('proveedor')">+ Nuevo Proveedor</button>`;
                            break;
                        case 'productos':
                            btnHtml = `<button id="toggleProductoForm" class="btn-primary" onclick="window.app.toggleForm('producto')">+ Nuevo Producto</button>`;
                            break;
                        case 'escandallos':
                            btnHtml = `<button id="toggleEscandalloForm" class="btn-primary" onclick="window.app.expandForm('escandallo')">+ Nuevo Escandallo</button>`;
                            break;
                        case 'inventario':
                            btnHtml = `
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn-primary" onclick="window.app.expandForm('inventario')">📝 Crear Inventario</button>
                                    <button class="btn-secondary" onclick="window.app.calcularCOGS()">🧮 Nuevo COGS</button>
                                </div>
                            `;
                            break;
                        case 'compras':
                            // En compras solemos usar filtros, pero podemos poner botón de añadir manual
                            btnHtml = `<button class="btn-secondary" onclick="window.app.currentView='ocr'; window.app.render()">📸 Ir a Escáner</button>`;
                            break;
                    }
                    actionsDiv.innerHTML = btnHtml;
                }
            }
        }

        // 3. Renderizar Contenido
        switch(this.currentView) {
            case 'ocr': this.renderCompras(); break;
            case 'cierres': this.renderCierres(); this.collapseForm('cierre'); break;
            case 'compras': this.renderCompras(); break;
            case 'proveedores': this.renderProveedores(); this.collapseForm('proveedor'); break;
            case 'productos': this.renderProductos(); this.collapseForm('producto'); break;
            case 'escandallos': this.renderEscandallos(); this.collapseForm('escandallo'); break;
            case 'inventario': this.renderInventarios(); break;
            case 'delivery': this.renderDelivery(); break;
            case 'pnl': this.renderPnL(); break;
        }
    }

    abrirModalEditarCierre(id) {
        const cierre = this.db.cierres.find(c => c.id === id);
        if (!cierre) return;

        // 1. Abrir formulario
        this.expandForm('cierre');
        
        // 2. Llenar datos básicos
        document.getElementById('cierreFecha').value = cierre.fecha;
        document.getElementById('cierreTurno').value = cierre.turno;
        
        // 3. Simular paso 1 -> paso 2
        this.iniciarCierre();
        
        // 4. Llenar desglose de efectivo
        if (cierre.desgloseEfectivo) {
            Object.keys(cierre.desgloseEfectivo).forEach(key => {
                const el = document.getElementById(key);
                if (el) el.value = cierre.desgloseEfectivo[key];
            });
        }
        
        // 5. Llenar Datafonos
        const containerDatafonos = document.getElementById('datafonosContainer');
        if (containerDatafonos) {
            containerDatafonos.innerHTML = '';
            if (cierre.datafonos && cierre.datafonos.length > 0) {
                cierre.datafonos.forEach(d => {
                    const row = document.createElement('div');
                    row.className = 'datafono-item';
                    row.innerHTML = `
                        <input type="text" class="datafono-nombre" placeholder="Nombre (ej: Visa)" value="${d.nombre}">
                        <input type="number" class="datafono-importe" step="0.01" placeholder="0.00" value="${d.importe}">
                        <button type="button" class="btn-delete-row" onclick="this.parentElement.remove(); window.app.calcularTotalesCierre()">🗑️</button>
                    `;
                    containerDatafonos.appendChild(row);
                });
            }
        }

        // 6. Llenar Otros Medios
        const containerOtros = document.getElementById('otrosMediosContainer');
        if (containerOtros) {
            containerOtros.innerHTML = '';
            if (cierre.otrosMedios && cierre.otrosMedios.length > 0) {
                cierre.otrosMedios.forEach(m => {
                    const row = document.createElement('div');
                    row.className = 'otro-medio-item';
                    row.innerHTML = `
                        <input type="text" class="otro-medio-tipo" placeholder="Tipo (ej: Glovo)" value="${m.tipo}">
                        <input type="number" class="otro-medio-importe" step="0.01" placeholder="0.00" value="${m.importe}">
                        <button type="button" class="btn-delete-row" onclick="this.parentElement.remove(); window.app.calcularTotalesCierre()">🗑️</button>
                    `;
                    containerOtros.appendChild(row);
                });
            }
        }

        // 7. Llenar POS
        if (document.getElementById('posEfectivo')) document.getElementById('posEfectivo').value = cierre.posEfectivo || 0;
        if (document.getElementById('posTarjetas')) document.getElementById('posTarjetas').value = cierre.posTarjetas || 0;
        if (document.getElementById('posTickets')) document.getElementById('posTickets').value = cierre.posTickets || 0;
        
        // 8. Configurar estado de edición
        const form = document.getElementById('cierreForm');
        form.dataset.editId = cierre.id;
        const btn = document.getElementById('toggleCierreForm');
        if(btn) btn.textContent = 'Guardar Cambios';
        
        // Recalcular totales
        this.calcularTotalesCierre();
        
        this.showToast('✏️ Editando cierre del ' + cierre.fecha);
    }

    renderCierres_OLD_1062() {
        const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        
        if (cierres.length === 0) {
            document.getElementById('listaCierres').innerHTML = '<p class="empty-state">No hay cierres registrados</p>';
            return;
        }

        const html = cierres.reverse().map(c => {
            const ticketMedio = c.numTickets > 0 ? (c.totalPos / c.numTickets).toFixed(2) : '0.00';
            const descuadreAbs = Math.abs(c.descuadreTotal);
            const cuadra = descuadreAbs <= 0.01;
            
            // Badge de estado
            const badgeClass = cuadra ? 'badge-cuadra' : 'badge-descuadre';
            const badgeText = cuadra ? '✅ CUADRA' : `⚠ DESCUADRE: ${Math.abs(c.descuadreTotal).toFixed(2)} €`;
            
            // Calcular diferencias por método
            const efectivoPOS = c.posEfectivo || 0;
            const efectivoReal = c.efectivoContado || 0;
            const deltaEfectivo = efectivoReal - efectivoPOS;
            
            const tarjetasPOS = c.posTarjetas || 0;
            const tarjetasReal = c.totalDatafonos || 0;
            const deltaTarjetas = tarjetasReal - tarjetasPOS;
            
            // Preparar filas condicionales (Bizum/Transferencias)
            const bizumPOS = c.posBizum || 0;
            const bizumReal = c.otrosMedios ? (c.otrosMedios.find(m => m.tipo === 'Bizum')?.importe || 0) : 0;
            const deltaBizum = bizumReal - bizumPOS;
            let bizumRow = '';
            if (bizumReal > 0 || bizumPOS > 0) {
                bizumRow = `
                <tr>
                    <td>📲 Bizum</td>
                    <td>${bizumPOS.toFixed(2)} €</td>
                    <td>${bizumReal.toFixed(2)} €</td>
                    <td class="${this.getDeltaClass(deltaBizum)}">${deltaBizum >= 0 ? '+' : ''}${deltaBizum.toFixed(2)} €</td>
                </tr>`;
            }

            const transPOS = c.posTransferencias || 0;
            const transReal = c.otrosMedios ? (c.otrosMedios.find(m => m.tipo === 'Transferencia')?.importe || 0) : 0;
            const deltaTrans = transReal - transPOS;
            let transRow = '';
            if (transReal > 0 || transPOS > 0) {
                transRow = `
                <tr>
                    <td>🏦 Transferencias</td>
                    <td>${transPOS.toFixed(2)} €</td>
                    <td>${transReal.toFixed(2)} €</td>
                    <td class="${this.getDeltaClass(deltaTrans)}">${deltaTrans >= 0 ? '+' : ''}${deltaTrans.toFixed(2)} €</td>
                </tr>`;
            }

            // Otros medios varios
            let otrosRows = '';
            if (c.otrosMedios) {
                c.otrosMedios
                    .filter(m => m.tipo !== 'Bizum' && m.tipo !== 'Transferencia')
                    .forEach(m => {
                        otrosRows += `
                        <tr>
                            <td>💰 ${m.tipo}</td>
                            <td>–</td>
                            <td>${m.importe.toFixed(2)} €</td>
                            <td class="delta-cero">–</td>
                        </tr>`;
                    });
            }
            
            // Resumen compacto
            const resumenCompacto = `POS: ${c.totalPos.toFixed(2)} €  |  REAL: ${c.totalReal.toFixed(2)} €  |  Δ: ${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €`;
            
            // Banda de resultado
            const bandaResultado = cuadra ? `
                <div class="cierre-banda-cuadrado">
                    ✔ Cierre cuadrado (Real ${c.totalReal.toFixed(2)} € – POS ${c.totalPos.toFixed(2)} €)
                </div>
            ` : `
                <div class="cierre-banda-descuadre">
                    🔍 Descuadre total: <strong>${Math.abs(c.descuadreTotal).toFixed(2)} €</strong> (Real ${c.totalReal.toFixed(2)} € – POS ${c.totalPos.toFixed(2)} €)
                </div>
            `;
            
            return `
            <div class="cierre-card-compacta">
                <div class="cierre-header-compacta">
                    <div class="cierre-titulo-compacta">
                        Cierre ${c.fecha} – ${c.turno}
                    </div>
                    <div class="cierre-resumen-inline">
                        ${resumenCompacto}
                    </div>
                    <div class="cierre-header-derecha">
                        <div class="cierre-badge-v2 ${badgeClass}">${badgeText}</div>
                        <button class="btn-edit" onclick="window.app.editItem('cierres', ${c.id})" title="Editar">✏️</button>
                        <button class="btn-delete" onclick="window.app.deleteItem('cierres', ${c.id})" title="Eliminar">🗑️</button>
                        <button class="btn-toggle-detalle" onclick="this.closest('.cierre-card-compacta').classList.toggle('detalle-visible')" title="Ver detalle">▼</button>
                    </div>
                </div>
                
                <div class="cierre-detalle-desplegable">
                    <div class="cierre-tabla-wrapper">
                        <table class="cierre-tabla-metodos">
                            <thead>
                                <tr>
                                    <th>Método</th>
                                    <th>POS declarado</th>
                                    <th>Real contado</th>
                                    <th>Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>💶 Efectivo</td>
                                    <td>${efectivoPOS > 0 ? efectivoPOS.toFixed(2) + ' €' : '–'}</td>
                                    <td>${efectivoReal.toFixed(2)} €</td>
                                    <td class="${this.getDeltaClass(deltaEfectivo)}">${deltaEfectivo >= 0 ? '+' : ''}${deltaEfectivo.toFixed(2)} €</td>
                                </tr>
                                <tr>
                                    <td>💳 Tarjetas</td>
                                    <td>${tarjetasPOS.toFixed(2)} €</td>
                                    <td>${tarjetasReal.toFixed(2)} €</td>
                                    <td class="${this.getDeltaClass(deltaTarjetas)}">${deltaTarjetas >= 0 ? '+' : ''}${deltaTarjetas.toFixed(2)} €</td>
                                </tr>
                                ${bizumRow}
                                ${transRow}
                                ${otrosRows}
                                <tr class="fila-total">
                                    <td><strong>TOTAL</strong></td>
                                    <td><strong>${c.totalPos.toFixed(2)} €</strong></td>
                                    <td><strong>${c.totalReal.toFixed(2)} €</strong></td>
                                    <td class="${this.getDeltaClass(c.descuadreTotal)}"><strong>${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- INFO SECUNDARIA -->
                    <div class="cierre-info-secundaria">
                        🎫 Tickets: <strong>${c.numTickets}</strong> | 🎟 Ticket medio: <strong>${ticketMedio} €</strong>
                    </div>
                    
                    <!-- BANDA RESULTADO -->
                    ${bandaResultado}
                </div>
            </div>
            `;
        }).join('');
        
        document.getElementById('listaCierres').innerHTML = html;
    }

    // Helper para clases de diferencia
    getDeltaClass(delta) {
        const abs = Math.abs(delta);
        return abs <= 0.01 ? 'delta-cero' : 'delta-descuadre';
    }

    renderCompras_OLD_1222() {
        // Poblar datalist de proveedores para autocomplete
        const datalist = document.getElementById('datalistProveedores');
        if (datalist) {
            datalist.innerHTML = this.db.proveedores
                .map(p => `<option value="${p.nombreFiscal}">${p.nombreComercial ? `(${p.nombreComercial})` : ''}</option>`)
                .join('');
        }

        let facturas = this.db.getByPeriod('facturas', this.currentPeriod);
        let albaranes = this.db.getByPeriod('albaranes', this.currentPeriod);

        // Aplicar filtros si existen
        if (this.currentFilters) {
            const { proveedor, desde, hasta } = this.currentFilters;
            
            if (proveedor) {
                facturas = facturas.filter(f => f.proveedor.toLowerCase().includes(proveedor));
                albaranes = albaranes.filter(a => a.proveedor.toLowerCase().includes(proveedor));
            }
            
            if (desde) {
                // Asegurar formato YYYY-MM-DD para comparación
                const fechaDesde = desde.includes('-') ? desde : new Date(desde).toISOString().split('T')[0];
                facturas = facturas.filter(f => {
                    const fechaFactura = f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0];
                    return fechaFactura >= fechaDesde;
                });
                albaranes = albaranes.filter(a => {
                    const fechaAlbaran = a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0];
                    return fechaAlbaran >= fechaDesde;
                });
            }
            
            if (hasta) {
                // Asegurar formato YYYY-MM-DD para comparación
                const fechaHasta = hasta.includes('-') ? hasta : new Date(hasta).toISOString().split('T')[0];
                facturas = facturas.filter(f => {
                    const fechaFactura = f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0];
                    return fechaFactura <= fechaHasta;
                });
                albaranes = albaranes.filter(a => {
                    const fechaAlbaran = a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0];
                    return fechaAlbaran <= fechaHasta;
                });
            }
        }

        const facturasHtml = facturas.length > 0 ? facturas.reverse().map(f => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${f.proveedor} - ${f.numeroFactura}</span>
                    <span class="list-item-value">${f.total.toFixed(2)}€</span>
                </div>
                <div class="list-item-details">
                    📅 ${f.fecha} | 🏷️ ${f.categoria}
                </div>
                <div class="list-item-actions">
                    ${f.archivoData ? `<button class="btn-view" onclick="window.app.verArchivoFactura(${f.id})" title="Ver archivo">🔍</button>` : ''}
                    <button class="btn-verify-factura" onclick="window.app.verificarFacturaAlbaranes(${f.id})" title="Verificar albaranes">📋</button>
                    <button class="btn-edit" onclick="window.app.editItem('facturas', ${f.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('facturas', ${f.id})" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay facturas registradas</p>';
        
        document.getElementById('listaFacturas').innerHTML = facturasHtml;

        const albaranesHtml = albaranes.length > 0 ? albaranes.reverse().map(a => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${a.proveedor} - ${a.numeroAlbaran}</span>
                    <span class="list-item-value">${a.verificado ? '✅' : '⏳'}</span>
                </div>
                <div class="list-item-details">
                    📅 ${a.fecha}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('albaranes', ${a.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('albaranes', ${a.id})">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay albaranes registradas</p>';
        
        document.getElementById('listaAlbaranes').innerHTML = albaranesHtml;

        // --- NUEVO: Renderizar lista unificada para OCR View ---
        const recentDocsContainer = document.getElementById('recentDocsContainer');
        if (recentDocsContainer) {
            const filter = document.getElementById('documentFilter') ? document.getElementById('documentFilter').value : 'all';
            let allDocs = [];

            // 1. Facturas
            if (filter === 'all' || filter === 'factura' || filter === 'ticket') {
                let facts = this.db.getByPeriod('facturas', this.currentPeriod);
                if (filter === 'ticket') {
                    facts = facts.filter(f => f.categoria && f.categoria.toLowerCase().includes('ticket'));
                }
                allDocs = [...allDocs, ...facts.map(f => ({...f, type: 'factura', label: 'Factura'}))];
            }

            // 2. Albaranes
            if (filter === 'all' || filter === 'albaran') {
                const albs = this.db.getByPeriod('albaranes', this.currentPeriod);
                allDocs = [...allDocs, ...albs.map(a => ({...a, type: 'albaran', label: 'Albarán'}))];
            }

            // 3. Cierres
            if (filter === 'all' || filter === 'cierre') {
                const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
                allDocs = [...allDocs, ...cierres.map(c => ({...c, type: 'cierre', label: 'Cierre', proveedor: 'Cierre de Caja', total: c.totalReal}))];
            }

            // Ordenar por fecha descendente
            allDocs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            // Renderizar
            if (allDocs.length === 0) {
                recentDocsContainer.innerHTML = '<p class="empty-state" style="text-align:center; padding:20px; color:#94a3b8;">No hay documentos recientes</p>';
            } else {
                recentDocsContainer.innerHTML = allDocs.map(doc => `
                    <div class="recent-doc-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; transition: transform 0.2s;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="background: #f1f5f9; padding: 10px; border-radius: 8px; font-size: 20px;">
                                ${doc.type === 'factura' ? '🧾' : doc.type === 'albaran' ? '📦' : doc.type === 'cierre' ? '💰' : '📄'}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #1e293b;">${doc.proveedor || 'Desconocido'}</div>
                                <div style="font-size: 13px; color: #64748b;">${doc.label} • ${this.formatDate(doc.fecha)}</div>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: #1e293b;">${(doc.total || 0).toFixed(2)} €</div>
                            <div style="display: flex; gap: 5px; justify-content: flex-end; margin-top: 5px;">
                                <button class="btn-icon" onclick="window.app.editItem('${doc.type === 'cierre' ? 'cierres' : doc.type === 'albaran' ? 'albaranes' : 'facturas'}', ${doc.id})" title="Editar">✏️</button>
                                <button class="btn-icon delete" onclick="window.app.deleteItem('${doc.type === 'cierre' ? 'cierres' : doc.type === 'albaran' ? 'albaranes' : 'facturas'}', ${doc.id})" title="Eliminar">🗑️</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    filtrarCompras() {
        const proveedor = document.getElementById('filtroProveedor').value.toLowerCase().trim();
        const desde = document.getElementById('filtroFechaDesde').value;
        const hasta = document.getElementById('filtroFechaHasta').value;

        this.currentFilters = { proveedor, desde, hasta };
        this.renderCompras();
        this.showToast('🔍 Filtros aplicados');
    }

    verificarFacturaAlbaranes(facturaId) {
        const factura = this.db.facturas.find(f => f.id === facturaId);
        if (!factura) {
            this.showToast('❌ Factura no encontrada', true);
            return;
        }

        // Validar que la factura tenga los datos necesarios
        if (!factura.proveedor || !factura.fecha) {
            this.showToast('❌ Factura sin datos de proveedor o fecha', true);
            return;
        }

        // Buscar albaranes del mismo proveedor anteriores o iguales a la fecha de la factura
        const albaranesCandidatos = this.db.albaranes.filter(a => 
            a.proveedor === factura.proveedor && 
            a.fecha && a.fecha <= factura.fecha
        );

        if (albaranesCandidatos.length === 0) {
            this.showModal(
                '📋 Información de Verificación',
                `No se encontraron albaranes del proveedor "<strong>${factura.proveedor}</strong>" anteriores o iguales a la fecha <strong>${factura.fecha}</strong>.<br><br>` +
                `<strong>Factura:</strong> ${factura.numeroFactura}<br>` +
                `<strong>Total:</strong> ${(factura.total || factura.baseImponible || 0).toFixed(2)}€<br><br>` +
                `<small style="color: #7f8c8d;">💡 Esto es normal si aún no has registrado albaranes de este proveedor. Los albaranes son opcionales.</small>`,
                'info'
            );
            return;
        }

        // Mostrar resumen
        const totalAlbaranes = albaranesCandidatos.reduce((sum, a) => sum + (a.total || 0), 0);
        const totalFactura = factura.total || factura.baseImponible || 0;
        const diferencia = Math.abs(totalFactura - totalAlbaranes);
        const coincide = diferencia < 0.01;

        const detalleAlbaranes = albaranesCandidatos.map(a => 
            `<li><strong>${a.numeroAlbaran}</strong> (${a.fecha}): ${(a.total || 0).toFixed(2)}€</li>`
        ).join('');


        const mensajeHTML = `
            <div style="text-align: left;">
                <p><strong>Factura:</strong> ${factura.numeroFactura}</p>
                <p><strong>Proveedor:</strong> ${factura.proveedor}</p>
                <p><strong>Fecha:</strong> ${factura.fecha}</p>
                <p><strong>Total Factura:</strong> ${totalFactura.toFixed(2)}€</p>
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #e3e8ef;">
                <p><strong>Albaranes encontrados (${albaranesCandidatos.length}):</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">${detalleAlbaranes}</ul>
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #e3e8ef;">
                <p><strong>Total Albaranes:</strong> ${totalAlbaranes.toFixed(2)}€</p>
                <p><strong>Diferencia:</strong> <span style="color: ${coincide ? '#27ae60' : '#e67e22'}; font-weight: 600;">${diferencia.toFixed(2)}€</span></p>
                <p style="font-size: 16px; font-weight: 600; color: ${coincide ? '#27ae60' : '#e67e22'}; margin-top: 15px;">
                    ${coincide ? '✅ Los totales coinciden' : '⚠️ Los totales NO coinciden'}
                </p>
            </div>
        `;

        this.showModal(
            coincide ? '✅ Verificación Correcta' : '⚠️ Verificación con Diferencias',
            mensajeHTML,
            coincide ? 'success' : 'warning'
        );
    }

    verArchivoFactura(facturaId) {
        const factura = this.db.facturas.find(f => f.id === facturaId);
        if (!factura) {
            this.showToast('❌ Factura no encontrada', true);
            return;
        }

        if (!factura.archivoData) {
            this.showToast('❌ Esta factura no tiene archivo adjunto', true);
            return;
        }

        // Crear modal para mostrar el archivo
        const modalHTML = `
            <div id="modalVisorArchivo" class="modal-overlay" style="z-index: 10000;">
                <div class="modal-content" style="max-width: 90vw; max-height: 90vh; width: 900px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>📄 ${factura.archivoNombre || 'Archivo de Factura'}</h3>
                        <button onclick="window.app.cerrarVisorArchivo()" class="btn-secondary">✕ Cerrar</button>
                    </div>
                    <div style="overflow: auto; max-height: 75vh; border: 1px solid #e3e8ef; border-radius: 6px; background: #f8f9fa;">
                        ${factura.archivoNombre && factura.archivoNombre.toLowerCase().endsWith('.pdf') 
                            ? `<iframe src="${factura.archivoData}" style="width: 100%; height: 70vh; border: none;"></iframe>`
                            : `<img src="${factura.archivoData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    cerrarVisorArchivo() {
        const modal = document.getElementById('modalVisorArchivo');
        if (modal) modal.remove();
    }

    renderProveedores_OLD_1424() {
        const proveedores = this.db.proveedores;
        
        // DEBUG: Verificar datos de proveedores
        // console.log('📋 DEBUG RENDER - Total proveedores:', proveedores.length);
        // console.log('📋 DEBUG RENDER - Proveedores completos:', proveedores);
        
        const html = proveedores.length > 0 ? proveedores.map(p => {
            const nombre = p.nombreFiscal || p.nombre || 'Sin nombre';
            const comercial = p.nombreComercial ? ` (${p.nombreComercial})` : '';
            const tipo = p.tipo || p.tipoProveedor || 'N/A';
            
            return `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${nombre}${comercial}</span>
                    <span class="list-item-value">${tipo}</span>
                </div>
                <div class="list-item-details">
                    🏢 ${p.nifCif || 'Sin NIF/CIF'} | 📞 ${p.telefono || 'Sin teléfono'} | 📧 ${p.email || 'Sin email'}
                    ${p.condicionesPago ? `| 💳 ${p.condicionesPago}` : ''}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('proveedores', ${p.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('proveedores', ${p.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay proveedores registrados</p>';
        
        // console.log('📋 DEBUG RENDER - HTML generado (primeros 500 chars):', html.substring(0, 500));
        // console.log('📋 DEBUG RENDER - Elemento listaProveedores existe?:', !!document.getElementById('listaProveedores'));
        
        const contenedor = document.getElementById('listaProveedores');
        if (contenedor) {
            contenedor.innerHTML = html;
            // console.log('📋 DEBUG RENDER - HTML insertado correctamente. Children:', contenedor.children.length);
        } else {
            console.error('❌ ERROR - Elemento listaProveedores NO ENCONTRADO en el DOM');
        }
        
        // Actualizar dropdown de productos
        const selectProveedor = document.getElementById('productoProveedorId');
        if (selectProveedor) {
            const options = proveedores.map(p => 
                `<option value="${p.id}">${p.nombreFiscal || p.nombre}</option>`
            ).join('');
            selectProveedor.innerHTML = '<option value="">Seleccionar...</option>' + options;
        }
    }

    renderProductos_OLD_1475() {
        const productos = this.db.productos;
        const html = productos.length > 0 ? productos.map(p => {
            const precio = p.precioPromedioNeto || p.precio || 0;
            const stock = p.stockActualUnidades || 0;
            const unidad = p.unidadBase || 'ud';
            const proveedor = p.proveedorNombre || p.proveedor || 'Sin proveedor';
            
            let empaqueInfo = '';
            if (p.esEmpaquetado && p.unidadesPorEmpaque) {
                const numEmpaques = (stock / p.unidadesPorEmpaque).toFixed(2);
                empaqueInfo = ` | 📦 ${numEmpaques} ${p.tipoEmpaque}s`;
            }
            
            return `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${p.nombre}</span>
                    <span class="list-item-value">${precio.toFixed(2)}€/${unidad}</span>
                </div>
                <div class="list-item-details">
                    🏢 ${proveedor} | 📦 Stock: ${stock.toFixed(2)} ${unidad}${empaqueInfo}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('productos', ${p.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('productos', ${p.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay productos en el catálogo</p>';
        
        document.getElementById('listaProductos').innerHTML = html;
    }

    renderEscandallos_OLD_1509() {
        const escandallos = this.db.escandallos;
        const html = escandallos.length > 0 ? escandallos.map(e => {
            const fcClass = e.foodCost > 35 ? 'fc-high' : e.foodCost > 25 ? 'fc-medium' : 'fc-low';
            const numIngredientes = e.ingredientes ? e.ingredientes.length : 0;
            
            return `
            <div class="escandallo-card">
                <div class="escandallo-header">
                    <span class="escandallo-title">${e.nombre}${e.codigo ? ` (${e.codigo})` : ''}</span>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="window.app.editItem('escandallos', ${e.id})">✏️</button>
                        <button class="btn-delete" onclick="window.app.deleteItem('escandallos', ${e.id})">🗑️</button>
                    </div>
                </div>
                <div class="escandallo-stats">
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">PVP con IVA (${e.tipoIva}%)</div>
                        <div class="escandallo-stat-value">${e.pvpConIva.toFixed(2)}€</div>
                    </div>
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">Coste Neto</div>
                        <div class="escandallo-stat-value">${e.costeTotalNeto.toFixed(2)}€</div>
                    </div>
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">Food Cost %</div>
                        <div class="escandallo-stat-value ${fcClass}">${e.foodCost.toFixed(1)}%</div>
                    </div>
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">Margen Bruto</div>
                        <div class="escandallo-stat-value">${e.margenPorcentaje.toFixed(1)}%</div>
                    </div>
                </div>
                ${numIngredientes > 0 ? `
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <strong style="font-size: 13px; color: #34495e;">🧂 Ingredientes (${numIngredientes}):</strong>
                    <div style="margin-top: 8px; font-size: 12px; color: #7f8c8d;">
                        ${e.ingredientes.map(ing => {
                            const producto = this.db.productos.find(p => p.id === ing.productoId);
                            const nombreProd = producto ? producto.nombre : ing.nombre || 'Producto desconocido';
                            const unidad = ing.unidad || '';
                            const costeTotal = ing.costeTotal || ing.costeIngrediente || 0;
                            return `• ${nombreProd}: ${ing.cantidad} ${unidad} × ${ing.costeUnitario.toFixed(4)}€ = ${costeTotal.toFixed(2)}€`;
                        }).join('<br>')}
                </div>
                </div>` : ''}
                <div style="margin-top: 10px; font-size: 13px; color: #7f8c8d;">
                    💶 PVP Neto: ${e.pvpNeto.toFixed(2)}€ | 📈 Margen: ${e.margenBruto.toFixed(2)}€
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay escandallos creados</p>';
        
        document.getElementById('listaEscandallos').innerHTML = html;
    }

    // Conversión de unidades para escandallos
    convertirUnidades(precioPromedioNeto, unidadBase, unidadEscandallo) {
        // Retorna el coste unitario en la unidad del escandallo
        if (!unidadBase || !unidadEscandallo || !precioPromedioNeto) return 0;
        
        // Sin conversión necesaria
        if (unidadBase === unidadEscandallo) return precioPromedioNeto;
        
        // Conversión kg ↔ g
        if (unidadBase === 'kg' && unidadEscandallo === 'g') {
            return precioPromedioNeto / 1000;  // €/kg → €/g
        }
        if (unidadBase === 'g' && unidadEscandallo === 'kg') {
            return precioPromedioNeto * 1000;  // €/g → €/kg
        }
        
        // Conversión L ↔ ml
        if (unidadBase === 'L' && unidadEscandallo === 'ml') {
            return precioPromedioNeto / 1000;  // €/L → €/ml
        }
        if (unidadBase === 'ml' && unidadEscandallo === 'L') {
            return precioPromedioNeto * 1000;  // €/ml → €/L
        }
        
        // Unidades: sin conversión
        if (unidadBase === 'ud' && unidadEscandallo === 'ud') {
            return precioPromedioNeto;
        }
        
        // Si no hay conversión válida, retornar 0 (error)
        return 0;
    }

    onIngredienteProductoChange(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const productoId = parseInt(selectElement.value);
        const row = selectElement.closest('.ingrediente-item');
        
        if (!productoId) return;
        
        // Obtener producto
        const producto = this.db.productos.find(p => p.id === productoId);
        if (!producto) return;
        
        // Validar que el producto tenga precioPromedioNeto
        if (!producto.precioPromedioNeto || producto.precioPromedioNeto <= 0) {
            this.showModal('⚠️ Producto sin coste', 
                `El producto "${producto.nombre}" no tiene precio promedio neto definido. Por favor, actualiza la ficha del producto.`, 
                'warning');
            selectElement.value = '';
            return;
        }
        
        // Autocompletar unidad: convertir unidadBase a unidad de escandallo
        const unidadSelect = row.querySelector('.ingrediente-unidad');
        let unidadEscandallo = producto.unidadBase;
        
        // Por defecto, si es kg → usar g, si es L → usar ml
        if (producto.unidadBase === 'kg') unidadEscandallo = 'g';
        else if (producto.unidadBase === 'L') unidadEscandallo = 'ml';
        else if (producto.unidadBase === 'ud') unidadEscandallo = 'ud';
        
        unidadSelect.value = unidadEscandallo;
        
        // Calcular coste unitario con conversión
        const costeUnitarioConvertido = this.convertirUnidades(
            producto.precioPromedioNeto, 
            producto.unidadBase, 
            unidadEscandallo
        );
        
        // Autocompletar coste unitario (precio neto del producto convertido)
        const costeUnitarioInput = row.querySelector('.ingrediente-coste-unitario');
        costeUnitarioInput.value = costeUnitarioConvertido.toFixed(4);
        
        // Recalcular
        this.calcularCostesEscandallo();
    }

    calcularPVPNeto() {
        const pvpConIva = parseFloat(document.getElementById('escandalloPVPConIVA').value);
        const tipoIva = parseFloat(document.getElementById('escandalloTipoIVA').value);
        const pvpNeto = pvpConIva / (1 + tipoIva / 100);
        
        document.getElementById('escandalloPVPNeto').value = pvpNeto.toFixed(2);
        this.calcularCostesEscandallo();
    }

    addIngredienteRow() {
        const container = document.getElementById('ingredientesContainer');
        const rowId = Date.now();
        
        // Obtener lista de productos con unidad base
        const productosOptions = this.db.productos.map(p => {
            const proveedor = this.db.proveedores.find(pr => pr.id === p.proveedorId);
            return `<option value="${p.id}" data-precio="${p.precio}" data-unidad="${p.unidadBase}">${p.nombre} (${proveedor ? proveedor.nombre : 'Sin proveedor'})</option>`;
        }).join('');

        const row = document.createElement('div');
        row.className = 'ingrediente-item';
        row.dataset.id = rowId;
        row.innerHTML = `
            <div class="form-group">
                <label>Producto *</label>
                <select class="ingrediente-producto form-select" required onchange="app.onIngredienteProductoChange(this)">
                    <option value="">Seleccionar...</option>
                    ${productosOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Cantidad *</label>
                <input type="number" step="0.001" class="ingrediente-cantidad" oninput="app.calcularCostesEscandallo()" required>
            </div>
            <div class="form-group">
                <label>Unidad *</label>
                <select class="ingrediente-unidad form-select" required onchange="app.calcularCostesEscandallo()">
                    <option value="">Seleccionar...</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="ud">ud</option>
                </select>
            </div>
            <div class="form-group">
                <label>Coste Unit. (€) *</label>
                <input type="number" step="0.0001" class="ingrediente-coste-unitario" oninput="app.calcularCostesEscandallo()" required>
            </div>
            <div class="form-group">
                <label>Coste Total (€)</label>
                <input type="number" step="0.01" class="ingrediente-coste-total" readonly>
            </div>
            <button type="button" class="btn-delete" onclick="window.app.removeIngredienteRow(${rowId})">🗑️</button>
        `;
        container.appendChild(row);
    }

    removeIngredienteRow(rowId) {
        const row = document.querySelector(`.ingrediente-item[data-id="${rowId}"]`);
        if (row) {
           
            row.remove();
            this.calcularCostesEscandallo();
        }
    }

    calcularCostesEscandallo() {
        let costeTotalNeto = 0;
        
        document.querySelectorAll('.ingrediente-item').forEach(item => {
            const cantidad = parseFloat(item.querySelector('.ingrediente-cantidad').value) || 0;
            const costeUnitario = parseFloat(item.querySelector('.ingrediente-coste-unitario').value) || 0;
            const costeIngrediente = cantidad * costeUnitario;
            
            item.querySelector('.ingrediente-coste-total').value = costeIngrediente.toFixed(2);
            costeTotalNeto += costeIngrediente;
        });

        document.getElementById('escandalloCosteTotalNeto').value = costeTotalNeto.toFixed(2);

        const pvpNeto = parseFloat(document.getElementById('escandalloPVPNeto').value) || 0;
        if (pvpNeto > 0) {

            const fc = (costeTotalNeto / pvpNeto * 100);
            const margen = ((pvpNeto - costeTotalNeto) / pvpNeto * 100);
            document.getElementById('escandalloFC').value = fc.toFixed(1);
            document.getElementById('escandalloMargen').value = margen.toFixed(1);
            
            // Validación: Food Cost > 200%
            if (fc > 200) {
                document.getElementById('escandalloFC').style.color = '#e74c3c';
                document.getElementById('escandalloFC').style.fontWeight = 'bold';
            } else {
                document.getElementById('escandalloFC').style.color = '';
                document.getElementById('escandalloFC').style.fontWeight = '';
            }
        } else {
            document.getElementById('escandalloFC').value = '0.0';
            document.getElementById('escandalloMargen').value = '0.0';
        }
    }

    guardarEscandallo(escandallo, editId = null) {
        const form = document.getElementById('escandalloForm');
        
        if (editId) {
            escandallo.id = editId;
            this.db.update('escandallos', editId, escandallo);
            this.showToast('✓ Escandallo actualizado correctamente');
            delete form.dataset.editId;
        } else {
            this.db.add('escandallos', escandallo);
            this.showToast('✓ Escandallo guardado correctamente');
        }
        
        form.reset();
        document.getElementById('ingredientesContainer').innerHTML = '';
        this.render();
    }

    renderInventarios_OLD_1765() {
        const inventarios = this.db.inventarios;
        const html = inventarios.length > 0 ? inventarios.reverse().map(i => {
            const numProductos = i.productos ? i.productos.length : 0;
            const valorTotal = i.productos ? i.productos.reduce((sum, p) => sum + p.valorDiferencia, 0) : 0;
            const colorClass = Math.abs(valorTotal) > 50 ? 'warning' : '';
            
            return `
            <div class="list-item ${colorClass}">
                <div class="list-item-header">
                    <span class="list-item-title">Inventario ${i.fecha}</span>
                    <span class="list-item-value">${i.familia}</span>
                </div>
                <div class="list-item-details">
                    📦 ${numProductos} productos | 💰 Diferencia: ${valorTotal.toFixed(2)}€
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('inventarios', ${i.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('inventarios', ${i.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay inventarios realizados</p>';
        
        document.getElementById('listaInventarios').innerHTML = html;
    }

    renderDelivery_OLD_1792() {
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const html = delivery.length > 0 ? delivery.reverse().map(d => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${d.plataforma} - ${d.fecha}</span>
                    <span class="list-item-value">${d.ingresoNeto.toFixed(2)}€</span>
                </div>
                <div class="list-item-details">
                    💰 Brutos: ${d.ventasBrutas}€ | 💸 Comisión: ${d.comisionPorcentaje}% (${d.comisionImporte.toFixed(2)}€)
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('delivery', ${d.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('delivery', ${d.id})">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay pedidos registrados</p>';
        
        document.getElementById('listaDelivery').innerHTML = html;
    }

    renderPnL() {
        // ══════════════════════════════════════════════════════════════
        // CUENTA DE EXPLOTACIÓN PROFESIONAL HOSTELERÍA 2025
        // TODO SIN IVA · ESTRUCTURA PROFESIONAL COMPLETA
        // ══════════════════════════════════════════════════════════════

        const pnlView = document.getElementById('pnlView');
        if (!pnlView) return;

        // 1. OBTENER DATOS
        // Si no hay periodo seleccionado, usar mes actual por defecto
        if (!this.currentPeriod) {
            const now = new Date();
            this.currentPeriod = {
                month: now.getMonth(),
                year: now.getFullYear()
            };
        }
        
        const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const facturas = this.db.getByPeriod('facturas', this.currentPeriod);
        // Inventarios ya no se usan en P&L por solicitud del usuario
        // const inventarios = this.db.inventarios;

        // ────────────────────────────────────────────────────────────
        // 2. CÁLCULOS FINANCIEROS
        // ────────────────────────────────────────────────────────────

        // A. INGRESOS
        // Ventas Local = Total Real - Real Delivery (from Cierres)
        const ventasLocal = cierres.reduce((sum, c) => sum + ((c.totalReal || 0) - (c.realDelivery || 0)), 0);
        
        // Ventas Delivery = Real Delivery (from Cierres) + Ingreso Neto (from Delivery module)
        const ventasDeliveryCierres = cierres.reduce((sum, c) => sum + (c.realDelivery || 0), 0);
        const ventasDeliveryPlataformas = delivery.reduce((sum, d) => sum + (d.ingresoNeto || 0), 0);
        const ventasDelivery = ventasDeliveryCierres + ventasDeliveryPlataformas;
        
        const totalIngresos = ventasLocal + ventasDelivery;

        // B. MATERIAS / PRODUCTO (COGS) - SOLO COMPRAS (FACTURAS)
        // El usuario ha solicitado eliminar la lógica de inventarios de la P&L.
        // Solo se mostrarán los gastos de materia prima provenientes de facturas.

        // Helper para detectar facturas de delivery
        // Eliminamos 'reparto' y 'delivery' como palabras clave genéricas en el proveedor
        // para evitar falsos positivos con proveedores de logística o distribución.
        const deliveryKeywords = ['glovo', 'uber', 'just eat', 'deliveroo'];
        const isDeliveryInvoice = (f) => {
            const proveedor = (f.proveedorNombre || f.proveedor || '').toLowerCase();
            const categoria = (f.categoria || '').toLowerCase();
            
            // Solo si el proveedor contiene explícitamente el nombre de la plataforma
            const isPlatform = deliveryKeywords.some(k => proveedor.includes(k));
            
            // O si la categoría es explícitamente 'delivery' (pero no 'reparto' genérico)
            const isCategory = categoria === 'delivery' || categoria === 'comisiones delivery';
            
            return isPlatform || isCategory;
        };

        // 1. Compras (Facturas)
        let comprasComida = 0;
        let comprasBebida = 0;

        facturas.forEach(f => {
            // Si es factura de delivery, NO es materia prima (se va a OPEX)
            if (isDeliveryInvoice(f)) return;

            const cat = (f.categoria || '').toLowerCase();
            const val = f.baseImponible || f.total || 0; // Usar base imponible si existe, sino total (asumiendo sin IVA)
            
            // Clasificación simple basada en categoría
            if (cat.includes('bebida') || cat.includes('licor') || cat.includes('vino') || cat.includes('cerveza') || cat.includes('café') || cat.includes('refresco')) {
                comprasBebida += val;
            } else if (cat.includes('comida') || cat.includes('alimento') || cat.includes('carne') || cat.includes('pescado') || cat.includes('fruta') || cat.includes('verdura')) {
                comprasComida += val;
            } else {
                // Si no es explícitamente bebida, y es una factura de proveedor de materia prima, asumimos comida por defecto
                // O podríamos tener una categoría "Otros Insumos"
                comprasComida += val; 
            }
        });

        // 2. Cálculo Consumos (Directamente Compras)
        const consumoComida = comprasComida;
        const consumoBebida = comprasBebida;
        const totalMaterias = consumoComida + consumoBebida;

        const foodCostPct = totalIngresos > 0 ? (totalMaterias / totalIngresos * 100) : 0;

        // C. MARGEN BRUTO
        const margenBruto = totalIngresos - totalMaterias;
        const margenBrutoPct = totalIngresos > 0 ? (margenBruto / totalIngresos * 100) : 0;

        // D. PERSONAL (Simulado)
        const salarios = 0;
        const seguridadSocial = 0;
        const totalPersonal = salarios + seguridadSocial;
        const personalPct = totalIngresos > 0 ? (totalPersonal / totalIngresos * 100) : 0;

        // E. OPEX
        // Lógica Delivery: Comisiones (Ventas) + Facturas (Gastos)
        // El usuario pide NO incluir comisiones delivery en gastos generales si no hay factura
        // Pero si las tenemos calculadas de las ventas, las mostramos solo si > 0
        const comisionesVentas = delivery.reduce((sum, d) => sum + (d.comisionImporte || 0), 0);
        
        // Buscar facturas de delivery (Glovo, Uber, etc.)
        // Usamos el mismo helper isDeliveryInvoice definido arriba para consistencia
        const facturasDelivery = facturas.filter(isDeliveryInvoice);
        const gastosDeliveryFacturas = facturasDelivery.reduce((sum, f) => sum + (f.baseImponible || f.total || 0), 0);

        const alquiler = 0;
        const suministros = 0;
        const servicios = 0;
        const marketing = 0;
        const limpieza = 0;
        const seguros = 0;
        const otrosOpex = 0;
        
        // Solo sumamos comisionesVentas si queremos considerarlas gasto (normalmente sí, se restan del ingreso neto o se ponen como gasto)
        // El usuario dijo: "no poner gastos delivery ni comisiones delivery, solo mostrar si hay alguna factura de servicios delivery en el sistema."
        // Interpretación: Si hay factura, se muestra. Si es un cálculo automático (comisionesVentas), quizás no quiere verlo aquí si no hay "factura".
        // Sin embargo, si no lo ponemos, el EBITDA será falso.
        // Voy a mantener el cálculo pero en la visualización (HTML) ya puse la condición de mostrar solo si > 0.
        
        const totalOpex = alquiler + suministros + servicios + marketing + comisionesVentas + gastosDeliveryFacturas + limpieza + seguros + otrosOpex;
        const opexPct = totalIngresos > 0 ? (totalOpex / totalIngresos * 100) : 0;

        // F. EBITDA
        const ebitda = margenBruto - totalPersonal - totalOpex;
        const ebitdaPct = totalIngresos > 0 ? (ebitda / totalIngresos * 100) : 0;

        // G. NETO
        const financieros = 0;
        const amortizaciones = 0;
        const beneficioNeto = ebitda - financieros - amortizaciones;
        const margenNetoPct = totalIngresos > 0 ? (beneficioNeto / totalIngresos * 100) : 0;

        // ────────────────────────────────────────────────────────────
        // 3. RENDERIZADO (NUEVO DISEÑO TABLA)
        // ────────────────────────────────────────────────────────────
        
        const formatCurrency = (val) => val.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
        const formatPct = (val) => val.toFixed(1) + '%';
        const calcPct = (val) => totalIngresos > 0 ? formatPct(val / totalIngresos * 100) : '0.0%';

        pnlView.innerHTML = `
        <div class="pnl-dashboard">
            <div class="pnl-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h2>Cuenta de Explotación</h2>
                    <p>Resumen financiero del período</p>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <label for="pnlMonthPicker" style="font-weight: 600; color: #555;">Periodo:</label>
                    <input type="month" id="pnlMonthPicker" class="form-control" style="width: auto;" value="${(this.currentPeriod && this.currentPeriod.year) ? `${this.currentPeriod.year}-${String(this.currentPeriod.month + 1).padStart(2, '0')}` : new Date().toISOString().slice(0, 7)}">
                    <button class="btn-primary" id="btnUpdatePnL">Actualizar</button>
                </div>
            </div>

            <!-- KPIs -->
            <div class="pnl-kpis-grid">
                <div class="pnl-kpi-card">
                    <div class="pnl-kpi-label">Ingresos</div>
                    <div class="pnl-kpi-value">${formatCurrency(totalIngresos)}</div>
                </div>
                <div class="pnl-kpi-card">
                    <div class="pnl-kpi-label">Product Cost</div>
                    <div class="pnl-kpi-value">${formatPct(foodCostPct)}</div>
                </div>
                <div class="pnl-kpi-card">
                    <div class="pnl-kpi-label">Margen Bruto</div>
                    <div class="pnl-kpi-value">${formatPct(margenBrutoPct)}</div>
                </div>
                <div class="pnl-kpi-card">
                    <div class="pnl-kpi-label">EBITDA</div>
                    <div class="pnl-kpi-value">${formatPct(ebitdaPct)}</div>
                </div>
            </div>

            <!-- Alertas -->
            <div id="pnlAlertas" class="pnl-alertas-container" style="margin-bottom: 20px;"></div>

            <!-- TABLA P&L REDISEÑADA -->
            <div class="pnl-sections-container">
                
                <!-- 1. INGRESOS -->
                <div class="pnl-section pnl-ingresos">
                    <div class="pnl-section-header">
                        <h3>1. Ingresos Operativos</h3>
                        <span style="font-size: 18px; font-weight: 700; color: #2dce89;">${formatCurrency(totalIngresos)}</span>
                    </div>
                    <table class="pnl-table">
                        <thead>
                            <tr>
                                <th>Concepto</th>
                                <th class="text-right">Importe</th>
                                <th class="text-right percentage-col">% Ventas</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Ventas Local</td>
                                <td class="text-right">${formatCurrency(ventasLocal)}</td>
                                <td class="text-right">${calcPct(ventasLocal)}</td>
                            </tr>
                            <tr>
                                <td>Ventas Delivery</td>
                                <td class="text-right">${formatCurrency(ventasDelivery)}</td>
                                <td class="text-right">${calcPct(ventasDelivery)}</td>
                            </tr>
                            <tr class="total-row">
                                <td>TOTAL INGRESOS</td>
                                <td class="text-right">${formatCurrency(totalIngresos)}</td>
                                <td class="text-right">100.0%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- 2. GASTOS -->
                <div class="pnl-section pnl-gastos">
                    <div class="pnl-section-header">
                        <h3>2. Gastos Operativos</h3>
                        <span style="font-size: 18px; font-weight: 700; color: #f5365c;">${formatCurrency(totalMaterias + totalPersonal + totalOpex)}</span>
                    </div>

                    <!-- 2.1 MATERIAS / PRODUCTO -->
                    <div class="pnl-subsection">
                        <h4 class="pnl-subsection-title">2.1 Materias / Producto (Coste de Ventas)</h4>
                        <table class="pnl-table">
                            <tbody>
                                <!-- COMIDA -->
                                <tr class="subtotal-row">
                                    <td colspan="3" style="color: #1171ef;">Comida (Food)</td>
                                </tr>
                                <tr>
                                    <td style="padding-left: 40px;">Compras Comida</td>
                                    <td class="text-right">${formatCurrency(comprasComida)}</td>
                                    <td class="text-right">${calcPct(comprasComida)}</td>
                                </tr>

                                <!-- BEBIDA -->
                                <tr class="subtotal-row">
                                    <td colspan="3" style="color: #1171ef;">Bebida (Beverage)</td>
                                </tr>
                                <tr>
                                    <td style="padding-left: 40px;">Compras Bebida</td>
                                    <td class="text-right">${formatCurrency(comprasBebida)}</td>
                                    <td class="text-right">${calcPct(comprasBebida)}</td>
                                </tr>

                                <tr class="total-row">
                                    <td>TOTAL MATERIAS / PRODUCTO</td>
                                    <td class="text-right">${formatCurrency(totalMaterias)}</td>
                                    <td class="text-right">${formatPct(foodCostPct)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 2.2 PERSONAL -->
                    <div class="pnl-subsection">
                        <h4 class="pnl-subsection-title">2.2 Personal</h4>
                        <table class="pnl-table">
                            <tbody>
                                <tr>
                                    <td>Salarios y Seguros Sociales</td>
                                    <td class="text-right">${formatCurrency(totalPersonal)}</td>
                                    <td class="text-right">${formatPct(personalPct)}</td>
                                </tr>
                                <tr class="total-row">
                                    <td>TOTAL PERSONAL</td>
                                    <td class="text-right">${formatCurrency(totalPersonal)}</td>
                                    <td class="text-right">${formatPct(personalPct)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- 2.3 OPEX -->
                    <div class="pnl-subsection">
                        <h4 class="pnl-subsection-title">2.3 Gastos Generales (OPEX)</h4>
                        <table class="pnl-table">
                            <tbody>
                                <tr>
                                    <td>Alquiler</td>
                                    <td class="text-right">${formatCurrency(alquiler)}</td>
                                    <td class="text-right">${calcPct(alquiler)}</td>
                                </tr>
                                <tr>
                                    <td>Suministros (Luz, Agua, Gas)</td>
                                    <td class="text-right">${formatCurrency(suministros)}</td>
                                    <td class="text-right">${calcPct(suministros)}</td>
                                </tr>
                                <tr>
                                    <td>Servicios Profesionales</td>
                                    <td class="text-right">${formatCurrency(servicios)}</td>
                                    <td class="text-right">${calcPct(servicios)}</td>
                                </tr>
                                <tr>
                                    <td>Marketing y Publicidad</td>
                                    <td class="text-right">${formatCurrency(marketing)}</td>
                                    <td class="text-right">${calcPct(marketing)}</td>
                                </tr>
                                <tr>
                                    <td>Limpieza y Mantenimiento</td>
                                    <td class="text-right">${formatCurrency(limpieza)}</td>
                                    <td class="text-right">${calcPct(limpieza)}</td>
                                </tr>
                                <tr>
                                    <td>Seguros</td>
                                    <td class="text-right">${formatCurrency(seguros)}</td>
                                    <td class="text-right">${calcPct(seguros)}</td>
                                </tr>
                                <tr>
                                    <td>Otros Gastos Operativos</td>
                                    <td class="text-right">${formatCurrency(otrosOpex)}</td>
                                    <td class="text-right">${calcPct(otrosOpex)}</td>
                                </tr>
                                ${comisionesVentas > 0 ? `
                                <tr>
                                    <td>Comisiones Delivery</td>
                                    <td class="text-right">${formatCurrency(comisionesVentas)}</td>
                                    <td class="text-right">${calcPct(comisionesVentas)}</td>
                                </tr>` : ''}
                                ${gastosDeliveryFacturas > 0 ? `
                                <tr>
                                    <td>Gastos Delivery (Facturas)</td>
                                    <td class="text-right">${formatCurrency(gastosDeliveryFacturas)}</td>
                                    <td class="text-right">${calcPct(gastosDeliveryFacturas)}</td>
                                </tr>` : ''}
                                <tr class="total-row">
                                    <td>TOTAL OPEX</td>
                                    <td class="text-right">${formatCurrency(totalOpex)}</td>
                                    <td class="text-right">${formatPct(opexPct)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- RESULTADOS -->
                <div class="pnl-section">
                    <div class="pnl-section-header">
                        <h3>3. Resultados</h3>
                    </div>
                    <table class="pnl-table">
                        <tbody>
                            <tr class="total-row" style="background: #f6f9fc;">
                                <td>MARGEN BRUTO</td>
                                <td class="text-right">${formatCurrency(margenBruto)}</td>
                                <td class="text-right">${formatPct(margenBrutoPct)}</td>
                            </tr>
                            <tr class="total-row" style="background: #e8f5e9; color: #2dce89; font-size: 16px;">
                                <td>EBITDA (Resultado Operativo)</td>
                                <td class="text-right">${formatCurrency(ebitda)}</td>
                                <td class="text-right">${formatPct(ebitdaPct)}</td>
                            </tr>
                            <tr>
                                <td>Amortizaciones e Intereses</td>
                                <td class="text-right">${formatCurrency(financieros + amortizaciones)}</td>
                                <td class="text-right">${calcPct(financieros + amortizaciones)}</td>
                            </tr>
                            <tr class="total-row" style="background: #2dce89; color: white;">
                                <td>BENEFICIO NETO</td>
                                <td class="text-right">${formatCurrency(beneficioNeto)}</td>
                                <td class="text-right">${formatPct(margenNetoPct)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
        `;

        // Event Listeners para el selector de fecha
        setTimeout(() => {
            const btnUpdate = document.getElementById('btnUpdatePnL');
            const picker = document.getElementById('pnlMonthPicker');
            
            if (btnUpdate && picker) {
                btnUpdate.onclick = () => {
                    const val = picker.value; // "YYYY-MM"
                    if (val) {
                        const [year, month] = val.split('-').map(Number);
                        this.currentPeriod = { month: month - 1, year: year }; // month is 0-indexed
                        this.renderPnL();
                        this.showToast(`📅 Periodo actualizado: ${month}/${year}`);
                    }
                };
            }
        }, 100);
    }

    extractZonesFromTesseractData(tesseractData) {
        // Extraer zonas de IMAGENES (JPEG, PNG, etc) usando coordenadas de Tesseract
        // Similar a extractPDFText pero para imágenes
        try {
            if (!tesseractData.words || tesseractData.words.length === 0) {
                return null; // Sin datos de palabras, usar texto plano
            }

            const words = tesseractData.words;
            const imageWidth = tesseractData.width || 1000;
            const imageHeight = tesseractData.height || 1000;

            console.log('🎯 Aplicando extracción con ZONAS a imagen (JPEG/PNG/etc)...');

            // Definir zonas (igual que PDF.js)
            const zones = {
                topLeft: [],      // Proveedor (x < 50%, y < 30%)
                topRight: [],     // Cliente (x >= 50%, y < 30%)
                center: [],       // Detalle (30% < y < 70%)
                bottom: []        // Totales (y >= 70%)
            };

            // Clasificar cada palabra por coordenadas
            words.forEach(word => {
                const text = word.text.trim();
                if (!text || word.confidence < 30) return; // Ignorar palabras con baja confianza

                const bbox = word.bbox;
                const x = bbox.x0; // Posición X (izquierda)
                const y = bbox.y0; // Posición Y (arriba)

                // Normalizar coordenadas (0-1)
                const normalX = x / imageWidth;
                const normalY = y / imageHeight;

                // Clasificar por zona (Y en imágenes: menor = arriba)
                if (normalY < 0.3) { // Arriba (30% superior)
                    if (normalX < 0.5) {
                        zones.topLeft.push({ text, x, y });
                    } else {
                        zones.topRight.push({ text, x, y });
                    }
                } else if (normalY < 0.7) { // Centro
                    zones.center.push({ text, x, y });
                } else { // Abajo (totales)
                    zones.bottom.push({ text, x, y });
                }
            });

            // Ordenar cada zona por Y (ascendente) y luego por X
            Object.keys(zones).forEach(zoneKey => {
                zones[zoneKey].sort((a, b) => {
                    const yDiff = a.y - b.y; // Menor Y primero (arriba)
                    if (Math.abs(yDiff) > 10) return yDiff;
                    return a.x - b.x; // Mismo Y
                });
            });

            // Reconstruir texto estructurado
            const structuredText = {
                proveedor: zones.topLeft.map(i => i.text).join(' '),
                cliente: zones.topRight.map(i => i.text).join(' '),
                detalle: zones.center.map(i => i.text).join(' '),
                totales: zones.bottom.map(i => i.text).join(' '),
                full: text
            };

            console.log('📋 Zonas extraídas de imagen:');
            console.log('  Proveedor (arriba-izq):', structuredText.proveedor.substring(0, 100) + '...');
            console.log('  Cliente (arriba-der):', structuredText.cliente.substring(0, 100) + '...');
            console.log('  Totales (abajo):', structuredText.totales.substring(0, 100) + '...');

            // Devolver texto estructurado (igual que PDF.js)
            return `ZONA_PROVEEDOR: ${structuredText.proveedor}\n\nZONA_CLIENTE: ${structuredText.cliente}\n\nZONA_DETALLE: ${structuredText.detalle}\n\nZONA_TOTALES: ${structuredText.totales}`;

        } catch (error) {
            console.error('Error extrayendo zonas de imagen:', error);
            return null; // Fallback a texto plano
        }
    }

    async extractPDFText(pdfFile) {
        // Extraer texto embebido del PDF CON COORDENADAS para separar zonas
        try {
            if (typeof pdfjsLib === 'undefined') {
                return null;
            }

            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            if (!pdf || pdf.numPages === 0) return null;

            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            const textContent = await page.getTextContent();
            
            // Si no hay texto embebido, return null para usar OCR
            if (!textContent.items || textContent.items.length === 0) {
                return null;
            }
            
            // Calcular texto total
            const totalText = textContent.items.map(item => item.str).join(' ').trim();
            if (totalText.length < 100) {
                return null; // Muy poco texto, usar OCR
            }
            
            console.log('✅ PDF con texto embebido detectado, extrayendo con coordenadas...');
            
            // Separar texto por ZONAS usando coordenadas (x, y)
            const pageHeight = viewport.height;
            const pageWidth = viewport.width;
            
            // Definir zonas (normalizado 0-1)
            const zones = {
                topLeft: [],      // Arriba izquierda (proveedor)
                topRight: [],     // Arriba derecha (cliente)
                center: [],       // Centro (tabla de productos)
                bottom: []        // Abajo (totales)
            };
            
            // Clasificar cada item de texto en su zona
            textContent.items.forEach(item => {
                const x = item.transform[4]; // Posición X
                const y = item.transform[5]; // Posición Y
                const text = item.str.trim();
                
                if (!text) return;
                
                // Normalizar coordenadas (0-1)
                const normalX = x / pageWidth;
                const normalY = y / pageHeight;
                
                // Clasificar por zona (Y invertido: mayor Y = arriba)
                if (normalY > 0.7) { // Arriba (70% superior)
                    if (normalX < 0.5) {
                        zones.topLeft.push({ text, x, y });
                    } else {
                        zones.topRight.push({ text, x, y });
                    }
                } else if (normalY > 0.3) { // Centro
                    zones.center.push({ text, x, y });
                } else { // Abajo (totales)
                    zones.bottom.push({ text, x, y });
                }
            });
            
            // Ordenar cada zona por Y (descendente) y luego por X
            Object.keys(zones).forEach(zoneKey => {
                zones[zoneKey].sort((a, b) => {
                    const yDiff = b.y - a.y; // Mayor Y primero (arriba)
                    if (Math.abs(yDiff) > 5) return yDiff;
                    return a.x - b.x; // Mismo Y → orden X
                });
            });
            
            // Reconstruir texto estructurado
            const structuredText = {
                proveedor: zones.topLeft.map(i => i.text).join(' '),
                cliente: zones.topRight.map(i => i.text).join(' '),
                detalle: zones.center.map(i => i.text).join(' '),
                totales: zones.bottom.map(i => i.text).join(' '),
                full: totalText
            };
            
            console.log('📋 Zonas extraídas:');
            console.log('  Proveedor (arriba-izq):', structuredText.proveedor.substring(0, 100) + '...');
            console.log('  Cliente (arriba-der):', structuredText.cliente.substring(0, 100) + '...');
            console.log('  Totales (abajo):', structuredText.totales.substring(0, 100) + '...');
            
            // Devolver texto estructurado como string especial
            return `ZONA_PROVEEDOR: ${structuredText.proveedor}\n\nZONA_CLIENTE: ${structuredText.cliente}\n\nZONA_DETALLE: ${structuredText.detalle}\n\nZONA_TOTALES: ${structuredText.totales}`;
            
        } catch (error) {
            console.error('Error extrayendo texto embebido:', error);
            return null;
        }
    }

    async convertPDFToImage(pdfFile) {
        // Usar PDF.js para renderizar PDF a canvas de alta calidad
        return new Promise(async (resolve, reject) => {
            try {
                // Verificar que PDF.js está disponible
                if (typeof pdfjsLib === 'undefined') {
                    reject(new Error('PDF.js library not loaded'));
                    return;
                }

                const arrayBuffer = await pdfFile.arrayBuffer();
                
                // Configurar opciones de carga
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
                });
                
                const pdf = await loadingTask.promise;
                
                if (!pdf || pdf.numPages === 0) {
                    reject(new Error('PDF vacío o corrupto'));
                    return;
                }
                
                // Procesar primera página
                const page = await pdf.getPage(1);
                
                // Escala para 300-400 DPI (alta calidad)
                const scale = 3.0; // 3x = ~300 DPI
                const viewport = page.getViewport({ scale });
                
                // Crear canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                if (!context) {
                    reject(new Error('No se pudo crear contexto canvas'));
                    return;
                }
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Fondo blanco para PDFs con transparencia
                context.fillStyle = 'white';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Renderizar PDF a canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                    intent: 'print' // Mejor calidad para impresión/OCR
                }).promise;
                
                // Convertir canvas a imagen PNG de alta calidad
                const imageData = canvas.toDataURL('image/png', 1.0);
                
                if (!imageData || imageData === 'data:,') {
                    reject(new Error('No se pudo convertir PDF a imagen'));
                    return;
                }
                
                resolve(imageData);
            } catch (error) {
                console.error('Error convirtiendo PDF a imagen:', error);
                reject(new Error('Error al convertir PDF a imagen: ' + error.message));
            }
        });
    }

    async preprocessImage(imageData) {
        // Preprocesar imagen para mejorar resultados de OCR
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Dibujar imagen original
                ctx.drawImage(img, 0, 0);
                
                // Obtener datos de píxeles
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Aplicar ajustes: brillo (+20), contraste (+30%)
                const brightness = 20;
                const contrast = 30;
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                
                for (let i = 0; i < data.length; i += 4) {
                    // Aplicar brillo
                    data[i] += brightness;     // R
                    data[i + 1] += brightness; // G
                    data[i + 2] += brightness; // B
                    
                    // Aplicar contraste
                    data[i] = factor * (data[i] - 128) + 128;
                    data[i + 1] = factor * (data[i + 1] - 128) + 128;
                    data[i + 2] = factor * (data[i + 2] - 128) + 128;
                    
                    // Convertir a escala de grises
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = data[i + 1] = data[i + 2] = gray;
                }
                
                // Aplicar datos procesados
                ctx.putImageData(imageData, 0, 0);
                
                // Devolver imagen procesada
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageData;
        });
    }

    async analyzeOCRDocument() {
        // Verificar si tenemos texto embebido de PDF
        if (this.isPDFWithEmbeddedText && this.currentPDFText) {
            this.showToast('✅ Procesando texto embebido del PDF...');
            try {
                // Parsear directamente el texto embebido (SIN Tesseract)
                const extractedData = {
                    text: this.currentPDFText,
                    confidence: 99, // Texto embebido tiene máxima confianza
                    words: []
                };
                
                const parsedData = this.parseOCRTextWithConfidence(extractedData);
                
                // Detectar tipo si no hay seleccionado
                let tipoDocumento = this.currentOCRType;
                if (!tipoDocumento) {
                    tipoDocumento = this.detectarTipoDocumento(parsedData);
                    this.currentOCRType = tipoDocumento;
                    document.querySelectorAll('.ocr-tipo-btn').forEach(btn => {
                        if (btn.dataset.tipo === tipoDocumento) {
                            btn.classList.add('active');
                        }
                    });
                    this.showToast(`📄 Tipo detectado: ${this.getTipoLabel(tipoDocumento)}`);
                }
                
                this.displayOCRForm(parsedData, tipoDocumento);
                document.getElementById('ocrDataCard').classList.remove('hidden');
                this.showToast('✅ Análisis completado (texto embebido)');
                return;
            } catch (error) {
                console.error('❌ Error procesando texto embebido:', error);
                console.error('❌ Stack trace:', error.stack);
                this.showToast('❌ Error al procesar texto embebido: ' + error.message, true);
                return;
            }
        }
        
        // Flujo normal con OCR Tesseract
        if (!this.currentImageData) {
            this.showToast('⚠️ Primero carga una imagen o PDF', true);
            return;
        }

        // Verificar que Tesseract está cargado
        if (typeof Tesseract === 'undefined') {
            this.showToast('❌ Error: Tesseract OCR no está cargado. Recarga la página', true);
            return;
        }

        // Show progress
        document.getElementById('ocrProgressBar').classList.remove('hidden');
        document.getElementById('ocrProgressText').textContent = 'Inicializando Tesseract OCR...';
        document.getElementById('ocrProgressFill').style.width = '0%';

        try {
            // Call Tesseract.js (FREE OCR)
            const extractedData = await this.runTesseractOCR(this.currentImageData);
            
            // Validar que se extrajo algo
            if (!extractedData || !extractedData.text || extractedData.text.trim().length < 5) {
                this.showToast('⚠️ No se pudo extraer texto legible. Intenta con una imagen más nítida', true);
                document.getElementById('ocrProgressBar').classList.add('hidden');
                return;
            }
            
            // Si no hay tipo seleccionado, detectar automáticamente
            let tipoDocumento = this.currentOCRType;
            if (!tipoDocumento) {
                tipoDocumento = this.detectarTipoDocumento(extractedData);
                this.currentOCRType = tipoDocumento;
                
                // Marcar botón como activo
                document.querySelectorAll('.ocr-tipo-btn').forEach(btn => {
                    if (btn.dataset.tipo === tipoDocumento) {
                        btn.classList.add('active');
                    }
                });
                
                this.showToast(`📄 Tipo detectado: ${this.getTipoLabel(tipoDocumento)}`);
            }
            
            // Si se extrajeron zonas, reemplazar texto plano por estructurado
            if (textWithZones) {
                extractedData.text = textWithZones;
            }
            
            this.displayOCRForm(extractedData, tipoDocumento);
            document.getElementById('ocrProgressBar').classList.add('hidden');
            document.getElementById('ocrDataCard').classList.remove('hidden');
            this.showToast('✅ Análisis OCR completado');
        } catch (error) {
            console.error('Error OCR:', error);
            this.showToast('❌ Error al analizar documento. Verifica que la imagen sea legible', true);
            document.getElementById('ocrProgressBar').classList.add('hidden');
        }
    }

    async runTesseractOCR(imageData) {
        let worker = null;
        try {
            // Tesseract.js - OCR 100% GRATUITO sin API keys
            worker = await Tesseract.createWorker('spa+eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        const progress = Math.round(m.progress * 100);
                        document.getElementById('ocrProgressText').textContent = `Analizando documento... ${progress}%`;
                        document.getElementById('ocrProgressFill').style.width = `${progress}%`;
                    } else if (m.status === 'loading tesseract core') {
                        document.getElementById('ocrProgressText').textContent = 'Cargando motor OCR...';
                    } else if (m.status === 'initializing tesseract') {
                        document.getElementById('ocrProgressText').textContent = 'Inicializando...';
                    } else if (m.status === 'loading language traineddata') {
                        document.getElementById('ocrProgressText').textContent = 'Cargando diccionarios...';
                    }
                }
            });

            // Configuración ÓPTIMA para documentos comerciales (facturas, albaranes)
            // OEM 1 = LSTM only (Tesseract 4+ con redes neuronales)
            // PSM 6 = Assume uniform block of text (ideal para facturas)
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // PSM 6
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // OEM 1
                preserve_interword_spaces: '1',
                tessedit_char_blacklist: '',
                language_model_penalty_non_dict_word: '0.5',
                language_model_penalty_non_freq_dict_word: '0.5',
                // Mejorar detección de números y puntuación
                classify_enable_adaptive_matcher: '1',
                classify_enable_learning: '1'
            });

            // Primera pasada: texto completo
            const { data } = await worker.recognize(imageData, {
                rotateAuto: true // Deskew automático para documentos torcidos
            });
            
            console.log('OCR Completo - Texto extraído:', data.text);
            console.log('OCR Completo - Confianza:', data.confidence + '%');
            console.log('OCR Completo - Palabras detectadas:', data.words?.length || 0);
            
            // Extraer ZONAS de imagen (igual que PDF.js)
            const textWithZones = this.extractZonesFromTesseractData(data);
            
            // Si se extrajeron zonas, usar texto estructurado
            const textoFinal = textWithZones || data.text;
            
            // Segunda pasada SOLO para números (importes, IVA, totales)
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789,.-€%' // Whitelist numérica
            });
            
            const { data: dataNumeros } = await worker.recognize(imageData);
            console.log('OCR Números - Texto extraído:', dataNumeros.text);
            
            // Combinar resultados (priorizar números de segunda pasada para campos numéricos)
            const resultado = {
                text: textoFinal, // ⬅️ Usar texto con zonas si está disponible
                confidence: data.confidence,
                words: data.words,
                textNumeros: dataNumeros.text,
                confidenceNumeros: dataNumeros.confidence
            };
            
            // Parse text with confidence
            return this.parseOCRTextWithConfidence(resultado);
        } catch (error) {
            console.error('Error en Tesseract OCR:', error);
            throw new Error('Error al procesar OCR: ' + error.message);
        } finally {
            // Asegurar que el worker se termina siempre
            if (worker) {
                try {
                    await worker.terminate();
                } catch (e) {
                    console.error('Error terminando worker:', e);
                }
            }
        }
    }

    normalizeNumber(numStr) {
        // Función para normalizar números de facturas españolas
        // "668,84€" → 668.84
        // "1.609,30€" → 1609.30
        // "1,609.30" → 1609.30 (formato americano)
        
        if (!numStr) return 0;
        
        // Convertir a string y limpiar
        let cleaned = numStr.toString()
            .trim()
            .replace(/€/g, '')
            .replace(/\s+/g, '')
            .replace(/[A-Za-z]/g, ''); // Quitar letras
        
        // Detectar formato:
        // Si tiene punto Y coma → formato europeo (punto=miles, coma=decimal)
        // Si solo tiene coma → coma es decimal
        // Si solo tiene punto → punto es decimal (formato US)
        
        const tienePunto = cleaned.includes('.');
        const tieneComa = cleaned.includes(',');
        
        if (tienePunto && tieneComa) {
            // Formato europeo: 1.609,30 → 1609.30
            // El último separador es el decimal
            const ultimoPunto = cleaned.lastIndexOf('.');
            const ultimaComa = cleaned.lastIndexOf(',');
            
            if (ultimaComa > ultimoPunto) {
                // Formato: 1.609,30
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
                // Formato: 1,609.30 (americano)
                cleaned = cleaned.replace(/,/g, '');
            }
        } else if (tieneComa) {
            // Solo coma: puede ser decimal o miles
            // Si tiene más de 3 dígitos después de la coma, es miles
            const partes = cleaned.split(',');
            if (partes.length === 2 && partes[1].length <= 2) {
                // Es decimal: 668,84 → 668.84
                cleaned = cleaned.replace(',', '.');
            } else {
                // Es miles: 1,609 → 1609
                cleaned = cleaned.replace(/,/g, '');
            }
        }
        // Si solo tiene punto, ya está en formato correcto
        
        const numero = parseFloat(cleaned);
        return isNaN(numero) ? 0 : numero;
    }

    parseOCRTextWithConfidence(ocrData) {
        const text = ocrData.text;
        const confidence = ocrData.confidence;
        const lines = text.split('\n');
        
        // Detectar si el texto viene con ZONAS (PDF.js con coordenadas)
        const tieneZonas = text.includes('ZONA_PROVEEDOR:');
        let zonaProveedor = '';
        let zonaCliente = '';
        let zonaTotales = '';
        
        if (tieneZonas) {
            console.log('🎯 Detectado texto con ZONAS de PDF.js, usando extracción mejorada...');
            
            // Extraer cada zona
            const matchProveedor = text.match(/ZONA_PROVEEDOR:\s*([^\n]+(?:\n(?!ZONA_)[^\n]+)*)/);
            const matchCliente = text.match(/ZONA_CLIENTE:\s*([^\n]+(?:\n(?!ZONA_)[^\n]+)*)/);
            const matchTotales = text.match(/ZONA_TOTALES:\s*([^\n]+(?:\n(?!ZONA_)[^\n]+)*)/);
            
            zonaProveedor = matchProveedor ? matchProveedor[1].trim() : '';
            zonaCliente = matchCliente ? matchCliente[1].trim() : '';
            zonaTotales = matchTotales ? matchTotales[1].trim() : '';
            
            console.log('📦 Zona Proveedor:', zonaProveedor.substring(0, 80) + '...');
            console.log('👤 Zona Cliente:', zonaCliente.substring(0, 50) + '...');
            console.log('💰 Zona Totales:', zonaTotales.substring(0, 50) + '...');
        }
        
        const data = {
            text: text,
            confidence: confidence,
            proveedor: { value: '', confidence: 0 },
            nif: { value: '', confidence: 0 },
            numero: { value: '', confidence: 0 },
            fecha: { value: '', confidence: 0 },
            baseImponible: { value: 0, confidence: 0 },
            iva: { value: 0, confidence: 0 },
            total: { value: 0, confidence: 0 },
            direccion: { value: '', confidence: 0 },
            codigoPostal: { value: '', confidence: 0 },
            ciudad: { value: '', confidence: 0 },
            telefono: { value: '', confidence: 0 },
            email: { value: '', confidence: 0 },
            personaContacto: { value: '', confidence: 0 },
            formaPago: { value: '', confidence: 0 },
            condicionesPago: { value: '', confidence: 0 },
            frecuenciaPedido: { value: '', confidence: 0 },
            observaciones: { value: '', confidence: 0 },
            needsReview: false
        };

        // EXTRACCIÓN SEMÁNTICA CON REGEX (no por posición)
        
        // 1. CIF/NIF PRIMERO (buscar en zona proveedor si está disponible)
        // CIF/NIF español: Letra inicial + 7 dígitos + dígito de control
        const textoBusquedaCIF = tieneZonas && zonaProveedor ? zonaProveedor : text;
        const cifPatterns = [
            /(?:NIF|CIF|RUT)[:\s]*([A-Z][0-9]{7}[0-9A-Z])/gi,  // Con etiqueta
            /\b([A-Z][0-9]{7}[0-9A-Z])\b/gi,  // Estándar (B12345678)
            /\b([A-Z]-[0-9]{7}-[0-9A-Z])\b/gi // Con guiones
        ];
        
        for (const pattern of cifPatterns) {
            const matches = [...textoBusquedaCIF.matchAll(pattern)];
            for (const match of matches) {
                let cifValue = match[1].toUpperCase().replace(/[^A-Z0-9]/g, ''); // Limpiar guiones
                // Validar formato estricto: letra + 7 números + dígito/letra control
                if (cifValue.match(/^[A-Z][0-9]{7}[0-9A-Z]$/)) {
                    data.nif = { value: cifValue, confidence: confidence };
                    console.log('✓ CIF/NIF detectado:', cifValue);
                    break;
                }
            }
            if (data.nif.value) break;
        }
        
        // 2. PROVEEDOR/EMPRESA (Lógica Mejorada)
        
        // ESTRATEGIA A: Buscar sufijos societarios (S.L., S.A., etc.) -> ALTA PROBABILIDAD
        // Esta es la prueba más fuerte de que una línea es una empresa
        if (!data.proveedor.value) {
            // Regex mejorada para capturar variaciones y sufijos comunes
            const sufijosSocietarios = /\b(S\.?L\.?U\.?|S\.?L\.?L\.?|S\.?L\.?|S\.?A\.?U\.?|S\.?A\.?|S\.?C\.?|S\.?COOP\.?|C\.?B\.?|S\.?R\.?L\.?|LIMITED|LTD|GMBH|S\.?A\.?S\.?)\b/i;
            const lineas = text.split('\n');
            
            // Buscar en las primeras 20 líneas (cabecera)
            for (let i = 0; i < Math.min(20, lineas.length); i++) {
                let linea = lineas[i].trim();
                
                // Limpiar caracteres extraños al inicio (ej: "• Empresa S.L.")
                linea = linea.replace(/^[^A-Za-z0-9Á-Úá-ú]+/, '');

                if (linea.length > 3 && linea.length < 100 && sufijosSocietarios.test(linea)) {
                    // Limpiar prefijos comunes si existen
                    let nombreLimpio = linea.replace(/^(Proveedor|Empresa|Razón Social|Cliente|De|From)[:\s]*/i, '').trim();
                    
                    // Lógica extra: Si la línea contiene el sufijo pero sigue con basura (ej: "EMPRESA S.L. - CIF..."), cortar
                    const matchSufijo = nombreLimpio.match(sufijosSocietarios);
                    if (matchSufijo) {
                        const finSufijo = matchSufijo.index + matchSufijo[0].length;
                        // Cortar todo lo que venga después del sufijo si parece basura o datos extra
                        // (Ej: "EMPRESA S.L. - 12345" -> "EMPRESA S.L.")
                        nombreLimpio = nombreLimpio.substring(0, finSufijo);
                    }

                    // Evitar falsos positivos (ej: "Inscrita en el registro S.L...")
                    if (!nombreLimpio.match(/^(Inscrita|Registro|Mercantil|Tomo|Libro|Folio|Página|Page|Hoja)/i)) {
                        data.proveedor = { value: nombreLimpio.trim(), confidence: confidence * 0.95 };
                        console.log('✓ Proveedor detectado (Sufijo Societario):', nombreLimpio);
                        break;
                    }
                }
            }
        }

        // ESTRATEGIA B: Buscar línea antes del CIF (si tenemos CIF)
        if (data.nif.value && !data.proveedor.value) {
            const indexCIF = text.indexOf(data.nif.value);
            if (indexCIF >= 0) {
                // 1. Buscar en la MISMA línea del CIF (antes del CIF)
                const lineStart = text.lastIndexOf('\n', indexCIF);
                const lineEnd = text.indexOf('\n', indexCIF);
                const lineaCIF = text.substring(lineStart + 1, lineEnd !== -1 ? lineEnd : text.length).trim();
                
                // Si la línea empieza con texto y luego viene el CIF
                const cifIndexInLine = lineaCIF.indexOf(data.nif.value);
                if (cifIndexInLine > 3) {
                    const posibleNombre = lineaCIF.substring(0, cifIndexInLine).trim().replace(/[-:,]+$/, '').trim();
                    if (posibleNombre.length > 3 && !posibleNombre.match(/^(NIF|CIF|RUT|Tel)/i)) {
                         data.proveedor = { value: posibleNombre, confidence: confidence * 0.9 };
                         console.log('✓ Proveedor detectado (Misma línea CIF):', posibleNombre);
                    }
                }

                // 2. Si no encontramos en la misma línea, buscar en líneas ANTERIORES
                if (!data.proveedor.value) {
                    const textBeforeCIF = text.substring(0, indexCIF);
                    const lineasAntes = textBeforeCIF.split('\n').reverse();
                    
                    for (let i = 0; i < Math.min(5, lineasAntes.length); i++) {
                        const linea = lineasAntes[i].trim();
                        // Criterios para ser nombre de empresa:
                        if (linea.length > 3 && linea.length < 80 && 
                            !linea.match(/^(factura|invoice|fecha|total|cliente|nif|cif|tel|fax|email|web|pag|hoja)/i) &&
                            !linea.match(/\b(Calle|C\/|Avda|Avenida|Plaza|Paseo|Carrer)\b/i) &&
                            !linea.includes('@') && !linea.includes('www.')) {
                            
                            data.proveedor = { value: linea, confidence: confidence * 0.8 };
                            console.log('✓ Proveedor detectado (Línea sobre CIF):', linea);
                            break;
                        }
                    }
                }
            }
        }
        
        // ESTRATEGIA C: Buscar palabras clave explícitas
        if (!data.proveedor.value) {
            const proveedorMatch = text.match(/(?:Proveedor|Empresa|Razón\s+Social|Emisor)[:\s]+([A-ZÀ-ÿ0-9][^\n]{3,80})/i);
            if (proveedorMatch && proveedorMatch[1]) {
                const nombre = proveedorMatch[1].trim().replace(/\s+(NIF|CIF|Tel).*$/i, '');
                data.proveedor = { value: nombre, confidence: confidence * 0.85 };
                console.log('✓ Proveedor detectado (Etiqueta):', nombre);
            }
        }

        // ESTRATEGIA D: Email corporativo (dominio suele ser la empresa)
        if (!data.proveedor.value) {
            const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
            if (emailMatch && emailMatch[1]) {
                const dominio = emailMatch[1].split('.')[0]; // "empresa" de "empresa.com"
                if (dominio.length > 3 && !['gmail', 'hotmail', 'yahoo', 'outlook'].includes(dominio.toLowerCase())) {
                    // Capitalizar primera letra
                    const nombre = dominio.charAt(0).toUpperCase() + dominio.slice(1);
                    data.proveedor = { value: nombre, confidence: confidence * 0.5 }; // Confianza baja, es una estimación
                    console.log('⚠️ Proveedor estimado por dominio email:', nombre);
                }
            }
        }

        // ESTRATEGIA E: Línea en MAYÚSCULAS (Fallback)
        // Muchas empresas ponen su nombre en mayúsculas en la cabecera
        if (!data.proveedor.value) {
             const lineas = text.split('\n');
             for (let i = 0; i < Math.min(10, lineas.length); i++) {
                const linea = lineas[i].trim();
                // Solo letras mayúsculas, espacios y quizás . o &
                if (linea.length > 4 && linea.length < 50 && /^[A-ZÁ-Ú\s\.\&]+$/.test(linea)) {
                     // Evitar palabras comunes que pueden estar en mayúsculas
                     if (!linea.match(/^(FACTURA|INVOICE|ALBARAN|PRESUPUESTO|TOTAL|FECHA|CLIENTE|PROVEEDOR|PAGINA|HOJA)/i)) {
                         data.proveedor = { value: linea, confidence: confidence * 0.6 };
                         console.log('⚠️ Proveedor estimado (Mayúsculas):', linea);
                         break;
                     }
                }
             }
        }
        
        // 3. NÚMERO DE FACTURA (patrones MEJORADOS) - MANTENER COMPLETO con letras, números, guiones, barras
        const numeroPatterns = [
            /\b(PCK\d{3,})\b/i,  // PRIORIDAD: PCK seguido de números (PCK215)
            /\b(FCK\d{3,})\b/i,  // FCK seguido de números
            /\b(FAC[\-\/]?\d{3,})\b/i,  // FAC-123 o FAC123
            /(?:N[úu]mero|Invoice|Num)\s*[:\s#]*([A-Z]{2,}[\-\/]?[0-9]+)/i,  // "Número: ABC123"
            /Factura\s+N[úu]mero\s+\d+\s+([A-Z0-9]+)/i,  // "Factura Número 4 PCK215" → captura PCK215
            /(?:PCK|FCK|FAC|INV|ALB|DL|PED|ORD)[\-\/]?([0-9\-\/]+)/i,  // Códigos comunes con números
            /\b([A-Z]{2,4}[\-\/]\d{3,}[\-\/]?\d*)\b/,  // Formato prefijo-números: ABC-12345
            /\b([A-Z]{3,}[0-9]{3,})\b/  // Formato pegado: PCK215, FAC20240001
        ];
        for (const pattern of numeroPatterns) {
            const match = text.match(pattern);
            if (match) {
                // Extraer el grupo capturado (puede ser 1 o el match completo)
                let numeroCompleto = (match[1] || match[0]).trim();
                
                // Si capturó solo números después de prefijo, añadir prefijo
                if (numeroCompleto.match(/^\d+$/) && match[0].match(/^(PCK|FCK|FAC)/i)) {
                    const prefijo = match[0].match(/^(PCK|FCK|FAC)/i)[1];
                    numeroCompleto = prefijo + numeroCompleto;
                }
                
                // Validar que no sea un CIF, fecha u otro dato
                if (numeroCompleto.length > 2 && numeroCompleto.length < 30 &&
                    !numeroCompleto.match(/^[A-HJ-NP-SUVW]\d{7}[A-Z0-9]$/i) && // No es CIF
                    !numeroCompleto.match(/^\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4}$/) && // No es fecha
                    !numeroCompleto.match(/^[0-9]+$/)) { // No es solo números sin letras
                    data.numero = { value: numeroCompleto, confidence: confidence };
                    console.log('✓ Número factura detectado:', numeroCompleto);
                    break;
                }
            }
        }
        
        // 3. FECHA (múltiples formatos)
        const fechaMatch = text.match(/(?:Fecha|Date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i) ||
                          text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
        if (fechaMatch) {
            const fechaStr = this.parseDateFromText(fechaMatch[1]);
            data.fecha = { value: fechaStr, confidence: confidence };
        }
        
        // 4. BASE IMPONIBLE (buscar patrón semántico)
        const basePatterns = [
            /BASE\s+IMPONIBLE[\s\w]*?([0-9\.\,]+)\s*€?/i,
            /BASE\s+NETA[\s\w]*?([0-9\.\,]+)\s*€?/i,
            /IMPONIBLE[\s\w]*?([0-9\.\,]+)\s*€?/i
        ];
        for (const pattern of basePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                data.baseImponible = { 
                    value: this.normalizeNumber(match[1]), 
                    confidence: confidence 
                };
                break;
            }
        }
        
        // 5. IVA (buscar porcentaje + importe)
        const ivaPatterns = [
            /IVA\s*(\d{1,2})%[\s\w]*?([0-9\.\,]+)\s*€?/i,
            /IVA[\s]*[:\s]*([0-9\.\,]+)\s*€?/i,
            /(\d{1,2})%\s+IVA[\s]*[:\s]*([0-9\.\,]+)\s*€?/i
        ];
        for (const pattern of ivaPatterns) {
            const match = text.match(pattern);
            if (match) {
                // Tomar el último número (el importe, no el porcentaje)
                const numero = match[match.length - 1];
                data.iva = { 
                    value: this.normalizeNumber(numero), 
                    confidence: confidence 
                };
                break;
            }
        }
        
        // 6. TOTAL (buscar patrón semántico)
        const totalPatterns = [
            /TOTAL\s+CON\s+IVA[\s\w]*?([0-9\.\,]+)\s*€?/i,
            /TOTAL[\s]*[:\s]*([0-9\.\,]+)\s*€?/i,
            /IMPORTE\s+TOTAL[\s]*[:\s]*([0-9\.\,]+)\s*€?/i
        ];
        for (const pattern of totalPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                data.total = { 
                    value: this.normalizeNumber(match[1]), 
                    confidence: confidence 
                };
                break;
            }
        }

        // Si no hay fecha, usar hoy
        if (!data.fecha.value) {
            data.fecha = { value: new Date().toISOString().split('T')[0], confidence: 0 };
        }
        
        // 7. DIRECCIÓN (buscar patrón de calle/avenida/plaza)
        const direccionPatterns = [
            /(?:Direcci[oó]n|Domicilio|Address)[:\s]*([A-ZÀ-ÿ][A-ZÀ-ÿ0-9\s,\.\/\-]{10,100})/i,
            /\b((?:Calle|C\/|Avda|Avenida|Plaza|Pl\.|Paseo|Carrer)[A-ZÀ-ÿ0-9\s,\.\/\-]{5,80})/i
        ];
        for (const pattern of direccionPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let direccion = match[1].trim();
                // Limpiar: cortar si encuentra CP, ciudad o país
                direccion = direccion.replace(/\s*\d{5}\s*[A-ZÀ-ÿ]+.*$/i, '').trim();
                direccion = direccion.replace(/\s*(Tel[eé]fono|Tel|Email).*$/i, '').trim();
                if (direccion.length > 5 && direccion.length < 150) {
                    data.direccion = { value: direccion, confidence: confidence * 0.85 };
                    console.log('✓ Dirección detectada:', direccion);
                    break;
                }
            }
        }
        
        // 8. CÓDIGO POSTAL (5 dígitos españoles)
        const cpMatch = text.match(/\b(\d{5})\b/);
        if (cpMatch && cpMatch[1]) {
            // Validar que sea un CP español (00001-52999)
            const cp = cpMatch[1];
            const cpNum = parseInt(cp);
            if (cpNum >= 1000 && cpNum <= 52999) {
                data.codigoPostal = { value: cp, confidence: confidence };
                console.log('✓ Código Postal detectado:', cp);
            }
        }
        
        // 9. CIUDAD (después del código postal o en línea con palabras clave)
        if (data.codigoPostal.value) {
            // Buscar texto después del CP
            const indexCP = text.indexOf(data.codigoPostal.value);
            const textoDespuesCP = text.substring(indexCP + 5, indexCP + 100);
            const ciudadMatch = textoDespuesCP.match(/\s+([A-ZÁÉÍÓÚÑ][A-ZÀ-ÿa-z\s]{2,40}?)(?:\n|,|\.|Tel|Email|España|Spain)/i);
            if (ciudadMatch && ciudadMatch[1]) {
                const ciudad = ciudadMatch[1].trim();
                data.ciudad = { value: ciudad, confidence: confidence };
                console.log('✓ Ciudad detectada:', ciudad);
            }
        }
        
        // Si no encontró ciudad con CP, buscar palabras clave
        if (!data.ciudad.value) {
            const ciudadPatterns = [
                /(?:Ciudad|Población|City)[:\s]*([A-ZÁÉÍÓÚÑ][A-ZÀ-ÿa-z\s]{2,40})/i,
                /\b(Barcelona|Madrid|Valencia|Sevilla|Zaragoza|Málaga|Murcia|Palma|Bilbao|Alicante|Córdoba|Granada|Valladolid)\b/i
            ];
            for (const pattern of ciudadPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    data.ciudad = { value: match[1].trim(), confidence: confidence * 0.9 };
                    console.log('✓ Ciudad detectada (palabra clave):', match[1]);
                    break;
                }
            }
        }
        
        // 10. TELÉFONO (formatos españoles e internacionales)
        // REFUERZO: si tiene 9 números seguidos, es un teléfono
        const textoBusquedaTelefono = tieneZonas && zonaProveedor ? zonaProveedor : text;
        const telefonoPatterns = [
            /(?:Tel[eé]fono|Tel|Phone|Móvil)[:\s]*([\+\d][\d\s\-\(\)]{8,20})/i,  // Con etiqueta
            /\b(\+34\s?[6-9]\d{2}\s?\d{3}\s?\d{3})\b/,  // +34 6XX XXX XXX
            /\b([6-9]\d{2}[\s\-]?\d{3}[\s\-]?\d{3})\b/,  // 6XX XXX XXX o 6XXXXXXXX
            /\b(\d{3}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2})\b/,  // 93 XXX XX XX
            /\b(\+?[0-9]{9,15})\b/  // Cualquier número de 9-15 dígitos
        ];
        for (const pattern of telefonoPatterns) {
            const match = textoBusquedaTelefono.match(pattern);
            if (match && match[1]) {
                let telefono = match[1].trim();
                // Limpiar y normalizar formato
                telefono = telefono.replace(/[\s\-\(\)]/g, '');
                
                // Validar longitud: 9 dígitos españoles o 10-15 internacional
                if (telefono.startsWith('+')) {
                    // Internacional: +34 6XXXXXXXXX (12 chars) o similar
                    if (telefono.length >= 11 && telefono.length <= 15) {
                        data.telefono = { value: telefono, confidence: confidence };
                        console.log('✓ Teléfono detectado (internacional):', telefono, tieneZonas ? '(desde zona proveedor)' : '');
                        break;
                    }
                } else {
                    // Español: 9 dígitos exactos
                    if (telefono.length === 9) {
                        // Validar que empiece por 6, 7, 8 o 9 (móviles y fijos españoles)
                        if (telefono.match(/^[6-9]/)) {
                            telefono = '+34' + telefono; // Añadir prefijo español
                            data.telefono = { value: telefono, confidence: confidence };
                            console.log('✓ Teléfono detectado (español):', telefono, tieneZonas ? '(desde zona proveedor)' : '');
                            break;
                        }
                    }
                }
            }
        }
        
        // 11. EMAIL (REFUERZO: si tiene @, es un email)
        const textoBusquedaEmail = tieneZonas && zonaProveedor ? zonaProveedor : text;
        
        const emailPatterns = [
            /(?:Email|E-mail|Correo)[:\s]*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,  // Con etiqueta
            /\b([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi  // Sin etiqueta (buscar todas)
        ];
        for (const pattern of emailPatterns) {
            const matches = [...textoBusquedaEmail.matchAll(pattern)];
            for (const match of matches) {
                const email = match[1].toLowerCase().trim();
                // Validar formato básico: tiene @ y dominio válido
                if (email.includes('@') && email.includes('.') && email.length > 5 && email.length < 100) {
                    data.email = { value: email, confidence: confidence };
                    console.log('✓ Email detectado:', email, tieneZonas ? '(desde zona proveedor)' : '');
                    break;
                }
            }
            if (data.email.value) break;
        }

        // VALIDACIÓN DE COHERENCIA: base + IVA ≈ total
        this.validateInvoiceCoherence(data);

        // --- MAPEO A NUEVO ESQUEMA (2025) ---
        // Asignar alias para que coincidan con los IDs del schema getSchemas()
        
        // Factura / Albarán
        data.proveedorNombre = data.proveedor;
        data.proveedorCif = data.nif;
        data.numeroFactura = data.numero;
        data.numeroAlbaran = data.numero;
        data.fechaFactura = data.fecha;
        data.fechaAlbaran = data.fecha;
        data.subtotal = data.baseImponible;
        data.ivaTotal = data.iva;
        data.totalFactura = data.total;
        data.totalAlbaran = data.total;
        
        // Ticket
        data.fechaTicket = data.fecha;
        data.totalTicket = data.total;
        data.horaTicket = { value: '', confidence: 0 }; // No extraído aún
        
        // Otros campos comunes
        data.observacionesRevision = data.observaciones;
        data.metodoPago = data.formaPago;

        return data;
    }
    
    validateInvoiceCoherence(data) {
        // Validar que base + IVA ≈ total (tolerancia 0.01€)
        const base = data.baseImponible.value;
        const iva = data.iva.value;
        const total = data.total.value;
        
        if (base > 0 && iva > 0 && total > 0) {
            const calculado = base + iva;
            const diferencia = Math.abs(calculado - total);
            
            if (diferencia > 0.01) {
                // No cuadra - marcar para revisar
                data.needsReview = true;
                data.coherenceError = `Base (${base.toFixed(2)}) + IVA (${iva.toFixed(2)}) = ${calculado.toFixed(2)} ≠ Total (${total.toFixed(2)})`;
                console.warn('⚠️ Coherencia: Los importes no cuadran', data.coherenceError);
            } else {
                data.needsReview = false;
                console.log('✅ Coherencia: Base + IVA = Total correctamente');
            }
        }
    }

    parseDateFromText(text) {
        const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (dateMatch) {
            const [_, day, month, year] = dateMatch;
            const fullYear = year.length === 2 ? '20' + year : year;
            return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return new Date().toISOString().split('T')[0];
    }

    // --- NUEVO SISTEMA DE FORMULARIOS DINÁMICOS ---

    getSchemas() {
        return {
            'factura': [
                // A) Visible y modificable
                { id: 'ocr_tipo_factura', label: 'Tipo Factura', type: 'select', options: ['Detallada', 'Resumen Periodo'], required: true, field: 'tipoFactura' },
                { id: 'ocr_numero', label: 'Nº Factura', type: 'text', required: true, field: 'numeroFactura' },
                { id: 'ocr_fecha', label: 'Fecha Factura', type: 'date', required: true, field: 'fechaFactura' },
                { id: 'ocr_periodo_inicio', label: 'Periodo Inicio', type: 'date', required: false, field: 'periodoInicio' },
                { id: 'ocr_periodo_fin', label: 'Periodo Fin', type: 'date', required: false, field: 'periodoFin' },
                // Regla 3: proveedor_nombre SIEMPRE es razon_social
                { id: 'ocr_proveedor', label: 'Proveedor (Razón Social)', type: 'text', required: true, field: 'proveedorRazonSocial' },
                { id: 'ocr_proveedor_cif', label: 'CIF Proveedor', type: 'text', required: false, field: 'proveedorCif' },
                
                { id: 'ocr_categoria', label: 'Categoría', type: 'select', options: ['Comida', 'Bebida', 'Otros', 'Ticket'], required: true, field: 'categoria' },

                { id: 'ocr_subtotal', label: 'Subtotal', type: 'number', step: '0.01', required: true, field: 'subtotal' },
                { id: 'ocr_descuento', label: 'Descuento Total', type: 'number', step: '0.01', required: false, field: 'descuentoTotal' },
                { id: 'ocr_iva', label: 'IVA Total', type: 'number', step: '0.01', required: true, field: 'ivaTotal' },
                { id: 'ocr_recargos', label: 'Recargos Especiales', type: 'number', step: '0.01', required: false, field: 'recargosEspecialesTotal' },
                { id: 'ocr_otros_cargos', label: 'Otros Cargos', type: 'number', step: '0.01', required: false, field: 'otrosCargos' },
                { id: 'ocr_total', label: 'Total Factura', type: 'number', step: '0.01', required: true, field: 'totalFactura' },
                
                { id: 'ocr_metodo_pago', label: 'Método Pago', type: 'text', required: false, field: 'metodoPago' },
                { id: 'ocr_vencimiento', label: 'Fecha Vencimiento', type: 'date', required: false, field: 'fechaVencimiento' },
                { id: 'ocr_estado_pago', label: 'Estado Pago', type: 'select', options: ['Pendiente', 'Pagado'], required: false, field: 'estadoPago' },
                { id: 'ocr_observaciones', label: 'Observaciones', type: 'textarea', required: false, field: 'observacionesRevision' }
                
                // Campos ocultos/internos eliminados de la vista OCR para no saturar el desplegable
            ],
            'albaran': [
                // A) Visible y modificable
                { id: 'ocr_numero', label: 'Nº Albarán', type: 'text', required: true, field: 'numeroAlbaran' },
                { id: 'ocr_fecha', label: 'Fecha Albarán', type: 'date', required: true, field: 'fechaAlbaran' },
                // Regla 3: proveedor_nombre SIEMPRE es razon_social
                { id: 'ocr_proveedor', label: 'Proveedor (Razón Social)', type: 'text', required: true, field: 'proveedorRazonSocial' },
                { id: 'ocr_proveedor_cif', label: 'CIF Proveedor', type: 'text', required: false, field: 'proveedorCif' },
                { id: 'ocr_referencia', label: 'Referencia Pedido', type: 'text', required: false, field: 'referenciaPedido' },
                
                { id: 'ocr_subtotal', label: 'Subtotal', type: 'number', step: '0.01', required: true, field: 'subtotal' },
                { id: 'ocr_descuento', label: 'Descuento Total', type: 'number', step: '0.01', required: false, field: 'descuentoTotal' },
                { id: 'ocr_iva', label: 'IVA Total', type: 'number', step: '0.01', required: true, field: 'ivaTotal' },
                { id: 'ocr_recargos', label: 'Recargos Especiales', type: 'number', step: '0.01', required: false, field: 'recargosEspecialesTotal' },
                { id: 'ocr_otros_cargos', label: 'Otros Cargos', type: 'number', step: '0.01', required: false, field: 'otrosCargos' },
                { id: 'ocr_total', label: 'Total Albarán', type: 'number', step: '0.01', required: true, field: 'totalAlbaran' },
                { id: 'ocr_observaciones', label: 'Observaciones', type: 'textarea', required: false, field: 'observacionesRevision' }
            ],
            'ticket': [
                // A) Visible y modificable
                { id: 'ocr_numero', label: 'Nº Ticket', type: 'text', required: false, field: 'numeroTicket' },
                { id: 'ocr_fecha', label: 'Fecha Ticket', type: 'date', required: true, field: 'fechaTicket' },
                // Regla 3: proveedor_nombre SIEMPRE es razon_social
                { id: 'ocr_proveedor', label: 'Proveedor (Razón Social)', type: 'text', required: true, field: 'proveedorRazonSocial' },
                { id: 'ocr_total', label: 'Total Ticket', type: 'number', step: '0.01', required: true, field: 'totalTicket' }
            ],
            'venta_pos': [
                { id: 'ocr_fecha', label: 'Fecha', type: 'date', required: true, field: 'fecha' },
                { id: 'ocr_total_dia', label: 'Total Día', type: 'number', required: true, field: 'total' },
                { id: 'ocr_efectivo', label: 'Efectivo', type: 'number', required: false, field: 'efectivo' },
                { id: 'ocr_tarjeta', label: 'Tarjeta', type: 'number', required: false, field: 'tarjeta' }
            ]
        };
    }

    getCollectionSchemas() {
        return {
            'proveedores': {
                // A) Visible y modificable
                nombreComercial: { label: 'Nombre Comercial', type: 'text', section: 'A' },
                razonSocial: { label: 'Razón Social', type: 'text', section: 'A' },
                nifCif: { label: 'NIF/CIF', type: 'text', section: 'A' },
                personaContacto: { label: 'Persona Contacto', type: 'text', section: 'A' },
                telefono: { label: 'Teléfono', type: 'text', section: 'A' },
                email: { label: 'Email', type: 'email', section: 'A' },
                web: { label: 'Web', type: 'text', section: 'A' },
                direccionFiscal: { label: 'Dirección Fiscal', type: 'text', section: 'A' },
                direccionEnvioHabitual: { label: 'Dirección Envío', type: 'text', section: 'A' },
                codigoPostal: { label: 'C.P.', type: 'text', section: 'A' },
                ciudad: { label: 'Ciudad', type: 'text', section: 'A' },
                pais: { label: 'País', type: 'text', section: 'A' },
                metodoPagoPreferido: { label: 'Método Pago', type: 'text', section: 'A' },
                plazoPagoDias: { label: 'Plazo Pago (días)', type: 'number', section: 'A' },
                descuentoAcordadoPorcentaje: { label: 'Descuento (%)', type: 'number', section: 'A' },
                notasCondiciones: { label: 'Notas Condiciones', type: 'textarea', section: 'A' },
                iban: { label: 'IBAN', type: 'text', section: 'A' },
                banco: { label: 'Banco', type: 'text', section: 'A' },
                categoriaPrincipalCompra: { label: 'Categoría Principal', type: 'text', section: 'A' },
                subcategoriasCompra: { label: 'Subcategorías', type: 'text', section: 'A' },
                estado: { label: 'Estado', type: 'select', options: ['Activo', 'Inactivo'], section: 'A' }
                
                // B) Visible NO modificable (Eliminados fechaAlta y notasInternas de la vista general)
            },
            'facturas': {
                // A) Visible y modificable
                tipoFactura: { label: 'Tipo Factura', type: 'select', options: ['Detallada', 'Resumen Periodo'], section: 'A' },
                numeroFactura: { label: 'Nº Factura', type: 'text', section: 'A' },
                fechaFactura: { label: 'Fecha Factura', type: 'date', section: 'A' },
                periodoInicio: { label: 'Periodo Inicio', type: 'date', section: 'A' },
                periodoFin: { label: 'Periodo Fin', type: 'date', section: 'A' },
                proveedorRazonSocial: { label: 'Proveedor (Razón Social)', type: 'text', section: 'A' },
                proveedorCif: { label: 'CIF Proveedor', type: 'text', section: 'A' },
                subtotal: { label: 'Subtotal', type: 'number', step: '0.01', section: 'A' },
                descuentoTotal: { label: 'Descuento Total', type: 'number', step: '0.01', section: 'A' },
                ivaTotal: { label: 'IVA Total', type: 'number', step: '0.01', section: 'A' },
                recargosEspecialesTotal: { label: 'Recargos Especiales', type: 'number', step: '0.01', section: 'A' },
                otrosCargos: { label: 'Otros Cargos', type: 'number', step: '0.01', section: 'A' },
                totalFactura: { label: 'Total Factura', type: 'number', step: '0.01', section: 'A' },
                metodoPago: { label: 'Método Pago', type: 'text', section: 'A' },
                fechaVencimiento: { label: 'Fecha Vencimiento', type: 'date', section: 'A' },
                estadoPago: { label: 'Estado Pago', type: 'select', options: ['Pendiente', 'Pagado'], section: 'A' },
                observacionesRevision: { label: 'Observaciones', type: 'textarea', section: 'A' }
                
                // B) Visible NO modificable (Eliminados campos internos)
            },
            'albaranes': {
                // A) Visible y modificable
                numeroAlbaran: { label: 'Nº Albarán', type: 'text', section: 'A' },
                fechaAlbaran: { label: 'Fecha Albarán', type: 'date', section: 'A' },
                proveedorRazonSocial: { label: 'Proveedor (Razón Social)', type: 'text', section: 'A' },
                proveedorCif: { label: 'CIF Proveedor', type: 'text', section: 'A' },
                referenciaPedido: { label: 'Ref. Pedido', type: 'text', section: 'A' },
                subtotal: { label: 'Subtotal', type: 'number', step: '0.01', section: 'A' },
                descuentoTotal: { label: 'Descuento Total', type: 'number', step: '0.01', section: 'A' },
                ivaTotal: { label: 'IVA Total', type: 'number', step: '0.01', section: 'A' },
                recargosEspecialesTotal: { label: 'Recargos', type: 'number', step: '0.01', section: 'A' },
                otrosCargos: { label: 'Otros Cargos', type: 'number', step: '0.01', section: 'A' },
                totalAlbaran: { label: 'Total Albarán', type: 'number', step: '0.01', section: 'A' },
                observacionesRevision: { label: 'Observaciones', type: 'text', section: 'A' }
                
                // B) Visible NO modificable (Eliminados campos internos)
            },
            'productos': {
                nombre: { label: 'Nombre', type: 'text', section: 'A' },
                descripcion: { label: 'Descripción', type: 'text', section: 'A' },
                categoria: { label: 'Categoría', type: 'text', section: 'A' },
                subcategoria: { label: 'Subcategoría', type: 'text', section: 'A' },
                unidadBase: { label: 'Unidad Base', type: 'text', section: 'A' },
                precio: { label: 'Precio', type: 'number', step: '0.01', section: 'A' },
                stockActualUnidades: { label: 'Stock Actual', type: 'number', step: '0.01', section: 'A' },
                proveedor: { label: 'Proveedor', type: 'text', section: 'A' }
            },
            'escandallos': {
                nombre: { label: 'Nombre Plato', type: 'text', section: 'A' },
                codigo: { label: 'Código', type: 'text', section: 'A' },
                pvpConIva: { label: 'PVP (con IVA)', type: 'number', step: '0.01', section: 'A' },
                tipoIva: { label: 'Tipo IVA (%)', type: 'number', section: 'A' },
                costeTotalNeto: { label: 'Coste Neto', type: 'number', readOnly: true, section: 'B' },
                foodCost: { label: 'Food Cost %', type: 'number', readOnly: true, section: 'B' },
                margenPorcentaje: { label: 'Margen %', type: 'number', readOnly: true, section: 'B' }
            },
            'inventarios': {
                fecha: { label: 'Fecha', type: 'date', section: 'A' },
                familia: { label: 'Familia', type: 'text', section: 'A' },
                observaciones: { label: 'Observaciones', type: 'text', section: 'A' }
            },
            'delivery': {
                plataforma: { label: 'Plataforma', type: 'text', section: 'A' },
                fecha: { label: 'Fecha', type: 'date', section: 'A' },
                ventasBrutas: { label: 'Ventas Brutas', type: 'number', step: '0.01', section: 'A' },
                comisionPorcentaje: { label: 'Comisión %', type: 'number', step: '0.01', section: 'A' },
                comisionImporte: { label: 'Comisión €', type: 'number', step: '0.01', section: 'A' },
                ingresoNeto: { label: 'Ingreso Neto', type: 'number', step: '0.01', section: 'A' }
            }
        };
    }

    renderDynamicOCRForm(data, tipo) {
        const schemas = this.getSchemas();
        const schema = schemas[tipo] || schemas['factura'];
        const container = document.getElementById('ocrDynamicForm');
        if (!container) return;
        container.innerHTML = '';

        const activeFields = schema.filter(field => {
            const hasData = data[field.field] && (data[field.field].value || data[field.field].value === 0);
            return hasData || field.required;
        });

        let html = '<div class="dynamic-form-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">';
        
        activeFields.forEach(field => {
            html += this.renderField(field, data);
        });
        
        html += '</div>';

        const missingFields = schema.filter(f => !activeFields.includes(f));
        if (missingFields.length > 0) {
            html += `
                <div class="add-field-container">
                    <div class="custom-select-wrapper">
                        <div class="custom-select-trigger" onclick="window.app.toggleFieldDropdown()">
                            <span id="customSelectText">+ Añadir campo faltante...</span>
                            <span class="arrow">▼</span>
                        </div>
                        <div id="customSelectOptions" class="custom-select-options hidden">
                            ${missingFields.map(f => `
                                <div class="custom-option" data-value="${f.id}" onclick="window.app.selectFieldOption('${f.id}', '${f.label}')">
                                    ${f.label}
                                </div>
                            `).join('')}
                        </div>
                        <input type="hidden" id="addFieldSelect" value="">
                    </div>
                    <button type="button" class="btn-secondary add-field-btn" onclick="window.app.addFieldFromDropdown()">
                        Añadir
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
        
        const saveBtn = document.getElementById('ocrSaveBtn');
        if (saveBtn) saveBtn.disabled = false;
        
        if (tipo === 'factura') {
             const inputNumero = document.getElementById('ocr_numero');
             const inputProveedor = document.getElementById('ocr_proveedor');
             if (inputNumero && inputProveedor) {
                 // Lógica de duplicados simplificada
             }
        }
    }

    toggleFieldDropdown() {
        const options = document.getElementById('customSelectOptions');
        const wrapper = document.querySelector('.custom-select-wrapper');
        
        if (options && wrapper) {
            const isHidden = options.classList.contains('hidden');
            
            if (isHidden) {
                // Opening
                options.classList.remove('hidden');
                
                // Check position
                const rect = wrapper.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const optionsHeight = 200; // Max height approx
                
                // If space below is less than options height and space above is more
                if (spaceBelow < optionsHeight && rect.top > optionsHeight) {
                    options.classList.add('open-up');
                } else {
                    options.classList.remove('open-up');
                }
            } else {
                // Closing
                options.classList.add('hidden');
                options.classList.remove('open-up');
            }
        }
    }

    selectFieldOption(value, label) {
        document.getElementById('addFieldSelect').value = value;
        const triggerText = document.getElementById('customSelectText');
        triggerText.textContent = label;
        triggerText.style.color = '#1f2d3d';
        triggerText.style.fontWeight = '500';
        
        // Highlight selected option
        document.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('selected'));
        const selectedOpt = document.querySelector(`.custom-option[data-value="${value}"]`);
        if (selectedOpt) selectedOpt.classList.add('selected');

        this.toggleFieldDropdown();
    }

    addFieldFromDropdown() {
        const select = document.getElementById('addFieldSelect');
        if (!select || !select.value) {
            this.showToast('⚠️ Selecciona un campo primero', true);
            return;
        }
        
        this.addFieldToForm(select.value);
        
        // Remove option from custom list
        const option = document.querySelector(`.custom-option[data-value="${select.value}"]`);
        if (option) option.remove();
        
        // Reset trigger
        select.value = "";
        const triggerText = document.getElementById('customSelectText');
        triggerText.textContent = "+ Añadir campo faltante...";
        triggerText.style.color = '';
        triggerText.style.fontWeight = '';
        
        // If no more options, hide container
        const optionsContainer = document.getElementById('customSelectOptions');
        if (optionsContainer && optionsContainer.children.length === 0) {
            const container = document.querySelector('.add-field-container');
            if(container) container.style.display = 'none';
        }
    }

    renderField(field, data) {
        const value = data[field.field] ? (data[field.field].value || '') : '';
        const confidence = data[field.field] ? data[field.field].confidence : 0;
        
        let confidenceBadge = '';
        let isHighConfidence = false;

        if (confidence > 0) {
            const color = confidence > 80 ? '#27ae60' : (confidence > 50 ? '#f39c12' : '#c0392b');
            confidenceBadge = `<span style="color: ${color}; font-size: 0.8em; margin-left: 5px;">● ${Math.round(confidence)}%</span>`;
            
            // Regla OCR 1: Si confianza >= 90%, campo bloqueado (readonly)
            if (confidence >= 90) {
                isHighConfidence = true;
                confidenceBadge += ` <span title="Lectura de alta confianza" style="cursor:help">🔒</span>`;
            }
        }

        // Determinar si es readonly por esquema o por confianza OCR
        const isReadOnly = field.readOnly || isHighConfidence;
        const readOnlyAttr = isReadOnly ? 'readonly' : '';
        const readOnlyClass = isReadOnly ? 'input-readonly' : '';

        let inputHtml = '';
        if (field.type === 'select') {
            // Los selects no soportan readonly igual que inputs, se suelen deshabilitar o usar CSS
            // Si es high confidence, lo deshabilitamos pero enviamos valor en hidden si fuera necesario (aquí simplificado)
            const disabledAttr = isReadOnly ? 'disabled' : '';
            inputHtml = `<select id="${field.id}" class="form-select ${readOnlyClass}" ${disabledAttr}>
                ${field.options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
            </select>`;
            if (isReadOnly) {
                inputHtml += `<input type="hidden" id="${field.id}_hidden" value="${value}">`; // Fallback para valor
            }
        } else if (field.type === 'textarea') {
            inputHtml = `<textarea id="${field.id}" class="form-control ${readOnlyClass}" rows="3" ${readOnlyAttr}>${value}</textarea>`;
        } else {
            inputHtml = `<input type="${field.type}" id="${field.id}" value="${value}" class="form-control ${readOnlyClass}" ${field.required ? 'required' : ''} ${readOnlyAttr}>`;
        }

        return `
            <div class="form-group">
                <label for="${field.id}">${field.label} ${confidenceBadge}</label>
                ${inputHtml}
            </div>
        `;
    }

    showAddFieldModal(tipo) {
        const schemas = this.getSchemas();
        const schema = schemas[tipo];
        
        const currentIds = Array.from(document.querySelectorAll('#ocrDynamicForm [id^="ocr_"]')).map(el => el.id);
        const availableFields = schema.filter(f => !currentIds.includes(f.id));

        if (availableFields.length === 0) {
            this.showToast('Todos los campos ya están visibles');
            return;
        }

        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <h3>Añadir Campo</h3>
            <div class="field-list" style="display: flex; flex-direction: column; gap: 10px;">
                ${availableFields.map(f => `
                    <button class="btn-outline" onclick="app.addFieldToForm('${f.id}')" style="text-align: left; padding: 10px;">
                        ${f.label}
                    </button>
                `).join('')}
            </div>
            <button class="btn-secondary" style="margin-top: 15px;" onclick="document.body.removeChild(this.closest('.modal-overlay-generic'))">Cancelar</button>
        `;
        
        this.showModal('Añadir Campo', '');
        const modalBody = document.querySelector('.modal-generic');
        if (modalBody) {
            modalBody.innerHTML = '';
            modalBody.appendChild(modalContent);
        }
    }

    addFieldToForm(fieldId) {
        const schemas = this.getSchemas();
        let fieldDef = null;
        for (const key in schemas) {
            const found = schemas[key].find(f => f.id === fieldId);
            if (found) {
                fieldDef = found;
                break;
            }
        }

        if (!fieldDef) return;

        const fieldHtml = this.renderField(fieldDef, {});
        
        const grid = document.querySelector('.dynamic-form-grid');
        if (grid) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = fieldHtml;
            grid.appendChild(tempDiv.firstElementChild);
        }

        const modal = document.querySelector('.modal-overlay-generic');
        if (modal) document.body.removeChild(modal);
    }

    displayOCRForm(data, tipo) {
        // Usar el nuevo renderizador dinámico
        this.renderDynamicOCRForm(data, tipo);
        this.currentOCRExtractedData = data;
    }

    // --- GESTIÓN DE ELEMENTOS (CRUD) ---
    deleteItem(collection, id) {
        console.log(`🗑️ Solicitud de eliminación: ${collection} #${id}`);
        
        // Mapeo de nombres singulares para mensajes
        const singularMap = {
            'facturas': 'la factura',
            'albaranes': 'el albarán',
            'proveedores': 'el proveedor',
            'productos': 'el producto',
            'escandallos': 'el escandallo',
            'cierres': 'el cierre',
            'inventarios': 'el inventario',
            'delivery': 'el registro de delivery'
        };
        
        const itemNombre = singularMap[collection] || 'el elemento';

        this.showConfirm(
            '🗑️ Eliminar Elemento',
            `¿Estás seguro de que quieres eliminar ${itemNombre}? Esta acción no se puede deshacer.`,
            () => {
                try {
                    this.db.delete(collection, id);
                    this.showToast('✅ Elemento eliminado correctamente');
                    this.render();
                } catch (error) {
                    console.error('Error eliminando:', error);
                    this.showToast('❌ Error al eliminar el elemento', true);
                }
            },
            'Sí, eliminar',
            'Cancelar'
        );
    }

    editItem(collection, id) {
        console.log(`✏️ Solicitud de edición: ${collection} #${id}`);
        
        // Obtener el elemento
        const item = this.db[collection].find(i => i.id === id);
        if (!item) {
            this.showToast('❌ Elemento no encontrado', true);
            return;
        }

        // 1. PRODUCTOS
        if (collection === 'productos') {
            this.expandForm('producto');
            const form = document.getElementById('productoForm');
            form.dataset.editId = item.id;
            
            document.getElementById('productoNombre').value = item.nombre;
            document.getElementById('productoPrecio').value = item.precioPromedioNeto;
            document.getElementById('productoUnidadBase').value = item.unidadBase;
            document.getElementById('productoEsEmpaquetado').value = item.esEmpaquetado.toString();
            this.toggleEmpaqueFields(); // Actualizar visibilidad
            document.getElementById('productoTipoEmpaque').value = item.tipoEmpaque || '';
            document.getElementById('productoUnidadesPorEmpaque').value = item.unidadesPorEmpaque || '';
            document.getElementById('productoStockActual').value = item.stockActualUnidades || 0;
            
            if (this.proveedorDropdown) {
                this.proveedorDropdown.setValue(item.proveedorId);
            }
            
            const btn = form.querySelector('button[type="submit"]');
            if(btn) btn.textContent = '✓ Actualizar Producto';
            return;
        }

        // 2. PROVEEDORES
        if (collection === 'proveedores') {
            this.expandForm('proveedor');
            const form = document.getElementById('proveedorForm');
            form.dataset.editId = item.id;
            
            document.getElementById('proveedorNombreComercial').value = item.nombreComercial || '';
            document.getElementById('proveedorRazonSocial').value = item.nombreFiscal || item.nombre || '';
            document.getElementById('proveedorNifCif').value = item.nifCif || item.cif || '';
            document.getElementById('proveedorPersonaContacto').value = item.personaContacto || item.contacto || '';
            document.getElementById('proveedorTelefono').value = item.telefono || '';
            document.getElementById('proveedorEmail').value = item.email || '';
            document.getElementById('proveedorWeb').value = item.web || '';
            document.getElementById('proveedorDireccionFiscal').value = item.direccionFiscal || item.direccion || '';
            document.getElementById('proveedorDireccionEnvioHabitual').value = item.direccionEnvio || '';
            document.getElementById('proveedorCodigoPostal').value = item.codigoPostal || item.cp || '';
            document.getElementById('proveedorCiudad').value = item.ciudad || '';
            document.getElementById('proveedorPais').value = item.pais || '';
            document.getElementById('proveedorMetodoPagoPreferido').value = item.metodoPago || item.condicionesPago || '';
            document.getElementById('proveedorPlazoPagoDias').value = item.plazoPagoDias || item.plazoPago || '';
            document.getElementById('proveedorDescuentoAcordadoPorcentaje').value = item.descuento || '';
            document.getElementById('proveedorIban').value = item.iban || '';
            document.getElementById('proveedorBanco').value = item.banco || '';
            document.getElementById('proveedorCategoriaPrincipalCompra').value = item.categoria || '';
            document.getElementById('proveedorSubcategoriasCompra').value = item.subcategorias || '';
            document.getElementById('proveedorNotasCondiciones').value = item.notasCondiciones || item.notas || '';
            document.getElementById('proveedorNotasInternas').value = item.notasInternas || '';
            document.getElementById('proveedorEstado').value = item.estado || 'Activo';
            document.getElementById('proveedorFechaAlta').value = item.fechaAlta || '';
            
            const btn = form.querySelector('button[type="submit"]');
            if(btn) btn.textContent = '✓ Actualizar Proveedor';
            return;
        }

        // 3. ESCANDALLOS
        if (collection === 'escandallos') {
            this.expandForm('escandallo');
            const form = document.getElementById('escandalloForm');
            form.dataset.editId = item.id;
            
            // Actualizar título del formulario
            const formCard = document.getElementById('escandalloFormCard');
            const title = formCard.querySelector('h3');
            if (title) title.textContent = `Editar Escandallo: ${item.nombre}`;

            document.getElementById('escandalloNombre').value = item.nombre;
            document.getElementById('escandalloCodigo').value = item.codigo || '';
            document.getElementById('escandalloPVPConIVA').value = item.pvpConIva;
            document.getElementById('escandalloTipoIVA').value = item.tipoIva;
            document.getElementById('escandalloPVPNeto').value = item.pvpNeto;
            document.getElementById('escandalloCosteTotalNeto').value = item.costeTotalNeto;
            document.getElementById('escandalloFC').value = item.foodCost;
            document.getElementById('escandalloMargen').value = item.margenPorcentaje;
            document.getElementById('escandalloNotas').value = item.notas || '';

            // Reconstruir ingredientes
            const container = document.getElementById('ingredientesContainer');
            container.innerHTML = '';
            if (item.ingredientes) {
                item.ingredientes.forEach(ing => {
                    this.addIngredienteRow();
                    const rows = container.querySelectorAll('.ingrediente-item');
                    const lastRow = rows[rows.length - 1];
                    
                    // Seleccionar producto en el select estándar
                    const select = lastRow.querySelector('.ingrediente-producto');
                    if (select) {
                        select.value = ing.productoId;
                        // Cargar datos por defecto del producto (unidad, coste)
                        this.onIngredienteProductoChange(select);
                    }
                    
                    // Restaurar valores específicos guardados (sobreescribiendo defaults si es necesario)
                    if (ing.cantidad) lastRow.querySelector('.ingrediente-cantidad').value = ing.cantidad;
                    if (ing.unidad) lastRow.querySelector('.ingrediente-unidad').value = ing.unidad;
                    if (ing.costeUnitario) lastRow.querySelector('.ingrediente-coste-unitario').value = ing.costeUnitario;
                    
                    // Recalcular total de la fila
                    const cantidad = parseFloat(lastRow.querySelector('.ingrediente-cantidad').value) || 0;
                    const costeUnitario = parseFloat(lastRow.querySelector('.ingrediente-coste-unitario').value) || 0;
                    lastRow.querySelector('.ingrediente-coste-total').value = (cantidad * costeUnitario).toFixed(2);
                });
                this.calcularCostesEscandallo();
            }
            
            const btn = form.querySelector('button[type="submit"]');
            if(btn) btn.textContent = '✓ Actualizar Escandallo';
            return;
        }

        // 4. INVENTARIOS
        if (collection === 'inventarios') {
            // 1. Cambiar a la vista de inventarios
            document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
            const view = document.getElementById('inventarioView');
            if (view) view.classList.remove('hidden');
            
            // Actualizar menú lateral
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            const navBtn = document.querySelector('.nav-item[data-view="inventarios"]');
            if (navBtn) navBtn.classList.add('active');
            
            // 2. Preparar formulario
            const formCard = document.getElementById('inventarioFormCard');
            if (formCard) formCard.classList.remove('hidden');
            
            const form = document.getElementById('inventarioForm');
            form.dataset.editId = item.id;
            
            // 3. Cargar datos
            document.getElementById('inventarioFecha').value = item.fecha;
            document.getElementById('inventarioFamilia').value = item.familia;
            
            // Inicializar estado
            this.inventarioState = {
                step: 2,
                counts: {},
                currentProduct: null
            };
            
            if (item.productos) {
                item.productos.forEach(p => {
                    this.inventarioState.counts[p.id] = p.stockReal;
                });
            }
            
            // 4. Mostrar paso 2 directamente
            const step1 = document.getElementById('inventarioStep1');
            if (step1) step1.classList.add('hidden');
            form.classList.remove('hidden');
            
            // 5. Actualizar UI
            const title = formCard.querySelector('h3');
            if (title) title.textContent = `Editar Inventario: ${item.fecha}`;
            
            const btn = form.querySelector('button[type="submit"]');
            if (btn) btn.textContent = '✓ Actualizar Inventario';
            
            // 6. Renderizar tabla
            this.populateInventarioFilters();
            this.filterInventarioTable();
            
            return;
        }

        // 5. MODALES ESPECÍFICOS (Facturas, Albaranes, Cierres) -> AHORA INLINE
        if (collection === 'facturas' || collection === 'albaranes') {
            // 1. Cambiar a la vista de escáner
            document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
            const view = document.getElementById('ocrView');
            if (view) view.classList.remove('hidden');
            
            // Actualizar menú lateral
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            const navBtn = document.querySelector('.nav-item[data-view="ocr"]');
            if (navBtn) navBtn.classList.add('active');

            // 2. Ocultar tarjetas de carga y mostrar formulario de datos
            const optionsCard = document.getElementById('scanOptionsCard');
            const uploadCard = document.getElementById('ocrUploadCard');
            const dataCard = document.getElementById('ocrDataCard');
            
            if (optionsCard) optionsCard.classList.add('hidden');
            if (uploadCard) uploadCard.classList.add('hidden');
            if (dataCard) dataCard.classList.remove('hidden');
            
            // 3. Preparar datos para el formulario OCR
            const tipo = collection === 'facturas' ? 'factura' : 'albaran';
            const ocrData = {
                tipoFactura: { value: item.tipoFactura || 'Detallada', confidence: 1 },
                numeroFactura: { value: item.numeroFactura, confidence: 1 },
                numeroAlbaran: { value: item.numeroAlbaran, confidence: 1 },
                fechaFactura: { value: item.fecha, confidence: 1 },
                fechaAlbaran: { value: item.fecha, confidence: 1 },
                proveedorRazonSocial: { value: item.proveedor, confidence: 1 },
                proveedorCif: { value: item.nifCif, confidence: 1 },
                subtotal: { value: item.baseImponible || item.subtotal, confidence: 1 },
                ivaTotal: { value: (item.total - (item.baseImponible || item.subtotal)), confidence: 1 },
                totalFactura: { value: item.total, confidence: 1 },
                totalAlbaran: { value: item.total, confidence: 1 },
                categoria: { value: item.categoria, confidence: 1 },
                observacionesRevision: { value: item.observacionesRevision || '', confidence: 1 }
            };
            
            // 4. Renderizar formulario
            this.currentOCRType = tipo;
            this.renderDynamicOCRForm(ocrData, tipo);
            
            // 5. Configurar botón de guardado
            const btn = document.getElementById('ocrSaveBtn');
            if (btn) {
                btn.textContent = collection === 'facturas' ? '✓ Actualizar Factura' : '✓ Actualizar Albarán';
                btn.disabled = false;
            }
            
            dataCard.dataset.editId = item.id;
            dataCard.dataset.editCollection = collection;
            
            // 6. Actualizar título
            const title = dataCard.querySelector('h3');
            if (title) title.textContent = `✏️ Editar ${collection === 'facturas' ? 'Factura' : 'Albarán'}: ${item.proveedor}`;
            
            return;
        }

        if (collection === 'cierres') {
            if (this.abrirModalEditarCierre) this.abrirModalEditarCierre(item.id);
            return;
        }
        
        // 6. INVENTARIOS (Ya manejado arriba)
        // if (collection === 'inventarios') { ... }

        console.warn(`Edición no implementada para ${collection}`);
        this.showToast(`⚠️ La edición de ${collection} no está disponible`);
    }

    saveOCRData() {
        console.log('💾 saveOCRData iniciado. Contexto:', this);
        const tipo = this.currentOCRType;
        
        // Helper para obtener valor de forma segura
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : null;
        };

        try {
            if (tipo === 'factura' || tipo === 'ticket') {
                // Obtener valores soportando IDs antiguos y nuevos (compatibilidad schema)
                const baseNetaStr = getVal('ocr_base') || getVal('ocr_subtotal');
                const baseNeta = baseNetaStr ? parseFloat(baseNetaStr) : 0;
                
                const nombreProveedor = getVal('ocr_proveedor');
                const nifCif = getVal('ocr_nif') || getVal('ocr_proveedor_cif');
                const numeroFactura = getVal('ocr_numero');
                
                // Validaciones específicas para Factura
                if (tipo === 'factura') {
                    const missingFields = [];
                    if (!nombreProveedor) missingFields.push('Nombre Proveedor');
                    if (!numeroFactura) missingFields.push('Nº Factura');
                    // Añadir más validaciones si es necesario
                    
                    if (missingFields.length > 0) {
                        throw new Error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
                    }
                }

                console.log(`🔍 Verificando duplicados: ${numeroFactura} - ${nombreProveedor}`);

                // Verificar duplicados (con validación segura)
                const facturaDuplicada = (numeroFactura && nombreProveedor) ? this.db.facturas.find(f => 
                    f.numeroFactura === numeroFactura && 
                    f.proveedor && f.proveedor.toLowerCase() === nombreProveedor.toLowerCase()
                ) : null;
                
                if (facturaDuplicada) {
                    console.log('⚠️ Duplicado encontrado:', facturaDuplicada);
                    
                    if (typeof this.showConfirm === 'function') {
                        // Mostrar confirmación de duplicado
                        this.showConfirm(
                            '⚠️ Factura Duplicada',
                            `Ya existe la factura ${numeroFactura} de ${nombreProveedor}. ¿Deseas sustituirla?`,
                            () => {
                                console.log('🔄 Usuario confirmó sustitución');
                                // Sustituir factura existente
                                this.db.delete('facturas', facturaDuplicada.id);
                                this.continuarGuardadoFactura(tipo, baseNeta, nombreProveedor, nifCif, numeroFactura, true);
                            },
                            '✓ Sustituir factura',
                            '✗ Cancelar'
                        );
                    } else {
                        console.error('❌ this.showConfirm no es una función');
                        alert(`⚠️ Factura Duplicada: Ya existe la factura ${numeroFactura}.`);
                    }
                    return; // Detener ejecución hasta que el usuario decida
                }
                
                // Continuar con guardado normal (sin duplicados)
                this.continuarGuardadoFactura(tipo, baseNeta, nombreProveedor, nifCif, numeroFactura, false);
                
            } else if (tipo === 'albaran') {
                const albaran = {
                    fecha: document.getElementById('ocr_fecha').value,
                    proveedor: document.getElementById('ocr_proveedor').value,
                    numeroAlbaran: document.getElementById('ocr_numero').value,
                    periodo: this.currentPeriod,
                    verificado: false,
                    ocrProcessed: true
                };
                this.db.add('albaranes', albaran);
                if (typeof this.showModal === 'function') {
                    this.showModal('✅ Éxito', 'Albarán guardado en COMPRAS correctamente', 'success');
                }
                
            } else if (tipo === 'cierre') {
                const cierre = {
                    fecha: document.getElementById('ocr_fecha').value,
                    turno: 'comida',
                    totalReal: parseFloat(document.getElementById('ocr_total').value),
                    totalPos: parseFloat(document.getElementById('ocr_total').value),
                    numTickets: 0,
                    periodo: this.currentPeriod,
                    ocrProcessed: true
                };
                this.db.add('cierres', cierre);
                if (typeof this.showModal === 'function') {
                    this.showModal('✅ Éxito', 'Cierre de caja guardado en periodo actual', 'success');
                }
                
            } else if (tipo === 'delivery') {
                const ventasBrutas = parseFloat(document.getElementById('ocr_ventas').value);
                const comision = parseFloat(document.getElementById('ocr_comision').value);
                
                const delivery = {
                    fecha: document.getElementById('ocr_fecha').value,
                    plataforma: document.getElementById('ocr_plataforma').value,
                    ventasBrutas: ventasBrutas,
                    comisionPorcentaje: comision,
                    comisionImporte: ventasBrutas * comision / 100,
                    ingresoNeto: ventasBrutas - (ventasBrutas * comision / 100),
                    periodo: this.currentPeriod,
                    ocrProcessed: true
                };
                this.db.add('delivery', delivery);
                if (typeof this.showModal === 'function') {
                    this.showModal('✅ Éxito', 'Delivery guardado en periodo actual con comisiones calculadas', 'success');
                }
            }

            this.resetOCRForm();
            this.render();
            
        } catch (error) {
            console.error('Error guardando OCR:', error);
            if (typeof this.showModal === 'function') {
                this.showModal('❌ Error', error.message || 'Error al guardar los datos. Verifica los campos.', 'error');
            } else {
                alert('❌ ' + (error.message || 'Error al guardar los datos. Verifica los campos.'));
            }
        }
    }

    seleccionarProveedorExistente(proveedorId, nombreFiscal) {
        // Usuario seleccionó un proveedor existente de la lista
        document.getElementById('ocr_proveedor').value = nombreFiscal;
        
        // Buscar el proveedor y rellenar el CIF si no está
        const proveedor = this.db.proveedores.find(p => p.id === parseInt(proveedorId));
        if (proveedor && proveedor.nifCif) {
            const nifInput = document.getElementById('ocr_nif') || document.getElementById('ocr_proveedor_cif');
            if (nifInput) nifInput.value = proveedor.nifCif;
        }
        
        // Ocultar formulario de datos adicionales
        const datosAdicionalesDiv = document.getElementById('ocr_datos_adicionales_proveedor');
        if (datosAdicionalesDiv) {
            datosAdicionalesDiv.style.display = 'none';
        }
        
        this.showToast('✓ Proveedor existente seleccionado');
    }

    confirmarProveedorNuevo() {
        // Usuario confirmó que es un proveedor nuevo
        const datosAdicionalesDiv = document.getElementById('ocr_datos_adicionales_proveedor');
        if (datosAdicionalesDiv) {
            datosAdicionalesDiv.style.display = 'block';
        }
        
        this.showToast('📋 Completa los datos adicionales del nuevo proveedor');
    }

    verificarProveedorSimilar() {
        // Si el usuario edita manualmente el nombre, re-verificar similares
        // (Función placeholder para futuras mejoras)
    }

    continuarGuardadoFactura(tipo, baseNeta, nombreProveedor, nifCif, numeroFactura, esSustitucion) {
        console.log('💾 continuarGuardadoFactura iniciado', { tipo, numeroFactura, esSustitucion });
        
        try {
            // Verificar si el proveedor existe para crearlo si no
            let proveedorExiste = false;
            if (nifCif) proveedorExiste = this.db.proveedores.some(p => p.nifCif === nifCif);
            if (!proveedorExiste && nombreProveedor) {
                proveedorExiste = this.db.proveedores.some(p => p.nombreFiscal.toLowerCase() === nombreProveedor.toLowerCase());
            }
            
            // Crear proveedor automático si no existe
            if (!proveedorExiste && nombreProveedor) {
                const nuevoProveedor = {
                    nombreFiscal: nombreProveedor,
                    nombreComercial: nombreProveedor,
                    nifCif: nifCif || '',
                    tipo: 'Comida', // Por defecto
                    periodo: this.currentPeriod,
                    creadoDesdeOCR: true
                };
                this.db.add('proveedores', nuevoProveedor);
            }

            const factura = {
                fecha: document.getElementById('ocr_fecha').value,
                proveedor: nombreProveedor,
                numeroFactura: numeroFactura,
                nifCif: nifCif,
                baseImponible: baseNeta,
                total: parseFloat(document.getElementById('ocr_total').value) || 0,
                categoria: tipo === 'ticket' ? 'Ticket' : 'Comida',
                periodo: this.currentPeriod,
                ocrProcessed: true,
                ocrConfidence: this.currentOCRExtractedData ? this.currentOCRExtractedData.confidence : 0,
                archivoNombre: this.currentImageData ? 'imagen_ocr.png' : 'archivo.pdf'
            };
            
            this.db.add('facturas', factura);
            
            // Usar showModal de forma segura
            if (typeof this.showModal === 'function') {
                this.showModal('✅ Guardado', 'Documento procesado y guardado correctamente.', 'success');
            } else {
                console.warn('⚠️ this.showModal no disponible, usando alert');
                alert('✅ Documento procesado y guardado correctamente.');
            }

            this.resetOCRForm();
            this.render();
        } catch (error) {
            console.error('❌ Error en continuarGuardadoFactura:', error);
            alert('Error al guardar la factura: ' + error.message);
        }
    }

    abrirModalEditarFactura(factura) {
        if (!factura) return;
        const badgeBase = this.getConfidenceBadge ? this.getConfidenceBadge(factura.ocrConfidence) : '';

        const html = `
            <form id="editarFacturaForm" class="form-grid">
                <div class="form-row">
                    <div class="form-group">
                        <label>Proveedor *</label>
                        <input type="text" name="proveedor" value="${factura.proveedor}" required>
                    </div>
                    <div class="form-group">
                        <label>NIF/CIF</label>
                        <input type="text" name="nifCif" value="${factura.nifCif || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº Factura *</label>
                        <input type="text" name="numeroFactura" value="${factura.numeroFactura}" required>
                    </div>
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" name="fecha" value="${factura.fecha}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Base NETA (€) * ${badgeBase}</label>
                        <input type="number" step="0.01" name="baseImponible" value="${factura.baseImponible}" required>
                    </div>
                    <div class="form-group">
                        <label>Total CON IVA (€)</label>
                        <input type="number" step="0.01" name="total" value="${factura.total}">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Categoría</label>
                    <select name="categoria" class="form-select">
                        <option value="Comida" ${factura.categoria === 'Comida' ? 'selected' : ''}>Comida</option>
                        <option value="Bebida" ${factura.categoria === 'Bebida' ? 'selected' : ''}>Bebida</option>
                        <option value="Otros" ${factura.categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                        <option value="Ticket" ${factura.categoria === 'Ticket' ? 'selected' : ''}>Ticket Supermercado</option>
                    </select>
                </div>
                <div class="modal-actions full-width">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('universalModal').classList.remove('show')">Cancelar</button>
                    <button type="submit" class="btn-primary">✓ Guardar Cambios</button>
                </div>
            </form>
        `;
        
        this.openModal('✏️ Editar Factura', html, (formData) => {
            const updated = {
                proveedor: formData.get('proveedor'),
                nifCif: formData.get('nifCif'),
                numeroFactura: formData.get('numeroFactura'),
                fecha: formData.get('fecha'),
                baseImponible: parseFloat(formData.get('baseImponible')),
                total: parseFloat(formData.get('total')),
                categoria: formData.get('categoria')
            };
            this.db.update('facturas', factura.id, updated);
            this.render();
            this.showToast('✓ Factura actualizada correctamente');
            return true;
        });
    }

    abrirModalEditarAlbaran(albaran) {
        if (!albaran) return;

        const html = `
            <form id="editarAlbaranForm" class="form-grid">
                <div class="form-row">
                    <div class="form-group">
                        <label>Proveedor *</label>
                        <input type="text" name="proveedor" value="${albaran.proveedor}" required>
                    </div>
                    <div class="form-group">
                        <label>Nº Albarán *</label>
                        <input type="text" name="numeroAlbaran" value="${albaran.numeroAlbaran}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha *</label>
                        <input type="date" name="fecha" value="${albaran.fecha}" required>
                    </div>
                </div>
                <div class="modal-actions full-width">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('universalModal').classList.remove('show')">Cancelar</button>
                    <button type="submit" class="btn-primary">✓ Guardar Cambios</button>
                </div>
            </form>
        `;
        
        this.openModal('✏️ Editar Albarán', html, (formData) => {
            const updated = {
                proveedor: formData.get('proveedor'),
                numeroAlbaran: formData.get('numeroAlbaran'),
                fecha: formData.get('fecha')
            };
            this.db.update('albaranes', albaran.id, updated);
            this.render();
            this.showToast('✓ Albarán actualizado correctamente');
            return true;
        });
    }

    // --- LÓGICA DE CIERRES REPARADA ---

    openModal(title, htmlContent, onSaveCallback) {
        console.log('📝 openModal llamado:', title);
        
        // Eliminar overlays previos
        const existingOverlay = document.querySelector('.modal-overlay-form');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay-form';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '2000000';
        overlay.style.backdropFilter = 'blur(2px)';
        
        const modal = document.createElement('div');
        modal.className = 'modal-form';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '30px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        modal.style.maxWidth = '600px';
        modal.style.width = '95%';
        modal.style.maxHeight = '90vh';
        modal.style.overflowY = 'auto';
        modal.style.position = 'relative';
        
        modal.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 24px; font-weight: bold; border-bottom: 2px solid #eee; padding-bottom: 10px;">${title}</h3>
            <div class="modal-content-body">${htmlContent}</div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Manejar cierre
        const closeModal = () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        };

        // Buscar formulario y manejar submit
        const form = modal.querySelector('form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                if (onSaveCallback) {
                    const result = onSaveCallback(formData);
                    if (result !== false) { // Si devuelve false, no cerrar
                        closeModal();
                    }
                } else {
                    closeModal();
                }
            };
        }

        // Buscar botones de cancelar (por texto o clase)
        const cancelBtns = modal.querySelectorAll('button.btn-secondary, button:not([type="submit"])');
        cancelBtns.forEach(btn => {
            if (btn.textContent.toLowerCase().includes('cancelar')) {
                // Sobrescribir el onclick inline si existe
                btn.onclick = (e) => {
                    e.preventDefault();
                    closeModal();
                };
            }
        });

        // Clic fuera para cerrar
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        };
    }

    conectarEventosCierre() {
        // Esta función se llamará al abrir el formulario de cierre
        try {
            // 1. Listeners de Billetes y Monedas
            const inputs = document.querySelectorAll('.billete-input');
            inputs.forEach(input => {
                // Eliminar listeners antiguos para evitar duplicados
                const nuevoInput = input.cloneNode(true);
                if (input.parentNode) {
                    input.parentNode.replaceChild(nuevoInput, input);
                    nuevoInput.addEventListener('input', () => this.calcularTotalesCierre());
                }
            });

            // 2. Botones de Añadir
            const btnTPV = document.getElementById('addDatafono');
            const btnOtro = document.getElementById('addOtroMedio');
            
            if (btnTPV && btnTPV.parentNode) {
                const nuevoBtn = btnTPV.cloneNode(true);
                btnTPV.parentNode.replaceChild(nuevoBtn, btnTPV);
                nuevoBtn.addEventListener('click', () => this.addFilaTPV());
            }
            
            if (btnOtro && btnOtro.parentNode) {
                const nuevoBtn = btnOtro.cloneNode(true);
                btnOtro.parentNode.replaceChild(nuevoBtn, btnOtro);
                nuevoBtn.addEventListener('click', () => this.addFilaOtroMedio());
            }
            
            // 3. Listeners de Campos POS fijos (Efectivo/Tarjetas)
            // Se añadirán dinámicamente en renderDatosPOS
            this.renderDatosPOS();
        } catch (error) {
            console.error('Error en conectarEventosCierre:', error);
        }
    }

    addFilaTPV() {
        const container = document.getElementById('datafonosContainer');
        const div = document.createElement('div');
        div.className = 'datafono-item';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" placeholder="Nombre TPV (ej: Barra)" class="datafono-nombre" style="flex: 2;">
            <input type="number" step="0.01" placeholder="0.00 €" class="datafono-importe" style="flex: 1;">
            <button type="button" class="btn-remove" style="padding: 5px 10px;">✕</button>
        `;
        
        // Evento borrar
        div.querySelector('.btn-remove').onclick = () => {
            div.remove();
            this.calcularTotalesCierre();
        };
        
        // Evento sumar
        div.querySelector('.datafono-importe').oninput = () => this.calcularTotalesCierre();
        
        container.appendChild(div);
    }

    addFilaOtroMedio() {
        const container = document.getElementById('otrosMediosContainer');
        const div = document.createElement('div');
        div.className = 'otro-medio-item';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <select class="otro-medio-tipo form-select" style="flex: 2;">
                <option value="Bizum">Bizum</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Glovo">Glovo (Pago App)</option>
                <option value="Uber">Uber (Pago App)</option>
                <option value="JustEat">JustEat (Pago App)</option>
                <option value="TicketRest">Ticket Restaurant</option>
                <option value="Otro">Otro</option>
            </select>
            <input type="number" step="0.01" placeholder="0.00 €" class="otro-medio-importe" style="flex: 1;">
            <button type="button" class="btn-remove" style="padding: 5px 10px;">✕</button>
        `;
        
        // Evento borrar
        div.querySelector('.btn-remove').onclick = () => {
            div.remove();
            this.renderDatosPOS(); // Actualizar campos POS al borrar
            this.calcularTotalesCierre();
        };
        
        // Evento cambio de tipo (para actualizar POS)
        div.querySelector('.otro-medio-tipo').onchange = () => {
            this.renderDatosPOS();
            this.calcularTotalesCierre();
        };
        
        // Evento sumar
        div.querySelector('.otro-medio-importe').oninput = () => this.calcularTotalesCierre();
        
        container.appendChild(div);
        this.renderDatosPOS(); // Actualizar campos POS al añadir
    }

    renderDatosPOS() {
        const container = document.getElementById('datosPOSContainer');
        
        // 1. Identificar qué medios extra tenemos
        const mediosActivos = new Set();
        document.querySelectorAll('.otro-medio-tipo').forEach(select => {
            mediosActivos.add(select.value);
        });
        
        // 2. Guardar valores actuales para no perderlos al repintar
        const valoresPrevios = {};
        container.querySelectorAll('input').forEach(inp => {
            valoresPrevios[inp.id] = inp.value;
        });
        
        // 3. Construir HTML dinámico
        let html = `
            <div class="form-row">
                <div class="form-group">
                    <label>Efectivo (Caja)</label>
                    <input type="number" id="posEfectivo" step="0.01" placeholder="0.00" value="${valoresPrevios['posEfectivo'] || 0}">
                </div>
                <div class="form-group">
                    <label>Tarjetas (Datafonos)</label>
                    <input type="number" id="posTarjetas" step="0.01" placeholder="0.00" value="${valoresPrevios['posTarjetas'] || 0}">
                </div>
            </div>
            <div class="form-group" style="margin-top: 10px;">
                <label>Delivery (Plataformas)</label>
                <input type="number" id="posDelivery" step="0.01" placeholder="0.00" value="${valoresPrevios['posDelivery'] || 0}">
            </div>
        `;
        
        // Añadir campos extra solo si existen en "Otros Medios"
        mediosActivos.forEach(medio => {
            const idPos = `pos${medio.replace(/\s/g, '')}`;
            html += `
                <div class="form-group" style="margin-top: 10px; background: #f0f8ff; padding: 10px; border-radius: 4px;">
                    <label>${medio} (Ticket)</label>
                    <input type="number" id="${idPos}" step="0.01" placeholder="0.00" class="pos-extra-input" value="${valoresPrevios[idPos] || 0}">
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Reconectar listeners de cálculo
        container.querySelectorAll('input').forEach(inp => {
            inp.oninput = () => this.calcularTotalesCierre();
        });
    }

    iniciarCierre() {
        const fecha = document.getElementById('cierreFecha').value;
        const turno = document.getElementById('cierreTurno').value;

        if (!fecha) {
            this.showToast('⚠️ Selecciona una fecha', true);
            return;
        }

        // Ocultar paso 1 y mostrar paso 2
        const step1 = document.getElementById('cierreStep1');
        const form = document.getElementById('cierreForm');
        
        if (step1) step1.classList.add('hidden');
        if (form) form.classList.remove('hidden');
        
        // Inicializar eventos y cálculos
        this.conectarEventosCierre();
        this.calcularTotalesCierre();
    }

    iniciarInventario() {
        const fecha = document.getElementById('inventarioFecha').value;
        const familia = document.getElementById('inventarioFamilia').value;

        if (!fecha) {
            this.showToast('⚠️ Selecciona una fecha para el inventario', true);
            return;
        }

        // Ocultar paso 1 y mostrar paso 2
        const step1 = document.getElementById('inventarioStep1');
        const form = document.getElementById('inventarioForm');
        
        if (step1) step1.classList.add('hidden');
        if (form) form.classList.remove('hidden');

        // Inicializar estado de conteo
        this.inventarioState.counts = {};
        this.inventarioState.currentProduct = null;

        // Poblar filtros
        this.populateInventarioFilters();
        
        // Renderizar tabla inicial
        this.filterInventarioTable();
    }

    handleCierreSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Helper para leer un valor de input con seguridad (devuelve 0 si no existe)
        const readSafe = (id, type = 'float') => {
            const el = document.getElementById(id);
            if (!el) return 0;
            if (type === 'int') return parseInt(el.value) || 0;
            return parseFloat(el.value) || 0;
        };

        // Recopilar billetes y monedas (Recalcular para asegurar precisión)
        let efectivoContado = 0;
        const valores = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01];
        const ids = ['b500', 'b200', 'b100', 'b50', 'b20', 'b10', 'b5', 'm2', 'm1', 'm050', 'm020', 'm010', 'm005', 'm002', 'm001'];
        
        ids.forEach((id, index) => {
            const el = document.getElementById(id);
            const val = el ? (parseFloat(el.value) || 0) : 0;
            efectivoContado += val * valores[index];
        });
        
        // Recopilar desglose de efectivo (NUEVO: Guardar cantidades de billetes/monedas)
        const desgloseEfectivo = {};
        const idsEfectivo = ['b500', 'b200', 'b100', 'b50', 'b20', 'b10', 'b5', 'm2', 'm1', 'm050', 'm020', 'm010', 'm005', 'm002', 'm001'];
        idsEfectivo.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.value && parseFloat(el.value) > 0) {
                desgloseEfectivo[id] = parseFloat(el.value);
            }
        });

        // Recopilar datafonos
        const datafonos = [];
        document.querySelectorAll('.datafono-item').forEach(item => {
            const nombre = item.querySelector('.datafono-nombre').value;
            const importe = parseFloat(item.querySelector('.datafono-importe').value) || 0;
            if (nombre && importe > 0) {
                datafonos.push({ nombre, importe });
            }
        });

        // Recopilar otros medios
        const otrosMedios = [];
        document.querySelectorAll('.otro-medio-item').forEach(item => {
            const tipo = item.querySelector('.otro-medio-tipo').value;
            const importe = parseFloat(item.querySelector('.otro-medio-importe').value) || 0;
            if (importe > 0) {
                otrosMedios.push({ tipo, importe });
            }
        });
        
        const totalDatafonos = datafonos.reduce((sum, d) => sum + d.importe, 0);
        const totalOtrosMedios = otrosMedios.reduce((sum, m) => sum + m.importe, 0);
        
        // Datos POS (con comprobaciones de existencia para evitar el TypeError)
        const posEfectivo = readSafe('posEfectivo');
        const posTarjetas = readSafe('posTarjetas');
        const posDelivery = readSafe('posDelivery');
        const realDelivery = readSafe('realDelivery');
        const posTickets = readSafe('posTickets', 'int');
        
        // Suma de extras POS (Bizum, Transferencia, etc.)
        let posExtrasTotal = 0;
        document.querySelectorAll('.pos-extra-input').forEach(el => posExtrasTotal += parseFloat(el.value) || 0);
        
        // Calcular totales
        const totalReal = efectivoContado + totalDatafonos + totalOtrosMedios + realDelivery;
        const totalPOS = posEfectivo + posTarjetas + posExtrasTotal + posDelivery;
        const descuadreTotal = totalReal - totalPOS;

        const cierre = {
            fecha: document.getElementById('cierreFecha').value,
            turno: document.getElementById('cierreTurno').value,
            
            efectivoContado: efectivoContado,
            desgloseEfectivo: desgloseEfectivo,
            datafonos: datafonos,
            totalDatafonos: totalDatafonos,
            otrosMedios: otrosMedios,
            totalOtrosMedios: totalOtrosMedios,
            realDelivery: realDelivery,
            
            posEfectivo: posEfectivo,
            posTarjetas: posTarjetas,
            posDelivery: posDelivery,
            posTickets: posTickets,
            
            descuadreTotal: descuadreTotal,
            totalReal: totalReal,
            totalPos: totalPOS,
            numTickets: posTickets,
            
            periodo: this.currentPeriod
        };

        const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
        
        if (editId) {
            cierre.id = editId;
            this.db.update('cierres', editId, cierre);
            this.showToast('✓ Cierre actualizado');
            delete form.dataset.editId;
        } else {
            this.db.add('cierres', cierre);
            this.showToast('✓ Cierre guardado');
        }
        
        this.resetCierreForm();
        document.getElementById('cierreFormCard').classList.add('hidden');
        document.getElementById('toggleCierreForm').textContent = '+ Nuevo Cierre';
        this.render();
    }

    calcularTotalesCierre() {
        // 1. Calcular Efectivo (Billetes + Monedas)
        let totalEfectivo = 0;
        const valores = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01];
        const ids = ['b500', 'b200', 'b100', 'b50', 'b20', 'b10', 'b5', 'm2', 'm1', 'm050', 'm020', 'm010', 'm005', 'm002', 'm001'];
        
        ids.forEach((id, index) => {
            const el = document.getElementById(id);
            const val = el ? (parseFloat(el.value) || 0) : 0;
            totalEfectivo += val * valores[index];
        });
        
        // Unificar estilo de subtotales (igual que Total Efectivo)
        const dispEfectivo = document.getElementById('totalEfectivoDisplay');
        if(dispEfectivo) dispEfectivo.textContent = totalEfectivo.toFixed(2) + ' €';
        
        // 2. Calcular Totales Reales (TPV y Otros)
        let totalDatafonos = 0;
        document.querySelectorAll('.datafono-importe').forEach(el => totalDatafonos += parseFloat(el.value) || 0);
        
        let totalOtros = 0;
        const desgloseOtros = [];
        
        document.querySelectorAll('.otro-medio-item').forEach(item => {
            const nombre = item.querySelector('.otro-medio-tipo').value;
            const importe = parseFloat(item.querySelector('.otro-medio-importe').value) || 0;
            totalOtros += importe;
            desgloseOtros.push({ nombre, importe });
        });

        // Aplicar estilo de barra de total a los subtotales TPV y Otros Medios
        const dispDatafonos = document.getElementById('totalDatafonosDisplay');
        const dispOtros = document.getElementById('totalOtrosDisplay');
        if(dispDatafonos) {
            dispDatafonos.innerHTML = totalDatafonos.toFixed(2) + ' €';
            dispDatafonos.parentElement.classList.add('total-efectivo-bar'); // <-- Aplicar estilo de barra
        }
        if(dispOtros) {
            dispOtros.innerHTML = totalOtros.toFixed(2) + ' €';
            dispOtros.parentElement.classList.add('total-efectivo-bar'); // <-- Aplicar estilo de barra
        }
        
        // 3. Calcular Totales POS (Ticket de Caja)
        const posEfectivo = parseFloat(document.getElementById('posEfectivo')?.value) || 0;
        const posTarjetas = parseFloat(document.getElementById('posTarjetas')?.value) || 0;
        const posDelivery = parseFloat(document.getElementById('posDelivery')?.value) || 0;
        let posOtrosTotal = 0;
        document.querySelectorAll('.pos-extra-input').forEach(el => posOtrosTotal += parseFloat(el.value) || 0);
        
        // Calcular Totales Reales (incluyendo Delivery)
        const realDelivery = parseFloat(document.getElementById('realDelivery')?.value) || 0;

        const totalReal = totalEfectivo + totalDatafonos + totalOtros + realDelivery;
        const totalPOS = posEfectivo + posTarjetas + posOtrosTotal + posDelivery;
        
        // Actualizar display de Delivery Real
        const dispDelivery = document.getElementById('totalDeliveryDisplay');
        if(dispDelivery) {
            dispDelivery.textContent = realDelivery.toFixed(2) + ' €';
        }

        // Actualizar display de Total POS
        const dispPOS = document.getElementById('totalPOSDisplay');
        if(dispPOS) {
            dispPOS.textContent = totalPOS.toFixed(2) + ' €';
        }

        const diferenciaTotal = totalReal - totalPOS;
        
        // 4. Generar Tabla Resumen DINÁMICA (CLARIFICANDO COLUMNAS)
        const tbody = document.getElementById('resumenTbody');
        if (tbody) {
            let html = `
                <tr style="background: #f1f3f5; font-weight: 600;">
                    <td>MÉTODO</td>
                    <td>POS DECLARADO</td>
                    <td>REAL CONTADO</td>
                    <td>DIFERENCIA</td>
                </tr>
            `;
            
            // Fila Efectivo
            const difEfectivo = totalEfectivo - posEfectivo;
            html += `
                <tr>
                    <td>💶 Efectivo</td>
                    <td>${posEfectivo.toFixed(2)} €</td>
                    <td>${totalEfectivo.toFixed(2)} €</td>
                    <td style="color: ${this.getColor(difEfectivo)}">${(difEfectivo > 0 ? '+' : '')}${difEfectivo.toFixed(2)} €</td>
                </tr>`;
            
            // Fila Tarjetas
            const difTarjetas = totalDatafonos - posTarjetas;
            html += `
                <tr>
                    <td>💳 Tarjetas</td>
                    <td>${posTarjetas.toFixed(2)} €</td>
                    <td>${totalDatafonos.toFixed(2)} €</td>
                    <td style="color: ${this.getColor(difTarjetas)}">${(difTarjetas > 0 ? '+' : '')}${difTarjetas.toFixed(2)} €</td>
                </tr>`;

            // Fila Delivery
            const difDelivery = realDelivery - posDelivery;
            html += `
                <tr>
                    <td>🛵 Delivery</td>
                    <td>${posDelivery.toFixed(2)} €</td>
                    <td>${realDelivery.toFixed(2)} €</td>
                    <td style="color: ${this.getColor(difDelivery)}">${(difDelivery > 0 ? '+' : '')}${difDelivery.toFixed(2)} €</td>
                </tr>`;

            // Filas Dinámicas (Otros Medios)
            desgloseOtros.forEach(medio => {
                const idPos = `pos${medio.nombre.replace(/\s/g, '')}`;
                const inputPos = document.getElementById(idPos);
                const valPos = inputPos ? (parseFloat(inputPos.value) || 0) : 0;
                const dif = medio.importe - valPos;
                
                let nombreMostrar = medio.nombre;
                let estiloExtra = '';
                
                if (medio.nombre === 'Dinero B (sin IVA)') {
                    nombreMostrar = '💵 Dinero B';
                    estiloExtra = 'background-color: #fff3cd;';
                }

                html += `
                    <tr style="${estiloExtra}">
                        <td>${nombreMostrar}</td>
                        <td>${valPos.toFixed(2)} €</td>
                        <td>${medio.importe.toFixed(2)} €</td>
                        <td style="color: ${this.getColor(dif)}">${(dif > 0 ? '+' : '')}${dif.toFixed(2)} €</td>
                    </tr>`;
            });

            // Fila TOTAL
            html += `
                <tr style="font-weight: 700; background: #e9ecef; border-top: 2px solid #dee2e6;">
                    <td>TOTAL</td>
                    <td>${totalPOS.toFixed(2)} €</td>
                    <td>${totalReal.toFixed(2)} €</td>
                    <td style="color: ${this.getColor(diferenciaTotal)}">${(diferenciaTotal > 0 ? '+' : '')}${diferenciaTotal.toFixed(2)} €</td>
                </tr>
            `;
            
            tbody.innerHTML = html;
        }
    }

    getColor(val) {
        if (Math.abs(val) < 0.05) return '#27ae60'; // Verde (Cuadra)
        return val > 0 ? '#2980b9' : '#e74c3c'; // Azul (Sobra) o Rojo (Falta)
    }

    calcularEfectivo(billetes) {
        if (!billetes) return 0;
        const valores = {
            'b500': 500, 'b200': 200, 'b100': 100, 'b50': 50, 'b20': 20, 'b10': 10, 'b5': 5,
            'm2': 2, 'm1': 1, 'm050': 0.50, 'm020': 0.20, 'm010': 0.10, 'm005': 0.05, 'm002': 0.02, 'm001': 0.01
        };
        let total = 0;
        for (const [key, valor] of Object.entries(valores)) {
            total += (billetes[key] || 0) * valor;
        }
        return total;
    }

    // (Asegúrate que el método getColor existe en tu app.js)
    // AÑADIR este método al inicio de la clase App (necesitas la definción completa si no existe)
    // resetCierreForm() { /* ... */ } 
    // Si la función resetCierreForm NO existe, hay que añadirla:
    resetCierreForm() {
        const form = document.getElementById('cierreForm');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
        
        const datafonosContainer = document.getElementById('datafonosContainer');
        if (datafonosContainer) datafonosContainer.innerHTML = '';
        
        const otrosMediosContainer = document.getElementById('otrosMediosContainer');
        if (otrosMediosContainer) otrosMediosContainer.innerHTML = '';
        
        const totalEfectivoDisplay = document.getElementById('totalEfectivoDisplay');
        if (totalEfectivoDisplay) totalEfectivoDisplay.textContent = '0.00 €';
        
        const resumenTbody = document.getElementById('resumenTbody');
        if (resumenTbody) resumenTbody.innerHTML = ''; 
        
        this.renderDatosPOS(); 

        // Resetear pasos
        const step1 = document.getElementById('cierreStep1');
        if (step1) step1.classList.remove('hidden');
        if (form) form.classList.add('hidden');
        
        // Resetear título
        const formCard = document.getElementById('cierreFormCard');
        if (formCard) {
            const title = formCard.querySelector('h3, .card-title');
            if (title) title.textContent = 'Nuevo Cierre de Caja';
        }
    }

    // --- NUEVAS FUNCIONES ---

    resetOCRForm() {
        // Limpiar input file
        const fileInput = document.getElementById('ocrFile');
        if(fileInput) fileInput.value = '';
        
        // Resetear UI
        document.querySelectorAll('.ocr-tipo-btn').forEach(btn => btn.classList.remove('active'));
        
        // Ocultar paneles
        const uploadCard = document.getElementById('ocrUploadCard');
        const previewContainer = document.getElementById('ocrPreviewContainer');
        const progressBar = document.getElementById('ocrProgressBar');
        const dataCard = document.getElementById('ocrDataCard');
        const fileInfo = document.getElementById('fileSelectedInfo');
        
        if(uploadCard) uploadCard.classList.add('hidden');
        if(previewContainer) previewContainer.classList.add('hidden');
        if(progressBar) progressBar.classList.add('hidden');
        if(dataCard) dataCard.classList.add('hidden');
        if(fileInfo) fileInfo.classList.add('hidden');
        
        // Mostrar drag & drop de nuevo
        const uploadZone = document.querySelector('.file-upload-zone');
        if (uploadZone) uploadZone.style.display = 'block';
        
        // Resetear bot�n cancelar (asegurar que est� visible para la pr�xima vez)
        const cancelContainer = document.getElementById('ocrUploadCancelContainer');
        if (cancelContainer) cancelContainer.classList.remove('hidden');
        
        // Resetear variables estado
        this.currentImageData = null;
        this.currentOCRType = null;
        this.currentOCRExtractedData = null;
        this.currentPDFText = null;
        this.isPDFWithEmbeddedText = false;

        // Ocultar opciones de escaneo si est�n abiertas
        const scanOptionsCard = document.getElementById('scanOptionsCard');
        if (scanOptionsCard) {
             scanOptionsCard.classList.add('hidden');
             scanOptionsCard.style.display = 'none';
        }

        // Mostrar listas de nuevo
        const listaFacturas = document.getElementById('listaFacturas');
        const listaAlbaranes = document.getElementById('listaAlbaranes');
        const recentDocs = document.getElementById('recentDocumentsList');
        if (listaFacturas) listaFacturas.classList.remove('hidden');
        if (listaAlbaranes) listaAlbaranes.classList.remove('hidden');
        if (recentDocs) recentDocs.classList.remove('hidden');
        
        this.showToast('🔄 Escáner reiniciado');
    }

    async testFirebaseConnection() {
        console.log('🔥 Probando conexión Firebase...');
        try {
            const testDoc = await this.firestoreService.add('test_connection', {
                timestamp: new Date(),
                agent: navigator.userAgent
            });
            console.log('✅ Escritura exitosa:', testDoc.id);
            this.showToast('✅ Firebase Conectado: Escritura OK');
            
            const docs = await this.firestoreService.getAll('test_connection');
            console.log('✅ Lectura exitosa:', docs.length, 'documentos');
            this.showToast('✅ Firebase Conectado: Lectura OK');
            
        } catch (error) {
            console.error('❌ Error Firebase:', error);
            this.showToast('❌ Error Firebase: ' + error.message, true);
        }
    }

    // --- FUNCIONES EXISTENTES ---

    toggleEmpaqueFields() {
        const esEmpaquetado = document.getElementById('productoEsEmpaquetado').value === 'true';
        const fields = document.getElementById('empaqueFields');
        if (esEmpaquetado) {
            fields.classList.remove('hidden');
            this.updateResumenEmpaque();
        } else {
            fields.classList.add('hidden');
            document.getElementById('resumenEmpaque').style.display = 'none';
        }
    }

    updateResumenEmpaque() {
        // Actualizar resumen visual de empaque en tiempo real
        const tipoEmpaque = document.getElementById('productoTipoEmpaque').value;
        const unidadesPorEmpaque = parseFloat(document.getElementById('productoUnidadesPorEmpaque').value);
        const unidadBase = document.getElementById('productoUnidadBase').value;
        
        const resumenDiv = document.getElementById('resumenEmpaque');
        const resumenTexto = document.getElementById('resumenEmpaqueTexto');
        
        if (unidadesPorEmpaque && unidadesPorEmpaque > 0) {
            resumenTexto.textContent = `1 ${tipoEmpaque} = ${unidadesPorEmpaque} ${unidadBase}`;
            resumenDiv.style.display = 'block';
        } else {
            resumenDiv.style.display = 'none';
        }
    }

    addProductoInventario() {
        // Bloqueo: no permitir si ya hay una línea en edición
        if (this.inventarioState.hasEditingLine) {
            this.showToast('⚠️ Termina de contar el producto actual antes de añadir otro', true);
            return;
        }

        const container = document.getElementById('inventarioProductosContainer');
        const rowId = Date.now();
        
        const productosOptions = this.db.productos.map(p => 
            `<option value="${p.id}">${p.nombre} (${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</option>`
        ).join('');

        const row = document.createElement('div');
        row.className = 'inventario-producto-item inventario-editing';
        row.dataset.id = rowId;
        row.dataset.isEditing = 'true';
        row.innerHTML = `
            <div class="inventario-producto-select-wrapper">
                <div class="form-group">
                    <label>Producto *</label>
                    <input type="text" class="inventario-producto-search" placeholder="Buscar o crear producto..." 
                           oninput="app.searchProductoInventario(${rowId})" 
                           onfocus="app.showProductoDropdown(${rowId})"
                           autocomplete="off">
                    <input type="hidden" class="inventario-producto-id" required>
                    <div class="inventario-producto-dropdown hidden"></div>
                </div>
            </div>
            <div class="inventario-producto-info hidden" style="background: #e8f5e9; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 13px;"></div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo Conteo *</label>
                    <select class="inventario-tipo-conteo form-select" onchange="app.updateTipoConteoInventario(${rowId})" required>
                        <option value="">Seleccionar...</option>
                        <option value="solo-unidad">Solo unidad base</option>
                        <option value="solo-empaques">Solo empaques</option>
                        <option value="empaques-sueltas">Empaques + sueltas</option>
                    </select>
                </div>
            </div>
            <div class="inventario-conteo-solo-unidad hidden">
                <div class="form-group">
                    <label>Stock Real (unidad base) *</label>
                    <input type="number" step="0.001" class="inventario-stock-real" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                </div>
            </div>
            <div class="inventario-conteo-solo-empaques hidden">
                <div class="form-group">
                    <label>Nº Empaques Completos *</label>
                    <input type="number" step="1" class="inventario-num-empaques-solo" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                </div>
                <div class="form-group">
                    <label>Stock Real Calculado (unidad base)</label>
                    <input type="number" class="inventario-stock-calculado" readonly style="background: #f0f0f0;">
                </div>
            </div>
            <div class="inventario-conteo-empaques-sueltas hidden">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº Empaques Completos *</label>
                        <input type="number" step="1" class="inventario-num-empaques" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                    </div>
                    <div class="form-group">
                        <label>Unidades Sueltas *</label>
                        <input type="number" step="0.001" class="inventario-unidades-sueltas" oninput="app.calcularDiferenciaInventario(${rowId})" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Stock Real Calculado (unidad base)</label>
                    <input type="number" class="inventario-stock-calculado" readonly style="background: #f0f0f0;">
                </div>
            </div>
            <div class="inventario-resumen hidden">
                <div style="background: #fff; border: 2px solid #e3e8ef; border-radius: 8px; padding: 12px; margin: 15px 0;">
                    <h5 style="margin: 0 0 10px 0; color: #1f2d3d; font-size: 14px;">📊 Resumen de Conteo</h5>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
                        <div>
                            <div style="color: #7f8c8d;">Teórico</div>
                            <div style="font-weight: 600; color: #1f2d3d;" class="inventario-stock-teorico">-</div>
                        </div>
                        <div>
                            <div style="color: #7f8c8d;">Contado</div>
                            <div style="font-weight: 600; color: #1f2d3d;" class="inventario-stock-contado">-</div>
                        </div>
                        <div>
                            <div style="color: #7f8c8d;">Diferencia</div>
                            <div style="font-weight: 700;" class="inventario-diferencia">-</div>
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button type="button" class="btn-success inventario-btn-validar" onclick="window.app.validarLineaInventario(${rowId})">✓ Validar Conteo</button>
                <button type="button" class="btn-delete" onclick="window.app.removeProductoInventario(${rowId})">🗑️ Quitar</button>
            </div>
        `;
        container.appendChild(row);

        // Marcar como línea en edición
        this.inventarioState.hasEditingLine = true;
        this.inventarioState.editingLineId = rowId;

        // Deshabilitar botón de añadir
        document.getElementById('addProductoInventario').disabled = true;
    }

    searchProductoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const searchInput = row.querySelector('.inventario-producto-search');
        const dropdown = row.querySelector('.inventario-producto-dropdown');
        const searchTerm = searchInput.value.toLowerCase().trim();

        if (!searchTerm) {
            dropdown.classList.add('hidden');
            return;
        }

        const productosMatch = this.db.productos.filter(p => 
            p.nombre.toLowerCase().includes(searchTerm)
        );

        let html = '';
        productosMatch.forEach(p => {
            html += `<div class="inventario-producto-option" onclick="window.app.selectProductoInventario(${rowId}, ${p.id})">
                ${p.nombre} <span style="color: #7f8c8d; font-size: 12px;">(${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</span>
            </div>`;
        });

        // Opción de alta rápida
        if (searchTerm.length > 2) {
            html += `<div class="inventario-producto-option inventario-alta-rapida" onclick="window.app.abrirModalAltaRapida('${searchTerm.replace(/'/g, "\\'")}', ${rowId})">
                ➕ Crear producto rápido "<strong>${searchTerm}</strong>"
            </div>`;
        }

        dropdown.innerHTML = html || '<div style="padding: 10px; color: #7f8c8d; font-size: 13px;">No hay coincidencias</div>';
        dropdown.classList.remove('hidden');
    }

    showProductoDropdown(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const dropdown = row.querySelector('.inventario-producto-dropdown');
        const searchInput = row.querySelector('.inventario-producto-search');

        if (!searchInput.value.trim()) {
            // Mostrar todos los productos
            let html = '';
            this.db.productos.forEach(p => {
                html += `<div class="inventario-producto-option" onclick="window.app.selectProductoInventario(${rowId}, ${p.id})">
                    ${p.nombre} <span style="color: #7f8c8d; font-size: 12px;">(${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</span>
                </div>`;
            });
            dropdown.innerHTML = html;
            dropdown.classList.remove('hidden');
        }
    }

    selectProductoInventario(rowId, productoId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const producto = this.db.productos.find(p => p.id === productoId);

        if (!producto) return;

        // Rellenar campos
        row.querySelector('.inventario-producto-search').value = producto.nombre;
        row.querySelector('.inventario-producto-id').value = productoId;
        row.querySelector('.inventario-producto-dropdown').classList.add('hidden');

        // Mostrar info del producto con formato claro
        const infoDiv = row.querySelector('.inventario-producto-info');
        let infoHTML = `<strong>${producto.nombre}</strong><br>`;
        infoHTML += `📦 Unidad base: <strong>${producto.unidadBase}</strong>`;
        if (producto.esEmpaquetado && producto.unidadesPorEmpaque > 0) {
            infoHTML += `<br>📐 <strong>1 ${producto.tipoEmpaque} = ${producto.unidadesPorEmpaque} ${producto.unidadBase}</strong>`;
            infoHTML += `<br><small style="color: #7f8c8d;">Puedes contar empaques completos + unidades sueltas</small>`;
        } else {
            infoHTML += '<br><span style="color: #ff9800;">⚠️ Este producto no tiene empaque definido - solo conteo en unidad base</span>';
        }
        infoDiv.innerHTML = infoHTML;
        infoDiv.classList.remove('hidden');

        // Pre-seleccionar tipo de conteo según producto
        const tipoConteoSelect = row.querySelector('.inventario-tipo-conteo');
        if (producto.esEmpaquetado) {
            tipoConteoSelect.value = 'empaques-sueltas';
        } else {
            tipoConteoSelect.value = 'solo-unidad';
        }
        this.updateTipoConteoInventario(rowId);
    }

    abrirModalAltaRapida(nombreSugerido, rowId) {
        this.inventarioState.tempProductoAltaRapida = { rowId, nombreSugerido };
        document.getElementById('altaRapidaNombre').value = nombreSugerido;
        document.getElementById('modalAltaRapidaProducto').classList.remove('hidden');
        
        // Cerrar dropdown
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        row.querySelector('.inventario-producto-dropdown').classList.add('hidden');
    }

    toggleAltaRapidaEmpaque() {
        const esEmpaquetado = document.getElementById('altaRapidaEsEmpaquetado').value === 'true';
        const fields = document.getElementById('altaRapidaEmpaqueFields');
        if (esEmpaquetado) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    }

    guardarAltaRapidaProducto() {
        const nombre = document.getElementById('altaRapidaNombre').value.trim();
        const unidadBase = document.getElementById('altaRapidaUnidadBase').value;
        const esEmpaquetado = document.getElementById('altaRapidaEsEmpaquetado').value === 'true';

        if (!nombre || !unidadBase) {
            this.showToast('❌ Completa nombre y unidad base', true);
            return;
        }

        if (esEmpaquetado) {
            const unidadesPorEmpaque = parseFloat(document.getElementById('altaRapidaUnidadesPorEmpaque').value);
            if (!unidadesPorEmpaque || unidadesPorEmpaque <= 0) {
                this.showToast('❌ Especifica las unidades por empaque', true);
                return;
            }
        }

        const producto = {
            nombre,
            unidadBase,
            esEmpaquetado,
            tipoEmpaque: esEmpaquetado ? document.getElementById('altaRapidaTipoEmpaque').value : '',
            unidadesPorEmpaque: esEmpaquetado ? parseFloat(document.getElementById('altaRapidaUnidadesPorEmpaque').value) : 0,
            precioPromedioNeto: parseFloat(document.getElementById('altaRapidaPrecioNeto').value) || 0,
            stockActualUnidades: 0,
            cantidadTotal: 0
        };

        const nuevoProducto = this.db.add('productos', producto);
        this.showToast(`✓ Producto "${nombre}" creado correctamente`);

        // Seleccionar automáticamente en la línea de inventario
        if (this.inventarioState.tempProductoAltaRapida) {
            const rowId = this.inventarioState.tempProductoAltaRapida.rowId;
            this.selectProductoInventario(rowId, nuevoProducto.id);
        }

        // Cerrar modal y limpiar
        this.cerrarModalAltaRapida();
        this.render(); // Actualizar listas
    }

    cerrarModalAltaRapida() {
        document.getElementById('modalAltaRapidaProducto').classList.add('hidden');
        document.getElementById('altaRapidaProductoForm').reset();
        document.getElementById('altaRapidaEmpaqueFields').classList.add('hidden');
        this.inventarioState.tempProductoAltaRapida = null;
    }

    updateTipoConteoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        const producto = this.db.productos.find(p => p.id === productoId);

        // Ocultar todos
        row.querySelector('.inventario-conteo-solo-unidad').classList.add('hidden');
        row.querySelector('.inventario-conteo-solo-empaques').classList.add('hidden');
        row.querySelector('.inventario-conteo-empaques-sueltas').classList.add('hidden');

        if (!tipo) return;

        // Validar si producto tiene empaque cuando se necesita
        if ((tipo === 'solo-empaques' || tipo === 'empaques-sueltas') && producto && !producto.esEmpaquetado) {
            this.showToast('⚠️ Este producto no tiene unidades por empaque definidas. Cuenta en unidad base o configúralo primero.', true);
            row.querySelector('.inventario-tipo-conteo').value = 'solo-unidad';
            row.querySelector('.inventario-conteo-solo-unidad').classList.remove('hidden');
            return;
        }

        // Mostrar el tipo correcto
        if (tipo === 'solo-unidad') {
            row.querySelector('.inventario-conteo-solo-unidad').classList.remove('hidden');
        } else if (tipo === 'solo-empaques') {
            row.querySelector('.inventario-conteo-solo-empaques').classList.remove('hidden');
        } else if (tipo === 'empaques-sueltas') {
            row.querySelector('.inventario-conteo-empaques-sueltas').classList.remove('hidden');
        }

        this.calcularDiferenciaInventario(rowId);
    }

    calcularDiferenciaInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        const producto = this.db.productos.find(p => p.id === productoId);

        if (!producto) return;

        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        let stockContado = 0;

        if (tipo === 'solo-unidad') {
            stockContado = parseFloat(row.querySelector('.inventario-stock-real').value) || 0;
        } else if (tipo === 'solo-empaques') {
            const numEmpaques = parseFloat(row.querySelector('.inventario-num-empaques-solo').value) || 0;
            stockContado = numEmpaques * (producto.unidadesPorEmpaque || 0);
            row.querySelector('.inventario-stock-calculado').value = stockContado.toFixed(3);
        } else if (tipo === 'empaques-sueltas') {
            const numEmpaques = parseFloat(row.querySelector('.inventario-num-empaques').value) || 0;
            const unidadesSueltas = parseFloat(row.querySelector('.inventario-unidades-sueltas').value) || 0;
            stockContado = (numEmpaques * (producto.unidadesPorEmpaque || 0)) + unidadesSueltas;
            row.querySelector('.inventario-stock-calculado').value = stockContado.toFixed(3);
        }

        const stockTeorico = producto.stockActualUnidades || 0;
        const diferencia = stockContado - stockTeorico;

        // Mostrar resumen mejorado con stock teórico vs real
        const resumenDiv = row.querySelector('.inventario-resumen');
        resumenDiv.classList.remove('hidden');
        
        row.querySelector('.inventario-stock-teorico').textContent = `${stockTeorico.toFixed(2)} ${producto.unidadBase}`;
        row.querySelector('.inventario-stock-contado').textContent = `${stockContado.toFixed(2)} ${producto.unidadBase}`;
        
        const diferenciaEl = row.querySelector('.inventario-diferencia');
        const diferenciaText = diferencia >= 0 ? `+${diferencia.toFixed(2)}` : diferencia.toFixed(2);
        diferenciaEl.textContent = `${diferenciaText} ${producto.unidadBase}`;
        
        // Color semántico: verde si cuadra, azul si sobra, rojo si falta
        if (Math.abs(diferencia) < 0.01) {
            diferenciaEl.style.color = '#34c759';
            diferenciaEl.textContent = `✓ Cuadra (${diferencia.toFixed(2)} ${producto.unidadBase})`;
        } else {
            diferenciaEl.style.color = diferencia > 0 ? '#1171ef' : '#ff3b30';
            const tipoAjuste = diferencia > 0 ? 'Sobra' : 'Falta';
            diferenciaEl.textContent = `${tipoAjuste}: ${Math.abs(diferencia).toFixed(2)} ${producto.unidadBase}`;
        }
    }

    validarLineaInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        
        // Validar producto seleccionado
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        if (!productoId) {
            this.showToast('❌ Selecciona un producto', true);
            return;
        }

        // Validar tipo de conteo
        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        if (!tipo) {
            this.showToast('❌ Selecciona el tipo de conteo', true);
            return;
        }

        // Validar conteo según tipo
        let valid = false;
        if (tipo === 'solo-unidad') {
            const stockReal = row.querySelector('.inventario-stock-real').value;
            valid = stockReal && parseFloat(stockReal) >= 0;
        } else if (tipo === 'solo-empaques') {
            const numEmpaques = row.querySelector('.inventario-num-empaques-solo').value;
            valid = numEmpaques && parseFloat(numEmpaques) >= 0;
        } else if (tipo === 'empaques-sueltas') {
            const numEmpaques = row.querySelector('.inventario-num-empaques').value;
            const sueltas = row.querySelector('.inventario-unidades-sueltas').value;
            valid = numEmpaques !== '' && sueltas !== '' && 
                   parseFloat(numEmpaques) >= 0 && parseFloat(sueltas) >= 0;
        }

        if (!valid) {
            this.showToast('❌ Completa el conteo correctamente', true);
            return;
        }

        // Marcar como validada
        row.classList.remove('inventario-editing');
        row.classList.add('inventario-validated');
        row.dataset.isEditing = 'false';

        // Deshabilitar edición en los campos
        row.querySelectorAll('input, select').forEach(input => {
            input.disabled = true;
        });

        // Ocultar botón validar
        row.querySelector('.inventario-btn-validar').style.display = 'none';

        // Actualizar estado
        this.inventarioState.hasEditingLine = false;
        this.inventarioState.editingLineId = null;

        // Habilitar botón de añadir producto
        document.getElementById('addProductoInventario').disabled = false;

        this.showToast('✓ Conteo validado correctamente');
    }

    removeProductoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        if (!row) return;

        const isEditing = row.dataset.isEditing === 'true';
        
        row.remove();

        // Si era la línea en edición, liberar el estado
        if (isEditing) {
            this.inventarioState.hasEditingLine = false;
            this.inventarioState.editingLineId = null;
            document.getElementById('addProductoInventario').disabled = false;
        }
    }

    render_OLD_5160() {
        const titles = {
            'ocr': 'Escáner de Documentos',
            'cierres': '🧾 Cierres de Caja',
            'compras': '📦 Compras',
            'proveedores': '🏢 Proveedores',
            'productos': '🥘 Productos',
            'escandallos': '📋 Escandallos',
            'inventario': '📦 Control de Stock',
            'delivery': '🛵 Delivery',
            'pnl': '💰 Cuenta de Explotación'
        };

        // 1. Gestión de Vistas
        document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
        const viewMap = {
            'ocr': 'ocrView', 'cierres': 'cierresView', 'compras': 'comprasView',
            'proveedores': 'proveedoresView', 'productos': 'productosView',
            'escandallos': 'escandallosView', 'inventario': 'inventarioView',
            'delivery': 'deliveryView', 'pnl': 'pnlView'
        };
        const currentViewId = viewMap[this.currentView];
        if(document.getElementById(currentViewId)) document.getElementById(currentViewId).classList.remove('hidden');

        // 2. Gestión de Cabecera y BOTONES DE ACCIÓN
        const mainHeader = document.querySelector('.header');
        if (this.currentView === 'ocr') {
            if(mainHeader) mainHeader.style.display = 'none';
        } else {
            if(mainHeader) {
                mainHeader.style.display = 'flex';
                document.getElementById('viewTitle').textContent = titles[this.currentView];
                
                // INYECCIÓN DE BOTONES (Restauración)
                const actionsDiv = document.getElementById('headerActions');
                if (actionsDiv) {
                    let btnHtml = '';
                    switch(this.currentView) {
                        case 'cierres':
                            // Usa expandForm porque el formulario YA existe en el HTML
                            btnHtml = `<button id="toggleCierreForm" class="btn-primary" onclick="window.app.expandForm('cierre')">+ Nuevo Cierre</button>`;
                            break;
                        case 'proveedores':
                            // Usa toggleForm para mostrar/ocultar el div
                            btnHtml = `<button id="toggleProveedorForm" class="btn-primary" onclick="window.app.toggleForm('proveedor')">+ Nuevo Proveedor</button>`;
                            break;
                        case 'productos':
                            btnHtml = `<button id="toggleProductoForm" class="btn-primary" onclick="window.app.toggleForm('producto')">+ Nuevo Producto</button>`;
                            break;
                        case 'escandallos':
                            btnHtml = `<button id="toggleEscandalloForm" class="btn-primary" onclick="window.app.expandForm('escandallo')">+ Nuevo Escandallo</button>`;
                            break;
                        case 'inventario':
                            btnHtml = `
                                <div style="display: flex; gap: 10px;">
                                    <button class="btn-primary" onclick="window.app.expandForm('inventario')">📝 Crear Inventario</button>
                                    <button class="btn-secondary" onclick="window.app.calcularCOGS()">🧮 Nuevo COGS</button>
                                </div>
                            `;
                            break;
                        case 'compras':
                            // En compras solemos usar filtros, pero podemos poner botón de añadir manual
                            btnHtml = `<button class="btn-secondary" onclick="window.app.currentView='ocr'; window.app.render()">📸 Ir a Escáner</button>`;
                            break;
                    }
                    actionsDiv.innerHTML = btnHtml;
                }
            }
        }

        // 3. Renderizar Contenido
        switch(this.currentView) {
            case 'ocr': this.renderCompras(); break;
            case 'cierres': this.renderCierres(); this.collapseForm('cierre'); break;
            case 'compras': this.renderCompras(); break;
            case 'proveedores': this.renderProveedores(); this.collapseForm('proveedor'); break;
            case 'productos': this.renderProductos(); this.collapseForm('producto'); break;
            case 'escandallos': this.renderEscandallos(); this.collapseForm('escandallo'); break;
            case 'inventario': this.renderInventarios(); break;
            case 'delivery': this.renderDelivery(); break;
            case 'pnl': this.renderPnL(); break;
        }
    }

    abrirModalEditarCierre(id) {
        const cierre = this.db.cierres.find(c => c.id === id);
        if (!cierre) return;

        // 1. Abrir formulario
        this.expandForm('cierre');
        
        // 2. Llenar datos básicos
        document.getElementById('cierreFecha').value = cierre.fecha;
        document.getElementById('cierreTurno').value = cierre.turno;
        
        // 3. Simular paso 1 -> paso 2
        this.iniciarCierre();
        
        // 4. Llenar desglose de efectivo
        if (cierre.desgloseEfectivo) {
            Object.keys(cierre.desgloseEfectivo).forEach(key => {
                const el = document.getElementById(key);
                if (el) el.value = cierre.desgloseEfectivo[key];
            });
        }
        
        // 5. Llenar Datafonos
        const containerDatafonos = document.getElementById('datafonosContainer');
        if (containerDatafonos) {
            containerDatafonos.innerHTML = '';
            if (cierre.datafonos && cierre.datafonos.length > 0) {
                cierre.datafonos.forEach(d => {
                    const row = document.createElement('div');
                    row.className = 'datafono-item';
                    row.innerHTML = `
                        <input type="text" class="datafono-nombre" placeholder="Nombre (ej: Visa)" value="${d.nombre}">
                        <input type="number" class="datafono-importe" step="0.01" placeholder="0.00" value="${d.importe}">
                        <button type="button" class="btn-delete-row" onclick="this.parentElement.remove(); window.app.calcularTotalesCierre()">🗑️</button>
                    `;
                    containerDatafonos.appendChild(row);
                });
            }
        }

        // 6. Llenar Otros Medios
        const containerOtros = document.getElementById('otrosMediosContainer');
        if (containerOtros) {
            containerOtros.innerHTML = '';
            if (cierre.otrosMedios && cierre.otrosMedios.length > 0) {
                cierre.otrosMedios.forEach(m => {
                    const row = document.createElement('div');
                    row.className = 'otro-medio-item';
                    row.innerHTML = `
                        <input type="text" class="otro-medio-tipo" placeholder="Tipo (ej: Glovo)" value="${m.tipo}">
                        <input type="number" class="otro-medio-importe" step="0.01" placeholder="0.00" value="${m.importe}">
                        <button type="button" class="btn-delete-row" onclick="this.parentElement.remove(); window.app.calcularTotalesCierre()">🗑️</button>
                    `;
                    containerOtros.appendChild(row);
                });
            }
        }

        // 7. Llenar POS
        if (document.getElementById('posEfectivo')) document.getElementById('posEfectivo').value = cierre.posEfectivo || 0;
        if (document.getElementById('posTarjetas')) document.getElementById('posTarjetas').value = cierre.posTarjetas || 0;
        if (document.getElementById('posTickets')) document.getElementById('posTickets').value = cierre.posTickets || 0;
        
        // 8. Configurar estado de edición
        const form = document.getElementById('cierreForm');
        form.dataset.editId = cierre.id;
        const btn = document.getElementById('toggleCierreForm');
        if(btn) btn.textContent = 'Guardar Cambios';
        
        // Recalcular totales
        this.calcularTotalesCierre();
        
        this.showToast('✏️ Editando cierre del ' + cierre.fecha);
    }

    renderCierres_OLD_5319() {
        const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        
        if (cierres.length === 0) {
            document.getElementById('listaCierres').innerHTML = '<p class="empty-state">No hay cierres registrados</p>';
            return;
        }

        const html = cierres.reverse().map(c => {
            const ticketMedio = c.numTickets > 0 ? (c.totalPos / c.numTickets).toFixed(2) : '0.00';
            const descuadreAbs = Math.abs(c.descuadreTotal);
            const cuadra = descuadreAbs <= 0.01;
            
            // Badge de estado
            const badgeClass = cuadra ? 'badge-cuadra' : 'badge-descuadre';
            const badgeText = cuadra ? '✅ CUADRA' : `⚠ DESCUADRE: ${Math.abs(c.descuadreTotal).toFixed(2)} €`;
            
            // Calcular diferencias por método
            const efectivoPOS = c.posEfectivo || 0;
            const efectivoReal = c.efectivoContado || 0;
            const deltaEfectivo = efectivoReal - efectivoPOS;
            
            const tarjetasPOS = c.posTarjetas || 0;
            const tarjetasReal = c.totalDatafonos || 0;
            const deltaTarjetas = tarjetasReal - tarjetasPOS;
            
            // Preparar filas condicionales (Bizum/Transferencias/Otros)
            let otrosRows = '';
            if (c.otrosMedios) {
                c.otrosMedios.forEach(m => {
                    // Intentar recuperar el valor POS si se guardó (actualmente no se guarda desglosado en DB plana, asumimos 0 o mejora futura)
                    // Para visualización simple:
                    const posVal = 0; // TODO: Guardar desglose POS en DB
                    const realVal = m.importe;
                    const delta = realVal - posVal;
                    
                    // Estilo especial para Dinero B
                    let nombreMostrar = m.tipo;
                    let estiloExtra = '';
                    if (m.tipo === 'Dinero B (sin IVA)') {
                        nombreMostrar = '💵 Dinero B';
                        estiloExtra = 'background-color: #fff3cd;';
                    }

                    otrosRows += `
                    <tr style="${estiloExtra}">
                        <td>${nombreMostrar}</td>
                        <td>${posVal.toFixed(2)} €</td>
                        <td>${realVal.toFixed(2)} €</td>
                        <td style="color: ${this.getColor(delta)}">${delta >= 0 ? '+' : ''}${delta.toFixed(2)} €</td>
                    </tr>`;
                });
            }
            
            // Resumen compacto
            const resumenCompacto = `POS: ${c.totalPos.toFixed(2)} €  |  REAL: ${c.totalReal.toFixed(2)} €  |  Δ: ${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €`;
            
            // Banda de resultado (Estilo idéntico al modal de cierre)
            const bandaResultado = cuadra ? `
                <div style="margin-top: 15px; padding: 15px; background: #d4edda; color: #155724; border-radius: 8px; text-align: center; font-weight: 600; border: 1px solid #c3e6cb;">
                    ✔ Cierre cuadrado (Real ${c.totalReal.toFixed(2)} € – POS ${c.totalPos.toFixed(2)} €)
                </div>
            ` : `
                <div style="margin-top: 15px; padding: 15px; background: #f8d7da; color: #721c24; border-radius: 8px; text-align: center; font-weight: 600; border: 1px solid #f5c6cb;">
                    🔍 Descuadre total: <strong>${Math.abs(c.descuadreTotal).toFixed(2)} €</strong> (Real ${c.totalReal.toFixed(2)} € – POS ${c.totalPos.toFixed(2)} €)
                </div>
            `;
            
            return `
            <div class="cierre-card-compacta" id="cierre-card-${c.id}">
                <div class="cierre-header-compacta" onclick="window.app.toggleListAccordion('cierre-card-${c.id}', 'cierre-card-compacta')" style="cursor: pointer;">
                    <div class="cierre-titulo-compacta">
                        Cierre ${c.fecha} – ${c.turno}
                    </div>
                    <div class="cierre-resumen-inline">
                        ${resumenCompacto}
                    </div>
                    <div class="cierre-header-derecha">
                        <div class="cierre-badge-v2 ${badgeClass}">${badgeText}</div>
                        <button class="btn-edit" onclick="event.stopPropagation(); window.app.abrirModalEditarCierre(${c.id})" title="Editar">✏️</button>
                        <button class="btn-delete" onclick="event.stopPropagation(); window.app.deleteItem('cierres', ${c.id})" title="Eliminar">🗑️</button>
                    </div>
                </div>
                
                <div class="cierre-detalle-desplegable">
                    <div class="cierre-tabla-wrapper">
                        <table class="cierre-tabla-metodos" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: #f1f3f5; font-weight: 600; text-align: left;">
                                    <th style="padding: 10px;">MÉTODO</th>
                                    <th style="padding: 10px;">POS DECLARADO</th>
                                    <th style="padding: 10px;">REAL CONTADO</th>
                                    <th style="padding: 10px;">DIFERENCIA</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">💶 Efectivo</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${efectivoPOS.toFixed(2)} €</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${efectivoReal.toFixed(2)} €</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${this.getColor(deltaEfectivo)}">${deltaEfectivo >= 0 ? '+' : ''}${deltaEfectivo.toFixed(2)} €</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">💳 Tarjetas</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${tarjetasPOS.toFixed(2)} €</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${tarjetasReal.toFixed(2)} €</td>
                                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${this.getColor(deltaTarjetas)}">${deltaTarjetas >= 0 ? '+' : ''}${deltaTarjetas.toFixed(2)} €</td>
                                </tr>
                                ${otrosRows}
                                <tr style="font-weight: 700; background: #e9ecef; border-top: 2px solid #dee2e6;">
                                    <td style="padding: 10px;">TOTAL</td>
                                    <td style="padding: 10px;">${c.totalPos.toFixed(2)} €</td>
                                    <td style="padding: 10px;">${c.totalReal.toFixed(2)} €</td>
                                    <td style="padding: 10px; color: ${this.getColor(c.descuadreTotal)}">${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- INFO SECUNDARIA -->
                    <div class="cierre-info-secundaria" style="margin-top: 15px; text-align: center; color: #666;">
                        🎫 Tickets: <strong>${c.numTickets}</strong> | 🎟 Ticket medio: <strong>${ticketMedio} €</strong>
                    </div>
                    
                    <!-- BANDA RESULTADO -->
                    ${bandaResultado}
                </div>
            </div>
            `;
        }).join('');
        
        document.getElementById('listaCierres').innerHTML = html;
    }

    // Helper para clases de diferencia
    getDeltaClass(delta) {
        const abs = Math.abs(delta);
        return abs <= 0.01 ? 'delta-cero' : 'delta-descuadre';
    }

    renderCompras_OLD_5460() {
        // Poblar datalist de proveedores para autocomplete
        const datalist = document.getElementById('datalistProveedores');
        if (datalist) {
            datalist.innerHTML = this.db.proveedores
                .map(p => `<option value="${p.nombreFiscal}">${p.nombreComercial ? `(${p.nombreComercial})` : ''}</option>`)
                .join('');
        }

        let facturas = this.db.getByPeriod('facturas', this.currentPeriod);
        let albaranes = this.db.getByPeriod('albaranes', this.currentPeriod);

        // Aplicar filtros si existen
        if (this.currentFilters) {
            const { proveedor, desde, hasta } = this.currentFilters;
            
            if (proveedor) {
                facturas = facturas.filter(f => f.proveedor.toLowerCase().includes(proveedor));
                albaranes = albaranes.filter(a => a.proveedor.toLowerCase().includes(proveedor));
            }
            
            if (desde) {
                // Asegurar formato YYYY-MM-DD para comparación
                const fechaDesde = desde.includes('-') ? desde : new Date(desde).toISOString().split('T')[0];
                facturas = facturas.filter(f => {
                    const fechaFactura = f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0];
                    return fechaFactura >= fechaDesde;
                });
                albaranes = albaranes.filter(a => {
                    const fechaAlbaran = a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0];
                    return fechaAlbaran >= fechaDesde;
                });
            }
            
            if (hasta) {
                // Asegurar formato YYYY-MM-DD para comparación
                const fechaHasta = hasta.includes('-') ? hasta : new Date(hasta).toISOString().split('T')[0];
                facturas = facturas.filter(f => {
                    const fechaFactura = f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0];
                    return fechaFactura <= fechaHasta;
                });
                albaranes = albaranes.filter(a => {
                    const fechaAlbaran = a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0];
                    return fechaAlbaran <= fechaHasta;
                });
            }
        }

        const facturasHtml = facturas.length > 0 ? facturas.reverse().map(f => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${f.proveedor} - ${f.numeroFactura}</span>
                    <span class="list-item-value">${f.total.toFixed(2)}€</span>
                </div>
                <div class="list-item-details">
                    📅 ${f.fecha} | 🏷️ ${f.categoria}
                </div>
                <div class="list-item-actions">
                    ${f.archivoData ? `<button class="btn-view" onclick="window.app.verArchivoFactura(${f.id})" title="Ver archivo">🔍</button>` : ''}
                    <button class="btn-verify-factura" onclick="window.app.verificarFacturaAlbaranes(${f.id})" title="Verificar albaranes">📋</button>
                    <button class="btn-edit" onclick="window.app.editItem('facturas', ${f.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('facturas', ${f.id})" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay facturas registradas</p>';
        
        document.getElementById('listaFacturas').innerHTML = facturasHtml;

        const albaranesHtml = albaranes.length > 0 ? albaranes.reverse().map(a => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${a.proveedor} - ${a.numeroAlbaran}</span>
                    <span class="list-item-value">${a.verificado ? '✅' : '⏳'}</span>
                </div>
                <div class="list-item-details">
                    📅 ${a.fecha}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('albaranes', ${a.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('albaranes', ${a.id})">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay albaranes registradas</p>';
        
        document.getElementById('listaAlbaranes').innerHTML = albaranesHtml;
    }

    filtrarCompras() {
        const proveedor = document.getElementById('filtroProveedor').value.toLowerCase().trim();
        const desde = document.getElementById('filtroFechaDesde').value;
        const hasta = document.getElementById('filtroFechaHasta').value;

        this.currentFilters = { proveedor, desde, hasta };
        this.renderCompras();
        this.showToast('🔍 Filtros aplicados');
    }

    verificarFacturaAlbaranes(facturaId) {
        const factura = this.db.facturas.find(f => f.id === facturaId);
        if (!factura) {
            this.showToast('❌ Factura no encontrada', true);
            return;
        }

        // Validar que la factura tenga los datos necesarios
        if (!factura.proveedor || !factura.fecha) {
            this.showToast('❌ Factura sin datos de proveedor o fecha', true);
            return;
        }

        // Buscar albaranes del mismo proveedor anteriores o iguales a la fecha de la factura
        const albaranesCandidatos = this.db.albaranes.filter(a => 
            a.proveedor === factura.proveedor && 
            a.fecha && a.fecha <= factura.fecha
        );

        if (albaranesCandidatos.length === 0) {
            this.showModal(
                '📋 Información de Verificación',
                `No se encontraron albaranes del proveedor "<strong>${factura.proveedor}</strong>" anteriores o iguales a la fecha <strong>${factura.fecha}</strong>.<br><br>` +
                `<strong>Factura:</strong> ${factura.numeroFactura}<br>` +
                `<strong>Total:</strong> ${(factura.total || factura.baseImponible || 0).toFixed(2)}€<br><br>` +
                `<small style="color: #7f8c8d;">💡 Esto es normal si aún no has registrado albaranes de este proveedor. Los albaranes son opcionales.</small>`,
                'info'
            );
            return;
        }

        // Mostrar resumen
        const totalAlbaranes = albaranesCandidatos.reduce((sum, a) => sum + (a.total || 0), 0);
        const totalFactura = factura.total || factura.baseImponible || 0;
        const diferencia = Math.abs(totalFactura - totalAlbaranes);
        const coincide = diferencia < 0.01;

        const detalleAlbaranes = albaranesCandidatos.map(a => 
            `<li><strong>${a.numeroAlbaran}</strong> (${a.fecha}): ${(a.total || 0).toFixed(2)}€</li>`
        ).join('');


        const mensajeHTML = `
            <div style="text-align: left;">
                <p><strong>Factura:</strong> ${factura.numeroFactura}</p>
                <p><strong>Proveedor:</strong> ${factura.proveedor}</p>
                <p><strong>Fecha:</strong> ${factura.fecha}</p>
                <p><strong>Total Factura:</strong> ${totalFactura.toFixed(2)}€</p>
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #e3e8ef;">
                <p><strong>Albaranes encontrados (${albaranesCandidatos.length}):</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">${detalleAlbaranes}</ul>
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #e3e8ef;">
                <p><strong>Total Albaranes:</strong> ${totalAlbaranes.toFixed(2)}€</p>
                <p><strong>Diferencia:</strong> <span style="color: ${coincide ? '#27ae60' : '#e67e22'}; font-weight: 600;">${diferencia.toFixed(2)}€</span></p>
                <p style="font-size: 16px; font-weight: 600; color: ${coincide ? '#27ae60' : '#e67e22'}; margin-top: 15px;">
                    ${coincide ? '✅ Los totales coinciden' : '⚠️ Los totales NO coinciden'}
                </p>
            </div>
        `;

        this.showModal(
            coincide ? '✅ Verificación Correcta' : '⚠️ Verificación con Diferencias',
            mensajeHTML,
            coincide ? 'success' : 'warning'
        );
    }

    verArchivoFactura(facturaId) {
        const factura = this.db.facturas.find(f => f.id === facturaId);
        if (!factura) {
            this.showToast('❌ Factura no encontrada', true);
            return;
        }

        if (!factura.archivoData) {
            this.showToast('❌ Esta factura no tiene archivo adjunto', true);
            return;
        }

        // Crear modal para mostrar el archivo
        const modalHTML = `
            <div id="modalVisorArchivo" class="modal-overlay" style="z-index: 10000;">
                <div class="modal-content" style="max-width: 90vw; max-height: 90vh; width: 900px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3>📄 ${factura.archivoNombre || 'Archivo de Factura'}</h3>
                        <button onclick="window.app.cerrarVisorArchivo()" class="btn-secondary">✕ Cerrar</button>
                    </div>
                    <div style="overflow: auto; max-height: 75vh; border: 1px solid #e3e8ef; border-radius: 6px; background: #f8f9fa;">
                        ${factura.archivoNombre && factura.archivoNombre.toLowerCase().endsWith('.pdf') 
                            ? `<iframe src="${factura.archivoData}" style="width: 100%; height: 70vh; border: none;"></iframe>`
                            : `<img src="${factura.archivoData}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    cerrarVisorArchivo() {
        const modal = document.getElementById('modalVisorArchivo');
        if (modal) modal.remove();
    }

    renderProveedores_OLD_5662() {
        const proveedores = this.db.proveedores;
        
        // DEBUG: Verificar datos de proveedores
        // console.log('📋 DEBUG RENDER - Total proveedores:', proveedores.length);
        // console.log('📋 DEBUG RENDER - Proveedores completos:', proveedores);
        
        const html = proveedores.length > 0 ? proveedores.map(p => {
            const nombre = p.nombreFiscal || p.nombre || 'Sin nombre';
            const comercial = p.nombreComercial ? ` (${p.nombreComercial})` : '';
            const tipo = p.tipo || p.tipoProveedor || 'N/A';
            
            return `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${nombre}${comercial}</span>
                    <span class="list-item-value">${tipo}</span>
                </div>
                <div class="list-item-details">
                    🏢 ${p.nifCif || 'Sin NIF/CIF'} | 📞 ${p.telefono || 'Sin teléfono'} | 📧 ${p.email || 'Sin email'}
                    ${p.condicionesPago ? `| 💳 ${p.condicionesPago}` : ''}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('proveedores', ${p.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('proveedores', ${p.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay proveedores registrados</p>';
        
        // console.log('📋 DEBUG RENDER - HTML generado (primeros 500 chars):', html.substring(0, 500));
        // console.log('📋 DEBUG RENDER - Elemento listaProveedores existe?:', !!document.getElementById('listaProveedores'));
        
        const contenedor = document.getElementById('listaProveedores');
        if (contenedor) {
            contenedor.innerHTML = html;
            // console.log('📋 DEBUG RENDER - HTML insertado correctamente. Children:', contenedor.children.length);
        } else {
            console.error('❌ ERROR - Elemento listaProveedores NO ENCONTRADO en el DOM');
        }
        
        // Actualizar dropdown de productos
        const selectProveedor = document.getElementById('productoProveedorId');
        if (selectProveedor) {
            const options = proveedores.map(p => 
                `<option value="${p.id}">${p.nombreFiscal || p.nombre}</option>`
            ).join('');
            selectProveedor.innerHTML = '<option value="">Seleccionar...</option>' + options;
        }
    }

    renderProductos_OLD_5713() {
        const productos = this.db.productos;
        const html = productos.length > 0 ? productos.map(p => {
            const precio = p.precioPromedioNeto || p.precio || 0;
            const stock = p.stockActualUnidades || 0;
            const unidad = p.unidadBase || 'ud';
            const proveedor = p.proveedorNombre || p.proveedor || 'Sin proveedor';
            
            let empaqueInfo = '';
            if (p.esEmpaquetado && p.unidadesPorEmpaque) {
                const numEmpaques = (stock / p.unidadesPorEmpaque).toFixed(2);
                empaqueInfo = ` | 📦 ${numEmpaques} ${p.tipoEmpaque}s`;
            }
            
            return `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${p.nombre}</span>
                    <span class="list-item-value">${precio.toFixed(2)}€/${unidad}</span>
                </div>
                <div class="list-item-details">
                    🏢 ${proveedor} | 📦 Stock: ${stock.toFixed(2)} ${unidad}${empaqueInfo}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('productos', ${p.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('productos', ${p.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay productos en el catálogo</p>';
        
        document.getElementById('listaProductos').innerHTML = html;
    }

    renderEscandallos_OLD_5747() {
        const escandallos = this.db.escandallos;
        const html = escandallos.length > 0 ? escandallos.map(e => {
            const fcClass = e.foodCost > 35 ? 'fc-high' : e.foodCost > 25 ? 'fc-medium' : 'fc-low';
            const numIngredientes = e.ingredientes ? e.ingredientes.length : 0;
            
            return `
            <div class="escandallo-card">
                <div class="escandallo-header">
                    <span class="escandallo-title">${e.nombre}${e.codigo ? ` (${e.codigo})` : ''}</span>
                    <div class="list-item-actions">
                        <button class="btn-edit" onclick="window.app.editItem('escandallos', ${e.id})">✏️</button>
                        <button class="btn-delete" onclick="window.app.deleteItem('escandallos', ${e.id})">🗑️</button>
                    </div>
                </div>
                <div class="escandallo-stats">
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">PVP con IVA (${e.tipoIva}%)</div>
                        <div class="escandallo-stat-value">${e.pvpConIva.toFixed(2)}€</div>
                    </div>
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">Coste Neto</div>
                        <div class="escandallo-stat-value">${e.costeTotalNeto.toFixed(2)}€</div>
                    </div>
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">Food Cost %</div>
                        <div class="escandallo-stat-value ${fcClass}">${e.foodCost.toFixed(1)}%</div>
                    </div>
                    <div class="escandallo-stat">
                        <div class="escandallo-stat-label">Margen Bruto</div>
                        <div class="escandallo-stat-value">${e.margenPorcentaje.toFixed(1)}%</div>
                    </div>
                </div>
                ${numIngredientes > 0 ? `
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                    <strong style="font-size: 13px; color: #34495e;">🧂 Ingredientes (${numIngredientes}):</strong>
                    <div style="margin-top: 8px; font-size: 12px; color: #7f8c8d;">
                        ${e.ingredientes.map(ing => {
                            const producto = this.db.productos.find(p => p.id === ing.productoId);
                            const nombreProd = producto ? producto.nombre : ing.nombre || 'Producto desconocido';
                            const unidad = ing.unidad || '';
                            const costeTotal = ing.costeTotal || ing.costeIngrediente || 0;
                            return `• ${nombreProd}: ${ing.cantidad} ${unidad} × ${ing.costeUnitario.toFixed(4)}€ = ${costeTotal.toFixed(2)}€`;
                        }).join('<br>')}
                </div>
                </div>` : ''}
                <div style="margin-top: 10px; font-size: 13px; color: #7f8c8d;">
                    💶 PVP Neto: ${e.pvpNeto.toFixed(2)}€ | 📈 Margen: ${e.margenBruto.toFixed(2)}€
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay escandallos creados</p>';
        
        document.getElementById('listaEscandallos').innerHTML = html;
    }

    // Conversión de unidades para escandallos
    convertirUnidades(precioPromedioNeto, unidadBase, unidadEscandallo) {
        // Retorna el coste unitario en la unidad del escandallo
        if (!unidadBase || !unidadEscandallo || !precioPromedioNeto) return 0;
        
        // Sin conversión necesaria
        if (unidadBase === unidadEscandallo) return precioPromedioNeto;
        
        // Conversión kg ↔ g
        if (unidadBase === 'kg' && unidadEscandallo === 'g') {
            return precioPromedioNeto / 1000;  // €/kg → €/g
        }
        if (unidadBase === 'g' && unidadEscandallo === 'kg') {
            return precioPromedioNeto * 1000;  // €/g → €/kg
        }
        
        // Conversión L ↔ ml
        if (unidadBase === 'L' && unidadEscandallo === 'ml') {
            return precioPromedioNeto / 1000;  // €/L → €/ml
        }
        if (unidadBase === 'ml' && unidadEscandallo === 'L') {
            return precioPromedioNeto * 1000;  // €/ml → €/L
        }
        
        // Unidades: sin conversión
        if (unidadBase === 'ud' && unidadEscandallo === 'ud') {
            return precioPromedioNeto;
        }
        
        // Si no hay conversión válida, retornar 0 (error)
        return 0;
    }

    onIngredienteProductoChange(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const productoId = parseInt(selectElement.value);
        const row = selectElement.closest('.ingrediente-item');
        
        if (!productoId) return;
        
        // Obtener producto
        const producto = this.db.productos.find(p => p.id === productoId);
        if (!producto) return;
        
        // Validar que el producto tenga precioPromedioNeto
        if (!producto.precioPromedioNeto || producto.precioPromedioNeto <= 0) {
            this.showModal('⚠️ Producto sin coste', 
                `El producto "${producto.nombre}" no tiene precio promedio neto definido. Por favor, actualiza la ficha del producto.`, 
                'warning');
            selectElement.value = '';
            return;
        }
        
        // Autocompletar unidad: convertir unidadBase a unidad de escandallo
        const unidadSelect = row.querySelector('.ingrediente-unidad');
        let unidadEscandallo = producto.unidadBase;
        
        // Por defecto, si es kg → usar g, si es L → usar ml
        if (producto.unidadBase === 'kg') unidadEscandallo = 'g';
        else if (producto.unidadBase === 'L') unidadEscandallo = 'ml';
        else if (producto.unidadBase === 'ud') unidadEscandallo = 'ud';
        
        unidadSelect.value = unidadEscandallo;
        
        // Calcular coste unitario con conversión
        const costeUnitarioConvertido = this.convertirUnidades(
            producto.precioPromedioNeto, 
            producto.unidadBase, 
            unidadEscandallo
        );
        
        // Autocompletar coste unitario (precio neto del producto convertido)
        const costeUnitarioInput = row.querySelector('.ingrediente-coste-unitario');
        costeUnitarioInput.value = costeUnitarioConvertido.toFixed(4);
        
        // Recalcular
        this.calcularCostesEscandallo();
    }

    calcularPVPNeto() {
        const pvpConIva = parseFloat(document.getElementById('escandalloPVPConIVA').value);
        const tipoIva = parseFloat(document.getElementById('escandalloTipoIVA').value);
        const pvpNeto = pvpConIva / (1 + tipoIva / 100);
        
        document.getElementById('escandalloPVPNeto').value = pvpNeto.toFixed(2);
        this.calcularCostesEscandallo();
    }

    addIngredienteRow() {
        const container = document.getElementById('ingredientesContainer');
        const rowId = Date.now();
        
        // Obtener lista de productos con unidad base
        const productosOptions = this.db.productos.map(p => {
            const proveedor = this.db.proveedores.find(pr => pr.id === p.proveedorId);
            return `<option value="${p.id}" data-precio="${p.precio}" data-unidad="${p.unidadBase}">${p.nombre} (${proveedor ? proveedor.nombre : 'Sin proveedor'})</option>`;
        }).join('');

        const row = document.createElement('div');
        row.className = 'ingrediente-item';
        row.dataset.id = rowId;
        row.innerHTML = `
            <div class="form-group">
                <label>Producto *</label>
                <select class="ingrediente-producto form-select" required onchange="app.onIngredienteProductoChange(this)">
                    <option value="">Seleccionar...</option>
                    ${productosOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Cantidad *</label>
                <input type="number" step="0.001" class="ingrediente-cantidad" oninput="app.calcularCostesEscandallo()" required>
            </div>
            <div class="form-group">
                <label>Unidad *</label>
                <select class="ingrediente-unidad form-select" required onchange="app.calcularCostesEscandallo()">
                    <option value="">Seleccionar...</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="ud">ud</option>
                </select>
            </div>
            <div class="form-group">
                <label>Coste Unit. (€) *</label>
                <input type="number" step="0.0001" class="ingrediente-coste-unitario" oninput="app.calcularCostesEscandallo()" required>
            </div>
            <div class="form-group">
                <label>Coste Total (€)</label>
                <input type="number" step="0.01" class="ingrediente-coste-total" readonly>
            </div>
            <button type="button" class="btn-delete" onclick="window.app.removeIngredienteRow(${rowId})">🗑️</button>
        `;
        container.appendChild(row);
    }

    removeIngredienteRow(rowId) {
        const row = document.querySelector(`.ingrediente-item[data-id="${rowId}"]`);
        if (row) {
           
            row.remove();
            this.calcularCostesEscandallo();
        }
    }

    calcularCostesEscandallo() {
        let costeTotalNeto = 0;
        
        document.querySelectorAll('.ingrediente-item').forEach(item => {
            const cantidad = parseFloat(item.querySelector('.ingrediente-cantidad').value) || 0;
            const costeUnitario = parseFloat(item.querySelector('.ingrediente-coste-unitario').value) || 0;
            const costeIngrediente = cantidad * costeUnitario;
            
            item.querySelector('.ingrediente-coste-total').value = costeIngrediente.toFixed(2);
            costeTotalNeto += costeIngrediente;
        });

        document.getElementById('escandalloCosteTotalNeto').value = costeTotalNeto.toFixed(2);

        const pvpNeto = parseFloat(document.getElementById('escandalloPVPNeto').value) || 0;
        if (pvpNeto > 0) {

            const fc = (costeTotalNeto / pvpNeto * 100);
            const margen = ((pvpNeto - costeTotalNeto) / pvpNeto * 100);
            document.getElementById('escandalloFC').value = fc.toFixed(1);
            document.getElementById('escandalloMargen').value = margen.toFixed(1);
            
            // Validación: Food Cost > 200%
            if (fc > 200) {
                document.getElementById('escandalloFC').style.color = '#e74c3c';
                document.getElementById('escandalloFC').style.fontWeight = 'bold';
            } else {
                document.getElementById('escandalloFC').style.color = '';
                document.getElementById('escandalloFC').style.fontWeight = '';
            }
        } else {
            document.getElementById('escandalloFC').value = '0.0';
            document.getElementById('escandalloMargen').value = '0.0';
        }
    }

    guardarEscandallo(escandallo, editId = null) {
        const form = document.getElementById('escandalloForm');
        
        if (editId) {
            escandallo.id = editId;
            this.db.update('escandallos', editId, escandallo);
            this.showToast('✓ Escandallo actualizado correctamente');
            delete form.dataset.editId;
        } else {
            this.db.add('escandallos', escandallo);
            this.showToast('✓ Escandallo guardado correctamente');
        }
        
        form.reset();
        document.getElementById('ingredientesContainer').innerHTML = '';
        this.render();
    }

    renderInventarios_OLD_6003() {
        const inventarios = this.db.inventarios;
        const html = inventarios.length > 0 ? inventarios.reverse().map(i => {
            const numProductos = i.productos ? i.productos.length : 0;
            const valorTotal = i.productos ? i.productos.reduce((sum, p) => sum + p.valorDiferencia, 0) : 0;
            const colorClass = Math.abs(valorTotal) > 50 ? 'warning' : '';
            
            return `
            <div class="list-item ${colorClass}">
                <div class="list-item-header">
                    <span class="list-item-title">Inventario ${i.fecha}</span>
                    <span class="list-item-value">${i.familia}</span>
                </div>
                <div class="list-item-details">
                    📦 ${numProductos} productos | 💰 Diferencia: ${valorTotal.toFixed(2)}€
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('inventarios', ${i.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('inventarios', ${i.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay inventarios realizados</p>';
        
        document.getElementById('listaInventarios').innerHTML = html;
    }

    renderDelivery_OLD_6030() {
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const html = delivery.length > 0 ? delivery.reverse().map(d => `
            <div class="list-item">
                <div class="list-item-header">
                    <span class="list-item-title">${d.plataforma} - ${d.fecha}</span>
                    <span class="list-item-value">${d.ingresoNeto.toFixed(2)}€</span>
                </div>
                <div class="list-item-details">
                    💰 Brutos: ${d.ventasBrutas}€ | 💸 Comisión: ${d.comisionPorcentaje}% (${d.comisionImporte.toFixed(2)}€)
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('delivery', ${d.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('delivery', ${d.id})">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay pedidos registrados</p>';
        
        document.getElementById('listaDelivery').innerHTML = html;
    }

    renderPnL_OLD_6051() {
        // ══════════════════════════════════════════════════════════════
        // CUENTA DE EXPLOTACIÓN PROFESIONAL HOSTELERÍA 2025
        // TODO SIN IVA · ESTRUCTURA PROFESIONAL COMPLETA
        // ══════════════════════════════════════════════════════════════

        const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const facturas = this.db.getByPeriod('facturas', this.currentPeriod);
        const inventarios = this.db.inventarios;

        // ────────────────────────────────────────────────────────────
        // 1. INGRESOS NETOS (SIN IVA)
        // ────────────────────────────────────────────────────────────
        const ventasLocal = cierres.reduce((sum, c) => sum + (c.totalReal || 0), 0);
        const ventasDelivery = delivery.reduce((sum, d) => sum + (d.ingresoNeto || 0), 0);
        const totalIngresos = ventasLocal + ventasDelivery;

        // ────────────────────────────────────────────────────────────
        // 2. COGS (COSTE DE MERCANCÍA VENDIDA)
        // Fórmula: COGS = InvInicial + ComprasNetas - InvFinal
        // ────────────────────────────────────────────────────────────
        
        // Inventario inicial (último inventario del período anterior o primer inventario disponible)
        const invInicial = inventarios.length > 0 ? 
            inventarios[0].productos?.reduce((sum, p) => sum + (p.stockTeorico * p.precioUnitario), 0) || 0 : 0;
        
        // Compras netas del período (facturas SIN IVA)
        const comprasNetas = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
        
        // Inventario final (último inventario disponible)
        const invFinal = inventarios.length > 0 ? 
            inventarios[inventarios.length - 1].productos?.reduce((sum, p) => sum + (p.stockRealUnidades * p.precioUnitario), 0) || 0 : 0;
        
        // COGS TOTAL
        const cogsTotal = invInicial + comprasNetas - invFinal;
        
        // COGS por categoría (estimado: 60% comida, 40% bebida)
        const cogsComida = cogsTotal * 0.6;
        const cogsBebida = cogsTotal * 0.4;
        
        // Food Cost %
        const foodCostPct = totalIngresos > 0 ? (cogsTotal / totalIngresos * 100) : 0;

        // ────────────────────────────────────────────────────────────
        // 3. MARGEN BRUTO
        // ────────────────────────────────────────────────────────────
        const margenBruto = totalIngresos - cogsTotal;
        const margenBrutoPct = totalIngresos > 0 ? (margenBruto / totalIngresos * 100) : 0;

        // ────────────────────────────────────────────────────────────
        // 4. GASTOS DE PERSONAL (SIMULADO - en producción conectar con nóminas)
        // ────────────────────────────────────────────────────────────
        const salarios = 0; // Placeholder - integrar con módulo nóminas
        const seguridadSocial = 0; // Placeholder
        const totalPersonal = salarios + seguridadSocial;
        const personalPct = totalIngresos > 0 ? (totalPersonal / totalIngresos * 100) : 0;

        // ────────────────────────────────────────────────────────────
        // 5. GASTOS OPERATIVOS (SIMULADO - en producción conectar con gastos)
        // ────────────────────────────────────────────────────────────
        const alquiler = 0;
        const suministros = 0;
        const servicios = 0;
        const marketing = 0;
        const comisiones = delivery.reduce((sum, d) => sum + (d.comisionImporte || 0), 0);
        const limpieza = 0;
        const seguros = 0;
        const otrosOpex = 0;
        
        const totalOpex = alquiler + suministros + servicios + marketing + comisiones + limpieza + seguros + otrosOpex;
        const opexPct = totalIngresos > 0 ? (totalOpex / totalIngresos * 100) : 0;

        // ────────────────────────────────────────────────────────────
        // 6. EBITDA (Resultado Operativo)
        // ────────────────────────────────────────────────────────────
        const ebitda = margenBruto - totalPersonal - totalOpex;
        const ebitdaPct = totalIngresos > 0 ? (ebitda / totalIngresos * 100) : 0;

        // ────────────────────────────────────────────────────────────
        // 7. FINANCIEROS Y AMORTIZACIONES (SIMULADO)
        // ────────────────────────────────────────────────────────────
        const financieros = 0;
        const amortizaciones = 0;

        // ────────────────────────────────────────────────────────────
        // 8. BENEFICIO NETO (BAI)
        // ────────────────────────────────────────────────────────────
        const beneficioNeto = ebitda - financieros - amortizaciones;
        const margenNetoPct = totalIngresos > 0 ? (beneficioNeto / totalIngresos * 100) : 0;

        // ══════════════════════════════════════════════════════════════
        // ACTUALIZAR UI - KPIs PRINCIPALES
        // ══════════════════════════════════════════════════════════════
        document.getElementById('kpiIngresos').textContent = totalIngresos.toFixed(0) + '€';
        document.getElementById('kpiFoodCost').textContent = foodCostPct.toFixed(1) + '%';
        document.getElementById('kpiMargen').textContent = margenBrutoPct.toFixed(1) + '%';
        document.getElementById('kpiEBITDA').textContent = ebitdaPct.toFixed(1) + '%';

        // Comparaciones (placeholder - implementar comparación períodos)
        document.getElementById('kpiIngresosCompare').textContent = '';
        document.getElementById('kpiFoodCostCompare').textContent = '';
        document.getElementById('kpiMargenCompare').textContent = '';
        document.getElementById('kpiEBITDACompare').textContent = '';

        // ══════════════════════════════════════════════════════════════
        // ACTUALIZAR UI - CUENTA DETALLADA
        // ══════════════════════════════════════════════════════════════
        
        // 1. INGRESOS
        document.getElementById('plVentasLocal').textContent = ventasLocal.toFixed(2) + '€';
        document.getElementById('plVentasDelivery').textContent = ventasDelivery.toFixed(2) + '€';
        document.getElementById('plTotalIngresos').textContent = totalIngresos.toFixed(2) + '€';

        // 2. COGS
        document.getElementById('plInvInicial').textContent = invInicial.toFixed(2) + '€';
        document.getElementById('plComprasNetas').textContent = comprasNetas.toFixed(2) + '€';
        document.getElementById('plInvFinal').textContent = invFinal.toFixed(2) + '€';
        document.getElementById('plCOGSTotal').textContent = cogsTotal.toFixed(2) + '€';
        document.getElementById('plCOGSComida').textContent = cogsComida.toFixed(2) + '€';
        document.getElementById('plCOGSBebida').textContent = cogsBebida.toFixed(2) + '€';
        document.getElementById('plFoodCostPct').textContent = foodCostPct.toFixed(1) + '%';

        // 3. MARGEN BRUTO
        document.getElementById('plMargenBruto').textContent = margenBruto.toFixed(2) + '€';
        document.getElementById('plMargenPct').textContent = margenBrutoPct.toFixed(1) + '%';

        // 4. PERSONAL
        document.getElementById('plSalarios').textContent = salarios.toFixed(2) + '€';
        document.getElementById('plSeguridadSocial').textContent = seguridadSocial.toFixed(2) + '€';
        document.getElementById('plTotalPersonal').textContent = totalPersonal.toFixed(2) + '€';
        document.getElementById('plPersonalPct').textContent = personalPct.toFixed(1) + '%';

        // 5. OPEX
        document.getElementById('plAlquiler').textContent = alquiler.toFixed(2) + '€';
        document.getElementById('plSuministros').textContent = suministros.toFixed(2) + '€';
        document.getElementById('plServicios').textContent = servicios.toFixed(2) + '€';
        document.getElementById('plMarketing').textContent = marketing.toFixed(2) + '€';
        document.getElementById('plComisiones').textContent = comisiones.toFixed(2) + '€';
        document.getElementById('plLimpieza').textContent = limpieza.toFixed(2) + '€';
        document.getElementById('plSeguros').textContent = seguros.toFixed(2) + '€';
        document.getElementById('plOtrosOpex').textContent = otrosOpex.toFixed(2) + '€';
        document.getElementById('plTotalOpex').textContent = totalOpex.toFixed(2) + '€';
        document.getElementById('plOpexPct').textContent = opexPct.toFixed(1) + '%';

        // 6. EBITDA
        document.getElementById('plEBITDA').textContent = ebitda.toFixed(2) + '€';
        document.getElementById('plEBITDAPct').textContent = ebitdaPct.toFixed(1) + '%';

        // 7. FINANCIEROS Y AMORTIZACIONES
        document.getElementById('plFinancieros').textContent = financieros.toFixed(2) + '€';
        document.getElementById('plAmortizaciones').textContent = amortizaciones.toFixed(2) + '€';

        // 8. BENEFICIO NETO
        document.getElementById('plBeneficioNeto').textContent = beneficioNeto.toFixed(2) + '€';
        document.getElementById('plMargenNetoPct').textContent = margenNetoPct.toFixed(1) + '%';

        // ══════════════════════════════════════════════════════════════
        // ALERTAS AUTOMÁTICAS
        // ══════════════════════════════════════════════════════════════
        const alertas = [];

        if (foodCostPct > 32) {
            alertas.push({
                tipo: 'critica',
                mensaje: `⚠️ FOOD COST CRÍTICO: ${foodCostPct.toFixed(1)}% (objetivo <32%). Revisar precios compras y mermas.`
            });
        }

        if (personalPct > 38 && totalPersonal > 0) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `⚠️ Gastos de Personal: ${personalPct.toFixed(1)}% (objetivo <38%). Optimizar turnos.`
            });
        }

        if (opexPct > 20 && totalOpex > 0) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `⚠️ OPEX alto: ${opexPct.toFixed(1)}% (objetivo <20%). Revisar gastos operativos.`
            });
        }

        if (margenBrutoPct < 60) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `⚠️ Margen Bruto bajo: ${margenBrutoPct.toFixed(1)}% (objetivo >60%). Ajustar precios o reducir COGS.`
            });
        }

        if (ebitdaPct < 10 && totalIngresos > 0) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `⚠️ EBITDA bajo: ${ebitdaPct.toFixed(1)}% (objetivo >10%). Negocio poco rentable.`
            });
        }

        if (beneficioNeto < 0) {
            alertas.push({
                tipo: 'critica',
                mensaje: `🚨 PÉRDIDAS: Beneficio Neto negativo (${beneficioNeto.toFixed(2)}€). Acción urgente requerida.`
            });
        }

        if (totalIngresos === 0) {
            alertas.push({
                tipo: 'info',
                mensaje: `ℹ️ Sin datos de ventas en este período. Registra cierres y pedidos delivery.`
            });
        }

        // Renderizar alertas
        const alertasHtml = alertas.map(a => 
            `<div class="pnl-alerta ${a.tipo}">${a.mensaje}</div>`
        ).join('');
        document.getElementById('pnlAlertas').innerHTML = alertasHtml;
    }

    async handleOCRImageUpload(file) {
        // Aseguramos que el Toast sea accesible si el contexto 'this' se pierde
        const showToast = (msg, isError) => window.app.showToast(msg, isError);
        
        document.getElementById('fileNameDisplay').textContent = file.name;
        document.getElementById('fileSelectedInfo').classList.remove('hidden');
        document.getElementById('fileSelectedInfo').style.display = 'flex';

        // Ocultar la zona de drag & drop
        const uploadZone = document.querySelector('.file-upload-zone');
        if (uploadZone) uploadZone.style.display = 'none';
        
        // Ocultar botón cancelar carga (porque ya hay archivo)
        const cancelContainer = document.getElementById('ocrUploadCancelContainer');
        if (cancelContainer) cancelContainer.classList.add('hidden');

        // Ocultar lista de últimos documentos
        const recentDocsList = document.getElementById('recentDocumentsList');
        if (recentDocsList) recentDocsList.style.display = 'none';

        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'pdf'];
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'application/pdf'];
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            showToast('⚠️ Formato no soportado. Use: JPG, PNG, WEBP, TIFF o PDF', true);
            document.getElementById('ocrFile').value = '';
            return;
        }
        
        if (file.size > 20 * 1024 * 1024) {
            showToast('⚠️ El archivo es demasiado grande (máximo 20MB)', true);
            document.getElementById('ocrFile').value = '';
            return;
        }

        // --- LÓGICA DE PDF ---
        if (file.type === 'application/pdf' || fileExtension === 'pdf') {
            showToast('📝 Procesando PDF...');
            try {
                if (typeof pdfjsLib === 'undefined') throw new Error('PDF.js no está cargado');
                const extractedText = await this.extractPDFText(file);
                
                if (extractedText && extractedText.length > 100) {
                    this.currentPDFText = extractedText;
                    this.isPDFWithEmbeddedText = true;
                    const imageData = await this.convertPDFToImage(file);
                    document.getElementById('ocrPreviewImg').src = imageData;
                } else {
                    this.isPDFWithEmbeddedText = false;

        // Ocultar opciones de escaneo si est�n abiertas
        const scanOptionsCard = document.getElementById('scanOptionsCard');
        if (scanOptionsCard) {
             scanOptionsCard.classList.add('hidden');
             scanOptionsCard.style.display = 'none';
        }

        // Mostrar listas de nuevo
        const listaFacturas = document.getElementById('listaFacturas');
        const listaAlbaranes = document.getElementById('listaAlbaranes');
        const recentDocs = document.getElementById('recentDocumentsList');
        if (listaFacturas) listaFacturas.classList.remove('hidden');
        if (listaAlbaranes) listaAlbaranes.classList.remove('hidden');
        if (recentDocs) recentDocs.classList.remove('hidden');
                    const imageData = await this.convertPDFToImage(file);
                    this.currentImageData = imageData;
                    document.getElementById('ocrPreviewImg').src = imageData;
                }
                showToast('✅ PDF cargado. Listo para analizar.');
            } catch (error) {
                console.error('Error convirtiendo PDF:', error);
                showToast('❌ Error al procesar PDF.', true);
                document.getElementById('ocrFile').value = '';
            }
            document.getElementById('ocrAnalyzeBtn').style.display = 'flex'; // Mostrar botón de analizar
            document.getElementById('ocrPreviewContainer').classList.remove('hidden');
            document.getElementById('ocrUploadCard').classList.remove('hidden');
            return;
        }

        // --- LÓGICA DE IMAGEN ---
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const preprocessedImage = await this.preprocessImage(e.target.result);
                document.getElementById('ocrPreviewImg').src = preprocessedImage;
                this.currentImageData = preprocessedImage;
                document.getElementById('ocrPreviewContainer').classList.remove('hidden');
                document.getElementById('ocrAnalyzeBtn').style.display = 'flex'; // Mostrar botón de analizar
                showToast('✅ Imagen cargada correctamente');
            } catch (error) {
                console.error('Error procesando imagen:', error);
                showToast('❌ Error al procesar imagen', true);
                document.getElementById('ocrFile').value = '';
            }
        };
        reader.readAsDataURL(file);
        document.getElementById('ocrAnalyzeBtn').style.display = 'flex'; // Mostrar botón de analizar
        document.getElementById('ocrPreviewContainer').classList.remove('hidden');
        document.getElementById('ocrUploadCard').classList.remove('hidden');
    }

    extractZonesFromTesseractData(tesseractData) {
        // Extraer zonas de IMAGENES (JPEG, PNG, etc) usando coordenadas de Tesseract
        // Similar a extractPDFText pero para imágenes
        try {
            if (!tesseractData.words || tesseractData.words.length === 0) {
                return null; // Sin datos de palabras, usar texto plano
            }

            const words = tesseractData.words;
            const imageWidth = tesseractData.width || 1000;
            const imageHeight = tesseractData.height || 1000;

            console.log('🎯 Aplicando extracción con ZONAS a imagen (JPEG/PNG/etc)...');

            // Definir zonas (igual que PDF.js)
            const zones = {
                topLeft: [],      // Proveedor (x < 50%, y < 30%)
                topRight: [],     // Cliente (x >= 50%, y < 30%)
                center: [],       // Detalle (30% < y < 70%)
                bottom: []        // Totales (y >= 70%)
            };

            // Clasificar cada palabra por coordenadas
            words.forEach(word => {
                const text = word.text.trim();
                if (!text || word.confidence < 30) return; // Ignorar palabras con baja confianza

                const bbox = word.bbox;
                const x = bbox.x0; // Posición X (izquierda)
                const y = bbox.y0; // Posición Y (arriba)

                // Normalizar coordenadas (0-1)
                const normalX = x / imageWidth;
                const normalY = y / imageHeight;

                // Clasificar por zona (Y en imágenes: menor = arriba)
                if (normalY < 0.3) { // Arriba (30% superior)
                    if (normalX < 0.5) {
                        zones.topLeft.push({ text, x, y });
                    } else {
                        zones.topRight.push({ text, x, y });
                    }
                } else if (normalY < 0.7) { // Centro
                    zones.center.push({ text, x, y });
                } else { // Abajo (totales)
                    zones.bottom.push({ text, x, y });
                }
            });

            // Ordenar cada zona por Y (ascendente) y luego por X
            Object.keys(zones).forEach(zoneKey => {
                zones[zoneKey].sort((a, b) => {
                    const yDiff = a.y - b.y; // Menor Y primero (arriba)
                    if (Math.abs(yDiff) > 10) return yDiff;
                    return a.x - b.x; // Mismo Y
                });
            });

            // Reconstruir texto estructurado
            const structuredText = {
                proveedor: zones.topLeft.map(i => i.text).join(' '),
                cliente: zones.topRight.map(i => i.text).join(' '),
                detalle: zones.center.map(i => i.text).join(' '),
                totales: zones.bottom.map(i => i.text).join(' '),
                full: text
            };

            console.log('📋 Zonas extraídas de imagen:');
            console.log('  Proveedor (arriba-izq):', structuredText.proveedor.substring(0, 100) + '...');
            console.log('  Cliente (arriba-der):', structuredText.cliente.substring(0, 100) + '...');
            console.log('  Totales (abajo):', structuredText.totales.substring(0, 100) + '...');

            // Devolver texto estructurado (igual que PDF.js)
            return `ZONA_PROVEEDOR: ${structuredText.proveedor}\n\nZONA_CLIENTE: ${structuredText.cliente}\n\nZONA_DETALLE: ${structuredText.detalle}\n\nZONA_TOTALES: ${structuredText.totales}`;

        } catch (error) {
            console.error('Error extrayendo zonas de imagen:', error);
            return null; // Fallback a texto plano
        }
    }

    async extractPDFText(pdfFile) {
        // Extraer texto embebido del PDF CON COORDENADAS para separar zonas
        try {
            if (typeof pdfjsLib === 'undefined') {
                return null;
            }

            const arrayBuffer = await pdfFile.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            if (!pdf || pdf.numPages === 0) return null;

            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.0 });
            const textContent = await page.getTextContent();
            
            // Si no hay texto embebido, return null para usar OCR
            if (!textContent.items || textContent.items.length === 0) {
                return null;
            }
            
            // Calcular texto total
            const totalText = textContent.items.map(item => item.str).join(' ').trim();
            if (totalText.length < 100) {
                return null; // Muy poco texto, usar OCR
            }
            
            console.log('✅ PDF con texto embebido detectado, extrayendo con coordenadas...');
            
            // Separar texto por ZONAS usando coordenadas (x, y)
            const pageHeight = viewport.height;
            const pageWidth = viewport.width;
            
            // Definir zonas (normalizado 0-1)
            const zones = {
                topLeft: [],      // Arriba izquierda (proveedor)
                topRight: [],     // Arriba derecha (cliente)
                center: [],       // Centro (tabla de productos)
                bottom: []        // Abajo (totales)
            };
            
            // Clasificar cada item de texto en su zona
            textContent.items.forEach(item => {
                const x = item.transform[4]; // Posición X
                const y = item.transform[5]; // Posición Y
                const text = item.str.trim();
                
                if (!text) return;
                
                // Normalizar coordenadas (0-1)
                const normalX = x / pageWidth;
                const normalY = y / pageHeight;
                
                // Clasificar por zona (Y invertido: mayor Y = arriba)
                if (normalY > 0.7) { // Arriba (70% superior)
                    if (normalX < 0.5) {
                        zones.topLeft.push({ text, x, y });
                    } else {
                        zones.topRight.push({ text, x, y });
                    }
                } else if (normalY > 0.3) { // Centro
                    zones.center.push({ text, x, y });
                } else { // Abajo (totales)
                    zones.bottom.push({ text, x, y });
                }
            });
            
            // Ordenar cada zona por Y (descendente) y luego por X
            Object.keys(zones).forEach(zoneKey => {
                zones[zoneKey].sort((a, b) => {
                    const yDiff = b.y - a.y; // Mayor Y primero (arriba)
                    if (Math.abs(yDiff) > 5) return yDiff;
                    return a.x - b.x; // Mismo Y → orden X
                });
            });
            
            // Reconstruir texto estructurado
            const structuredText = {
                proveedor: zones.topLeft.map(i => i.text).join(' '),
                cliente: zones.topRight.map(i => i.text).join(' '),
                detalle: zones.center.map(i => i.text).join(' '),
                totales: zones.bottom.map(i => i.text).join(' '),
                full: totalText
            };
            
            console.log('📋 Zonas extraídas:');
            console.log('  Proveedor (arriba-izq):', structuredText.proveedor.substring(0, 100) + '...');
            console.log('  Cliente (arriba-der):', structuredText.cliente.substring(0, 100) + '...');
            console.log('  Totales (abajo):', structuredText.totales.substring(0, 100) + '...');
            
            // Devolver texto estructurado como string especial
            return `ZONA_PROVEEDOR: ${structuredText.proveedor}\n\nZONA_CLIENTE: ${structuredText.cliente}\n\nZONA_DETALLE: ${structuredText.detalle}\n\nZONA_TOTALES: ${structuredText.totales}`;
            
        } catch (error) {
            console.error('Error extrayendo texto embebido:', error);
            return null;
        }
    }

    async convertPDFToImage(pdfFile) {
        // Usar PDF.js para renderizar PDF a canvas de alta calidad
        return new Promise(async (resolve, reject) => {
            try {
                // Verificar que PDF.js está disponible
                if (typeof pdfjsLib === 'undefined') {
                    reject(new Error('PDF.js library not loaded'));
                    return;
                }

                const arrayBuffer = await pdfFile.arrayBuffer();
                
                // Configurar opciones de carga
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                    cMapPacked: true,
                    standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
                });
                
                const pdf = await loadingTask.promise;
                
                if (!pdf || pdf.numPages === 0) {
                    reject(new Error('PDF vacío o corrupto'));
                    return;
                }
                
                // Procesar primera página
                const page = await pdf.getPage(1);
                
                // Escala para 300-400 DPI (alta calidad)
                const scale = 3.0; // 3x = ~300 DPI
                const viewport = page.getViewport({ scale });
                
                // Crear canvas
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                if (!context) {
                    reject(new Error('No se pudo crear contexto canvas'));
                    return;
                }
                
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Fondo blanco para PDFs con transparencia
                context.fillStyle = 'white';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Renderizar PDF a canvas
                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                    intent: 'print' // Mejor calidad para impresión/OCR
                }).promise;
                
                // Convertir canvas a imagen PNG de alta calidad
                const imageData = canvas.toDataURL('image/png', 1.0);
                
                if (!imageData || imageData === 'data:,') {
                    reject(new Error('No se pudo convertir PDF a imagen'));
                    return;
                }
                
                resolve(imageData);
            } catch (error) {
                console.error('Error convirtiendo PDF a imagen:', error);
                reject(new Error('Error al convertir PDF a imagen: ' + error.message));
            }
        });
    }

    async preprocessImage(imageData) {
        // Preprocesar imagen para mejorar resultados de OCR
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Dibujar imagen original
                ctx.drawImage(img, 0, 0);
                
                // Obtener datos de píxeles
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Aplicar ajustes: brillo (+20), contraste (+30%)
                const brightness = 20;
                const contrast = 30;
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                
                for (let i = 0; i < data.length; i += 4) {
                    // Aplicar brillo
                    data[i] += brightness;     // R
                    data[i + 1] += brightness; // G
                    data[i + 2] += brightness; // B
                    
                    // Aplicar contraste
                    data[i] = factor * (data[i] - 128) + 128;
                    data[i + 1] = factor * (data[i + 1] - 128) + 128;
                    data[i + 2] = factor * (data[i + 2] - 128) + 128;
                    
                    // Convertir a escala de grises
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    data[i] = data[i + 1] = data[i + 2] = gray;
                }
                
                // Aplicar datos procesados
                ctx.putImageData(imageData, 0, 0);
                
                // Devolver imagen procesada
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageData;
        });
    }

    showToast(message, isError = false) {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = isError ? 'toast error' : 'toast success';
        toast.textContent = message;
        
        // Estilos inline para asegurar visibilidad si falta CSS
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '4px';
        toast.style.color = 'white';
        toast.style.fontWeight = '500';
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.3s ease';
        toast.style.opacity = '0';
        toast.style.backgroundColor = isError ? '#e74c3c' : '#2ecc71';
        toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

        document.body.appendChild(toast);

        // Mostrar
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        // Ocultar y eliminar
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    showModal(title, message, type = 'info') {
        console.log('ℹ️ showModal llamado:', title, message);
        
        // Eliminar overlays previos
        const existingOverlay = document.querySelector('.modal-overlay-generic');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay-generic';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '2000000'; // Z-index superior a todo
        overlay.style.backdropFilter = 'blur(2px)';
        
        const modal = document.createElement('div');
        modal.className = 'modal-generic';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '30px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        modal.style.maxWidth = '500px';
        modal.style.width = '90%';
        modal.style.textAlign = 'center';
        modal.style.position = 'relative';
        modal.style.zIndex = '2000001';
        
        const iconMap = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colorMap = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        modal.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">${iconMap[type] || iconMap.info}</div>
            <h3 style="margin: 0 0 15px 0; color: ${colorMap[type] || colorMap.info}; font-size: 24px; font-weight: bold;">${title}</h3>
            <p style="margin: 0 0 25px 0; color: #333; font-size: 16px; line-height: 1.5;">${message}</p>
        `;
        
        const btnClose = document.createElement('button');
        btnClose.textContent = 'Aceptar';
        btnClose.style.cssText = `background: ${colorMap[type] || colorMap.info}; color: white; border: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;
        
        modal.appendChild(btnClose);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Cerrar modal
        const closeModal = () => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(overlay)) {
                    document.body.removeChild(overlay);
                }
            }, 300);
        };
        
        btnClose.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) closeModal();
        };
        
        // Animación de entrada
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease-out';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    showConfirm(title, message, onConfirm, confirmText = '✓ Aceptar', cancelText = '✗ Cancelar') {
        console.log('🔔 showConfirm llamado:', title, message);
        
        // Eliminar cualquier overlay previo para evitar duplicados
        const existingOverlay = document.querySelector('.modal-overlay-confirm');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay-confirm';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '999999';
        overlay.style.backdropFilter = 'blur(2px)';
        
        // Crear modal container
        const modal = document.createElement('div');
        modal.className = 'modal-confirm';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '30px';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        modal.style.maxWidth = '500px';
        modal.style.width = '90%';
        modal.style.textAlign = 'center';
        modal.style.position = 'relative';
        modal.style.zIndex = '1000000';
        
        // Contenido del modal (Icono, Título, Mensaje)
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h3 style="margin: 0 0 15px 0; color: #f39c12; font-size: 24px; font-weight: bold;">${title}</h3>
            <p style="margin: 0 0 25px 0; color: #333; font-size: 16px; line-height: 1.5;">${message}</p>
        `;
        modal.appendChild(contentDiv);

        // Contenedor de botones
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '15px';
        btnContainer.style.justifyContent = 'center';

        // Botón Confirmar
        const btnConfirm = document.createElement('button');
        btnConfirm.textContent = confirmText;
        btnConfirm.style.cssText = "background: #e74c3c; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.2);";
        
        // Botón Cancelar
        const btnCancel = document.createElement('button');
        btnCancel.textContent = cancelText;
        btnCancel.style.cssText = "background: #95a5a6; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600; box-shadow: 0 2px 5px rgba(0,0,0,0.2);";

        // Función de cierre
        const closeModal = () => {
            // Eliminar inmediatamente para evitar conflictos visuales
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        };

        // Asignar eventos DIRECTAMENTE a los elementos (sin IDs ni selectores)
        btnConfirm.onclick = (e) => {
            console.log('✅ Botón Confirmar clickeado');
            e.preventDefault();
            e.stopPropagation();
            closeModal();
            if (onConfirm) {
                console.log('🔄 Ejecutando callback onConfirm...');
                onConfirm();
            }
        };

        btnCancel.onclick = (e) => {
            console.log('❌ Botón Cancelar clickeado');
            e.preventDefault();
            e.stopPropagation();
            closeModal();
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                console.log('🌑 Overlay clickeado');
                closeModal();
            }
        };

        // Armar el DOM
        btnContainer.appendChild(btnConfirm);
        btnContainer.appendChild(btnCancel);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Animación de entrada
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease-out';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
    }

    renderCompras_OLD_6915() {
        // Poblar datalist de proveedores para autocomplete
        const datalist = document.getElementById('datalistProveedores');
        if (datalist) {
            datalist.innerHTML = this.db.proveedores
                .map(p => `<option value="${p.nombreFiscal}">${p.nombreComercial ? `(${p.nombreComercial})` : ''}</option>`)
                .join('');
        }

        let facturas = this.db.getByPeriod('facturas', this.currentPeriod);
        let albaranes = this.db.getByPeriod('albaranes', this.currentPeriod);

        // Aplicar filtros si existen
        if (this.currentFilters) {
            const { proveedor, desde, hasta } = this.currentFilters;
            
            if (proveedor) {
                facturas = facturas.filter(f => f.proveedor.toLowerCase().includes(proveedor));
                albaranes = albaranes.filter(a => a.proveedor.toLowerCase().includes(proveedor));
            }
            
            if (desde) {
                const fechaDesde = desde.includes('-') ? desde : new Date(desde).toISOString().split('T')[0];
                facturas = facturas.filter(f => {
                    const fechaFactura = f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0];
                    return fechaFactura >= fechaDesde;
                });
                albaranes = albaranes.filter(a => {
                    const fechaAlbaran = a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0];
                    return fechaAlbaran >= fechaDesde;
                });
            }
            
            if (hasta) {
                const fechaHasta = hasta.includes('-') ? hasta : new Date(hasta).toISOString().split('T')[0];
                facturas = facturas.filter(f => {
                    const fechaFactura = f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0];
                    return fechaFactura <= fechaHasta;
                });
                albaranes = albaranes.filter(a => {
                    const fechaAlbaran = a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0];
                    return fechaAlbaran <= fechaHasta;
                });
            }
        }

        const facturasHtml = facturas.length > 0 ? facturas.reverse().map(f => `
            <div class="list-item" id="row-facturas-${f.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${f.proveedor} - ${f.numeroFactura}</span>
                    <span class="list-item-value">${f.total.toFixed(2)}€</span>
                </div>
                <div class="list-item-details">
                    📅 ${f.fecha} | 🏷️ ${f.categoria}
                </div>
                <div class="list-item-actions">
                    ${f.archivoData ? `<button class="btn-view" onclick="window.app.verArchivoFactura(${f.id})" title="Ver archivo">🔍</button>` : ''}
                    <button class="btn-verify-factura" onclick="window.app.verificarFacturaAlbaranes(${f.id})" title="Verificar albaranes">📋</button>
                    <button class="btn-edit" onclick="window.app.editItem('facturas', ${f.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('facturas', ${f.id})" title="Eliminar">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay facturas registradas</p>';
        
        document.getElementById('listaFacturas').innerHTML = facturasHtml;

        const albaranesHtml = albaranes.length > 0 ? albaranes.reverse().map(a => `
            <div class="list-item" id="row-albaranes-${a.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${a.proveedor} - ${a.numeroAlbaran}</span>
                    <span class="list-item-value">${a.verificado ? '✅' : '⏳'}</span>
                </div>
                <div class="list-item-details">
                    📅 ${a.fecha}
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="window.app.editItem('albaranes', ${a.id})">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('albaranes', ${a.id})">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay albaranes registradas</p>';
        
        document.getElementById('listaAlbaranes').innerHTML = albaranesHtml;
    }

    renderProveedores_OLD_7000() {
        const proveedores = this.db.proveedores;
        
        const html = proveedores.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Nombre Comercial</th>
                        <th>Razón Social</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${proveedores.map(p => `
                    <tr id="row-proveedores-${p.id}">
                        <td>${p.nombreComercial || '-'}</td>
                        <td>${p.nombreFiscal || p.nombre || '-'}</td>
                        <td>${p.contacto || '-'}</td>
                        <td>${p.telefono || '-'}</td>
                        <td>${p.email || '-'}</td>
                        <td><span class="badge badge-${(p.estado || 'Activo').toLowerCase()}">${p.estado || 'Activo'}</span></td>
                        <td class="actions-cell">
                            <button class="btn-icon" onclick="window.app.editItem('proveedores', ${p.id})" title="Editar">✏️</button>
                            <button class="btn-icon delete" onclick="window.app.deleteItem('proveedores', ${p.id})" title="Eliminar">🗑️</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay proveedores registrados</p>';
        
        const contenedor = document.getElementById('listaProveedores');
        if (contenedor) {
            contenedor.innerHTML = html;
        }
        
        // Actualizar dropdown de productos
        const selectProveedor = document.getElementById('productoProveedorId');
        if (selectProveedor) {
            const options = proveedores.map(p => 
                `<option value="${p.id}">${p.nombreFiscal || p.nombre}</option>`
            ).join('');
            selectProveedor.innerHTML = '<option value="">Seleccionar...</option>' + options;
        }
    }

    renderInlineEditForm(collection, item) {
        try {
            const schemas = this.getCollectionSchemas();
            const schema = schemas[collection];
            
            if (!schema) {
                console.warn(`No schema found for collection: ${collection}`);
                return '<div class="error-message">No se puede editar este elemento (esquema no definido)</div>';
            }

            let fieldsHtml = '';
            
            Object.entries(schema).forEach(([key, config]) => {
                if (config.hidden) return;
                
                let inputHtml = '';
                const value = item[key] !== undefined ? item[key] : (config.default || '');
                const isReadOnly = config.readOnly ? 'disabled' : '';
                const readOnlyClass = config.readOnly ? 'readonly-field' : '';
                const labelStyle = config.readOnly ? 'color: #95a5a6;' : '';
                
                if (config.type === 'select') {
                    const options = (config.options || []).map(opt => 
                        `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('');
                    inputHtml = `<select name="${key}" class="form-select ${readOnlyClass}" ${isReadOnly}>${options}</select>`;
                } else if (config.type === 'number') {
                    inputHtml = `<input type="number" name="${key}" value="${value}" step="${config.step || 'any'}" class="inline-input ${readOnlyClass}" ${isReadOnly}>`;
                } else if (config.type === 'date') {
                    inputHtml = `<input type="date" name="${key}" value="${value}" class="inline-input ${readOnlyClass}" ${isReadOnly}>`;
                } else if (config.type === 'time') {
                    inputHtml = `<input type="time" name="${key}" value="${value}" class="inline-input ${readOnlyClass}" ${isReadOnly}>`;
                } else {
                    inputHtml = `<input type="text" name="${key}" value="${value}" class="inline-input ${readOnlyClass}" ${isReadOnly}>`;
                }
                
                fieldsHtml += `
                    <div class="inline-field">
                        <label style="${labelStyle}">${config.label}</label>
                        ${inputHtml}
                    </div>
                `;
            });

            return `
                <div class="inline-edit-form">
                    <div class="inline-fields-grid">
                        ${fieldsHtml}
                    </div>
                    <div class="inline-actions">
                        <button class="btn-save" onclick="window.app.saveInlineEdit('${collection}', ${item.id})">💾 Guardar</button>
                        <button class="btn-cancel" onclick="window.app.cancelInlineEdit('${collection}', ${item.id})">❌ Cancelar</button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering inline edit form:', error);
            return `<div class="error-message">Error al renderizar formulario: ${error.message}</div>`;
        }
    }

    saveInlineEdit(collection, id) {
        const row = document.getElementById(`row-${collection}-${id}`);
        if (!row) return;
        
        const schema = this.getCollectionSchemas()[collection];
        const inputs = row.querySelectorAll('input, select');
        const updates = {};
        
        inputs.forEach(input => {
            // Skip if disabled (read-only)
            if (input.disabled) return;

            const key = input.name;
            let value = input.value;
            
            if (input.type === 'number') {
                value = parseFloat(value);
                if (isNaN(value)) value = 0;
            }
            
            updates[key] = value;
        });
        
        // Validaciones básicas
        if (collection === 'facturas' || collection === 'albaranes') {
            if (updates.proveedor === '') {
                alert('El proveedor es obligatorio');
                return;
            }
        }
        
        this.db.update(collection, id, updates);
        
        // Recargar vista
        if (collection === 'facturas' || collection === 'albaranes') {
            this.renderCompras();
        } else if (collection === 'proveedores') {
            this.renderProveedores();
        } else if (collection === 'productos') {
            this.renderProductos();
        } else if (collection === 'escandallos') {
            this.renderEscandallos();
        } else if (collection === 'inventarios') {
            this.renderInventarios();
        // } else if (collection === 'delivery') {
        //    this.renderDelivery();
        }
    }

    cancelInlineEdit(collection, id) {
        // Simplemente recargar la vista para restaurar el elemento original
        if (collection === 'facturas' || collection === 'albaranes') {
            this.renderCompras();
        } else if (collection === 'proveedores') {
            this.renderProveedores();
        } else if (collection === 'productos') {
            this.renderProductos();
        } else if (collection === 'escandallos') {
            this.renderEscandallos();
        }
    }

    renderProductos_OLD_7174() {
        const productos = this.db.productos;
        const html = productos.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Proveedor</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => {
                        const precio = p.precioPromedioNeto || p.precio || 0;
                        const stock = p.stockActualUnidades || 0;
                        const unidad = p.unidadBase || 'ud';
                        const proveedor = p.proveedorNombre || p.proveedor || 'Sin proveedor';
                        
                        let empaqueInfo = '';
                        if (p.esEmpaquetado && p.unidadesPorEmpaque) {
                            const numEmpaques = (stock / p.unidadesPorEmpaque).toFixed(2);
                            empaqueInfo = `<br><small class="text-muted">📦 ${numEmpaques} ${p.tipoEmpaque}s</small>`;
                        }

                        return `
                        <tr id="row-productos-${p.id}">
                            <td>${p.nombre}</td>
                            <td>${precio.toFixed(2)} €/${unidad}</td>
                            <td>${proveedor}</td>
                            <td>${stock.toFixed(2)} ${unidad}${empaqueInfo}</td>
                            <td class="actions-cell">
                                <button class="btn-icon" onclick="window.app.editItem('productos', ${p.id})" title="Editar">✏️</button>
                                <button class="btn-icon delete" onclick="window.app.deleteItem('productos', ${p.id})" title="Eliminar">🗑️</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay productos en el catálogo</p>';
        
        document.getElementById('listaProductos').innerHTML = html;
    }

    renderInventarios_OLD_7221() {
        const inventarios = this.db.inventarios;
        const html = inventarios.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Familia</th>
                        <th>Productos</th>
                        <th>Valor Diferencia</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventarios.reverse().map(i => {
                        const numProductos = i.productos ? i.productos.length : 0;
                        const valorTotal = i.productos ? i.productos.reduce((sum, p) => sum + p.valorDiferencia, 0) : 0;
                        const colorClass = Math.abs(valorTotal) > 50 ? 'color: #e74c3c; font-weight: bold;' : '';
                        
                        return `
                        <tr id="row-inventarios-${i.id}">
                            <td>${i.fecha}</td>
                            <td>${i.familia}</td>
                            <td>${numProductos}</td>
                            <td style="${colorClass}">${valorTotal.toFixed(2)} €</td>
                            <td class="actions-cell">
                                <button class="btn-icon" onclick="window.app.editItem('inventarios', ${i.id})" title="Editar">✏️</button>
                                <button class="btn-icon delete" onclick="window.app.deleteItem('inventarios', ${i.id})" title="Eliminar">🗑️</button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay inventarios realizados</p>';
        
        document.getElementById('listaInventarios').innerHTML = html;
    }

    renderDelivery_OLD_7261() {
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const html = delivery.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Plataforma</th>
                        <th>Ventas Brutas</th>
                        <th>Comisión</th>
                        <th>Ingreso Neto</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${delivery.reverse().map(d => `
                    <tr id="row-delivery-${d.id}">
                        <td>${d.fecha}</td>
                        <td>${d.plataforma}</td>
                        <td>${d.ventasBrutas.toFixed(2)} €</td>
                        <td>${d.comisionPorcentaje}% (${d.comisionImporte.toFixed(2)} €)</td>
                        <td><strong>${d.ingresoNeto.toFixed(2)} €</strong></td>
                        <td class="actions-cell">
                            <button class="btn-icon" onclick="window.app.editItem('delivery', ${d.id})" title="Editar">✏️</button>
                            <button class="btn-icon delete" onclick="window.app.deleteItem('delivery', ${d.id})" title="Eliminar">🗑️</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay pedidos registrados</p>';
        
        document.getElementById('listaDelivery').innerHTML = html;
    }

    async renderRecentDocuments() {
        const container = document.getElementById('recentDocsContainer');
        if (!container) return;

        container.innerHTML = '<p style="text-align:center; color:#64748b;">Cargando documentos...</p>';

        // 1. Recopilar documentos (Local)
        let allDocs = [];
        
        const collectDocs = (source, type, dateField, amountField, nameField) => {
            if (source) {
                source.forEach(doc => {
                    if (doc.ocrProcessed) {
                        allDocs.push({
                            ...doc,
                            type: type,
                            displayDate: doc[dateField] || doc.fecha,
                            displayAmount: doc[amountField] || doc.total,
                            displayName: doc[nameField] || doc.proveedor || 'Desconocido'
                        });
                    }
                });
            }
        };

        collectDocs(this.db.facturas, 'Factura', 'fechaFactura', 'totalFactura', 'proveedorNombre');
        collectDocs(this.db.albaranes, 'Albarán', 'fechaAlbaran', 'totalAlbaran', 'proveedorNombre');
        collectDocs(this.db.cierres, 'Cierre', 'fecha', 'totalReal', 'turno');
        collectDocs(this.db.delivery, 'Delivery', 'fecha', 'ventasBrutas', 'plataforma');

        // 2. Si no hay locales, intentar Firebase
        if (allDocs.length === 0 && this.db.cloudService) {
            try {
                console.log('☁️ Buscando documentos recientes en Firebase...');
                const [facturas, albaranes, cierres, delivery] = await Promise.all([
                    this.db.cloudService.getAll('facturas'),
                    this.db.cloudService.getAll('albaranes'),
                    this.db.cloudService.getAll('cierres'),
                    this.db.cloudService.getAll('delivery')
                ]);

                // Actualizar local DB (opcional, pero útil)
                if(facturas.length) this.db.facturas = facturas;
                if(albaranes.length) this.db.albaranes = albaranes;
                if(cierres.length) this.db.cierres = cierres;
                if(delivery.length) this.db.delivery = delivery;

                // Recolectar de nuevo
                collectDocs(facturas, 'Factura', 'fechaFactura', 'totalFactura', 'proveedorNombre');
                collectDocs(albaranes, 'Albarán', 'fechaAlbaran', 'totalAlbaran', 'proveedorNombre');
                collectDocs(cierres, 'Cierre', 'fecha', 'totalReal', 'turno');
                collectDocs(delivery, 'Delivery', 'fecha', 'ventasBrutas', 'plataforma');
                
            } catch (e) {
                console.error('Error fetching from Firebase:', e);
            }
        }

        // 3. Ordenar y Renderizar
        container.innerHTML = '';
        
        if (allDocs.length === 0) {
            container.innerHTML = '<p style="color: #94a3b8; font-size: 13px; text-align: center; padding: 10px;">No hay documentos escaneados recientemente.</p>';
            return;
        }

        allDocs.sort((a, b) => b.id - a.id);
        const recentDocs = allDocs.slice(0, 5);

        recentDocs.forEach(doc => {
            const date = new Date(doc.id);
            const timeStr = !isNaN(date.getTime()) ? date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
            const dateStr = !isNaN(date.getTime()) ? date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : (doc.displayDate || '');
            
            const item = document.createElement('div');
            item.className = 'recent-doc-item';
            item.style.cssText = 'display: flex; align-items: center; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;';
            
            let icon = '📄';
            let collectionName = '';
            if (doc.type === 'Factura') { icon = '🧾'; collectionName = 'facturas'; }
            if (doc.type === 'Albarán') { icon = '📦'; collectionName = 'albaranes'; }
            if (doc.type === 'Cierre') { icon = '💰'; collectionName = 'cierres'; }
            if (doc.type === 'Delivery') { icon = '🛵'; collectionName = 'delivery'; }

            item.innerHTML = `
                <div style="font-size: 20px; margin-right: 12px;">${icon}</div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span style="font-weight: 600; color: #334155; font-size: 14px;">${doc.type}</span>
                        <span style="font-size: 12px; color: #64748b;">${dateStr} ${timeStr}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 13px; color: #475569;">${doc.displayName}</span>
                        <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${parseFloat(doc.displayAmount || 0).toFixed(2)} €</span>
                    </div>
                </div>
                <div style="display: flex; gap: 5px; margin-left: 10px;">
                    <button class="btn-edit" onclick="window.app.editItem('${collectionName}', ${doc.id})" title="Editar" style="padding: 4px 8px; font-size: 14px; background: none; border: none; cursor: pointer;">✏️</button>
                    <button class="btn-delete" onclick="window.app.deleteItem('${collectionName}', ${doc.id})" title="Eliminar" style="padding: 4px 8px; font-size: 14px; background: none; border: none; cursor: pointer;">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    handleProveedorSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const proveedor = {
            nombreComercial: document.getElementById('proveedorNombreComercial').value,
            nombreFiscal: document.getElementById('proveedorRazonSocial').value,
            nifCif: document.getElementById('proveedorNifCif').value,
            personaContacto: document.getElementById('proveedorPersonaContacto').value,
            telefono: document.getElementById('proveedorTelefono').value,
            email: document.getElementById('proveedorEmail').value,
            web: document.getElementById('proveedorWeb').value,
            direccionFiscal: document.getElementById('proveedorDireccionFiscal').value,
            direccionEnvio: document.getElementById('proveedorDireccionEnvioHabitual').value,
            codigoPostal: document.getElementById('proveedorCodigoPostal').value,
            ciudad: document.getElementById('proveedorCiudad').value,
            pais: document.getElementById('proveedorPais').value,
            metodoPago: document.getElementById('proveedorMetodoPagoPreferido').value,
            plazoPagoDias: parseInt(document.getElementById('proveedorPlazoPagoDias').value) || 0,
            descuento: parseFloat(document.getElementById('proveedorDescuentoAcordadoPorcentaje').value) || 0,
            iban: document.getElementById('proveedorIban').value,
            banco: document.getElementById('proveedorBanco').value,
            categoria: document.getElementById('proveedorCategoriaPrincipalCompra').value,
            subcategorias: document.getElementById('proveedorSubcategoriasCompra').value,
            notasCondiciones: document.getElementById('proveedorNotasCondiciones').value,
            notasInternas: document.getElementById('proveedorNotasInternas').value,
            estado: document.getElementById('proveedorEstado').value,
            fechaAlta: document.getElementById('proveedorFechaAlta').value || new Date().toISOString().split('T')[0]
        };

        if (form.dataset.editId) {
            proveedor.id = parseInt(form.dataset.editId);
            this.db.update('proveedores', proveedor.id, proveedor);
            this.showToast('✓ Proveedor actualizado correctamente');
            delete form.dataset.editId;
        } else {
            this.db.add('proveedores', proveedor);
            this.showToast('✓ Proveedor guardado correctamente');
        }
        
        form.reset();
        this.toggleForm('proveedor');
        this.render();
    }

    handleProductoSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const producto = {
            nombre: document.getElementById('productoNombre').value,
            proveedorId: this.proveedorDropdown && this.proveedorDropdown.getValue() ? parseInt(this.proveedorDropdown.getValue()) : null,
            precioPromedioNeto: parseFloat(document.getElementById('productoPrecio').value),
            unidadBase: document.getElementById('productoUnidadBase').value,
            esEmpaquetado: document.getElementById('productoEsEmpaquetado').value === 'true',
            tipoEmpaque: document.getElementById('productoTipoEmpaque').value,
            unidadesPorEmpaque: parseFloat(document.getElementById('productoUnidadesPorEmpaque').value) || 0,
            stockActualUnidades: parseFloat(document.getElementById('productoStockActual').value) || 0,
            fechaModificacion: new Date().toISOString()
        };

        if (producto.proveedorId) {
            const prov = this.db.proveedores.find(p => p.id === producto.proveedorId);
            if (prov) producto.proveedorNombre = prov.nombreFiscal || prov.nombre;
        }

        if (form.dataset.editId) {
            producto.id = parseInt(form.dataset.editId);
            this.db.update('productos', producto.id, producto);
            this.showToast('✓ Producto actualizado correctamente');
            delete form.dataset.editId;
        } else {
            this.db.add('productos', producto);
            this.showToast('✓ Producto guardado correctamente');
        }
        
        form.reset();
        this.toggleForm('producto');
        this.render();
    }

    handleInventarioSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const familia = document.getElementById('inventarioFamilia').value;
        const fecha = document.getElementById('inventarioFecha').value;

        // 1. Identificar productos en el alcance (Familia seleccionada)
        let productsInScope = this.db.productos;
        if (familia && familia !== 'Todo') {
            productsInScope = productsInScope.filter(p => p.familia === familia);
        }

        // 2. Construir detalle del inventario
        const productosDetalle = productsInScope.map(p => {
            const stockTeorico = p.stockActualUnidades || 0;
            // Si no se ha contado, asumimos 0 (o podríamos dejarlo como null si quisiéramos distinguir)
            // Aquí asumimos que si finaliza el inventario, lo no contado es 0.
            const stockReal = this.inventarioState.counts[p.id] !== undefined ? this.inventarioState.counts[p.id] : 0;
            const diferencia = stockReal - stockTeorico;
            const valorDiferencia = diferencia * (p.precioPromedioNeto || 0);

            return {
                id: p.id,
                nombre: p.nombre,
                unidad: p.unidadBase,
                stockTeorico: stockTeorico,
                stockReal: stockReal,
                diferencia: diferencia,
                valorDiferencia: valorDiferencia,
                precio: p.precioPromedioNeto || 0
            };
        });

        const inventario = {
            fecha: fecha,
            familia: familia,
            productos: productosDetalle, 
            fechaCreacion: new Date().toISOString()
        };
        
        if (form.dataset.editId) {
            inventario.id = parseInt(form.dataset.editId);
            this.db.update('inventarios', inventario.id, inventario);
            this.showToast('✓ Inventario actualizado');
            delete form.dataset.editId;
        } else {
            // Generar ID si es nuevo
            inventario.id = Date.now();
            this.db.add('inventarios', inventario);
            this.showToast('✓ Inventario guardado');
        }
        
        // Resetear estado del inventario
        this.inventarioState = {
            step: 1,
            counts: {},
            currentProduct: null
        };

        form.reset();
        this.collapseForm('inventario');
        this.render();
    }

    handleDeliverySubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const ventas = parseFloat(document.getElementById('deliveryVentas').value) || 0;
        const comisionPct = parseFloat(document.getElementById('deliveryComision').value) || 0;
        const comisionImporte = ventas * (comisionPct / 100);
        
        const delivery = {
            plataforma: document.getElementById('deliveryPlataforma').value,
            fecha: document.getElementById('deliveryFecha').value,
            ventasBrutas: ventas,
            comisionPorcentaje: comisionPct,
            comisionImporte: comisionImporte,
            ingresoNeto: ventas - comisionImporte
        };

        if (form.dataset.editId) {
            delivery.id = parseInt(form.dataset.editId);
            this.db.update('delivery', delivery.id, delivery);
            this.showToast('✓ Registro actualizado');
            delete form.dataset.editId;
        } else {
            this.db.add('delivery', delivery);
            this.showToast('✓ Registro guardado');
        }
        
        form.reset();
        this.expandForm('delivery');
        this.render();
    }

    handleEscandalloSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        // Recopilar ingredientes
        const ingredientes = [];
        document.querySelectorAll('.ingrediente-item').forEach(item => {
            // Intentar obtener ID desde Smart Dropdown o Select estándar
            let productoId = null;
            const hiddenInput = item.querySelector('.smart-dropdown-value');
            if (hiddenInput && hiddenInput.value) {
                productoId = parseInt(hiddenInput.value);
            } else {
                const select = item.querySelector('.ingrediente-producto');
                if (select && select.value) {
                    productoId = parseInt(select.value);
                }
            }
            
            if (productoId) {
                ingredientes.push({
                    productoId: productoId,
                    cantidad: parseFloat(item.querySelector('.ingrediente-cantidad').value),
                    unidad: item.querySelector('.ingrediente-unidad').value,
                    costeUnitario: parseFloat(item.querySelector('.ingrediente-coste-unitario').value),
                    costeTotal: parseFloat(item.querySelector('.ingrediente-coste-total').value)
                });
            }
        });

        const escandallo = {
            nombre: document.getElementById('escandalloNombre').value,
            codigo: document.getElementById('escandalloCodigo').value,
            pvpConIva: parseFloat(document.getElementById('escandalloPVPConIVA').value),
            tipoIva: parseFloat(document.getElementById('escandalloTipoIVA').value),
            pvpNeto: parseFloat(document.getElementById('escandalloPVPNeto').value),
            costeTotalNeto: parseFloat(document.getElementById('escandalloCosteTotalNeto').value),
            foodCost: parseFloat(document.getElementById('escandalloFC').value),
            margenPorcentaje: parseFloat(document.getElementById('escandalloMargen').value),
            margenBruto: parseFloat(document.getElementById('escandalloPVPNeto').value) - parseFloat(document.getElementById('escandalloCosteTotalNeto').value),
            ingredientes: ingredientes,
            notas: document.getElementById('escandalloNotas').value,
            fecha: new Date().toISOString().split('T')[0]
        };

        this.guardarEscandallo(escandallo, form.dataset.editId ? parseInt(form.dataset.editId) : null);
    }

    abrirModalEditarEscandallo(id) {
        const escandallo = this.db.escandallos.find(e => e.id === id);
        if (!escandallo) return;

        this.expandForm('escandallo');
        
        document.getElementById('escandalloNombre').value = escandallo.nombre;
        document.getElementById('escandalloCodigo').value = escandallo.codigo || '';
        document.getElementById('escandalloPVPConIVA').value = escandallo.pvpConIva;
        document.getElementById('escandalloTipoIVA').value = escandallo.tipoIva;
        document.getElementById('escandalloPVPNeto').value = escandallo.pvpNeto;
        document.getElementById('escandalloCosteTotalNeto').value = escandallo.costeTotalNeto;
        document.getElementById('escandalloFC').value = escandallo.foodCost;
        document.getElementById('escandalloMargen').value = escandallo.margenPorcentaje;
        document.getElementById('escandalloNotas').value = escandallo.notas || '';

        // Limpiar y llenar ingredientes
        const container = document.getElementById('ingredientesContainer');
        container.innerHTML = '';
        
        if (escandallo.ingredientes) {
            escandallo.ingredientes.forEach(ing => {
                this.addIngredienteRow();
                // Llenar la última fila añadida
                const rows = container.querySelectorAll('.ingrediente-item');
                const lastRow = rows[rows.length - 1];
                
                if (lastRow.dropdown) {
                    lastRow.dropdown.setValue(ing.productoId);
                }
                lastRow.querySelector('.ingrediente-cantidad').value = ing.cantidad;
                lastRow.querySelector('.ingrediente-unidad').value = ing.unidad;
                lastRow.querySelector('.ingrediente-coste-unitario').value = ing.costeUnitario;
                lastRow.querySelector('.ingrediente-coste-total').value = ing.costeTotal;
            });
        }

        const form = document.getElementById('escandalloForm');
        form.dataset.editId = escandallo.id;
        
        // Cambiar texto del botón
        const btn = document.querySelector('#escandalloForm button[type="submit"]');
        if(btn) btn.textContent = '✓ Actualizar Escandallo';
    }

    // ══════════════════════════════════════════════════════════════
    // UI HELPERS - SMART DROPDOWNS
    // ══════════════════════════════════════════════════════════════

    createSmartDropdown(containerId, options, onSelect, onCreateNew, placeholder = 'Seleccionar...') {
        const container = document.getElementById(containerId);
        if (!container) return null;

        container.innerHTML = '';
        container.className = 'smart-dropdown-container';

        // Input de búsqueda
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'smart-dropdown-input';
        input.placeholder = placeholder;
        input.autocomplete = 'off';

        // Lista de opciones
        const list = document.createElement('div');
        list.className = 'smart-dropdown-list';
        list.style.display = 'none';

        // Hidden input para el valor real (ID)
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.className = 'smart-dropdown-value';
        hiddenInput.name = containerId + '_value';

        container.appendChild(input);
        container.appendChild(hiddenInput);
        container.appendChild(list);

        let selectedOption = null;

        // Renderizar lista
        const renderList = (filterText = '') => {
            list.innerHTML = '';
            const filtered = options.filter(opt => 
                opt.label.toLowerCase().includes(filterText.toLowerCase())
            );

            if (filtered.length === 0) {
                if (onCreateNew && filterText.length > 0) {
                    const createItem = document.createElement('div');
                    createItem.className = 'smart-dropdown-item create-new';
                    createItem.textContent = `+ Crear "${filterText}"`;
                    createItem.onclick = (e) => {
                        e.preventDefault();
                        onCreateNew(filterText);
                        closeList();
                    };
                    createItem.onmousedown = (e) => e.preventDefault();
                    list.appendChild(createItem);
                } else {
                    const noResults = document.createElement('div');
                    noResults.className = 'smart-dropdown-item disabled';
                    noResults.textContent = 'No hay resultados';
                    list.appendChild(noResults);
                }
            } else {
                filtered.forEach(opt => {
                    const item = document.createElement('div');
                    item.className = 'smart-dropdown-item';
                    if (selectedOption && selectedOption.id === opt.id) {
                        item.classList.add('selected');
                    }
                    item.textContent = opt.label;
                    
                    item.onmousedown = (e) => {
                        e.preventDefault();
                        selectOption(opt);
                    };
                    
                    list.appendChild(item);
                });
            }
        };

        const selectOption = (opt) => {
            selectedOption = opt;
            input.value = opt.label;
            hiddenInput.value = opt.id;
            list.style.display = 'none';
            if (onSelect) onSelect(opt.id);
        };

        const openList = () => {
            list.style.display = 'block';
            renderList(input.value);
        };

        const closeList = () => {
            setTimeout(() => {
                list.style.display = 'none';
                if (selectedOption && input.value !== selectedOption.label) {
                    input.value = selectedOption.label;
                } else if (!selectedOption) {
                    input.value = '';
                }
            }, 200);
        };

        input.addEventListener('focus', openList);
        input.addEventListener('input', (e) => {
            list.style.display = 'block';
            renderList(e.target.value);
            if (e.target.value === '') {
                selectedOption = null;
                hiddenInput.value = '';
            }
        });
        input.addEventListener('blur', closeList);

        return {
            getValue: () => hiddenInput.value,
            setValue: (id) => {
                const opt = options.find(o => o.id === id);
                if (opt) {
                    selectOption(opt);
                } else {
                    selectedOption = null;
                    input.value = '';
                    hiddenInput.value = '';
                }
            },
            updateOptions: (newOptions) => {
                options = newOptions;
            }
        };
    }

    updateSmartDropdowns(type) {
        if (type === 'producto') {
            const container = document.getElementById('productoProveedorDropdown');
            if (container) {
                const options = this.db.proveedores.map(p => ({
                    id: p.id,
                    label: p.nombreFiscal || p.nombre
                }));
                
                this.proveedorDropdown = this.createSmartDropdown(
                    'productoProveedorDropdown',
                    options,
                    (id) => console.log('Proveedor seleccionado:', id),
                    (text) => {
                        this.toggleForm('proveedor');
                        const nombreInput = document.getElementById('proveedorNombre');
                        if (nombreInput) nombreInput.value = text;
                    },
                    'Buscar proveedor...'
                );
                
                // Si estamos editando, establecer valor inicial
                const form = document.getElementById('productoForm');
                if (form && form.dataset.editId) {
                    const prodId = parseInt(form.dataset.editId);
                    const prod = this.db.productos.find(p => p.id === prodId);
                    if (prod && prod.proveedorId && this.proveedorDropdown) {
                        this.proveedorDropdown.setValue(prod.proveedorId);
                    }
                }
            }
        }
    }

    // --- OVERRIDES FOR TABLE LAYOUT & SORTING ---

    renderEscandallos() {
        let escandallos = this.db.escandallos;
        escandallos = this.sortData(escandallos, 'escandallos');

        const html = escandallos.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('escandallos', 'nombre')" style="cursor:pointer">Nombre${this.getSortIndicator('escandallos', 'nombre')}</th>
                        <th onclick="window.app.handleSort('escandallos', 'pvpConIva')" style="cursor:pointer">PVP (IVA inc.)${this.getSortIndicator('escandallos', 'pvpConIva')}</th>
                        <th onclick="window.app.handleSort('escandallos', 'costeTotalNeto')" style="cursor:pointer">Coste Neto${this.getSortIndicator('escandallos', 'costeTotalNeto')}</th>
                        <th onclick="window.app.handleSort('escandallos', 'foodCost')" style="cursor:pointer">Food Cost %${this.getSortIndicator('escandallos', 'foodCost')}</th>
                        <th onclick="window.app.handleSort('escandallos', 'margenPorcentaje')" style="cursor:pointer">Margen %${this.getSortIndicator('escandallos', 'margenPorcentaje')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${escandallos.map(e => {
                        const fcClass = e.foodCost > 35 ? 'color: #e74c3c; font-weight: bold;' : e.foodCost > 25 ? 'color: #f39c12;' : 'color: #27ae60;';
                        
                        return `
                        <tr id="row-escandallos-${e.id}" onclick="window.app.toggleTableAccordion('preview-escandallo-${e.id}', this)" style="cursor: pointer;">
                            <td>${e.nombre}${e.codigo ? ` <small class="text-muted">(${e.codigo})</small>` : ''}</td>
                            <td>${e.pvpConIva.toFixed(2)} €</td>
                            <td>${e.costeTotalNeto.toFixed(2)} €</td>
                            <td style="${fcClass}">${e.foodCost.toFixed(1)}%</td>
                            <td>${e.margenPorcentaje.toFixed(1)}%</td>
                        </tr>
                        <tr id="preview-escandallo-${e.id}" class="hidden accordion-content-row">
                            <td colspan="5" style="padding: 20px;">
                                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                                        <h4 style="margin: 0; color: #2c3e50;">🥘 Detalle del Escandallo</h4>
                                        <div style="display: flex; gap: 10px;">
                                            <button class="btn-secondary btn-small" onclick="window.app.editItem('escandallos', ${e.id})">✏️ Editar</button>
                                            <button class="btn-danger btn-small" onclick="window.app.deleteItem('escandallos', ${e.id})">🗑️ Eliminar</button>
                                        </div>
                                    </div>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
                                        <thead>
                                            <tr style="background-color: #f1f2f6; color: #555;">
                                                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Ingrediente</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Cantidad</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Coste Unit.</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Coste Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${e.ingredientes ? e.ingredientes.map(ing => {
                                                const prod = this.db.productos.find(p => p.id === ing.productoId);
                                                const nombre = prod ? prod.nombre : 'Producto desconocido';
                                                return `
                                                <tr style="border-bottom: 1px solid #eee;">
                                                    <td style="padding: 10px;">${nombre}</td>
                                                    <td style="text-align: right; padding: 10px;">${ing.cantidad} ${ing.unidad}</td>
                                                    <td style="text-align: right; padding: 10px;">${ing.costeUnitario ? ing.costeUnitario.toFixed(4) : '0.0000'} €</td>
                                                    <td style="text-align: right; padding: 10px;">${ing.costeTotal ? ing.costeTotal.toFixed(2) : '0.00'} €</td>
                                                </tr>`;
                                            }).join('') : '<tr><td colspan="4" style="padding:10px; text-align:center;">Sin ingredientes</td></tr>'}
                                        </tbody>
                                    </table>
                                    ${e.notas ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;"><strong>📝 Notas:</strong> ${e.notas}</div>` : ''}
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay escandallos definidos</p>';
        
        document.getElementById('listaEscandallos').innerHTML = html;
    }

    renderCierres() {
        let cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        
        // Filtro por mes
        const filtroMes = document.getElementById('filtroMesCierres');
        if (filtroMes && filtroMes.value !== 'all') {
            const mes = parseInt(filtroMes.value);
            cierres = cierres.filter(c => {
                const fecha = new Date(c.fecha);
                return fecha.getMonth() === mes;
            });
        }

        cierres = this.sortData(cierres, 'cierres');
        
        if (cierres.length === 0) {
            document.getElementById('listaCierres').innerHTML = '<p class="empty-state">No hay cierres registrados</p>';
            return;
        }

        const html = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('cierres', 'fecha')" style="cursor:pointer">Fecha${this.getSortIndicator('cierres', 'fecha')}</th>
                        <th onclick="window.app.handleSort('cierres', 'turno')" style="cursor:pointer">Turno${this.getSortIndicator('cierres', 'turno')}</th>
                        <th onclick="window.app.handleSort('cierres', 'totalPos')" style="cursor:pointer">Total POS${this.getSortIndicator('cierres', 'totalPos')}</th>
                        <th onclick="window.app.handleSort('cierres', 'totalReal')" style="cursor:pointer">Total Real${this.getSortIndicator('cierres', 'totalReal')}</th>
                        <th onclick="window.app.handleSort('cierres', 'descuadreTotal')" style="cursor:pointer">Descuadre${this.getSortIndicator('cierres', 'descuadreTotal')}</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${cierres.map(c => {
                        // Recalcular valores para asegurar consistencia (especialmente para registros antiguos)
                        const efectivoReal = (c.efectivoContado && c.efectivoContado > 0) ? c.efectivoContado : this.calcularEfectivo(c.desgloseEfectivo);
                        const totalReal = efectivoReal + (c.totalDatafonos || 0) + (c.totalOtrosMedios || 0) + (c.realDelivery || 0);
                        const descuadreTotal = totalReal - (c.totalPos || 0);
                        
                        const descuadreAbs = Math.abs(descuadreTotal);
                        const cuadra = descuadreAbs <= 0.01;
                        const badgeClass = cuadra ? 'badge-cuadra' : 'badge-descuadre';
                        const badgeText = cuadra ? '✅ CUADRA' : `⚠ ${descuadreAbs.toFixed(2)} €`;
                        
                        return `
                        <tr id="row-cierres-${c.id}" onclick="window.app.toggleTableAccordion('preview-cierre-${c.id}', this)" style="cursor: pointer;">
                            <td>${this.formatDate(c.fecha)}</td>
                            <td>${c.turno}</td>
                            <td>${c.totalPos.toFixed(2)} €</td>
                            <td>${totalReal.toFixed(2)} €</td>
                            <td style="color: ${descuadreTotal >= 0 ? 'green' : 'red'}">${descuadreTotal.toFixed(2)} €</td>
                            <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                        </tr>
                        <tr id="preview-cierre-${c.id}" class="hidden accordion-content-row">
                            <td colspan="6" style="padding: 20px;">
                                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                                        <h4 style="margin: 0; color: #2c3e50;">✅ BALANCE CIERRE DE CAJA</h4>
                                        <div style="display: flex; gap: 10px;">
                                            <button class="btn-secondary btn-small" onclick="window.app.abrirModalEditarCierre(${c.id})">✏️ Editar</button>
                                            <button class="btn-danger btn-small" onclick="window.app.deleteItem('cierres', ${c.id})">🗑️ Eliminar</button>
                                        </div>
                                    </div>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
                                        <thead>
                                            <tr style="background-color: #f1f2f6; color: #555;">
                                                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">MÉTODO</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">POS DECLARADO</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">REAL CONTADO</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">DIFERENCIA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <!-- Efectivo -->
                                            <tr style="border-bottom: 1px solid #eee;">
                                                <td style="padding: 10px;">💵 Efectivo</td>
                                                <td style="text-align: right; padding: 10px;">${(c.posEfectivo || 0).toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px;">${efectivoReal.toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px; color: ${(efectivoReal - (c.posEfectivo || 0)) >= 0 ? 'green' : 'red'};">
                                                    ${(efectivoReal - (c.posEfectivo || 0)) > 0 ? '+' : ''}${(efectivoReal - (c.posEfectivo || 0)).toFixed(2)} €
                                                </td>
                                            </tr>
                                            <!-- Tarjetas -->
                                            <tr style="border-bottom: 1px solid #eee;">
                                                <td style="padding: 10px;">💳 Tarjetas</td>
                                                <td style="text-align: right; padding: 10px;">${(c.posTarjetas || 0).toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px;">${(c.totalDatafonos || 0).toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px; color: ${((c.totalDatafonos || 0) - (c.posTarjetas || 0)) >= 0 ? 'green' : 'red'};">
                                                    ${((c.totalDatafonos || 0) - (c.posTarjetas || 0)) > 0 ? '+' : ''}${((c.totalDatafonos || 0) - (c.posTarjetas || 0)).toFixed(2)} €
                                                </td>
                                            </tr>
                                            <!-- Delivery -->
                                            <tr style="border-bottom: 1px solid #eee;">
                                                <td style="padding: 10px;">🛵 Delivery</td>
                                                <td style="text-align: right; padding: 10px;">${(c.posDelivery || 0).toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px;">${(c.realDelivery || 0).toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px; color: ${((c.realDelivery || 0) - (c.posDelivery || 0)) >= 0 ? 'green' : 'red'};">
                                                    ${((c.realDelivery || 0) - (c.posDelivery || 0)) > 0 ? '+' : ''}${((c.realDelivery || 0) - (c.posDelivery || 0)).toFixed(2)} €
                                                </td>
                                            </tr>
                                            <!-- Otros Medios -->
                                            ${(() => {
                                                const posExtras = (c.totalPos || 0) - (c.posEfectivo || 0) - (c.posTarjetas || 0);
                                                const realExtras = (c.totalOtrosMedios || 0);
                                                const diffExtras = realExtras - posExtras;
                                                if (Math.abs(posExtras) > 0.01 || Math.abs(realExtras) > 0.01) {
                                                    return `
                                                    <tr style="border-bottom: 1px solid #eee;">
                                                        <td style="padding: 10px;">📱 Otros (Bizum, etc.)</td>
                                                        <td style="text-align: right; padding: 10px;">${posExtras.toFixed(2)} €</td>
                                                        <td style="text-align: right; padding: 10px;">${realExtras.toFixed(2)} €</td>
                                                        <td style="text-align: right; padding: 10px; color: ${diffExtras >= 0 ? 'green' : 'red'};">
                                                            ${diffExtras > 0 ? '+' : ''}${diffExtras.toFixed(2)} €
                                                        </td>
                                                    </tr>`;
                                                }
                                                return '';
                                            })()}
                                            <!-- TOTAL -->
                                            <tr style="background-color: #eef2f7; font-weight: bold;">
                                                <td style="padding: 10px;">TOTAL</td>
                                                <td style="text-align: right; padding: 10px;">${(c.totalPos || 0).toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px;">${totalReal.toFixed(2)} €</td>
                                                <td style="text-align: right; padding: 10px; color: ${descuadreTotal >= 0 ? '#2980b9' : '#c0392b'};">
                                                    ${descuadreTotal > 0 ? '+' : ''}${descuadreTotal.toFixed(2)} €
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                    ${c.notas ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;"><strong>📝 Notas:</strong> ${c.notas}</div>` : ''}
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

        document.getElementById('listaCierres').innerHTML = html;
    }

    toggleDocumentFilter(event) {
        if (event) event.stopPropagation();
        const options = document.getElementById('documentFilterOptions');
        const trigger = document.querySelector('#documentFilterWrapper .custom-select-trigger');
        if (options) {
            const isHidden = options.classList.contains('hidden');
            
            if (isHidden) {
                // Abrir
                options.classList.remove('hidden');
                if (trigger) trigger.classList.add('active');
                
                // Calcular posición óptima (Arriba o Abajo)
                const rect = trigger.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const dropdownHeight = 250; // Altura máxima estimada
                
                // Si hay poco espacio abajo y más espacio arriba, abrir hacia arriba
                if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                    options.classList.add('open-up');
                } else {
                    options.classList.remove('open-up');
                }
            } else {
                // Cerrar
                options.classList.add('hidden');
                if (trigger) trigger.classList.remove('active');
                options.classList.remove('open-up'); // Resetear posición
            }
        }
    }

    setDocumentFilter(value, text) {
        const hiddenInput = document.getElementById('documentFilter');
        if (hiddenInput) {
            hiddenInput.value = value;
        }
        
        const displayText = document.getElementById('documentFilterText');
        if (displayText) {
            displayText.textContent = text;
        }
        
        this.toggleDocumentFilter();
        this.renderCompras();
    }

    renderCompras() {
        // Poblar datalist de proveedores para autocomplete
        const datalist = document.getElementById('datalistProveedores');
        if (datalist) {
            datalist.innerHTML = this.db.proveedores
                .map(p => `<option value="${p.nombreFiscal}">${p.nombreComercial ? `(${p.nombreComercial})` : ''}</option>`)
                .join('');
        }

        // --- MODO OCR: Lista Unificada de Documentos Escaneados ---
        if (this.currentView === 'ocr') {
            const filter = document.getElementById('documentFilter') ? document.getElementById('documentFilter').value : 'all';
            let allDocs = [];

            // Helper para filtrar solo documentos escaneados (ocrProcessed = true)
            const isScanned = (item) => item.ocrProcessed === true;

            // 1. Facturas
            if (filter === 'all' || filter === 'recent' || filter === 'factura' || filter === 'ticket') {
                let facts = this.db.getByPeriod('facturas', this.currentPeriod).filter(isScanned);
                if (filter === 'ticket') {
                    facts = facts.filter(f => f.categoria && f.categoria.toLowerCase().includes('ticket'));
                }
                allDocs = [...allDocs, ...facts.map(f => ({...f, type: 'factura', label: 'Factura'}))];
            }

            // 2. Albaranes
            if (filter === 'all' || filter === 'recent' || filter === 'albaran') {
                const albs = this.db.getByPeriod('albaranes', this.currentPeriod).filter(isScanned);
                allDocs = [...allDocs, ...albs.map(a => ({...a, type: 'albaran', label: 'Albarán'}))];
            }

            // 3. Cierres
            if (filter === 'all' || filter === 'recent' || filter === 'cierre') {
                const cierres = this.db.getByPeriod('cierres', this.currentPeriod).filter(isScanned);
                allDocs = [...allDocs, ...cierres.map(c => ({...c, type: 'cierre', label: 'Cierre', proveedor: 'Cierre de Caja', total: c.totalReal}))];
            }

            // Ordenar por fecha descendente
            allDocs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            // Si es filtro reciente, limitar a 10
            if (filter === 'recent') {
                allDocs = allDocs.slice(0, 10);
            }

            const unifiedHtml = allDocs.length > 0 ? `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Nº Doc</th>
                            <th>Tipo</th>
                            <th>Proveedor / Nombre</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allDocs.map(doc => {
                            const uniqueId = `doc-${doc.type}-${doc.id}`;
                            const docNumber = doc.numeroFactura || doc.numeroAlbaran || doc.turno || '-';
                            
                            // Contenido expandido para Cierres (copiado de renderCierres)
                            let expandedContent = '';
                            if (doc.type === 'cierre') {
                                const c = doc;
                                const efectivoPOS = c.desgloseEfectivo ? c.desgloseEfectivo.total : (c.efectivoContado || 0);
                                const tarjetasPOS = c.tarjetas || 0;
                                const efectivoReal = c.desgloseEfectivo ? c.desgloseEfectivo.total : (c.efectivoContado || 0); // Asumimos igual si no hay desglose guardado
                                const tarjetasReal = c.tarjetasReal || c.tarjetas || 0;
                                
                                const deltaEfectivo = efectivoReal - efectivoPOS;
                                const deltaTarjetas = tarjetasReal - tarjetasPOS;
                                
                                let otrosRows = '';
                                if (c.otrosMetodos && c.otrosMetodos.length > 0) {
                                    c.otrosMetodos.forEach(m => {
                                        const posVal = m.valor || 0;
                                        const realVal = m.valorReal || posVal;
                                        const delta = realVal - posVal;
                                        otrosRows += `
                                        <tr>
                                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${m.nombre}</td>
                                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${posVal.toFixed(2)} €</td>
                                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${realVal.toFixed(2)} €</td>
                                            <td style="padding: 8px; border-bottom: 1px solid #eee; color: ${delta !== 0 ? (delta > 0 ? '#27ae60' : '#e74c3c') : '#7f8c8d'}">${delta >= 0 ? '+' : ''}${delta.toFixed(2)} €</td>
                                        </tr>`;
                                    });
                                }

                                expandedContent = `
                                <div class="cierre-detalle-desplegable" style="padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 15px;">
                                        <button class="btn-secondary btn-small" onclick="window.app.editItem('cierres', ${doc.id})">✏️ Editar</button>
                                        <button class="btn-danger btn-small" onclick="window.app.deleteItem('cierres', ${doc.id})">🗑️ Eliminar</button>
                                    </div>
                                    <div class="cierre-tabla-wrapper">
                                        <table class="cierre-tabla-metodos" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                            <thead>
                                                <tr style="background: #f1f3f5; font-weight: 600; text-align: left;">
                                                    <th style="padding: 10px;">MÉTODO</th>
                                                    <th style="padding: 10px;">POS DECLARADO</th>
                                                    <th style="padding: 10px;">REAL CONTADO</th>
                                                    <th style="padding: 10px;">DIFERENCIA</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">💶 Efectivo</td>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${efectivoPOS.toFixed(2)} €</td>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${efectivoReal.toFixed(2)} €</td>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${deltaEfectivo !== 0 ? (deltaEfectivo > 0 ? '#27ae60' : '#e74c3c') : '#7f8c8d'}">${deltaEfectivo >= 0 ? '+' : ''}${deltaEfectivo.toFixed(2)} €</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">💳 Tarjetas</td>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${tarjetasPOS.toFixed(2)} €</td>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${tarjetasReal.toFixed(2)} €</td>
                                                    <td style="padding: 10px; border-bottom: 1px solid #eee; color: ${deltaTarjetas !== 0 ? (deltaTarjetas > 0 ? '#27ae60' : '#e74c3c') : '#7f8c8d'}">${deltaTarjetas >= 0 ? '+' : ''}${deltaTarjetas.toFixed(2)} €</td>
                                                </tr>
                                                ${otrosRows}
                                                <tr style="font-weight: 700; background: #e9ecef; border-top: 2px solid #dee2e6;">
                                                    <td style="padding: 10px;">TOTAL</td>
                                                    <td style="padding: 10px;">${c.totalPos.toFixed(2)} €</td>
                                                    <td style="padding: 10px;">${c.totalReal.toFixed(2)} €</td>
                                                    <td style="padding: 10px; color: ${c.descuadreTotal !== 0 ? (c.descuadreTotal > 0 ? '#27ae60' : '#e74c3c') : '#7f8c8d'}">${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style="margin-top: 15px; text-align: center; color: #666;">
                                        🎫 Tickets: <strong>${c.numTickets || 0}</strong> | 🎟 Ticket medio: <strong>${((c.totalReal || 0) / (c.numTickets || 1)).toFixed(2)} €</strong>
                                    </div>
                                </div>`;
                            } else {
                                // Contenido expandido para Facturas/Albaranes/Tickets
                                expandedContent = `
                                <div style="display: flex; gap: 20px; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <div style="flex: 1;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                                            <h4 style="margin: 0; color: #2c3e50;">
                                                ${doc.type === 'factura' ? '🧾 Detalle de Factura' : doc.type === 'albaran' ? '📦 Detalle de Albarán' : '📄 Detalle del Documento'}
                                            </h4>
                                            <div style="display: flex; gap: 10px;">
                                                ${doc.archivoData ? `<button class="btn-secondary btn-small" onclick="window.app.verArchivoFactura(${doc.id})">🔍 Ver Archivo</button>` : ''}
                                                ${doc.type === 'factura' ? `<button class="btn-secondary btn-small" onclick="window.app.verificarFacturaAlbaranes(${doc.id})">📋 Verificar</button>` : ''}
                                                <button class="btn-secondary btn-small" onclick="window.app.editItem('${doc.type === 'cierre' ? 'cierres' : doc.type === 'albaran' ? 'albaranes' : 'facturas'}', ${doc.id})">✏️ Editar</button>
                                                <button class="btn-danger btn-small" onclick="window.app.deleteItem('${doc.type === 'cierre' ? 'cierres' : doc.type === 'albaran' ? 'albaranes' : 'facturas'}', ${doc.id})">🗑️ Eliminar</button>
                                            </div>
                                        </div>
                                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px;">
                                            <div>
                                                <span style="display: block; color: #7f8c8d; font-size: 12px;">Número Documento</span>
                                                <strong style="color: #2c3e50;">${docNumber}</strong>
                                            </div>
                                            <div>
                                                <span style="display: block; color: #7f8c8d; font-size: 12px;">Fecha Emisión</span>
                                                <strong style="color: #2c3e50;">${this.formatDate(doc.fecha)}</strong>
                                            </div>
                                            <div>
                                                <span style="display: block; color: #7f8c8d; font-size: 12px;">Proveedor</span>
                                                <strong style="color: #2c3e50;">${doc.proveedor || 'N/A'}</strong>
                                            </div>
                                            <div>
                                                <span style="display: block; color: #7f8c8d; font-size: 12px;">Categoría</span>
                                                <strong style="color: #2c3e50;">${doc.categoria || 'General'}</strong>
                                            </div>
                                            ${doc.concepto ? `
                                            <div style="grid-column: span 2;">
                                                <span style="display: block; color: #7f8c8d; font-size: 12px;">Concepto / Notas</span>
                                                <p style="margin: 0; color: #2c3e50;">${doc.concepto}</p>
                                            </div>` : ''}
                                            <div style="grid-column: span 2; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee;">
                                                <span style="display: block; color: #7f8c8d; font-size: 12px;">Importe Total</span>
                                                <strong style="color: #2c3e50; font-size: 18px;">${(doc.total || 0).toFixed(2)} €</strong>
                                            </div>
                                        </div>
                                    </div>
                                    ${doc.imagen ? `
                                    <div style="width: 200px; display: flex; flex-direction: column; gap: 10px;">
                                        <span style="font-size: 12px; color: #7f8c8d; font-weight: 600;">VISTA PREVIA</span>
                                        <div style="width: 100%; height: 200px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8f9fa; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="window.open('${doc.imagen}', '_blank')">
                                            <img src="${doc.imagen}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Documento">
                                        </div>
                                        <button class="btn-secondary btn-small" onclick="window.open('${doc.imagen}', '_blank')" style="width: 100%;">🔍 Ver original</button>
                                    </div>` : ''}
                                </div>`;
                            }

                            return `
                        <tr onclick="window.app.toggleTableAccordion('${uniqueId}', this)" style="cursor: pointer;">
                            <td>${this.formatDate(doc.fecha)}</td>
                            <td>${docNumber}</td>
                            <td>${doc.label}</td>
                            <td>${doc.proveedor || 'Desconocido'}</td>
                            <td>${(doc.total || 0).toFixed(2)} €</td>
                        </tr>
                        <tr id="${uniqueId}" class="hidden accordion-content-row" style="background-color: #f8f9fa;">
                            <td colspan="5" style="padding: 15px;">
                                ${expandedContent}
                            </td>
                        </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>` : '<p class="empty-state">No hay documentos escaneados recientes</p>';

            // Renderizar en listaFacturas (contenedor principal en OCR view)
            const container = document.getElementById('listaFacturas');
            if (container) container.innerHTML = unifiedHtml;
            
            // Limpiar listaAlbaranes si existe
            const containerAlbaranes = document.getElementById('listaAlbaranes');
            if (containerAlbaranes) containerAlbaranes.innerHTML = '';
            
            return; // Salir, ya que en modo OCR no renderizamos las tablas separadas
        }

        // --- MODO COMPRAS (Original) ---
        let facturas = this.db.getByPeriod('facturas', this.currentPeriod);

        let albaranes = this.db.getByPeriod('albaranes', this.currentPeriod);

        // Aplicar filtros si existen
        if (this.currentFilters) {
            const { proveedor, desde, hasta } = this.currentFilters;
            
            if (proveedor) {
                facturas = facturas.filter(f => f.proveedor.toLowerCase().includes(proveedor));
                albaranes = albaranes.filter(a => a.proveedor.toLowerCase().includes(proveedor));
            }
            
            if (desde) {
                const fechaDesde = desde.includes('-') ? desde : new Date(desde).toISOString().split('T')[0];
                facturas = facturas.filter(f => (f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0]) >= fechaDesde);
                albaranes = albaranes.filter(a => (a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0]) >= fechaDesde);
            }
            
            if (hasta) {
                const fechaHasta = hasta.includes('-') ? hasta : new Date(hasta).toISOString().split('T')[0];
                facturas = facturas.filter(f => (f.fecha.includes('-') ? f.fecha : new Date(f.fecha).toISOString().split('T')[0]) <= fechaHasta);
                albaranes = albaranes.filter(a => (a.fecha.includes('-') ? a.fecha : new Date(a.fecha).toISOString().split('T')[0]) <= fechaHasta);
            }
        }

        facturas = this.sortData(facturas, 'facturas');
        albaranes = this.sortData(albaranes, 'albaranes');

        const facturasHtml = facturas.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('facturas', 'proveedor')" style="cursor:pointer">Proveedor${this.getSortIndicator('facturas', 'proveedor')}</th>
                        <th onclick="window.app.handleSort('facturas', 'numeroFactura')" style="cursor:pointer">Nº Factura${this.getSortIndicator('facturas', 'numeroFactura')}</th>
                        <th onclick="window.app.handleSort('facturas', 'fecha')" style="cursor:pointer">Fecha${this.getSortIndicator('facturas', 'fecha')}</th>
                        <th onclick="window.app.handleSort('facturas', 'categoria')" style="cursor:pointer">Categoría${this.getSortIndicator('facturas', 'categoria')}</th>
                        <th onclick="window.app.handleSort('facturas', 'total')" style="cursor:pointer">Total${this.getSortIndicator('facturas', 'total')}</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${facturas.map(f => `
                    <tr id="row-facturas-${f.id}">
                        <td>${f.proveedor}</td>
                        <td>${f.numeroFactura}</td>
                        <td>${this.formatDate(f.fecha)}</td>
                        <td>${f.categoria}</td>
                        <td>${f.total.toFixed(2)} €</td>
                        <td class="actions-cell">
                            ${f.archivoData ? `<button class="btn-icon" onclick="window.app.verArchivoFactura(${f.id})" title="Ver archivo">🔍</button>` : ''}
                            <button class="btn-icon" onclick="window.app.verificarFacturaAlbaranes(${f.id})" title="Verificar albaranes">📋</button>
                            <button class="btn-icon" onclick="window.app.editItem('facturas', ${f.id})" title="Editar">✏️</button>
                            <button class="btn-icon delete" onclick="window.app.deleteItem('facturas', ${f.id})" title="Eliminar">🗑️</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay facturas registradas</p>';
        
        document.getElementById('listaFacturas').innerHTML = facturasHtml;

        const albaranesHtml = albaranes.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('albaranes', 'proveedor')" style="cursor:pointer">Proveedor${this.getSortIndicator('albaranes', 'proveedor')}</th>
                        <th onclick="window.app.handleSort('albaranes', 'numeroAlbaran')" style="cursor:pointer">Nº Albarán${this.getSortIndicator('albaranes', 'numeroAlbaran')}</th>
                        <th onclick="window.app.handleSort('albaranes', 'fecha')" style="cursor:pointer">Fecha${this.getSortIndicator('albaranes', 'fecha')}</th>
                        <th onclick="window.app.handleSort('albaranes', 'verificado')" style="cursor:pointer">Estado${this.getSortIndicator('albaranes', 'verificado')}</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${albaranes.map(a => `
                    <tr id="row-albaranes-${a.id}">
                        <td>${a.proveedor}</td>
                        <td>${a.numeroAlbaran}</td>
                        <td>${this.formatDate(a.fecha)}</td>
                        <td>${a.verificado ? '✅ Verificado' : '⏳ Pendiente'}</td>
                        <td class="actions-cell">
                            <button class="btn-icon" onclick="window.app.editItem('albaranes', ${a.id})" title="Editar">✏️</button>
                            <button class="btn-icon delete" onclick="window.app.deleteItem('albaranes', ${a.id})" title="Eliminar">🗑️</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay albaranes registrados</p>';
        
        document.getElementById('listaAlbaranes').innerHTML = albaranesHtml;
    }

    renderInventarios() {
        let inventarios = this.db.inventarios;
        inventarios = this.sortData(inventarios, 'inventarios');

        const html = inventarios.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('inventarios', 'fecha')" style="cursor:pointer">Fecha${this.getSortIndicator('inventarios', 'fecha')}</th>
                        <th onclick="window.app.handleSort('inventarios', 'familia')" style="cursor:pointer">Familia${this.getSortIndicator('inventarios', 'familia')}</th>
                        <th>Nº Productos</th>
                        <th>Diferencia Valor</th>
                    </tr>
                </thead>
                <tbody>
                    ${inventarios.map(i => {
                        const numProductos = i.productos ? i.productos.length : 0;
                        const valorTotal = i.productos ? i.productos.reduce((sum, p) => sum + (p.valorDiferencia || 0), 0) : 0;
                        const colorStyle = Math.abs(valorTotal) > 50 ? 'color: #e74c3c; font-weight: bold;' : '';
                        
                        // Generar filas de productos para el detalle
                        const productsHtml = i.productos && i.productos.length > 0 ? i.productos.map(p => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td style="padding: 8px;">${p.nombre}</td>
                                <td style="text-align: right; padding: 8px;">${(p.stockTeorico || 0).toFixed(2)} ${p.unidad || 'ud'}</td>
                                <td style="text-align: right; padding: 8px;">${(p.stockReal || 0).toFixed(2)} ${p.unidad || 'ud'}</td>
                                <td style="text-align: right; padding: 8px; color: ${(p.diferencia || 0) >= 0 ? 'green' : 'red'}">${(p.diferencia || 0).toFixed(2)}</td>
                                <td style="text-align: right; padding: 8px; color: ${(p.valorDiferencia || 0) >= 0 ? 'green' : 'red'}">${(p.valorDiferencia || 0).toFixed(2)} €</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align:center; padding:10px;">No hay productos registrados en este inventario</td></tr>';

                        return `
                        <tr id="row-inventarios-${i.id}" onclick="window.app.toggleTableAccordion('preview-inventario-${i.id}', this)" style="cursor: pointer;">
                            <td>${this.formatDate(i.fecha)}</td>
                            <td>${i.familia}</td>
                            <td>${numProductos}</td>
                            <td style="${colorStyle}">${valorTotal.toFixed(2)} €</td>
                        </tr>
                        <tr id="preview-inventario-${i.id}" class="hidden accordion-content-row">
                            <td colspan="5" style="padding: 20px;">
                                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                                        <h4 style="margin: 0; color: #2c3e50;">📦 DETALLE INVENTARIO</h4>
                                        <div style="display: flex; gap: 10px;">
                                            <button class="btn-secondary btn-small" onclick="window.app.editItem('inventarios', ${i.id})">✏️ Editar</button>
                                            <button class="btn-danger btn-small" onclick="window.app.deleteItem('inventarios', ${i.id})">🗑️ Eliminar</button>
                                        </div>
                                    </div>
                                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95em;">
                                        <thead>
                                            <tr style="background-color: #f1f2f6; color: #555;">
                                                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Producto</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Teórico</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Real</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Dif.</th>
                                                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Valor Dif.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${productsHtml}
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay inventarios realizados</p>';
        
        document.getElementById('listaInventarios').innerHTML = html;
    }

    // renderDelivery eliminado por unificación con Cierres

    renderProductos() {
        let productos = this.db.productos;
        productos = this.sortData(productos, 'productos');

        const html = productos.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('productos', 'nombre')" style="cursor:pointer">Producto${this.getSortIndicator('productos', 'nombre')}</th>
                        <th onclick="window.app.handleSort('productos', 'precioPromedioNeto')" style="cursor:pointer">Precio${this.getSortIndicator('productos', 'precioPromedioNeto')}</th>
                        <th onclick="window.app.handleSort('productos', 'proveedorNombre')" style="cursor:pointer">Proveedor${this.getSortIndicator('productos', 'proveedorNombre')}</th>
                        <th onclick="window.app.handleSort('productos', 'stockActualUnidades')" style="cursor:pointer">Stock${this.getSortIndicator('productos', 'stockActualUnidades')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => {
                        const precio = p.precioPromedioNeto || p.precio || 0;
                        const stock = p.stockActualUnidades || 0;
                        const unidad = p.unidadBase || 'ud';
                        const proveedor = p.proveedorNombre || p.proveedor || 'Sin proveedor';
                        
                        let empaqueInfo = '';
                        if (p.esEmpaquetado && p.unidadesPorEmpaque) {
                            const numEmpaques = (stock / p.unidadesPorEmpaque).toFixed(2);
                            empaqueInfo = `<br><small class="text-muted">📦 ${numEmpaques} ${p.tipoEmpaque}s</small>`;
                        }

                        return `
                        <tr id="row-productos-${p.id}" onclick="window.app.toggleTableAccordion('preview-producto-${p.id}', this)" style="cursor: pointer;">
                            <td>${p.nombre}</td>
                            <td>${precio.toFixed(2)} €/${unidad}</td>
                            <td>${proveedor}</td>
                            <td>${stock.toFixed(2)} ${unidad}${empaqueInfo}</td>
                        </tr>
                        <tr id="preview-producto-${p.id}" class="hidden accordion-content-row">
                            <td colspan="5" style="padding: 20px;">
                                <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                                        <h4 style="margin: 0; color: #2c3e50;">📦 Detalle del Producto</h4>
                                        <div style="display: flex; gap: 10px;">
                                            <button class="btn-secondary btn-small" onclick="window.app.editItem('productos', ${p.id})">✏️ Editar</button>
                                            <button class="btn-danger btn-small" onclick="window.app.deleteItem('productos', ${p.id})">🗑️ Eliminar</button>
                                        </div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px;">
                                        <div>
                                            <span style="display: block; color: #7f8c8d; font-size: 12px;">Nombre</span>
                                            <strong style="color: #2c3e50;">${p.nombre}</strong>
                                        </div>
                                        <div>
                                            <span style="display: block; color: #7f8c8d; font-size: 12px;">Proveedor</span>
                                            <strong style="color: #2c3e50;">${proveedor}</strong>
                                        </div>
                                        <div>
                                            <span style="display: block; color: #7f8c8d; font-size: 12px;">Precio Promedio</span>
                                            <strong style="color: #2c3e50;">${precio.toFixed(2)} €/${unidad}</strong>
                                        </div>
                                        <div>
                                            <span style="display: block; color: #7f8c8d; font-size: 12px;">Stock Actual</span>
                                            <strong style="color: #2c3e50;">${stock.toFixed(2)} ${unidad}</strong>
                                        </div>
                                        ${p.esEmpaquetado ? `
                                        <div>
                                            <span style="display: block; color: #7f8c8d; font-size: 12px;">Formato Compra</span>
                                            <strong style="color: #2c3e50;">${p.tipoEmpaque} de ${p.unidadesPorEmpaque} ${unidad}s</strong>
                                        </div>` : ''}
                                    </div>
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay productos en el catálogo</p>';
        
        document.getElementById('listaProductos').innerHTML = html;
    }

    renderProveedores() {
        let proveedores = this.db.proveedores;
        proveedores = this.sortData(proveedores, 'proveedores');
        
        const html = proveedores.length > 0 ? `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th onclick="window.app.handleSort('proveedores', 'nombreComercial')" style="cursor:pointer">Nombre Comercial${this.getSortIndicator('proveedores', 'nombreComercial')}</th>
                        <th onclick="window.app.handleSort('proveedores', 'nombreFiscal')" style="cursor:pointer">Razón Social${this.getSortIndicator('proveedores', 'nombreFiscal')}</th>
                        <th onclick="window.app.handleSort('proveedores', 'contacto')" style="cursor:pointer">Contacto${this.getSortIndicator('proveedores', 'contacto')}</th>
                        <th onclick="window.app.handleSort('proveedores', 'telefono')" style="cursor:pointer">Teléfono${this.getSortIndicator('proveedores', 'telefono')}</th>
                        <th onclick="window.app.handleSort('proveedores', 'email')" style="cursor:pointer">Email${this.getSortIndicator('proveedores', 'email')}</th>
                        <th onclick="window.app.handleSort('proveedores', 'estado')" style="cursor:pointer">Estado${this.getSortIndicator('proveedores', 'estado')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${proveedores.map(p => `
                    <tr id="row-proveedores-${p.id}" onclick="window.app.toggleTableAccordion('preview-proveedor-${p.id}', this)" style="cursor: pointer;">
                        <td>${p.nombreComercial || '-'}</td>
                        <td>${p.nombreFiscal || p.nombre || '-'}</td>
                        <td>${p.personaContacto || p.contacto || '-'}</td>
                        <td>${p.telefono || '-'}</td>
                        <td>${p.email || '-'}</td>
                        <td><span class="badge badge-${(p.estado || 'Activo').toLowerCase()}">${p.estado || 'Activo'}</span></td>
                    </tr>
                    <tr id="preview-proveedor-${p.id}" class="hidden accordion-content-row">
                        <td colspan="6" style="padding: 20px;">
                            <div style="background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                                    <h4 style="margin: 0; color: #2c3e50;">🏢 Detalle del Proveedor</h4>
                                    <div style="display: flex; gap: 10px;">
                                        <button class="btn-secondary btn-small" onclick="window.app.editItem('proveedores', ${p.id})">✏️ Editar</button>
                                        <button class="btn-danger btn-small" onclick="window.app.deleteItem('proveedores', ${p.id})">🗑️ Eliminar</button>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px;">
                                    <div>
                                        <span style="display: block; color: #7f8c8d; font-size: 12px;">Nombre Comercial</span>
                                        <strong style="color: #2c3e50;">${p.nombreComercial || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style="display: block; color: #7f8c8d; font-size: 12px;">Razón Social</span>
                                        <strong style="color: #2c3e50;">${p.nombreFiscal || p.nombre || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style="display: block; color: #7f8c8d; font-size: 12px;">Contacto</span>
                                        <strong style="color: #2c3e50;">${p.personaContacto || p.contacto || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style="display: block; color: #7f8c8d; font-size: 12px;">Teléfono</span>
                                        <strong style="color: #2c3e50;">${p.telefono || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style="display: block; color: #7f8c8d; font-size: 12px;">Email</span>
                                        <strong style="color: #2c3e50;">${p.email || '-'}</strong>
                                    </div>
                                    <div>
                                        <span style="display: block; color: #7f8c8d; font-size: 12px;">Estado</span>
                                        <strong style="color: #2c3e50;">${p.estado || 'Activo'}</strong>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p class="empty-state">No hay proveedores registrados</p>';
        
        const contenedor = document.getElementById('listaProveedores');
        if (contenedor) {
            contenedor.innerHTML = html;
        }
        
        // Actualizar dropdown de productos
        const selectProveedor = document.getElementById('productoProveedorId');
        if (selectProveedor) {
            const options = proveedores.map(p => 
                `<option value="${p.id}">${p.nombreFiscal || p.nombre}</option>`
            ).join('');
            selectProveedor.innerHTML = '<option value="">Seleccionar...</option>' + options;
        }
    }

    // --- MÉTODOS DE ORDENACIÓN ---
    
    handleSort(section, column) {
        const currentSort = this.sortState[section];
        if (currentSort.column === column) {
            // Alternar dirección
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // Nueva columna, default asc (o desc para fechas)
            currentSort.column = column;
            currentSort.direction = ['fecha', 'total', 'importe'].includes(column) ? 'desc' : 'asc';
        }
        
        // Re-renderizar la sección correspondiente
        switch(section) {
            case 'escandallos': this.renderEscandallos(); break;
            case 'cierres': this.renderCierres(); break;
            case 'facturas': this.renderCompras(); break; // Facturas y albaranes están en Compras
            case 'albaranes': this.renderCompras(); break;
            case 'inventarios': this.renderControlStock(); break;
            // case 'delivery': eliminado
            case 'productos': this.renderProductos(); break;
            case 'proveedores': this.renderProveedores(); break;
        }
    }

    sortData(data, section) {
        if (!data || !Array.isArray(data)) return [];
        
        const { column, direction } = this.sortState[section];
        
        return [...data].sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // Manejo de fechas
            if (column === 'fecha' || column.includes('Date')) {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }
            // Manejo de números
            else if (typeof valA === 'number' || typeof valB === 'number') {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            }
            // Manejo de strings
            else {
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1;
            if (valA > valB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    getSortIndicator(section, column) {
        const sort = this.sortState[section];
        if (sort.column !== column) return '<span class="sort-icon">↕</span>';
        return sort.direction === 'asc' ? '<span class="sort-icon">↑</span>' : '<span class="sort-icon">↓</span>';
    }

    toggleRow(id, btn) {
        const row = document.getElementById(id);
        if (row) {
            const isHidden = row.style.display === 'none';
            
            // Si vamos a abrir una fila, primero cerramos todas las demás
            if (isHidden) {
                const allPreviews = document.querySelectorAll('tr[id^="preview-"]');
                allPreviews.forEach(preview => {
                    if (preview.style.display !== 'none' && preview.id !== id) {
                        preview.style.display = 'none';
                        // Resetear el botón asociado
                        const btnId = 'btn-' + preview.id;
                        const otherBtn = document.getElementById(btnId);
                        if (otherBtn) otherBtn.textContent = '▶';
                    }
                });
            }

            row.style.display = isHidden ? 'table-row' : 'none';
            if (btn) btn.textContent = isHidden ? '▼' : '▶';
        }
    }

    // --- ACCORDION HELPERS ---
    toggleTableAccordion(contentId, triggerRow) {
        // 1. Close all other open rows in the same table
        const table = triggerRow.closest('table');
        if (table) {
            const openRows = table.querySelectorAll('.accordion-content-row:not(.hidden)');
            openRows.forEach(row => {
                if (row.id !== contentId) {
                    row.classList.add('hidden');
                }
            });
        }

        // 2. Toggle the target row
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.toggle('hidden');
        }
    }

    toggleListAccordion(itemId, itemClass) {
        // 1. Close all other items of the same class
        const allItems = document.querySelectorAll('.' + itemClass);
        allItems.forEach(item => {
            if (item.id !== itemId) {
                item.classList.remove('detalle-visible');
            }
        });

        // 2. Toggle the target item
        const target = document.getElementById(itemId);
        if (target) {
            target.classList.toggle('detalle-visible');
        }
    }
}

