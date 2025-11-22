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
        }
        
        if (toggleBtn) {
            toggleBtn.textContent = labels[type] || `+ Nuevo ${type.charAt(0).toUpperCase() + type.slice(1)}`;
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
                    if (toggleBtn) toggleBtn.textContent = '− Cancelar';
                    
                    // Resetear formulario al abrir
                    const form = document.getElementById(`${type}Form`);
                    if (form) {
                        form.reset();
                        delete form.dataset.editId;
                    }
                    
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

        // --- DELEGACIÓN DE EVENTOS GLOBAL (CRÍTICO) ---
        // Este oyente maneja todos los botones con 'window.app'
        document.body.addEventListener('click', (e) => {
            
            // 1. Navegación (Sidebar)
            if (e.target.classList.contains('nav-item')) {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.render();
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
            const btn = e.target.closest('button');
            if (btn) {
                if (btn.id === 'toggleCierreForm') window.app.expandForm('cierre');
                if (btn.id === 'toggleProveedorForm') window.app.toggleForm('proveedor');
                if (btn.id === 'toggleProductoForm') window.app.toggleForm('producto');
                if (btn.id === 'toggleEscandalloForm') window.app.expandForm('escandallo');
                if (btn.id === 'btnCrearInventario') window.app.expandForm('inventario');
                if (btn.id === 'btnCalcularCOGS') window.app.calcularCOGS();
            }

            // 4. Botones de Stock (Legacy IDs check just in case)
            if (e.target.id === 'btnCrearInventario') window.app.expandForm('inventario');
            if (e.target.id === 'btnCalcularCOGS') window.app.calcularCOGS();
            
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
                    <select class="inventario-tipo-conteo" onchange="app.updateTipoConteoInventario(${rowId})" required>
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
            'escandallos': 'escandalloView', 'inventario': 'inventarioView',
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
            case 'ocr': this.renderRecentDocuments(); break;
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

    renderCierres() {
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

    renderCompras() {
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

    renderProveedores() {
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

    renderProductos() {
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

    renderEscandallos() {
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
                <select class="ingrediente-producto" required onchange="app.onIngredienteProductoChange(this)">
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
                <select class="ingrediente-unidad" required onchange="app.calcularCostesEscandallo()">
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

    renderInventarios() {
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

    renderDelivery() {
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
        
        // Ocultar bot�n cancelar carga (porque ya hay archivo)
        const cancelContainer = document.getElementById('ocrUploadCancelContainer');
        if (cancelContainer) cancelContainer.classList.add('hidden');

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
        // CIF/NIF español: Letra inicial (A-H, J-N, P-S, U-W) + 7 dígitos + dígito de control
        const textoBusquedaCIF = tieneZonas && zonaProveedor ? zonaProveedor : text;
        const cifPatterns = [
            /(?:NIF|CIF)[:\s]*([A-HJ-NP-SUVW][0-9]{7}[0-9A-Z])/gi,  // Con etiqueta NIF/CIF
            /\b([A-HJ-NP-SUVW][0-9]{7}[0-9A-Z])\b/gi  // Sin etiqueta (buscar todas las ocurrencias)
        ];
        
        for (const pattern of cifPatterns) {
            const matches = [...textoBusquedaCIF.matchAll(pattern)];
            for (const match of matches) {
                const cifValue = match[1].toUpperCase();
                // Validar formato: letra + 7 números + dígito/letra control
                if (cifValue.match(/^[A-HJ-NP-SUVW][0-9]{7}[0-9A-Z]$/)) {
                    data.nif = { value: cifValue, confidence: confidence };
                    console.log('✓ CIF/NIF detectado:', cifValue, tieneZonas ? '(desde zona proveedor)' : '');
                    break;
                }
            }
            if (data.nif.value) break;
        }
        
        // 2. PROVEEDOR/EMPRESA (buscar con múltiples patrones MEJORADOS)
        // Patrón 0: Si tenemos zona proveedor, buscar primero ahí
        if (tieneZonas && zonaProveedor && !data.proveedor.value) {
            // Buscar línea con forma societaria: S.L., S.A., SLU, S.L.L., S.COOP, etc.
            const lineasProveedor = zonaProveedor.split(/\s{2,}|\n/).filter(l => l.trim().length > 0);
            for (const linea of lineasProveedor) {
                const lineaTrim = linea.trim();
                // REFUERZO: Si tiene forma societaria, ES nombre de empresa
                if (lineaTrim.match(/\b(S\.?L\.?U\.?|S\.?L\.?L\.?|S\.?L\.?|S\.?A\.?|S\.?COOP\.?|S\.?A\.?T\.?|S\.?COM\.?|BCN|GROUP|FOODS|DELIVERY)\b/i) && 
                    lineaTrim.length > 4 && lineaTrim.length < 100 &&
                    !lineaTrim.match(/^(Cliente|Factura|Invoice|Total|Fecha)/i)) {
                    data.proveedor = { value: lineaTrim, confidence: confidence };
                    break;
                }
                // Si no tiene forma societaria pero es nombre en mayúsculas
                if (!data.proveedor.value && lineaTrim.match(/^[A-ZÁÉÍÓÚÑ]/i) && 
                    lineaTrim.length > 4 && lineaTrim.length < 60 &&
                    !lineaTrim.match(/^(Cliente|Factura|Invoice|Total|Fecha|Tel|Email|NIF|CIF)/i)) {
                    data.proveedor = { value: lineaTrim, confidence: confidence * 0.9 };
                    console.log('✓ Proveedor detectado (zona proveedor, nombre capitalizado):', lineaTrim);
                    break;
                }
            }
        }
        
        // Patrón 1: Buscar línea antes del CIF (PRIORIDAD ALTA)
        if (data.nif.value && !data.proveedor.value) {
            const indexCIF = text.indexOf(data.nif.value);
            if (indexCIF > 0) {
                const textBeforeCIF = text.substring(0, indexCIF);
                const lineasAntes = textBeforeCIF.split('\n').reverse();
                
                for (let i = 0; i < Math.min(8, lineasAntes.length); i++) {
                    const linea = lineasAntes[i].trim();
                    // Buscar líneas que parezcan nombre de empresa
                    // EXCLUIR: palabras clave de factura, "Cliente:", emails, URLs, direcciones obvias
                    if (linea.length > 3 && linea.length < 100 && 
                        !linea.match(/^(factura|invoice|fecha|total|cliente:|email|www\.|http|tel[eé]fono|calle|avenida|plaza|carrer|c\/)/i) &&
                        !linea.match(/^\d+[\.,]\d+\s*€?$/) && // No es un número/precio
                        !linea.match(/^\+?\d+/) && // No empieza con teléfono
                        (linea.match(/[A-ZÁÉÍÓÚÑ]{3,}/) || linea.match(/S\.?L\.?|SL|S\.?A\.?|SA|BCN|GROUP|FOODS|RESTAURANT|DELIVERY|DELIVERYIFY/i))) {
                        data.proveedor = { value: linea, confidence: confidence };
                        console.log('✓ Proveedor detectado (antes de CIF):', linea);
                        break;
                    }
                }
            }
        }
        
        // Patrón 1.5: Buscar "NOMBRE S.L." o "NOMBRE S.A." en líneas mixtas (con dirección)
        // Para casos como: "DELIVERYIFY S.L. Carrer Rossend Arús 20..."
        if (!data.proveedor.value) {
            // Buscar patrón: PALABRAS_MAYUSCULAS S.L. (o SL, S.A., SA) seguido de dirección
            const empresaMixta = text.match(/\b([A-ZÁÉÍÓÚÑ][A-ZÀ-ÿa-z0-9\s&\.\-]{3,50}?\s*(?:S\.?L\.?|S\.?A\.?))\s+(?:Carrer|Calle|Avda|Avenida)/i);
            if (empresaMixta && empresaMixta[1]) {
                const nombreEmpresa = empresaMixta[1].trim();
                data.proveedor = { value: nombreEmpresa, confidence: confidence };
                console.log('✓ Proveedor detectado (línea mixta con dirección):', nombreEmpresa);
            }
        }
        
        // Patrón 2: Buscar después de palabras clave "Proveedor:", "Empresa:", "Razón Social:"
        // EXCLUIR explícitamente "Cliente:" (que somos nosotros)
        if (!data.proveedor.value) {
            const proveedorMatch = text.match(/(?:Proveedor|Empresa|Razón\s+Social|Emisor)[:\s]+([A-ZÀ-ÿ0-9][^\n]{3,80})/i);

            if (proveedorMatch && proveedorMatch[1]) {
                const nombre = proveedorMatch[1].trim();
                // Limpiar posibles artefactos al final
                const nombreLimpio = nombre.replace(/\s+(NIF|CIF|Tel[eé]fono).*$/i, '').trim();
                if (nombreLimpio.length > 2) {
                    data.proveedor = { value: nombreLimpio, confidence: confidence };
                    console.log('✓ Proveedor detectado (palabra clave):', nombreLimpio);
                }

            }
        }
        
        // Patrón 3: Buscar en las primeras 10 líneas del documento (cabecera) - MANTENER COMPLETO
        if (!data.proveedor.value) {
            const primerasLineas = text.split('\n').slice(0, 10);
            for (const linea of primerasLineas) {
                const lineaTrim = linea.trim();
                // Buscar cualquier línea que tenga al menos 2 palabras capitalizadas
                const palabrasMayusculas = lineaTrim.match(/\b[A-ZÁÉÍÓÚÑ][A-ZÀ-ÿ]+\b/g);
                if (palabrasMayusculas && palabrasMayusculas.length >= 2 && 
                    lineaTrim.length > 5 && lineaTrim.length < 100 &&
                    !lineaTrim.match(/^(factura|invoice|fecha|cliente)/i)) {
                    data.proveedor = { value: lineaTrim, confidence: confidence * 0.6 };
                    console.log('⚠️ Proveedor detectado (último recurso):', lineaTrim);
                    break;
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
            inputHtml = `<select id="${field.id}" class="form-control ${readOnlyClass}" ${disabledAttr}>
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

        // Buscar contenedor en el DOM
        const containerId = `row-${collection}-${id}`;
        const container = document.getElementById(containerId);
        
        if (container) {
            // MODO INLINE: Reemplazar contenido del contenedor
            container.innerHTML = this.renderInlineEditForm(collection, item);
        } else {
            // Fallback a modal si no se encuentra el contenedor (o para vistas antiguas)
            // Router de edición antiguo
            switch(collection) {
                case 'facturas':
                    if (this.abrirModalEditarFactura) this.abrirModalEditarFactura(item);
                    break;
                case 'albaranes':
                    if (this.abrirModalEditarAlbaran) this.abrirModalEditarAlbaran(item);
                    break;
                default:
                    console.warn(`Edición no implementada para ${collection}`);
                    this.showToast(`⚠️ La edición de ${collection} aún no está disponible`);
            }
        }
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
                    <select name="categoria">
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
            <select class="otro-medio-tipo" style="flex: 2;">
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

        // Recopilar billetes y monedas (usamos ids en el cálculo, no aquí)
        const efectivoContado = readSafe('totalEfectivoDisplay', 'float'); // Lee el total calculado del display
        
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
        const posTickets = readSafe('posTickets', 'int');
        
        // Suma de extras POS (Bizum, Transferencia, etc.)
        let posExtrasTotal = 0;
        document.querySelectorAll('.pos-extra-input').forEach(el => posExtrasTotal += parseFloat(el.value) || 0);
        
        // Calcular totales
        const totalReal = efectivoContado + totalDatafonos + totalOtrosMedios;
        const totalPOS = posEfectivo + posTarjetas + posExtrasTotal;
        const descuadreTotal = totalReal - totalPOS;

        const cierre = {
            fecha: document.getElementById('cierreFecha').value,
            turno: document.getElementById('cierreTurno').value,
            
            efectivoContado: efectivoContado,
            datafonos: datafonos,
            totalDatafonos: totalDatafonos,
            otrosMedios: otrosMedios,
            totalOtrosMedios: totalOtrosMedios,
            
            posEfectivo: posEfectivo,
            posTarjetas: posTarjetas,
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
        let posOtrosTotal = 0;
        document.querySelectorAll('.pos-extra-input').forEach(el => posOtrosTotal += parseFloat(el.value) || 0);
        
        const totalReal = totalEfectivo + totalDatafonos + totalOtros;
        const totalPOS = posEfectivo + posTarjetas + posOtrosTotal;
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
        document.getElementById('cierreForm').reset();
        document.getElementById('datafonosContainer').innerHTML = '';
        document.getElementById('otrosMediosContainer').innerHTML = '';
        document.getElementById('totalEfectivoDisplay').textContent = '0.00 €';
        document.getElementById('resumenTbody').innerHTML = ''; 
        this.renderDatosPOS(); 
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
                    <select class="inventario-tipo-conteo" onchange="app.updateTipoConteoInventario(${rowId})" required>
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
            'escandallos': 'escandalloView', 'inventario': 'inventarioView',
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
            case 'ocr': this.renderRecentDocuments(); break;
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

    renderCierres() {
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

    renderCompras() {
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

    renderProveedores() {
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

    renderProductos() {
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

    renderEscandallos() {
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
                <select class="ingrediente-producto" required onchange="app.onIngredienteProductoChange(this)">
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
                <select class="ingrediente-unidad" required onchange="app.calcularCostesEscandallo()">
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

    renderInventarios() {
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

    renderDelivery() {
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

    renderCompras() {
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

    renderProveedores() {
        const proveedores = this.db.proveedores;
        
        const html = proveedores.length > 0 ? proveedores.map(p => {
            const nombre = p.nombreFiscal || p.nombre || 'Sin nombre';
            const comercial = p.nombreComercial ? ` (${p.nombreComercial})` : '';
            const tipo = p.tipo || p.tipoProveedor || 'N/A';
            
            return `
            <div class="list-item" id="row-proveedores-${p.id}">
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
                    inputHtml = `<select name="${key}" class="inline-input ${readOnlyClass}" ${isReadOnly}>${options}</select>`;
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
        } else if (collection === 'delivery') {
            this.renderDelivery();
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

    renderProductos() {
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
            <div class="list-item" id="row-productos-${p.id}">
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

    renderInventarios() {
        const inventarios = this.db.inventarios;
        const html = inventarios.length > 0 ? inventarios.reverse().map(i => {
            const numProductos = i.productos ? i.productos.length : 0;
            const valorTotal = i.productos ? i.productos.reduce((sum, p) => sum + p.valorDiferencia, 0) : 0;
            const colorClass = Math.abs(valorTotal) > 50 ? 'warning' : '';
            
            return `
            <div class="list-item ${colorClass}" id="row-inventarios-${i.id}">
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

    renderDelivery() {
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const html = delivery.length > 0 ? delivery.reverse().map(d => `
            <div class="list-item" id="row-delivery-${d.id}">
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
            const timeStr = !isNaN(date.getTime()) ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            const dateStr = !isNaN(date.getTime()) ? date.toLocaleDateString() : (doc.displayDate || '');
            
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
}
