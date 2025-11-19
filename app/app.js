// ===============================================
// DATABASE
// ===============================================
class Database {
    constructor() {
        this.cierres = this.load('cierres') || [];
        this.facturas = this.load('facturas') || [];
        this.albaranes = this.load('albaranes') || [];
        this.proveedores = this.load('proveedores') || [];
        this.productos = this.load('productos') || [];
        this.escandallos = this.load('escandallos') || [];
        this.inventarios = this.load('inventarios') || [];
        this.delivery = this.load('delivery') || [];
    }

    load(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    add(collection, item) {
        item.id = Date.now();
        this[collection].push(item);
        this.save(collection, this[collection]);
        return item;
    }

    update(collection, id, updatedItem) {
        const index = this[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            this[collection][index] = { ...this[collection][index], ...updatedItem, id: id };
            this.save(collection, this[collection]);
            return this[collection][index];
        }
        return null;
    }

    delete(collection, id) {
        this[collection] = this[collection].filter(item => item.id !== id);
        this.save(collection, this[collection]);
    }

    getByPeriod(collection, period) {
        const now = new Date();
        const items = this[collection];
        
        return items.filter(item => {
            const itemDate = new Date(item.fecha);
            switch(period) {
                case 'dia':
                    return itemDate.toDateString() === now.toDateString();
                case 'semana':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return itemDate >= weekAgo;
                case 'mes':
                    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                case 'anio':
                    return itemDate.getFullYear() === now.getFullYear();
                default:
                    return true;
            }
        });
    }
}

// ===============================================
// APP
// ===============================================
class App {
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
        // Variables OCR mejoradas
        this.currentPDFText = null;
        this.isPDFWithEmbeddedText = false;
        this.initializeEventListeners();
        this.render();
    }

    // Método robusto para colapsar formularios (usa múltiples estrategias)
    collapseForm(type) {
        const formCard = document.getElementById(`${type}FormCard`);
        const toggleBtn = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
        
        if (formCard && toggleBtn) {
            // Estrategia 1: classList
            formCard.classList.add('hidden');
            // Estrategia 2: inline style como backup
            formCard.style.display = 'none';
            // Actualizar texto del botón
            toggleBtn.textContent = type === 'cierre' ? '+ Nuevo Cierre' : '+ Nuevo Escandallo';
        }
    }

    // Método robusto para expandir formularios
    expandForm(type) {
        const formCard = document.getElementById(`${type}FormCard`);
        const toggleBtn = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
        
        if (formCard && toggleBtn) {
            // Estrategia 1: classList
            formCard.classList.remove('hidden');
            // Estrategia 2: inline style
            formCard.style.display = 'block';
            // Actualizar texto del botón
            toggleBtn.textContent = type === 'cierre' ? '− Cancelar' : '− Cancelar';
        }
    }

    // Toggle form para productos y proveedores
    toggleForm(type) {
        const formCard = document.getElementById(`${type}FormCard`);
        const toggleBtn = document.getElementById(`toggle${type.charAt(0).toUpperCase() + type.slice(1)}Form`);
        
        if (formCard && toggleBtn) {
            const isHidden = formCard.classList.contains('hidden');
            
            if (isHidden) {
                // Expandir
                formCard.classList.remove('hidden');
                formCard.style.display = 'block';
                toggleBtn.textContent = '− Cancelar';
            } else {
                // Colapsar
                formCard.classList.add('hidden');
                formCard.style.display = 'none';
                toggleBtn.textContent = type === 'proveedor' ? '+ Nuevo Proveedor' : '+ Nuevo Producto';
                // Limpiar formulario
                document.getElementById(`${type}Form`).reset();
                delete document.getElementById(`${type}Form`).dataset.editId;
            }
        }
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.render();
            });
        });

        // Period selector
        document.getElementById('periodSelector').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.render();
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(tabName + 'Tab').classList.remove('hidden');
            });
        });

        // OCR File Upload
        // OCR - Selector tipo documento
        document.querySelectorAll('.ocr-tipo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.ocr-tipo-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentOCRType = btn.dataset.tipo;
                
                // Si no hay imagen cargada, solo mostrar upload card
                if (!this.currentImageData) {
                    document.getElementById('ocrUploadCard').classList.remove('hidden');
                    document.getElementById('ocrDataCard').classList.add('hidden');
                } else {
                    // Si ya hay imagen, re-analizar con el nuevo tipo
                    this.analyzeOCRDocument();
                }
            });
        });

        document.getElementById('ocrFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleOCRImageUpload(file);
            }
        });

        document.getElementById('ocrAnalyzeBtn').addEventListener('click', () => {
            this.analyzeOCRDocument();
        });

        document.getElementById('ocrSaveBtn').addEventListener('click', () => {
            this.saveOCRData();
        });

        document.getElementById('ocrCancelBtn').addEventListener('click', () => {
            this.resetOCRForm();
        });

        // Toggle formulario cierre
        document.getElementById('toggleCierreForm').addEventListener('click', () => {
            const formCard = document.getElementById('cierreFormCard');
            const isHidden = formCard.classList.contains('hidden') || formCard.style.display === 'none';
            
            if (isHidden) {
                this.expandForm('cierre');
            } else {
                this.collapseForm('cierre');
            }
        });

        // Cierre - Cálculo automático
        document.querySelectorAll('.billete-input').forEach(input => {
            input.addEventListener('input', () => this.calcularTotalesCierre());
        });

        document.getElementById('addDatafono').addEventListener('click', () => {
            const container = document.getElementById('datafonosContainer');
            const item = document.createElement('div');
            item.className = 'datafono-item';
            item.innerHTML = `
                <input type="text" placeholder="Nombre TPV" class="datafono-nombre">
                <input type="number" step="0.01" value="0" min="0" placeholder="Importe" class="datafono-importe">
                <button type="button" class="btn-remove" onclick="this.parentElement.remove(); app.calcularTotalesCierre()">✗</button>
            `;
            container.appendChild(item);
            item.querySelector('.datafono-importe').addEventListener('input', () => this.calcularTotalesCierre());
        });

        document.getElementById('addOtroMedio').addEventListener('click', () => {
            const container = document.getElementById('otrosMediosContainer');
            const item = document.createElement('div');
            item.className = 'otro-medio-item';
            item.innerHTML = `
                <select class="otro-medio-tipo">
                    <option value="Bizum">Bizum</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Pagaré">Pagaré</option>
                    <option value="Dinero B (sin IVA)">💵 Dinero B (sin IVA)</option>
                    <option value="Otro">Otro</option>
                </select>
                <input type="number" step="0.01" value="0" min="0" placeholder="Importe" class="otro-medio-importe">
                <button type="button" class="btn-remove" onclick="this.parentElement.remove(); app.renderDatosPOS(); app.renderResumenTabla(); app.calcularTotalesCierre()">✗</button>
            `;
            container.appendChild(item);
            
            const selectTipo = item.querySelector('.otro-medio-tipo');
            const aplicarEstiloDineroB = () => {
                if (selectTipo.value === 'Dinero B (sin IVA)') {
                    item.style.background = '#fff3cd';
                    item.style.border = '2px solid #ffc107';
                    item.style.padding = '10px';
                    item.style.borderRadius = '6px';
                    if (!item.querySelector('.dinero-b-warning')) {
                        const warning = document.createElement('small');
                        warning.className = 'dinero-b-warning';
                        warning.style.cssText = 'display: block; color: #856404; font-size: 11px; margin-top: 5px; font-weight: 600;';
                        warning.textContent = '⚠️ Este importe NO computa IVA en ningún cálculo';
                        item.appendChild(warning);
                    }
                } else {
                    item.style.background = '';
                    item.style.border = '';
                    item.style.padding = '';
                    item.style.borderRadius = '';
                    const warning = item.querySelector('.dinero-b-warning');
                    if (warning) warning.remove();
                }
            };
            
            selectTipo.addEventListener('change', () => {
                aplicarEstiloDineroB();
                this.renderDatosPOS();
                this.renderResumenTabla();
            });
            item.querySelector('.otro-medio-importe').addEventListener('input', () => this.calcularTotalesCierre());
            this.renderDatosPOS();
            this.renderResumenTabla();
        });

        // Renderizar campos POS y resumen inicialmente (solo Efectivo y Tarjetas)
        this.renderDatosPOS();
        this.renderResumenTabla();

        // Filtros compras
        document.getElementById('btnFiltrarCompras').addEventListener('click', () => {
            this.filtrarCompras();
        });

        document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
            document.getElementById('filtroProveedor').value = '';
            document.getElementById('filtroFechaDesde').value = '';
            document.getElementById('filtroFechaHasta').value = '';
            this.currentFilters = null;
            this.renderCompras();
            this.showToast('✗ Filtros limpiados');
        });

        document.getElementById('cierreForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Recopilar billetes y monedas
            const billetes = {
                b500: parseInt(document.getElementById('b500').value) || 0,
                b200: parseInt(document.getElementById('b200').value) || 0,
                b100: parseInt(document.getElementById('b100').value) || 0,
                b50: parseInt(document.getElementById('b50').value) || 0,
                b20: parseInt(document.getElementById('b20').value) || 0,
                b10: parseInt(document.getElementById('b10').value) || 0,
                b5: parseInt(document.getElementById('b5').value) || 0,
                m2: parseInt(document.getElementById('m2').value) || 0,
                m1: parseInt(document.getElementById('m1').value) || 0,
                m050: parseInt(document.getElementById('m050').value) || 0,
                m020: parseInt(document.getElementById('m020').value) || 0,
                m010: parseInt(document.getElementById('m010').value) || 0,
                m005: parseInt(document.getElementById('m005').value) || 0,
                m002: parseInt(document.getElementById('m002').value) || 0,
                m001: parseInt(document.getElementById('m001').value) || 0
            };

            // Recopilar datáfonos
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

            const totalOtrosMedios = otrosMedios.reduce((sum, m) => sum + m.importe, 0);
            const totalDatafonos = datafonos.reduce((sum, d) => sum + d.importe, 0);
            
            // Calcular Dinero B desde otrosMedios
            const dineroB = otrosMedios.find(m => m.tipo === 'Dinero B (sin IVA)')?.importe || 0;

            const cierre = {
                fecha: document.getElementById('cierreFecha').value,
                turno: document.getElementById('cierreTurno').value,
                
                // Conteo real
                billetes: billetes,
                efectivoContado: this.calcularEfectivo(billetes),
                datafonos: datafonos,
                totalDatafonos: totalDatafonos,
                otrosMedios: otrosMedios,
                totalOtrosMedios: totalOtrosMedios,
                
                // Dinero B (sin IVA)
                dineroB: dineroB,
                
                // Datos POS
                posEfectivo: parseFloat(document.getElementById('posEfectivo').value) || 0,
                posTarjetas: parseFloat(document.getElementById('posTarjetas').value) || 0,
                posBizum: parseFloat(document.getElementById('posBizum').value) || 0,
                posTransferencias: parseFloat(document.getElementById('posTransferencias').value) || 0,
                posTickets: parseInt(document.getElementById('posTickets').value) || 0,
                
                // Descuadres
                descuadreEfectivo: this.calcularEfectivo(billetes) - (parseFloat(document.getElementById('posEfectivo').value) || 0),
                descuadreTarjetas: totalDatafonos - (parseFloat(document.getElementById('posTarjetas').value) || 0),
                descuadreBizum: (otrosMedios.find(m => m.tipo === 'Bizum')?.importe || 0) - (parseFloat(document.getElementById('posBizum').value) || 0),
                descuadreTransferencias: (otrosMedios.find(m => m.tipo === 'Transferencia')?.importe || 0) - (parseFloat(document.getElementById('posTransferencias').value) || 0),
                
                totalReal: this.calcularEfectivo(billetes) + totalDatafonos + totalOtrosMedios,
                totalPos: (parseFloat(document.getElementById('posEfectivo').value) || 0) +
                         (parseFloat(document.getElementById('posTarjetas').value) || 0) +
                         (parseFloat(document.getElementById('posBizum').value) || 0) +
                         (parseFloat(document.getElementById('posTransferencias').value) || 0)
            };

            cierre.descuadreTotal = cierre.totalReal - cierre.totalPos;
            cierre.numTickets = cierre.posTickets;

            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            
            if (editId) {
                cierre.id = editId;
                this.db.update('cierres', editId, cierre);
                this.showToast('✓ Cierre actualizado con descuadres calculados');
                delete form.dataset.editId;
            } else {
                this.db.add('cierres', cierre);
                this.showToast('✓ Cierre guardado con descuadres calculados');
            }
            
            this.resetCierreForm();
            document.getElementById('cierreFormCard').classList.add('hidden');
            document.getElementById('toggleCierreForm').textContent = '+ Nuevo Cierre';
            this.render();
        });

        document.getElementById('proveedorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            
            const proveedor = {
                nombreFiscal: document.getElementById('proveedorNombreFiscal').value,
                nombreComercial: document.getElementById('proveedorNombreComercial').value,
                nifCif: document.getElementById('proveedorNifCif').value,
                tipoProveedor: document.getElementById('proveedorTipo').value,
                direccion: document.getElementById('proveedorDireccion').value,
                codigoPostal: document.getElementById('proveedorCodigoPostal').value,
                ciudad: document.getElementById('proveedorCiudad').value,
                provincia: document.getElementById('proveedorProvincia').value,
                telefono: document.getElementById('proveedorTelefono').value,
                email: document.getElementById('proveedorEmail').value,
                personaContacto: document.getElementById('proveedorContacto').value,
                formaPago: document.getElementById('proveedorFormaPago').value,
                condicionesPago: document.getElementById('proveedorCondicionesPago').value,
                frecuenciaPedido: document.getElementById('proveedorFrecuencia').value,
                observaciones: document.getElementById('proveedorObservaciones').value,
                activo: true
            };
            
            if (editId) {
                proveedor.id = editId;
                this.db.update('proveedores', editId, proveedor);
                this.showToast('✓ Proveedor actualizado');
                delete form.dataset.editId;
            } else {
                this.db.add('proveedores', proveedor);
                this.showToast('✓ Proveedor guardado');
            }
            
            form.reset();
            this.render();
        });

        document.getElementById('productoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const esEmpaquetado = document.getElementById('productoEsEmpaquetado').value === 'true';
            const proveedorId = parseInt(document.getElementById('productoProveedorId').value);
            const proveedor = this.db.proveedores.find(p => p.id === proveedorId);
            
            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            
            const producto = {
                nombre: document.getElementById('productoNombre').value,
                proveedorId: proveedorId,
                proveedorNombre: proveedor ? proveedor.nombreFiscal : '',
                precioPromedioNeto: parseFloat(document.getElementById('productoPrecio').value),
                unidadBase: document.getElementById('productoUnidadBase').value,
                stockActualUnidades: parseFloat(document.getElementById('productoStockActual').value) || 0,
                esEmpaquetado: esEmpaquetado,
                tipoEmpaque: esEmpaquetado ? document.getElementById('productoTipoEmpaque').value : '',
                unidadesPorEmpaque: esEmpaquetado ? parseFloat(document.getElementById('productoUnidadesPorEmpaque').value) || 0 : 0,
                activo: true
            };
            
            if (editId) {
                producto.id = editId;
                this.db.update('productos', editId, producto);
                this.showToast('✓ Producto actualizado');
                delete form.dataset.editId;
            } else {
                this.db.add('productos', producto);
                this.showToast('✓ Producto guardado');
            }
            
            form.reset();
            document.getElementById('empaqueFields').classList.add('hidden');
            this.render();
        });

        // Escandallos - Calcular PVP Neto automáticamente
        document.getElementById('escandalloPVPConIVA').addEventListener('input', () => this.calcularPVPNeto());
        document.getElementById('escandalloTipoIVA').addEventListener('change', () => this.calcularPVPNeto());

        // Escandallos - Toggle formulario
        document.getElementById('toggleEscandalloForm').addEventListener('click', () => {
            const formCard = document.getElementById('escandalloFormCard');
            const isHidden = formCard.classList.contains('hidden') || formCard.style.display === 'none';
            
            if (isHidden) {
                this.expandForm('escandallo');
            } else {
                this.collapseForm('escandallo');
            }
        });

        // Escandallos - Añadir ingrediente
        document.getElementById('addIngrediente').addEventListener('click', () => {
            this.addIngredienteRow();
        });

        document.getElementById('escandalloForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const pvpConIva = parseFloat(document.getElementById('escandalloPVPConIVA').value);
            const tipoIva = parseFloat(document.getElementById('escandalloTipoIVA').value);
            const pvpNeto = pvpConIva / (1 + tipoIva / 100);
            
            // Recoger ingredientes
            const ingredientes = [];
            let hayErrores = false;
            
            document.querySelectorAll('.ingrediente-item').forEach(item => {
                const productoId = parseInt(item.querySelector('.ingrediente-producto').value);
                const cantidad = parseFloat(item.querySelector('.ingrediente-cantidad').value) || 0;
                const unidad = item.querySelector('.ingrediente-unidad').value;
                const costeUnitario = parseFloat(item.querySelector('.ingrediente-coste-unitario').value) || 0;
                const costeTotal = cantidad * costeUnitario;
                
                // Validaciones
                if (productoId && cantidad <= 0) {
                    hayErrores = true;
                    item.querySelector('.ingrediente-cantidad').style.borderColor = '#e74c3c';
                }
                if (productoId && costeUnitario <= 0) {
                    hayErrores = true;
                    item.querySelector('.ingrediente-coste-unitario').style.borderColor = '#e74c3c';
                }
                if (productoId && !unidad) {
                    hayErrores = true;
                    item.querySelector('.ingrediente-unidad').style.borderColor = '#e74c3c';
                }
                
                if (productoId && cantidad > 0 && costeUnitario > 0 && unidad) {
                    ingredientes.push({
                        productoId,
                        cantidad,
                        unidad,
                        costeUnitario,
                        costeTotal
                    });
                }
            });
            
            // Validar que hay ingredientes
            if (ingredientes.length === 0) {
                this.showModal('⚠️ Sin ingredientes', 'Debes añadir al menos un ingrediente al escandallo.', 'warning');
                return;
            }
            
            // Validar errores
            if (hayErrores) {
                this.showModal('⚠️ Errores en ingredientes', 'Revisa los campos marcados en rojo: cantidad > 0, coste > 0, unidad seleccionada.', 'error');
                return;
            }

            const costeTotalNeto = ingredientes.reduce((sum, ing) => sum + ing.costeTotal, 0);
            const foodCost = pvpNeto > 0 ? (costeTotalNeto / pvpNeto * 100) : 0;
            const margenBruto = pvpNeto - costeTotalNeto;
            const margenPorcentaje = pvpNeto > 0 ? (margenBruto / pvpNeto * 100) : 0;
            
            // Validación: Food Cost > 200%
            if (foodCost > 200) {
                const form = e.target;
                const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
                this.showConfirm(
                    '⚠️ Food Cost muy alto',
                    `El Food Cost es ${foodCost.toFixed(1)}% (más del 200%). ¿Seguro que los datos son correctos?`,
                    () => {
                        this.guardarEscandallo({
                            nombre: document.getElementById('escandalloNombre').value,
                            codigo: document.getElementById('escandalloCodigo').value || '',
                            pvpConIva,
                            tipoIva,
                            pvpNeto,
                            ingredientes,
                            costeTotalNeto,
                            foodCost,
                            margenBruto,
                            margenPorcentaje
                        }, editId);
                    }
                );
                return;
            }

            const escandallo = {
                nombre: document.getElementById('escandalloNombre').value,
                codigo: document.getElementById('escandalloCodigo').value || '',
                pvpConIva,
                tipoIva,
                pvpNeto,
                ingredientes,
                costeTotalNeto,
                foodCost,
                margenBruto,
                margenPorcentaje
            };

            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            this.guardarEscandallo(escandallo, editId);
        });

        document.getElementById('inventarioForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validar que no haya líneas en edición
            const lineasEditando = document.querySelectorAll('.inventario-producto-item[data-is-editing="true"]');
            if (lineasEditando.length > 0) {
                this.showToast('❌ Valida todas las líneas de inventario antes de guardar', true);
                lineasEditando.forEach(linea => {
                    linea.style.border = '2px solid #ff3b30';
                    setTimeout(() => { linea.style.border = ''; }, 2000);
                });
                return;
            }

            // Validar que haya al menos un producto
            const lineasValidadas = document.querySelectorAll('.inventario-producto-item.inventario-validated');
            if (lineasValidadas.length === 0) {
                this.showToast('❌ Añade al menos un producto al inventario', true);
                return;
            }
            
            // Recoger productos inventariados
            const productosInventariados = [];
            lineasValidadas.forEach(item => {
                const productoId = parseInt(item.querySelector('.inventario-producto-id').value);
                const producto = this.db.productos.find(p => p.id === productoId);
                
                if (!producto) return;
                
                const tipoConteo = item.querySelector('.inventario-tipo-conteo').value;
                let stockRealUnidades = 0;
                
                if (tipoConteo === 'solo-unidad') {
                    stockRealUnidades = parseFloat(item.querySelector('.inventario-stock-real').value) || 0;
                } else if (tipoConteo === 'solo-empaques') {
                    const numEmpaques = parseFloat(item.querySelector('.inventario-num-empaques-solo').value) || 0;
                    stockRealUnidades = numEmpaques * (producto.unidadesPorEmpaque || 0);
                } else if (tipoConteo === 'empaques-sueltas') {
                    const numEmpaques = parseFloat(item.querySelector('.inventario-num-empaques').value) || 0;
                    const unidadesSueltas = parseFloat(item.querySelector('.inventario-unidades-sueltas').value) || 0;
                    stockRealUnidades = (numEmpaques * (producto.unidadesPorEmpaque || 0)) + unidadesSueltas;
                }
                
                const stockTeorico = producto.stockActualUnidades;
                const diferencia = stockRealUnidades - stockTeorico;
                const valorDiferencia = diferencia * producto.precioPromedioNeto;
                
                productosInventariados.push({
                    productoId,
                    productoNombre: producto.nombre,
                    unidadBase: producto.unidadBase,
                    stockTeorico,
                    stockRealUnidades,
                    diferencia,
                    precioUnitario: producto.precioPromedioNeto,
                    valorDiferencia
                });
                
                // Actualizar stock del producto
                producto.stockActualUnidades = stockRealUnidades;
                this.db.update('productos', producto.id, producto);
            });
            
            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            
            const inventario = {
                fecha: document.getElementById('inventarioFecha').value,
                familia: document.getElementById('inventarioFamilia').value,
                productos: productosInventariados
            };
            
            if (editId) {
                inventario.id = editId;
                this.db.update('inventarios', editId, inventario);
                this.showToast('✓ Inventario actualizado - Stock actualizado');
                delete form.dataset.editId;
            } else {
                this.db.add('inventarios', inventario);
                this.showToast('✓ Inventario guardado - Stock actualizado');
            }
            
            form.reset();
            document.getElementById('inventarioProductosContainer').innerHTML = '';
            
            // Resetear estado de inventario
            this.inventarioState.hasEditingLine = false;
            this.inventarioState.editingLineId = null;
            document.getElementById('addProductoInventario').disabled = false;
            
            this.render();
        });

        document.getElementById('deliveryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const ventasBrutas = parseFloat(document.getElementById('deliveryVentas').value);
            const comision = parseFloat(document.getElementById('deliveryComision').value);
            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            
            const delivery = {
                fecha: document.getElementById('deliveryFecha').value,
                plataforma: document.getElementById('deliveryPlataforma').value,
                ventasBrutas: ventasBrutas,
                comisionPorcentaje: comision,
                comisionImporte: ventasBrutas * comision / 100,
                ingresoNeto: ventasBrutas - (ventasBrutas * comision / 100)
            };
            
            if (editId) {
                delivery.id = editId;
                this.db.update('delivery', editId, delivery);
                this.showToast('✓ Delivery actualizado');
                delete form.dataset.editId;
            } else {
                this.db.add('delivery', delivery);
                this.showToast('✓ Delivery guardado');
            }
            
            form.reset();
            this.render();
        });

        document.getElementById('cierreForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Calcular efectivo
            const billetes = {
                b500: parseInt(document.getElementById('b500').value) || 0,
                b200: parseInt(document.getElementById('b200').value) || 0,
                b100: parseInt(document.getElementById('b100').value) || 0,
                b50: parseInt(document.getElementById('b50').value) || 0,
                b20: parseInt(document.getElementById('b20').value) || 0,
                b10: parseInt(document.getElementById('b10').value) || 0,
                b5: parseInt(document.getElementById('b5').value) || 0,
                m2: parseInt(document.getElementById('m2').value) || 0,
                m1: parseInt(document.getElementById('m1').value) || 0,
                m050: parseInt(document.getElementById('m050').value) || 0,
                m020: parseInt(document.getElementById('m020').value) || 0,
                m010: parseInt(document.getElementById('m010').value) || 0,
                m005: parseInt(document.getElementById('m005').value) || 0,
                m002: parseInt(document.getElementById('m002').value) || 0,
                m001: parseInt(document.getElementById('m001').value) || 0
            };
            const totalEfectivo = this.calcularEfectivo(billetes);
            
            // Calcular datáfonos
            const datafonos = [];
            document.querySelectorAll('.datafono-item').forEach(item => {
                const nombre = item.querySelector('.datafono-nombre').value;
                const importe = parseFloat(item.querySelector('.datafono-importe').value) || 0;
                if (nombre && importe > 0) {
                    datafonos.push({ nombre, importe });
                }
            });
            const totalDatafonos = datafonos.reduce((sum, d) => sum + d.importe, 0);
            
            // Otros medios
            const otrosMedios = [];
            document.querySelectorAll('.otro-medio-item').forEach(item => {
                const tipo = item.querySelector('.otro-medio-tipo').value;
                const importe = parseFloat(item.querySelector('.otro-medio-importe').value) || 0;
                if (tipo && importe > 0) {
                    otrosMedios.push({ tipo, importe });
                }
            });
            
            // POS
            const posEfectivo = parseFloat(document.getElementById('posEfectivo').value) || 0;
            const posTarjetas = parseFloat(document.getElementById('posTarjetas').value) || 0;
            const posBizum = document.getElementById('posBizum') ? (parseFloat(document.getElementById('posBizum').value) || 0) : 0;
            const posTransferencias = document.getElementById('posTransferencias') ? (parseFloat(document.getElementById('posTransferencias').value) || 0) : 0;
            
            const form = e.target;
            const editId = form.dataset.editId ? parseInt(form.dataset.editId) : null;
            
            const cierre = {
                fecha: document.getElementById('cierreFecha').value,
                turno: document.getElementById('cierreTurno').value,
                billetes,
                totalEfectivo,
                datafonos,
                totalDatafonos,
                otrosMedios,
                posEfectivo,
                posTarjetas,
                posBizum,
                posTransferencias,
                descuadreEfectivo: totalEfectivo - posEfectivo,
                descuadreTarjetas: totalDatafonos - posTarjetas
            };
            
            if (editId) {
                cierre.id = editId;
                this.db.update('cierres', editId, cierre);
                this.showToast('✓ Cierre actualizado');
                delete form.dataset.editId;
            } else {
                this.db.add('cierres', cierre);
                this.showToast('✓ Cierre guardado');
            }
            
            form.reset();
            this.render();
        });

        // Set today's date
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.value = new Date().toISOString().split('T')[0];
        });

        // Productos - Añadir producto a inventario
        const btnAddProductoInv = document.getElementById('addProductoInventario');
        if (btnAddProductoInv) {
            btnAddProductoInv.addEventListener('click', () => this.addProductoInventario());
        }

        // Alta rápida de producto desde inventario
        document.getElementById('altaRapidaProductoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarAltaRapidaProducto();
        });
    }

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
                <button type="button" class="btn-success inventario-btn-validar" onclick="app.validarLineaInventario(${rowId})">✓ Validar Conteo</button>
                <button type="button" class="btn-delete" onclick="app.removeProductoInventario(${rowId})">🗑️ Quitar</button>
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
            html += `<div class="inventario-producto-option" onclick="app.selectProductoInventario(${rowId}, ${p.id})">
                ${p.nombre} <span style="color: #7f8c8d; font-size: 12px;">(${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</span>
            </div>`;
        });

        // Opción de alta rápida
        if (searchTerm.length > 2) {
            html += `<div class="inventario-producto-option inventario-alta-rapida" onclick="app.abrirModalAltaRapida('${searchTerm.replace(/'/g, "\\'")}', ${rowId})">
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
                html += `<div class="inventario-producto-option" onclick="app.selectProductoInventario(${rowId}, ${p.id})">
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
            const sueltas = parseFloat(row.querySelector('.inventario-unidades-sueltas').value) || 0;
            stockContado = (numEmpaques * (producto.unidadesPorEmpaque || 0)) + sueltas;
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
        // Hide all views
        document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));
        
        // Show current view
        const viewMap = {
            'ocr': 'ocrView',
            'cierres': 'cierresView',
            'compras': 'comprasView',
            'proveedores': 'proveedoresView',
            'productos': 'productosView',
            'escandallos': 'escandallosView',
            'inventario': 'inventarioView',
            'delivery': 'deliveryView',
            'pnl': 'pnlView'
        };
        
        document.getElementById(viewMap[this.currentView]).classList.remove('hidden');

        // Update header
        const titles = {
            'ocr': 'OCR - Registro Manual',
            'cierres': '🧾 Cierres de Caja',
            'compras': '📦 Compras (Facturas & Albaranes)',
            'proveedores': '🏢 Proveedores',
            'productos': '🥘 Productos',
            'escandallos': '📋 Escandallos',
            'inventario': '📊 Inventario',
            'delivery': '🛵 Delivery',
            'pnl': '💰 Cuenta de Explotación'
        };
        document.getElementById('viewTitle').textContent = titles[this.currentView];

        // Update total
        const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        const delivery = this.db.getByPeriod('delivery', this.currentPeriod);
        const totalVentas = cierres.reduce((sum, c) => sum + c.totalReal, 0) +
                           delivery.reduce((sum, d) => sum + d.ingresoNeto, 0);
        document.getElementById('totalPeriodo').textContent = totalVentas.toFixed(0) + '€';

        // Render specific view content
        switch(this.currentView) {
            case 'cierres':
                this.renderCierres();
                // FORZAR formulario colapsado (método robusto)
                this.collapseForm('cierre');
                break;
            case 'compras':
                this.renderCompras();
                break;
            case 'proveedores':
                this.renderProveedores();
                // Colapsar formulario al entrar
                const proveedorFormCard = document.getElementById('proveedorFormCard');
                const toggleProveedorBtn = document.getElementById('toggleProveedorForm');
                if (proveedorFormCard && toggleProveedorBtn) {
                    proveedorFormCard.classList.add('hidden');
                    proveedorFormCard.style.display = 'none';
                    toggleProveedorBtn.textContent = '+ Nuevo Proveedor';
                }
                break;
            case 'productos':
                this.renderProductos();
                // Colapsar formulario al entrar
                const productoFormCard = document.getElementById('productoFormCard');
                const toggleProductoBtn = document.getElementById('toggleProductoForm');
                if (productoFormCard && toggleProductoBtn) {
                    productoFormCard.classList.add('hidden');
                    productoFormCard.style.display = 'none';
                    toggleProductoBtn.textContent = '+ Nuevo Producto';
                }
                break;
            case 'escandallos':
                this.renderEscandallos();
                // FORZAR formulario colapsado
                this.collapseForm('escandallo');
                break;
            case 'inventario':
                this.renderInventarios();
                break;
            case 'delivery':
                this.renderDelivery();
                break;
            case 'pnl':
                this.renderPnL();
                break;
        }
    }

    renderCierres() {
        const cierres = this.db.getByPeriod('cierres', this.currentPeriod);
        const html = cierres.length > 0 ? cierres.reverse().map(c => {
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
            
            const bizumPOS = c.posBizum || 0;
            const bizumReal = c.otrosMedios ? (c.otrosMedios.find(m => m.tipo === 'Bizum')?.importe || 0) : 0;
            const deltaBizum = bizumReal - bizumPOS;
            
            const transPOS = c.posTransferencias || 0;
            const transReal = c.otrosMedios ? (c.otrosMedios.find(m => m.tipo === 'Transferencia')?.importe || 0) : 0;
            const deltaTrans = transReal - transPOS;
            
            // Resumen compacto (una línea)
            const resumenCompacto = `POS: ${c.totalPos.toFixed(2)} €  |  REAL: ${c.totalReal.toFixed(2)} €  |  Δ: ${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €  |  Tickets: ${c.numTickets}  |  Ticket medio: ${ticketMedio} €`;
            
            // Función auxiliar para clase de diferencia
            const deltaClass = (delta) => {
                const abs = Math.abs(delta);
                return abs <= 0.01 ? 'delta-cero' : 'delta-descuadre';
            };
            
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
                <!-- CABECERA COMPACTA -->
                <div class="cierre-header-compacta">
                    <div class="cierre-titulo-compacta">
                        Cierre ${c.fecha} – ${c.turno}
                    </div>
                    <div class="cierre-resumen-inline">
                        ${resumenCompacto}
                    </div>
                    <div class="cierre-header-derecha">
                        <div class="cierre-badge-v2 ${badgeClass}">${badgeText}</div>
                        <button class="btn-edit" onclick="app.editItem('cierres', ${c.id})" title="Editar">✏️</button>
                        <button class="btn-delete" onclick="app.deleteItem('cierres', ${c.id})" title="Eliminar">🗑️</button>
                        <button class="btn-toggle-detalle" onclick="this.closest('.cierre-card-compacta').classList.toggle('detalle-visible')" title="Ver detalle">▼</button>
                    </div>
                </div>
                
                <!-- DETALLE DESPLEGABLE -->
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
                                    <td class="${deltaClass(deltaEfectivo)}">${deltaEfectivo >= 0 ? '+' : ''}${deltaEfectivo.toFixed(2)} €</td>
                                </tr>
                                <tr>
                                    <td>💳 Tarjetas</td>
                                    <td>${tarjetasPOS.toFixed(2)} €</td>
                                    <td>${tarjetasReal.toFixed(2)} €</td>
                                    <td class="${deltaClass(deltaTarjetas)}">${deltaTarjetas >= 0 ? '+' : ''}${deltaTarjetas.toFixed(2)} €</td>
                                </tr>
                                ${bizumReal > 0 || bizumPOS > 0 ? `
                                <tr>
                                    <td>📲 Bizum</td>
                                    <td>${bizumPOS.toFixed(2)} €</td>
                                    <td>${bizumReal.toFixed(2)} €</td>
                                    <td class="${deltaClass(deltaBizum)}">${deltaBizum >= 0 ? '+' : ''}${deltaBizum.toFixed(2)} €</td>
                                </tr>` : ''}
                                ${transReal > 0 || transPOS > 0 ? `
                                <tr>
                                    <td>🏦 Transferencias</td>
                                    <td>${transPOS.toFixed(2)} €</td>
                                    <td>${transReal.toFixed(2)} €</td>
                                    <td class="${deltaClass(deltaTrans)}">${deltaTrans >= 0 ? '+' : ''}${deltaTrans.toFixed(2)} €</td>
                                </tr>` : ''}
                                ${c.otrosMedios && c.otrosMedios.filter(m => m.tipo !== 'Bizum' && m.tipo !== 'Transferencia').length > 0 ? c.otrosMedios.filter(m => m.tipo !== 'Bizum' && m.tipo !== 'Transferencia').map(m => `
                                <tr>
                                    <td>💰 ${m.tipo}</td>
                                    <td>–</td>
                                    <td>${m.importe.toFixed(2)} €</td>
                                    <td class="delta-cero">–</td>
                                </tr>`).join('') : ''}
                                <tr class="fila-total">
                                    <td><strong>TOTAL</strong></td>
                                    <td><strong>${c.totalPos.toFixed(2)} €</strong></td>
                                    <td><strong>${c.totalReal.toFixed(2)} €</strong></td>
                                    <td class="${deltaClass(c.descuadreTotal)}"><strong>${c.descuadreTotal >= 0 ? '+' : ''}${c.descuadreTotal.toFixed(2)} €</strong></td>
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
        }).join('') : '<p class="empty-state">No hay cierres registrados</p>';
        
        document.getElementById('listaCierres').innerHTML = html;
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
                    ${f.archivoData ? `<button class="btn-view" onclick="app.verArchivoFactura(${f.id})" title="Ver archivo">🔍</button>` : ''}
                    <button class="btn-verify-factura" onclick="app.verificarFacturaAlbaranes(${f.id})" title="Verificar albaranes">📋</button>
                    <button class="btn-edit" onclick="app.editItem('facturas', ${f.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('facturas', ${f.id})" title="Eliminar">🗑️</button>
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
                    <button class="btn-edit" onclick="app.editItem('albaranes', ${a.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('albaranes', ${a.id})">🗑️</button>
                </div>
            </div>
        `).join('') : '<p class="empty-state">No hay albaranes registrados</p>';
        
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
                        <button onclick="app.cerrarVisorArchivo()" class="btn-secondary">✕ Cerrar</button>
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
        console.log('📋 DEBUG RENDER - Total proveedores:', proveedores.length);
        console.log('📋 DEBUG RENDER - Proveedores completos:', proveedores);
        
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
                    <button class="btn-edit" onclick="app.editItem('proveedores', ${p.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('proveedores', ${p.id})">🗑️</button>
                </div>
            </div>
            `;
        }).join('') : '<p class="empty-state">No hay proveedores registrados</p>';
        
        console.log('📋 DEBUG RENDER - HTML generado (primeros 500 chars):', html.substring(0, 500));
        console.log('📋 DEBUG RENDER - Elemento listaProveedores existe?:', !!document.getElementById('listaProveedores'));
        
        const contenedor = document.getElementById('listaProveedores');
        if (contenedor) {
            contenedor.innerHTML = html;
            console.log('📋 DEBUG RENDER - HTML insertado correctamente. Children:', contenedor.children.length);
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
                    <button class="btn-edit" onclick="app.editItem('productos', ${p.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('productos', ${p.id})">🗑️</button>
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
                        <button class="btn-edit" onclick="app.editItem('escandallos', ${e.id})">✏️</button>
                        <button class="btn-delete" onclick="app.deleteItem('escandallos', ${e.id})">🗑️</button>
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
                </div>
                ` : ''}
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
        const pvpConIva = parseFloat(document.getElementById('escandalloPVPConIVA').value) || 0;
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
            <button type="button" class="btn-delete" onclick="app.removeIngredienteRow(${rowId})">🗑️</button>
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
                    <button class="btn-edit" onclick="app.editItem('inventarios', ${i.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('inventarios', ${i.id})">🗑️</button>
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
                    <button class="btn-edit" onclick="app.editItem('delivery', ${d.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('delivery', ${d.id})">🗑️</button>
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
        // Validate file type (images + PDF) - permitir variaciones de extensión
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.split('.').pop();
        const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'pdf'];
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff', 'application/pdf'];
        
        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            this.showToast('⚠️ Formato no soportado. Use: JPG, PNG, WEBP, BMP, TIFF o PDF', true);
            document.getElementById('ocrFile').value = '';
            return;
        }
        
        // Validate file size (20MB max)
        if (file.size > 20 * 1024 * 1024) {
            this.showToast('⚠️ El archivo es demasiado grande (máximo 20MB)', true);
            document.getElementById('ocrFile').value = '';
            return;
        }

        // Si es PDF, intentar extraer texto embebido primero
        if (file.type === 'application/pdf' || fileExtension === 'pdf') {
            this.showToast('📝 Procesando PDF...');
            try {
                // Verificar que PDF.js está cargado
                if (typeof pdfjsLib === 'undefined') {
                    throw new Error('PDF.js no está cargado');
                }
                
                // PASO 1: Intentar extraer texto embebido (MUCHO MÁS RÁPIDO)
                const extractedText = await this.extractPDFText(file);
                
                if (extractedText && extractedText.length > 100) {
                    // PDF con texto embebido - NO necesita OCR
                    this.showToast('✅ PDF con texto embebido detectado (sin OCR)');
                    this.currentPDFText = extractedText;
                    this.isPDFWithEmbeddedText = true;
                    
                    // Generar preview visual del PDF
                    const imageData = await this.convertPDFToImage(file);
                    document.getElementById('ocrPreviewImg').src = imageData;
                    document.getElementById('ocrPreviewContainer').classList.remove('hidden');
                    document.getElementById('ocrUploadCard').classList.remove('hidden');
                } else {
                    // PDF escaneado - NECESITA OCR con Tesseract
                    this.showToast('📸 PDF escaneado detectado, usando OCR...');
                    this.isPDFWithEmbeddedText = false;
                    const imageData = await this.convertPDFToImage(file);
                    this.currentImageData = imageData;
                    document.getElementById('ocrPreviewImg').src = imageData;
                    document.getElementById('ocrPreviewContainer').classList.remove('hidden');
                    document.getElementById('ocrUploadCard').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error convirtiendo PDF:', error);
                this.showToast('❌ Error al procesar PDF. Intenta con una imagen JPG/PNG', true);
                document.getElementById('ocrFile').value = '';
            }
            return;
        }

        // Preview image y preprocesar
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                // Preprocesar imagen para mejorar OCR
                const preprocessedImage = await this.preprocessImage(e.target.result);
                document.getElementById('ocrPreviewImg').src = preprocessedImage;
                document.getElementById('ocrPreviewContainer').classList.remove('hidden');
                document.getElementById('ocrUploadCard').classList.remove('hidden');
                this.currentImageData = preprocessedImage;
                this.currentFileType = file.type; // Guardar tipo de archivo
                this.showToast('✅ Imagen cargada correctamente');
            } catch (error) {
                console.error('Error procesando imagen:', error);
                this.showToast('❌ Error al procesar imagen', true);
                document.getElementById('ocrFile').value = '';
            }
        };
        reader.onerror = () => {
            this.showToast('❌ Error al leer el archivo', true);
            document.getElementById('ocrFile').value = '';
        };
        reader.readAsDataURL(file);
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
                    return a.x - b.x; // Mismo Y → orden X
                });
            });

            // Reconstruir texto estructurado
            const structuredText = {
                proveedor: zones.topLeft.map(i => i.text).join(' '),
                cliente: zones.topRight.map(i => i.text).join(' '),
                detalle: zones.center.map(i => i.text).join(' '),
                totales: zones.bottom.map(i => i.text).join(' ')
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
                console.error('Error detallado PDF:', error);
                reject(error);
            }
        });
    }

    async preprocessImage(imageData) {
        // Preprocesar imagen para mejorar OCR: brillo, contraste, binarización
        return new Promise((resolve) => {
            const img = new Image();
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
                    console.log('✓ Proveedor detectado (zona proveedor con forma societaria):', lineaTrim);
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
                        !linea.match(/^(factura|invoice|fecha|date|total|subtotal|cliente:|email|www\.|http|tel[eé]fono|calle|avenida|plaza|carrer|c\/)/i) &&
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
            const empresaMixta = text.match(/\b([A-ZÁÉÍÓÚÑ][A-ZÀ-ÿa-z0-9\s&\.\-]{3,50}?\s*(?:S\.?L\.?|S\.?A\.?))\s+(?:Carrer|Calle|C\/|Avda|Avenida)/i);
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
        
        // Patrón 3: Buscar en las primeras 10 líneas del documento (cabecera) - MEJORADO
        if (!data.proveedor.value) {
            const primerasLineas = text.split('\n').slice(0, 10);
            for (const linea of primerasLineas) {
                const lineaTrim = linea.trim();
                // Buscar líneas con nombres de empresa típicos (MAYOR TOLERANCIA)
                if (lineaTrim.length > 4 && lineaTrim.length < 100 &&
                    !lineaTrim.match(/^(factura|invoice|fecha|total|cliente:|NIF|CIF|tel|email|www|http|carrer|calle)/i) &&
                    !lineaTrim.match(/^\d+[\.,]\d+/) && // No es precio
                    !lineaTrim.match(/^\+?\d+/) && // No es teléfono
                    (lineaTrim.match(/S\.?L\.?|SL|S\.?A\.?|SA|BCN|GROUP|FOODS|RESTAURANT|DELIVERY|DELIVERYIFY|SUMINISTROS|DISTRIBUCIONES/i) || 
                     (lineaTrim.match(/^[A-ZÁÉÍÓÚÑ][A-ZÀ-ÿa-z0-9\s&\.\-]{2,}$/) && lineaTrim.split(' ').length <= 8))) {
                    data.proveedor = { value: lineaTrim, confidence: confidence * 0.8 };
                    console.log('✓ Proveedor detectado (cabecera):', lineaTrim);
                    break;
                }
            }
        }
        
        // Patrón 4: ÚLTIMO RECURSO - Tomar primera línea con mayúsculas significativas
        if (!data.proveedor.value) {
            const primerasLineas = text.split('\n').slice(0, 15);
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
                    // Internacional: +34XXXXXXXXX (12 chars) o similar
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

    displayOCRForm(data, tipo) {
        const getConfidenceClass = (conf) => {
            if (conf >= 85) return 'high';
            if (conf >= 60) return 'medium';
            return 'low';
        };

        const getConfidenceBadge = (conf) => {
            const cls = getConfidenceClass(conf);
            let icon = '🟢'; // Verde
            let texto = 'Alta confianza';
            if (cls === 'medium') {
                icon = '🟡'; // Amarillo
                texto = 'Revisar';
            } else if (cls === 'low') {
                icon = '🔴'; // Rojo
                texto = 'Corregir';
            }
            return `<span class="field-confidence ${cls}" title="${texto}: ${Math.round(conf)}%">${icon}</span>`;
        };

        let html = '';
        
        // SECCIÓN DE VERIFICACIÓN (solo para facturas)
        if (tipo === 'factura') {
            const baseImponible = data.baseImponible.value || 0;
            const ivaAmount = data.iva.value || 0;
            const totalConIva = data.total.value || 0;
            const baseNeta = baseImponible > 0 ? baseImponible : totalConIva > 0 ? (totalConIva / 1.10) : 0;
            
            // Calcular coherencia
            const calculado = baseNeta + ivaAmount;
            const coherente = totalConIva > 0 && Math.abs(calculado - totalConIva) <= 0.01;
            
            // Verificar si factura ya existe (con validación de campos)
            const facturaExistente = (data.numero.value && data.proveedor.value) ? this.db.facturas.find(f => 
                f.numeroFactura === data.numero.value && 
                f.proveedor && f.proveedor.toLowerCase() === data.proveedor.value.toLowerCase()
            ) : null;
            const esDuplicada = !!facturaExistente;
            
            html += `
            <div class="ocr-verification-panel" style="background: ${coherente ? '#e8f5e9' : '#fff3e0'}; border: 2px solid ${coherente ? '#4caf50' : '#ff9800'}; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 12px 0; color: #1f2d3d; font-size: 15px;">
                    ${coherente ? '✅' : '⚠️'} Verificación de Importes
                    ${esDuplicada ? ' <span style="color: #e74c3c; font-weight: 700; margin-left: 15px;">🚨 FACTURA YA INTRODUCIDA</span>' : ''}
                </h4>
                ${esDuplicada ? `
                <div style="background: #fee; border-left: 3px solid #e74c3c; padding: 12px; margin-bottom: 15px; border-radius: 4px;">
                    <strong style="color: #c0392b;">⚠️ Esta factura (${data.numero.value} - ${data.proveedor.value}) ya está registrada</strong><br>
                    <small style="color: #7f8c8d;">Fecha: ${facturaExistente.fecha} | Base: ${facturaExistente.baseImponible.toFixed(2)}€</small>
                </div>` : ''}
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 13px;">
                    <div>
                        <div style="color: #7f8c8d; font-weight: 500;">Nº Factura</div>
                        <div style="font-weight: 600; color: ${esDuplicada ? '#e74c3c' : '#1f2d3d'};">${data.numero.value || '-'} ${getConfidenceBadge(data.numero.confidence)}</div>
                    </div>
                    <div>
                        <div style="color: #7f8c8d; font-weight: 500;">Fecha</div>
                        <div style="font-weight: 600; color: #1f2d3d;">${data.fecha.value || '-'}</div>
                    </div>
                    <div>
                        <div style="color: #7f8c8d; font-weight: 500;">Base NETA</div>
                        <div style="font-weight: 700; color: #1171ef;">${baseNeta.toFixed(2)}€ ${getConfidenceBadge(data.baseImponible.confidence)}</div>
                    </div>
                    <div>
                        <div style="color: #7f8c8d; font-weight: 500;">IVA</div>
                        <div style="font-weight: 600; color: #1f2d3d;">${ivaAmount.toFixed(2)}€ ${getConfidenceBadge(data.iva.confidence)}</div>
                    </div>
                </div>
                <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                    <div>
                        <div style="color: #7f8c8d; font-weight: 500; text-align: right;">Total CON IVA</div>
                        <div style="font-weight: 700; font-size: 18px; color: ${coherente ? '#4caf50' : '#ff9800'}; text-align: right;">${totalConIva.toFixed(2)}€ ${getConfidenceBadge(data.total.confidence)}</div>
                    </div>
                </div>
                ${!coherente && totalConIva > 0 ? `
                <div style="margin-top: 10px; padding: 8px; background: #fff; border-left: 3px solid #ff9800; font-size: 12px; color: #e65100;">
                    <strong>⚠️ Revisa los importes:</strong> Base (${baseNeta.toFixed(2)}) + IVA (${ivaAmount.toFixed(2)}) = ${(baseNeta + ivaAmount).toFixed(2)}€ ≠ Total (${totalConIva.toFixed(2)})€
                </div>` : ''}
            </div>`;
        }
        
        html += `<div class="form-group">
            <label>📄 Texto Original Extraído</label>
            <textarea readonly rows="4" style="font-size: 12px; background: #f8f9fa;">${data.text.substring(0, 500)}...</textarea>
        </div>`;

        if (tipo === 'factura') {
            // CONVERSIÓN AUTOMÁTICA A NETO
            const baseImponible = data.baseImponible.value || 0;
            const ivaAmount = data.iva.value || 0;
            const totalConIva = data.total.value || 0;
            
            // Si tenemos total pero no base, calcular base NETA (asumiendo 10% IVA)
            const baseNeta = baseImponible > 0 ? baseImponible : totalConIva > 0 ? (totalConIva / 1.10) : 0;

            // Verificar si el proveedor ya existe (exacto o similar)
            let proveedorExistente = null;
            let proveedoresSimilares = [];
            
            // Búsqueda por CIF (exacta)
            if (data.nif.value) {
                proveedorExistente = this.db.proveedores.find(p => p.nifCif === data.nif.value);
            }
            
            // Búsqueda por nombre (exacta)
            if (!proveedorExistente && data.proveedor.value) {
                proveedorExistente = this.db.proveedores.find(p => 
                    p.nombreFiscal.toLowerCase() === data.proveedor.value.toLowerCase()
                );
            }
            
            // Búsqueda de similares (para sugerir)
            if (!proveedorExistente && data.proveedor.value && data.proveedor.value.length > 3) {
                const nombreBuscado = data.proveedor.value.toLowerCase();
                proveedoresSimilares = this.db.proveedores.filter(p => {
                    const nombreProveedor = p.nombreFiscal.toLowerCase();
                    // Similitud: contiene parte del nombre o viceversa
                    return nombreProveedor.includes(nombreBuscado.substring(0, Math.min(5, nombreBuscado.length))) ||
                           nombreBuscado.includes(nombreProveedor.substring(0, Math.min(5, nombreProveedor.length)));
                }).slice(0, 3); // Máximo 3 sugerencias
            }
            
            const esProveedorNuevo = !proveedorExistente;
            const nombreProveedor = proveedorExistente ? proveedorExistente.nombreFiscal : data.proveedor.value;
            const haySimilares = proveedoresSimilares.length > 0;
            
            html += `
                <div class="form-row">
                    <div class="form-group">
                        <label>Proveedor ${getConfidenceBadge(data.proveedor.confidence)}</label>
                        <input type="text" id="ocr_proveedor" value="${nombreProveedor}" required onchange="app.verificarProveedorSimilar()">
                        ${esProveedorNuevo ? (haySimilares ? '<small style="color: #e67e22; font-weight: 600;">⚠️ Proveedores similares encontrados - verificar abajo</small>' : '<small style="color: #e67e22; font-weight: 600;">⚠️ Proveedor nuevo - se creará automáticamente</small>') : '<small style="color: #27ae60; font-weight: 600;">✓ Proveedor existente</small>'}
                    </div>
                    <div class="form-group">
                        <label>NIF/CIF ${getConfidenceBadge(data.nif.confidence)}</label>
                        <input type="text" id="ocr_nif" value="${data.nif.value}">
                    </div>
                </div>
                
                ${haySimilares && esProveedorNuevo ? `
                <div style="background: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="margin: 0 0 10px 0; color: #d68910; font-size: 14px;">🔍 Proveedores Similares Encontrados</h4>
                    <p style="margin: 0 0 10px 0; color: #7f8c8d; font-size: 13px;">¿El proveedor detectado es uno de estos?</p>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${proveedoresSimilares.map(p => `
                            <label style="display: flex; align-items: center; padding: 8px; background: white; border: 1px solid #e3e8ef; border-radius: 4px; cursor: pointer;">
                                <input type="radio" name="proveedor_similar" value="${p.id}" onchange="app.seleccionarProveedorExistente('${p.id}', '${p.nombreFiscal.replace(/'/g, "\\'")}')"> 
                                <span style="margin-left: 8px; font-weight: 600;">${p.nombreFiscal}</span>
                                ${p.nifCif ? `<small style="margin-left: 8px; color: #7f8c8d;">(${p.nifCif})</small>` : ''}
                            </label>
                        `).join('')}
                        <label style="display: flex; align-items: center; padding: 8px; background: white; border: 2px solid #e67e22; border-radius: 4px; cursor: pointer;">
                            <input type="radio" name="proveedor_similar" value="nuevo" onchange="app.confirmarProveedorNuevo()" checked>
                            <span style="margin-left: 8px; font-weight: 600; color: #e67e22;">✨ Crear nuevo proveedor</span>
                        </label>
                    </div>
                </div>
                ` : ''}
                
                <div id="ocr_datos_adicionales_proveedor" style="display: ${esProveedorNuevo && !haySimilares ? 'block' : 'none'};">
                ${esProveedorNuevo ? `
                <div style="background: #fff3cd; border-left: 4px solid #e67e22; padding: 15px; margin: 15px 0; border-radius: 6px;">
                    <h4 style="margin: 0 0 10px 0; color: #d68910; font-size: 14px;">📋 Datos Adicionales del Nuevo Proveedor</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email ${data.email && data.email.value ? getConfidenceBadge(data.email.confidence) : ''}</label>
                            <input type="email" id="ocr_proveedor_email" placeholder="contacto@empresa.com" value="${data.email ? data.email.value : ''}">
                        </div>
                        <div class="form-group">
                            <label>Teléfono ${data.telefono && data.telefono.value ? getConfidenceBadge(data.telefono.confidence) : ''}</label>
                            <input type="tel" id="ocr_proveedor_telefono" placeholder="+34 XXX XXX XXX" value="${data.telefono ? data.telefono.value : ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Dirección ${data.direccion && data.direccion.value ? getConfidenceBadge(data.direccion.confidence) : ''}</label>
                        <input type="text" id="ocr_proveedor_direccion" placeholder="Calle, número..." value="${data.direccion ? data.direccion.value : ''}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Código Postal ${data.codigoPostal && data.codigoPostal.value ? getConfidenceBadge(data.codigoPostal.confidence) : ''}</label>
                            <input type="text" id="ocr_proveedor_cp" placeholder="08001" value="${data.codigoPostal ? data.codigoPostal.value : ''}">
                        </div>
                        <div class="form-group">
                            <label>Ciudad ${data.ciudad && data.ciudad.value ? getConfidenceBadge(data.ciudad.confidence) : ''}</label>
                            <input type="text" id="ocr_proveedor_ciudad" placeholder="Barcelona" value="${data.ciudad ? data.ciudad.value : ''}">
                        </div>
                        <div class="form-group">
                            <label>Provincia</label>
                            <input type="text" id="ocr_proveedor_provincia" placeholder="Barcelona" value="${data.ciudad ? data.ciudad.value : ''}">
                        </div>
                    </div>
                </div>
                ` : ''}
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº Factura ${getConfidenceBadge(data.numero.confidence)}</label>
                        <input type="text" id="ocr_numero" value="${data.numero.value}" required>
                        <small class="form-help" id="ocr_numero_warning" style="display: none; color: #e67e22; font-weight: 600;">⚠️ Ya existe una factura con este número</small>
                    </div>
                    <div class="form-group">
                        <label>Fecha ${getConfidenceBadge(data.fecha.confidence)}</label>
                        <input type="date" id="ocr_fecha" value="${data.fecha.value}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Base Imponible NETA (€) ${getConfidenceBadge(data.baseImponible.confidence)}</label>
                        <input type="number" step="0.01" id="ocr_base" value="${baseNeta.toFixed(2)}" required>
                        <small class="form-help">⚠️ SIEMPRE SIN IVA (conversión automática aplicada)</small>
                    </div>
                    <div class="form-group">
                        <label>Total CON IVA (€) ${getConfidenceBadge(data.total.confidence)}</label>
                        <input type="number" step="0.01" id="ocr_total" value="${totalConIva.toFixed(2)}">
                        <small class="form-help">Solo para referencia - base NETA es lo que se registra</small>
                    </div>
                </div>
            `;
        } else if (tipo === 'albaran') {
            html += `
                <div class="form-row">
                    <div class="form-group">
                        <label>Proveedor ${getConfidenceBadge(data.proveedor.confidence)}</label>
                        <input type="text" id="ocr_proveedor" value="${data.proveedor.value}" required>
                    </div>
                    <div class="form-group">
                        <label>Nº Albarán ${getConfidenceBadge(data.numero.confidence)}</label>
                        <input type="text" id="ocr_numero" value="${data.numero.value}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Fecha ${getConfidenceBadge(data.fecha.confidence)}</label>
                    <input type="date" id="ocr_fecha" value="${data.fecha.value}" required>
                </div>
            `;
        } else if (tipo === 'cierre') {
            html += `
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha ${getConfidenceBadge(data.fecha.confidence)}</label>
                        <input type="date" id="ocr_fecha" value="${data.fecha.value}" required>
                    </div>
                    <div class="form-group">
                        <label>Total Cierre (€) ${getConfidenceBadge(data.total.confidence)}</label>
                        <input type="number" step="0.01" id="ocr_total" value="${data.total.value.toFixed(2)}" required>
                    </div>
                </div>
            `;
        } else if (tipo === 'delivery') {
            html += `
                <div class="form-row">
                    <div class="form-group">
                        <label>Plataforma</label>
                        <select id="ocr_plataforma" required>
                            <option value="Uber Eats">Uber Eats</option>
                            <option value="Glovo">Glovo</option>
                            <option value="Just Eat">Just Eat</option>
                            <option value="Deliveroo">Deliveroo</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Fecha ${getConfidenceBadge(data.fecha.confidence)}</label>
                        <input type="date" id="ocr_fecha" value="${data.fecha.value}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Ventas Brutas (€)</label>
                        <input type="number" step="0.01" id="ocr_ventas" value="${data.total.value.toFixed(2)}" required>
                    </div>
                    <div class="form-group">
                        <label>Comisión (%)</label>
                        <input type="number" step="0.1" id="ocr_comision" value="30" required>
                    </div>
                </div>
            `;
        }

        document.getElementById('ocrDynamicForm').innerHTML = html;
        document.getElementById('ocrSaveBtn').disabled = false;
        this.currentOCRExtractedData = data;
        
        // Añadir listeners para recálculo automático (solo facturas)
        if (tipo === 'factura') {
            const inputBase = document.getElementById('ocr_base');
            const inputTotal = document.getElementById('ocr_total');
            const inputNumero = document.getElementById('ocr_numero');
            const inputProveedor = document.getElementById('ocr_proveedor');
            const warningNumero = document.getElementById('ocr_numero_warning');
            
            if (inputBase && inputTotal) {
                const recalcular = () => {
                    const base = parseFloat(inputBase.value) || 0;
                    const total = parseFloat(inputTotal.value) || 0;
                    const iva = total - base;
                    
                    // Actualizar panel de verificación
                    const coherente = Math.abs((base + iva) - total) <= 0.01;
                    const panel = document.querySelector('.ocr-verification-panel');
                    if (panel && total > 0) {
                        panel.style.background = coherente ? '#e8f5e9' : '#fff3e0';
                        panel.style.borderColor = coherente ? '#4caf50' : '#ff9800';
                    }
                };
                
                inputBase.addEventListener('input', recalcular);
                inputTotal.addEventListener('input', recalcular);
            }
            
            // Detectar duplicados en tiempo real
            if (inputNumero && inputProveedor && warningNumero) {
                const checkDuplicado = () => {
                    const numero = inputNumero.value.trim();
                    const proveedor = inputProveedor.value.trim();
                    
                    if (numero && proveedor) {
                        const existe = this.db.facturas.find(f => 
                            f.numeroFactura === numero && 
                            f.proveedor.toLowerCase() === proveedor.toLowerCase()
                        );
                        
                        if (existe) {
                            warningNumero.style.display = 'block';
                            inputNumero.style.borderColor = '#e67e22';
                        } else {
                            warningNumero.style.display = 'none';
                            inputNumero.style.borderColor = '';
                        }
                    } else {
                        warningNumero.style.display = 'none';
                        inputNumero.style.borderColor = '';
                    }
                };
                
                inputNumero.addEventListener('input', checkDuplicado);
                inputProveedor.addEventListener('input', checkDuplicado);
                
                // Check inicial
                checkDuplicado();
            }
        }
    }

    saveOCRData() {
        const tipo = this.currentOCRType;
        
        try {
            if (tipo === 'factura') {
                const baseNeta = parseFloat(document.getElementById('ocr_base').value);
                
                if (baseNeta <= 0) {
                    this.showModal('⚠️ Validación', 'La base imponible neta debe ser mayor que 0', 'warning');
                    return;
                }
                
                const nombreProveedor = document.getElementById('ocr_proveedor').value;
                const nifCif = document.getElementById('ocr_nif').value;
                const numeroFactura = document.getElementById('ocr_numero').value;
                
                // Verificar si ya existe factura con mismo número
                const facturaDuplicada = this.db.facturas.find(f => 
                    f.numeroFactura === numeroFactura && 
                    f.proveedor.toLowerCase() === nombreProveedor.toLowerCase()
                );
                
                if (facturaDuplicada) {
                    // Mostrar modal de confirmación
                    return new Promise((resolve) => {
                        this.showConfirm(
                            '⚠️ Factura Duplicada',
                            `<p style="margin-bottom: 15px;">Ya existe una factura con el número <strong>${numeroFactura}</strong> del proveedor <strong>${nombreProveedor}</strong>.</p>` +
                            `<div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-bottom: 15px;">` +
                            `<strong>📄 Factura existente:</strong><br>` +
                            `<span style="color: #666;">Fecha: ${facturaDuplicada.fecha}</span><br>` +
                            `<span style="color: #666;">Total: ${facturaDuplicada.total.toFixed(2)} €</span>` +
                            `</div>` +
                            `<p style="font-weight: 600;">¿Deseas sustituir la factura anterior por esta nueva?</p>`,
                            () => {
                                // Sustituir factura existente
                                this.db.delete('facturas', facturaDuplicada.id);
                                this.continuarGuardadoFactura(tipo, baseNeta, nombreProveedor, nifCif, numeroFactura, true);
                            },
                            '✓ Sustituir factura',
                            '✗ Cancelar'
                        );
                    });
                }
                
                // Continuar con guardado normal
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
                this.showModal('✅ Éxito', 'Albarán guardado en COMPRAS correctamente', 'success');
                
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
                this.showModal('✅ Éxito', 'Cierre de caja guardado en periodo actual', 'success');
                
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
                this.showModal('✅ Éxito', 'Delivery guardado en periodo actual con comisiones calculadas', 'success');
            }

            this.resetOCRForm();
            this.render();
            
        } catch (error) {
            console.error('Error guardando OCR:', error);
            this.showModal('❌ Error', 'Error al guardar los datos. Verifica los campos.', 'error');
        }
    }

    seleccionarProveedorExistente(proveedorId, nombreFiscal) {
        // Usuario seleccionó un proveedor existente de la lista
        document.getElementById('ocr_proveedor').value = nombreFiscal;
        
        // Buscar el proveedor y rellenar el CIF si no está
        const proveedor = this.db.proveedores.find(p => p.id === parseInt(proveedorId));
        if (proveedor && proveedor.nifCif) {
            document.getElementById('ocr_nif').value = proveedor.nifCif;
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
        // Verificar si el proveedor existe
        let proveedorExiste = false;
        if (nifCif) {
            proveedorExiste = this.db.proveedores.some(p => p.nifCif === nifCif);
        }
        if (!proveedorExiste && nombreProveedor) {
            proveedorExiste = this.db.proveedores.some(p => 
                p.nombreFiscal.toLowerCase() === nombreProveedor.toLowerCase()
            );
        }
        
        // Si es proveedor nuevo, crearlo automáticamente
        if (!proveedorExiste && nombreProveedor) {
            const emailInput = document.getElementById('ocr_proveedor_email');
            const telefonoInput = document.getElementById('ocr_proveedor_telefono');
            const direccionInput = document.getElementById('ocr_proveedor_direccion');
            const cpInput = document.getElementById('ocr_proveedor_cp');
            const ciudadInput = document.getElementById('ocr_proveedor_ciudad');
            const provinciaInput = document.getElementById('ocr_proveedor_provincia');
            
            const nuevoProveedor = {
                nombreFiscal: nombreProveedor,
                nombreComercial: nombreProveedor,
                nifCif: nifCif || '',
                tipo: 'Comida',
                email: emailInput ? emailInput.value : '',
                telefono: telefonoInput ? telefonoInput.value : '',
                direccion: direccionInput ? direccionInput.value : '',
                codigoPostal: cpInput ? cpInput.value : '',
                ciudad: ciudadInput ? ciudadInput.value : '',
                provincia: provinciaInput ? provinciaInput.value : '',
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
            total: parseFloat(document.getElementById('ocr_total').value) || baseNeta * 1.10,
            categoria: 'Comida',
            periodo: this.currentPeriod,
            ocrProcessed: true,
            ocrConfidence: this.currentOCRExtractedData.confidence,
            archivoNombre: this.currentOCRFile ? this.currentOCRFile.name : null,
            archivoData: this.currentOCRFileData || null
        };
        
        this.db.add('facturas', factura);
        
        const mensajeAccion = esSustitucion ? ' (factura anterior sustituida)' : '';
        const mensajeProveedor = !proveedorExiste ? ' + Proveedor nuevo creado automáticamente' : '';
        this.showModal('✅ Éxito', `Factura guardada en COMPRAS correctamente con base NETA sin IVA${mensajeAccion}${mensajeProveedor}`, 'success');
        
        this.resetOCRForm();
        this.render();
    }

    abrirModalEditarFactura(factura) {
        if (!factura) {
            console.error('❌ Error: factura es undefined');
            this.showToast('❌ Error al abrir factura para editar', true);
            return;
        }
        
        // IMPORTANTE: Cerrar modal anterior si existe (evitar duplicación)
        this.cerrarModalEditarFactura();
        
        // Crear modal dinámico para editar factura
        const modalHTML = `
            <div id="modalEditarFactura" class="modal-overlay" style="overflow-y: auto;">
                <div class="modal-content" style="max-width: 600px;">
                    <h3>✏️ Editar Factura</h3>
                    <form id="editarFacturaForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Proveedor *</label>
                                <input type="text" id="edit_proveedor" value="${factura.proveedor}" required>
                            </div>
                            <div class="form-group">
                                <label>NIF/CIF</label>
                                <input type="text" id="edit_nif" value="${factura.nifCif || ''}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nº Factura *</label>
                                <input type="text" id="edit_numero" value="${factura.numeroFactura}" required>
                            </div>
                            <div class="form-group">
                                <label>Fecha *</label>
                                <input type="date" id="edit_fecha" value="${factura.fecha}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Base Imponible NETA (€) *</label>
                                <input type="number" step="0.01" id="edit_base" value="${factura.baseImponible}" required>
                                <small class="form-help">Sin IVA</small>
                            </div>
                            <div class="form-group">
                                <label>Total CON IVA (€)</label>
                                <input type="number" step="0.01" id="edit_total" value="${factura.total}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="edit_categoria">
                                <option value="Comida" ${factura.categoria === 'Comida' ? 'selected' : ''}>Comida</option>
                                <option value="Bebida" ${factura.categoria === 'Bebida' ? 'selected' : ''}>Bebida</option>
                                <option value="Otros" ${factura.categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="button" class="btn-secondary" onclick="app.cerrarModalEditarFactura()">Cancelar</button>
                            <button type="submit" class="btn-primary">✓ Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Scroll al inicio para ver el modal
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.getElementById('editarFacturaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarEdicionFactura(factura.id);
        });
    }

    cerrarModalEditarFactura() {
        const modal = document.getElementById('modalEditarFactura');
        if (modal) modal.remove();
    }

    async guardarEdicionFactura(facturaId) {
        const proveedor = document.getElementById('edit_proveedor').value;
        const nifCif = document.getElementById('edit_nif').value;
        
        // Verificar si el proveedor existe y si los datos cambiaron
        const proveedorExistente = this.db.proveedores.find(p => 
            p.nombreFiscal.toLowerCase() === proveedor.toLowerCase() || 
            (nifCif && p.nifCif === nifCif)
        );
        
        if (proveedorExistente) {
            // Verificar si hay cambios en los datos del proveedor
            const hayCambiosNombre = proveedorExistente.nombreFiscal !== proveedor;
            const hayCambiosCIF = nifCif && proveedorExistente.nifCif && proveedorExistente.nifCif !== nifCif;
            
            if (hayCambiosNombre || hayCambiosCIF) {
                // Preguntar qué datos conservar
                const confirmar = await this.mostrarModalConfirmacionProveedor(
                    proveedorExistente,
                    { nombre: proveedor, nif: nifCif }
                );
                
                if (!confirmar) return; // Usuario canceló
            }
        }
        
        // Actualizar factura
        const facturaActualizada = {
            proveedor: proveedor,
            nifCif: nifCif,
            numeroFactura: document.getElementById('edit_numero').value,
            fecha: document.getElementById('edit_fecha').value,
            baseImponible: parseFloat(document.getElementById('edit_base').value),
            total: parseFloat(document.getElementById('edit_total').value),
            categoria: document.getElementById('edit_categoria').value
        };
        
        this.db.update('facturas', facturaId, facturaActualizada);
        this.cerrarModalEditarFactura();
        this.render();
        this.showToast('✓ Factura actualizada correctamente');
    }

    abrirModalEditarAlbaran(albaran) {
        if (!albaran) {
            console.error('❌ Error: albarán es undefined');
            this.showToast('❌ Error al abrir albarán para editar', true);
            return;
        }
        
        // IMPORTANTE: Cerrar modal anterior si existe (evitar duplicación)
        this.cerrarModalEditarAlbaran();
        
        // Similar a factura pero para albaranes
        const modalHTML = `
            <div id="modalEditarAlbaran" class="modal-overlay" style="overflow-y: auto;">
                <div class="modal-content" style="max-width: 600px;">
                    <h3>✏️ Editar Albarán</h3>
                    <form id="editarAlbaranForm">
                        <div class="form-group">
                            <label>Proveedor *</label>
                            <input type="text" id="edit_albaran_proveedor" value="${albaran.proveedor}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Nº Albarán *</label>
                                <input type="text" id="edit_albaran_numero" value="${albaran.numeroAlbaran}" required>
                            </div>
                            <div class="form-group">
                                <label>Fecha *</label>
                                <input type="date" id="edit_albaran_fecha" value="${albaran.fecha}" required>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button type="button" class="btn-secondary" onclick="app.cerrarModalEditarAlbaran()">Cancelar</button>
                            <button type="submit" class="btn-primary">✓ Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Scroll al inicio para ver el modal
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        document.getElementById('editarAlbaranForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarEdicionAlbaran(albaran.id);
        });
    }

    cerrarModalEditarAlbaran() {
        const modal = document.getElementById('modalEditarAlbaran');
        if (modal) modal.remove();
    }

    guardarEdicionAlbaran(albaranId) {
        const albaranActualizado = {
            proveedor: document.getElementById('edit_albaran_proveedor').value,
            numeroAlbaran: document.getElementById('edit_albaran_numero').value,
            fecha: document.getElementById('edit_albaran_fecha').value
        };
        
        this.db.update('albaranes', albaranId, albaranActualizado);
        this.cerrarModalEditarAlbaran();
        this.render();
        this.showToast('✓ Albarán actualizado correctamente');
    }

    mostrarModalConfirmacionProveedor(proveedorExistente, datosNuevos) {
        return new Promise((resolve) => {
            const modalHTML = `
                <div id="modalConfirmacionProveedor" class="modal-overlay">
                    <div class="modal-content" style="max-width: 500px;">
                        <h3>⚠️ Datos de Proveedor Diferentes</h3>
                        <p>El proveedor existe pero los datos son diferentes. ¿Qué datos deseas conservar?</p>
                        
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #1f2d3d;">📋 Datos Actuales (Base de Datos)</h4>
                            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${proveedorExistente.nombreFiscal}</p>
                            <p style="margin: 5px 0;"><strong>CIF:</strong> ${proveedorExistente.nifCif || 'Sin CIF'}</p>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0;">
                            <h4 style="margin: 0 0 10px 0; color: #d68910;">📝 Datos en Factura</h4>
                            <p style="margin: 5px 0;"><strong>Nombre:</strong> ${datosNuevos.nombre}</p>
                            <p style="margin: 5px 0;"><strong>CIF:</strong> ${datosNuevos.nif || 'Sin CIF'}</p>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                            <button class="btn-primary" onclick="app.confirmarDatosProveedor('existente')">
                                ✓ Conservar datos actuales (Base de Datos)
                            </button>
                            <button class="btn-secondary" onclick="app.confirmarDatosProveedor('nuevos')">
                                📝 Actualizar con datos de factura
                            </button>
                            <button class="btn-delete" onclick="app.confirmarDatosProveedor('cancelar')">
                                ✗ Cancelar edición
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            this.confirmacionProveedorCallback = (opcion) => {
                const modal = document.getElementById('modalConfirmacionProveedor');
                if (modal) modal.remove();
                
                if (opcion === 'cancelar') {
                    resolve(false);
                } else if (opcion === 'nuevos') {
                    // Actualizar proveedor en base de datos con datos nuevos
                    this.db.update('proveedores', proveedorExistente.id, {
                        nombreFiscal: datosNuevos.nombre,
                        nifCif: datosNuevos.nif
                    });
                    this.showToast('✓ Proveedor actualizado con datos de factura');
                    resolve(true);
                } else {
                    // Conservar datos existentes (no hacer nada)
                    resolve(true);
                }
            };
        });
    }

    confirmarDatosProveedor(opcion) {
        if (this.confirmacionProveedorCallback) {
            this.confirmacionProveedorCallback(opcion);
        }
    }

    resetOCRForm() {
        document.getElementById('ocrFile').value = '';
        document.querySelectorAll('.ocr-tipo-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('ocrUploadCard').classList.add('hidden');
        document.getElementById('ocrPreviewContainer').classList.add('hidden');
        document.getElementById('ocrProgressBar').classList.add('hidden');
        document.getElementById('ocrDataCard').classList.add('hidden');
        this.currentImageData = null;
        this.currentOCRType = null;
        this.currentOCRExtractedData = null;
    }

    calcularEfectivo(billetes) {
        return (billetes.b500 * 500) + (billetes.b200 * 200) + (billetes.b100 * 100) +
               (billetes.b50 * 50) + (billetes.b20 * 20) + (billetes.b10 * 10) +
               (billetes.b5 * 5) + (billetes.m2 * 2) + (billetes.m1 * 1) +
               (billetes.m050 * 0.50) + (billetes.m020 * 0.20) + (billetes.m010 * 0.10) +
               (billetes.m005 * 0.05) + (billetes.m002 * 0.02) + (billetes.m001 * 0.01);
    }

    renderDatosPOS() {
        // Obtener métodos de pago activos de "Otros Medios"
        const metodosActivos = new Set();
        document.querySelectorAll('.otro-medio-item').forEach(item => {
            const tipo = item.querySelector('.otro-medio-tipo').value;
            metodosActivos.add(tipo);
        });

        const container = document.getElementById('datosPOSContainer');
        if (!container) return;

        // Siempre mostrar Efectivo y Tarjetas
        let html = `
            <div class="form-row">
                <div class="form-group">
                    <label>Efectivo POS</label>
                    <input type="number" step="0.01" id="posEfectivo" value="0" min="0">
                </div>
                <div class="form-group">
                    <label>Tarjetas POS</label>
                    <input type="number" step="0.01" id="posTarjetas" value="0" min="0">
                </div>
            </div>
        `;

        // Solo mostrar Bizum y Transferencias si están en otrosMedios
        const tieneBizum = metodosActivos.has('Bizum');
        const tieneTransferencia = metodosActivos.has('Transferencia');

        if (tieneBizum || tieneTransferencia) {
            html += '<div class="form-row">';
            if (tieneBizum) {
                html += `
                    <div class="form-group">
                        <label>Bizum POS</label>
                        <input type="number" step="0.01" id="posBizum" value="0" min="0">
                    </div>
                `;
            }
            if (tieneTransferencia) {
                html += `
                    <div class="form-group">
                        <label>Transferencias POS</label>
                        <input type="number" step="0.01" id="posTransferencias" value="0" min="0">
                    </div>
                `;
            }
            html += '</div>';
        }

        // Nº Tickets POS (siempre visible)
        html += `
            <div class="form-group">
                <label>Nº Tickets POS</label>
                <input type="number" id="posTickets" value="0" min="0">
            </div>
        `;

        container.innerHTML = html;

        // Reasignar listeners a los nuevos campos
        ['posEfectivo', 'posTarjetas', 'posBizum', 'posTransferencias'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calcularTotalesCierre());
            }
        });
    }

    renderResumenTabla() {
        // Obtener métodos de pago activos de "Otros Medios"
        const metodosActivos = new Set();
        document.querySelectorAll('.otro-medio-item').forEach(item => {
            const tipo = item.querySelector('.otro-medio-tipo').value;
            metodosActivos.add(tipo);
        });

        const tbody = document.getElementById('resumenTbody');
        if (!tbody) return;

        let html = '';

        // Efectivo y Tarjetas: SIEMPRE visibles
        html += `
            <tr>
                <td>💶 Efectivo</td>
                <td><span id="resumenPOSEfectivo">0.00 €</span></td>
                <td><span id="resumenRealEfectivo">0.00 €</span></td>
                <td><span id="resumenDeltaEfectivo" class="delta-cero">0.00 €</span></td>
            </tr>
            <tr>
                <td>💳 Tarjetas</td>
                <td><span id="resumenPOSTarjetas">0.00 €</span></td>
                <td><span id="resumenRealTarjetas">0.00 €</span></td>
                <td><span id="resumenDeltaTarjetas" class="delta-cero">0.00 €</span></td>
            </tr>
        `;

        // Bizum: solo si está en otrosMedios
        if (metodosActivos.has('Bizum')) {
            html += `
                <tr>
                    <td>📲 Bizum</td>
                    <td><span id="resumenPOSBizum">0.00 €</span></td>
                    <td><span id="resumenRealBizum">0.00 €</span></td>
                    <td><span id="resumenDeltaBizum" class="delta-cero">0.00 €</span></td>
                </tr>
            `;
        }

        // Transferencias: solo si está en otrosMedios
        if (metodosActivos.has('Transferencia')) {
            html += `
                <tr>
                    <td>🏦 Transferencias</td>
                    <td><span id="resumenPOSTrans">0.00 €</span></td>
                    <td><span id="resumenRealTrans">0.00 €</span></td>
                    <td><span id="resumenDeltaTrans" class="delta-cero">0.00 €</span></td>
                </tr>
            `;
        }

        // Fila TOTAL: siempre visible
        html += `
            <tr class="fila-total">
                <td><strong>TOTAL</strong></td>
                <td><strong><span id="resumenPOSTotal">0.00 €</span></strong></td>
                <td><strong><span id="resumenRealTotal">0.00 €</span></strong></td>
                <td><strong><span id="resumenDeltaTotal" class="delta-cero">0.00 €</span></strong></td>
            </tr>
        `;

        tbody.innerHTML = html;
        
        // Mostrar/ocultar caja de Dinero B
        const containerDineroB = document.getElementById('resumenDineroBContainer');
        if (containerDineroB) {
            if (metodosActivos.has('Dinero B (sin IVA)')) {
                containerDineroB.classList.remove('hidden');
            } else {
                containerDineroB.classList.add('hidden');
            }
        }
    }

    calcularTotalesCierre() {
        // Calcular efectivo
        const billetes = {
            b500: parseInt(document.getElementById('b500').value) || 0,
            b200: parseInt(document.getElementById('b200').value) || 0,
            b100: parseInt(document.getElementById('b100').value) || 0,
            b50: parseInt(document.getElementById('b50').value) || 0,
            b20: parseInt(document.getElementById('b20').value) || 0,
            b10: parseInt(document.getElementById('b10').value) || 0,
            b5: parseInt(document.getElementById('b5').value) || 0,
            m2: parseInt(document.getElementById('m2').value) || 0,
            m1: parseInt(document.getElementById('m1').value) || 0,
            m050: parseInt(document.getElementById('m050').value) || 0,
            m020: parseInt(document.getElementById('m020').value) || 0,
            m010: parseInt(document.getElementById('m010').value) || 0,
            m005: parseInt(document.getElementById('m005').value) || 0,
            m002: parseInt(document.getElementById('m002').value) || 0,
            m001: parseInt(document.getElementById('m001').value) || 0
        };

        // Actualizar totales individuales billetes y monedas
        document.querySelectorAll('.billete-item-compact').forEach((item, index) => {
            const input = item.querySelector('.billete-input');
            const total = item.querySelector('.billete-total');
            const valores = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01];
            const cantidad = parseInt(input.value) || 0;
            total.textContent = (cantidad * valores[index]).toFixed(2) + '€';
        });

        const totalEfectivo = this.calcularEfectivo(billetes);
        document.getElementById('totalEfectivoContado').textContent = totalEfectivo.toFixed(2) + '€';

        // Calcular datáfonos
        let totalDatafonos = 0;
        document.querySelectorAll('.datafono-importe').forEach(input => {
            totalDatafonos += parseFloat(input.value) || 0;
        });
        document.getElementById('totalDatafonos').textContent = totalDatafonos.toFixed(2) + '€';

        // Calcular otros medios (EXCLUIR Dinero B porque no computa)
        let totalOtrosMedios = 0;
        let bizumContado = 0;
        let transContadas = 0;
        let dineroB = 0;
        document.querySelectorAll('.otro-medio-item').forEach(item => {
            const tipo = item.querySelector('.otro-medio-tipo').value;
            const importe = parseFloat(item.querySelector('.otro-medio-importe').value) || 0;
            
            if (tipo === 'Dinero B (sin IVA)') {
                dineroB += importe;  // NO sumar a totalOtrosMedios
            } else {
                totalOtrosMedios += importe;
            }
            
            if (tipo === 'Bizum') bizumContado += importe;
            if (tipo === 'Transferencia') transContadas += importe;
        });
        document.getElementById('totalOtrosMedios').textContent = totalOtrosMedios.toFixed(2) + '€';

        // Obtener valores POS (verificar si existen)
        const posEfectivoEl = document.getElementById('posEfectivo');
        const posTarjetasEl = document.getElementById('posTarjetas');
        const posBizumEl = document.getElementById('posBizum');
        const posTransEl = document.getElementById('posTransferencias');

        const posEfectivo = posEfectivoEl ? (parseFloat(posEfectivoEl.value) || 0) : 0;
        const posTarjetas = posTarjetasEl ? (parseFloat(posTarjetasEl.value) || 0) : 0;
        const posBizum = posBizumEl ? (parseFloat(posBizumEl.value) || 0) : 0;
        const posTrans = posTransEl ? (parseFloat(posTransEl.value) || 0) : 0;

        // Calcular descuadres
        const descEfectivo = totalEfectivo - posEfectivo;
        const descTarjetas = totalDatafonos - posTarjetas;
        const descBizum = bizumContado - posBizum;
        const descTrans = transContadas - posTrans;
        const descTotal = descEfectivo + descTarjetas + descBizum + descTrans;

        // Actualizar resumen en tiempo real
        this.actualizarResumenTiempoReal({
            posEfectivo, posTarjetas, posBizum, posTrans,
            totalEfectivo, totalDatafonos, bizumContado, transContadas, dineroB,
            descEfectivo, descTarjetas, descBizum, descTrans, descTotal
        });
    }
    
    actualizarResumenTiempoReal(datos) {
        const { posEfectivo, posTarjetas, posBizum, posTrans,
                totalEfectivo, totalDatafonos, bizumContado, transContadas, dineroB,
                descEfectivo, descTarjetas, descBizum, descTrans, descTotal } = datos;
        
        // Efectivo
        document.getElementById('resumenPOSEfectivo').textContent = posEfectivo.toFixed(2) + ' €';
        document.getElementById('resumenRealEfectivo').textContent = totalEfectivo.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaEfectivo', descEfectivo);
        
        // Tarjetas
        document.getElementById('resumenPOSTarjetas').textContent = posTarjetas.toFixed(2) + ' €';
        document.getElementById('resumenRealTarjetas').textContent = totalDatafonos.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaTarjetas', descTarjetas);
        
        // Bizum (solo si existe en tabla)
        const bizumPOSEl = document.getElementById('resumenPOSBizum');
        const bizumRealEl = document.getElementById('resumenRealBizum');
        if (bizumPOSEl && bizumRealEl) {
            bizumPOSEl.textContent = posBizum.toFixed(2) + ' €';
            bizumRealEl.textContent = bizumContado.toFixed(2) + ' €';
            this.updateDeltaResumen('resumenDeltaBizum', descBizum);
        }
        
        // Transferencias (solo si existe en tabla)
        const transPOSEl = document.getElementById('resumenPOSTrans');
        const transRealEl = document.getElementById('resumenRealTrans');
        if (transPOSEl && transRealEl) {
            transPOSEl.textContent = posTrans.toFixed(2) + ' €';
            transRealEl.textContent = transContadas.toFixed(2) + ' €';
            this.updateDeltaResumen('resumenDeltaTrans', descTrans);
        }
        
        // Dinero B (sin IVA - solo informativo)
        const resumenDineroBEl = document.getElementById('resumenDineroB');
        if (resumenDineroBEl) {
            const valorDineroB = dineroB !== undefined ? dineroB : 0;
            resumenDineroBEl.textContent = valorDineroB.toFixed(2) + ' €';
        }
        
        // TOTAL
        const totalPOS = posEfectivo + posTarjetas + posBizum + posTrans;
        const totalReal = totalEfectivo + totalDatafonos + bizumContado + transContadas;
        document.getElementById('resumenPOSTotal').textContent = totalPOS.toFixed(2) + ' €';
        document.getElementById('resumenRealTotal').textContent = totalReal.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaTotal', descTotal);
    }
    
    updateDeltaResumen(elementId, valor) {
        const element = document.getElementById(elementId);
        const texto = (valor >= 0 ? '+' : '') + valor.toFixed(2) + ' €';
        element.textContent = texto;
        element.classList.remove('delta-cero', 'delta-descuadre');
        element.classList.add(Math.abs(valor) <= 0.01 ? 'delta-cero' : 'delta-descuadre');
    }

    resetCierreForm() {
        document.getElementById('cierreForm').reset();
        
        // Reset todos los billetes y monedas (15 denominaciones)
        ['b500','b200','b100','b50','b20','b10','b5','m2','m1','m050','m020','m010','m005','m002','m001'].forEach(id => {
            document.getElementById(id).value = 0;
        });
        document.querySelectorAll('.billete-total').forEach(span => span.textContent = '0€');
        
        // Reset datáfonos excepto el primero
        const containerDatafonos = document.getElementById('datafonosContainer');
        while (containerDatafonos.children.length > 1) {
            containerDatafonos.removeChild(containerDatafonos.lastChild);
        }
        containerDatafonos.querySelector('.datafono-nombre').value = '';
        containerDatafonos.querySelector('.datafono-importe').value = 0;
        
        // Reset otros medios
        const containerOtros = document.getElementById('otrosMediosContainer');
        containerOtros.innerHTML = '';
        
        this.calcularTotalesCierre();
    }

    editItem(collection, id) {
        const item = this.db[collection].find(i => i.id === id);
        if (!item) return;

        // Cambiar a la vista correspondiente
        const viewMap = {
            'cierres': 'cierres',
            'facturas': 'compras',
            'albaranes': 'compras',
            'proveedores': 'proveedores',
            'productos': 'productos',
            'escandallos': 'escandallos',
            'inventarios': 'inventario',
            'delivery': 'delivery'
        };
        this.currentView = viewMap[collection];
        this.render();

        // Rellenar formulario según la colección
        switch(collection) {
            case 'cierres':
                // Mostrar formulario usando método robusto
                this.expandForm('cierre');
                // Rellenar campos básicos
                document.getElementById('cierreFecha').value = item.fecha;
                document.getElementById('cierreTurno').value = item.turno;
                
                // Rellenar billetes y monedas
                if (item.billetes) {
                    Object.keys(item.billetes).forEach(key => {
                        const input = document.getElementById(key);
                        if (input) input.value = item.billetes[key] || 0;
                    });
                }
                
                // Rellenar datáfonos
                const datafonosContainer = document.getElementById('datafonosContainer');
                datafonosContainer.innerHTML = '';
                if (item.datafonos && item.datafonos.length > 0) {
                    item.datafonos.forEach(d => {
                        const div = document.createElement('div');
                        div.className = 'datafono-item';
                        div.innerHTML = `
                            <input type="text" placeholder="Nombre TPV" class="datafono-nombre" value="${d.nombre}">
                            <input type="number" step="0.01" value="${d.importe}" min="0" placeholder="Importe" class="datafono-importe">
                            <button type="button" class="btn-remove" onclick="this.parentElement.remove(); app.calcularTotalesCierre()">✗</button>
                        `;
                        datafonosContainer.appendChild(div);
                    });
                } else {
                    datafonosContainer.innerHTML = `
                        <div class="datafono-item">
                            <input type="text" placeholder="Nombre TPV" class="datafono-nombre">
                            <input type="number" step="0.01" value="0" min="0" placeholder="Importe" class="datafono-importe">
                            <button type="button" class="btn-remove" onclick="this.parentElement.remove(); app.calcularTotalesCierre()">✗</button>
                        </div>
                    `;
                }
                
                // Rellenar otros medios
                const otrosMediosContainer = document.getElementById('otrosMediosContainer');
                otrosMediosContainer.innerHTML = '';
                if (item.otrosMedios && item.otrosMedios.length > 0) {
                    item.otrosMedios.forEach(m => {
                        const div = document.createElement('div');
                        div.className = 'otro-medio-item';
                        div.innerHTML = `
                            <select class="otro-medio-tipo">
                                <option value="Bizum" ${m.tipo === 'Bizum' ? 'selected' : ''}>Bizum</option>
                                <option value="Transferencia" ${m.tipo === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                                <option value="Cheque" ${m.tipo === 'Cheque' ? 'selected' : ''}>Cheque</option>
                                <option value="Vale" ${m.tipo === 'Vale' ? 'selected' : ''}>Vale</option>
                                <option value="Otro" ${m.tipo === 'Otro' ? 'selected' : ''}>Otro</option>
                            </select>
                            <input type="number" step="0.01" value="${m.importe}" min="0" placeholder="Importe" class="otro-medio-importe">
                            <button type="button" class="btn-remove" onclick="this.parentElement.remove(); app.calcularTotalesCierre()">✗</button>
                        `;
                        otrosMediosContainer.appendChild(div);
                    });
                }
                
                // Rellenar datos POS
                document.getElementById('posEfectivo').value = item.posEfectivo || 0;
                document.getElementById('posTarjetas').value = item.posTarjetas || 0;
                document.getElementById('posBizum').value = item.posBizum || 0;
                document.getElementById('posTransferencias').value = item.posTransferencias || 0;
                document.getElementById('posTickets').value = item.posTickets || 0;
                
                // Recalcular totales
                this.calcularTotalesCierre();
                
                // Marcar para actualización
                document.getElementById('cierreForm').dataset.editId = id;
                break;

            case 'facturas':
                // Cambiar a vista Compras y abrir modal de edición
                this.currentView = 'compras';
                this.render();
                // Usar setTimeout para que el modal se abra después del render
                setTimeout(() => this.abrirModalEditarFactura(item), 100);
                return;
                
            case 'albaranes':
                // Cambiar a vista Compras y abrir modal de edición
                this.currentView = 'compras';
                this.render();
                // Usar setTimeout para que el modal se abra después del render
                setTimeout(() => this.abrirModalEditarAlbaran(item), 100);
                return;

            case 'proveedores':
                // Expandir formulario
                const proveedorFormCard = document.getElementById('proveedorFormCard');
                const toggleProveedorBtn = document.getElementById('toggleProveedorForm');
                if (proveedorFormCard && toggleProveedorBtn) {
                    proveedorFormCard.classList.remove('hidden');
                    proveedorFormCard.style.display = 'block';
                    toggleProveedorBtn.textContent = '− Cancelar';
                }
                document.getElementById('proveedorNombreFiscal').value = item.nombreFiscal || item.nombre || '';
                document.getElementById('proveedorNombreComercial').value = item.nombreComercial || '';
                document.getElementById('proveedorNifCif').value = item.nifCif || item.nif || '';
                document.getElementById('proveedorTipo').value = item.tipoProveedor || 'Mixto';
                document.getElementById('proveedorDireccion').value = item.direccion || '';
                document.getElementById('proveedorCodigoPostal').value = item.codigoPostal || '';
                document.getElementById('proveedorCiudad').value = item.ciudad || '';
                document.getElementById('proveedorProvincia').value = item.provincia || '';
                document.getElementById('proveedorTelefono').value = item.telefono || '';
                document.getElementById('proveedorEmail').value = item.email || '';
                document.getElementById('proveedorContacto').value = item.personaContacto || '';
                document.getElementById('proveedorFormaPago').value = item.formaPago || 'Transferencia';
                document.getElementById('proveedorCondicionesPago').value = item.condicionesPago || '';
                document.getElementById('proveedorFrecuencia').value = item.frecuenciaPedido || '';
                document.getElementById('proveedorObservaciones').value = item.observaciones || '';
                document.getElementById('proveedorForm').dataset.editId = id;
                break;

            case 'productos':
                // Expandir formulario
                const productoFormCard = document.getElementById('productoFormCard');
                const toggleProductoBtn = document.getElementById('toggleProductoForm');
                if (productoFormCard && toggleProductoBtn) {
                    productoFormCard.classList.remove('hidden');
                    productoFormCard.style.display = 'block';
                    toggleProductoBtn.textContent = '− Cancelar';
                }
                document.getElementById('productoNombre').value = item.nombre;
                document.getElementById('productoProveedorId').value = item.proveedorId || '';
                document.getElementById('productoPrecio').value = item.precioPromedioNeto || item.precio || 0;
                document.getElementById('productoUnidadBase').value = item.unidadBase || 'ud';
                document.getElementById('productoStockActual').value = item.stockActualUnidades || item.stockActual || 0;
                document.getElementById('productoEsEmpaquetado').value = item.esEmpaquetado ? 'true' : 'false';
                if (item.esEmpaquetado) {
                    document.getElementById('productoTipoEmpaque').value = item.tipoEmpaque;
                    document.getElementById('productoUnidadesPorEmpaque').value = item.unidadesPorEmpaque;
                    document.getElementById('empaqueFields').classList.remove('hidden');
                }
                document.getElementById('productoForm').dataset.editId = id;
                break;

            case 'escandallos':
                // Mostrar formulario usando método robusto
                this.expandForm('escandallo');
                document.getElementById('escandalloNombre').value = item.nombre;
                document.getElementById('escandalloCodigo').value = item.codigo || '';
                document.getElementById('escandalloPVPConIVA').value = item.pvpConIva;
                document.getElementById('escandalloTipoIVA').value = item.tipoIva;
                document.getElementById('escandalloPVPNeto').value = item.pvpNeto;
                // Recrear ingredientes
                document.getElementById('ingredientesContainer').innerHTML = '';
                if (item.ingredientes && item.ingredientes.length > 0) {
                    item.ingredientes.forEach(ing => {
                        this.addIngredienteRow();
                        const lastRow = document.querySelector('.ingrediente-item:last-child');
                        lastRow.querySelector('.ingrediente-producto').value = ing.productoId || '';
                        lastRow.querySelector('.ingrediente-cantidad').value = ing.cantidad;
                        lastRow.querySelector('.ingrediente-unidad').value = ing.unidad;
                        lastRow.querySelector('.ingrediente-coste-unitario').value = ing.costeUnitario;
                        lastRow.querySelector('.ingrediente-coste-total').value = ing.costeTotal;
                    });
                }
                document.getElementById('escandalloForm').dataset.editId = id;
                this.calcularCostesEscandallo();
                break;

            case 'inventarios':
                document.getElementById('inventarioFecha').value = item.fecha;
                document.getElementById('inventarioFamilia').value = item.familia;
                // Recrear productos
                document.getElementById('productosInventarioContainer').innerHTML = '';
                if (item.productos && item.productos.length > 0) {
                    item.productos.forEach(prod => {
                        this.addProductoInventario();
                        const lastRow = document.querySelector('.producto-inventario-item:last-child');
                        lastRow.querySelector('.producto-inventario-select').value = prod.productoId;
                        lastRow.querySelector('.producto-inventario-paquetes').value = prod.cantidadPaquetes || 0;
                        lastRow.querySelector('.producto-inventario-sueltas').value = prod.unidadesSueltas || 0;
                    });
                }
                document.getElementById('inventarioForm').dataset.editId = id;
                break;

            case 'delivery':
                document.getElementById('deliveryFecha').value = item.fecha;
                document.getElementById('deliveryPlataforma').value = item.plataforma;
                document.getElementById('deliveryVentas').value = item.ventas;
                document.getElementById('deliveryNumPedidos').value = item.numPedidos;
                document.getElementById('deliveryComision').value = item.comisionPlataforma;
                document.getElementById('deliveryForm').dataset.editId = id;
                break;
        }

        this.showToast('✏️ Editando registro', false);
        // Scroll al formulario
        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    }

    deleteItem(collection, id) {
        this.showConfirm(
            '🗑️ Confirmar Eliminación',
            '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
            () => {
                this.db.delete(collection, id);
                this.showToast('🗑️ Eliminado correctamente');
                this.render();
            }
        );
    }

    showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.toggle('error', isError);
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showModal(title, message, type = 'info') {
        const modal = document.getElementById('appModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalIcon = document.getElementById('modalIcon');
        
        if (!modal || !modalTitle || !modalMessage || !modalIcon) {
            console.error('❌ Modal elements not found');
            alert(`${title}\n\n${message}`);
            return;
        }
        
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        
        // Iconos según tipo
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        modalIcon.textContent = icons[type] || icons['info'];
        
        modal.classList.add('show');
    }

    showConfirm(title, message, onConfirm, confirmText = 'Confirmar', cancelText = 'Cancelar') {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('confirmTitle');
        const modalMessage = document.getElementById('confirmMessage');
        const btnConfirm = document.getElementById('confirmBtn');
        const btnCancel = document.getElementById('cancelBtn');
        
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        btnConfirm.textContent = confirmText;
        btnCancel.textContent = cancelText;
        
        // Limpiar listeners previos
        const newBtnConfirm = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        
        // Añadir nuevos listeners
        document.getElementById('confirmBtn').addEventListener('click', () => {
            modal.classList.remove('show');
            onConfirm();
        });
        
        document.getElementById('cancelBtn').addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        modal.classList.add('show');
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
