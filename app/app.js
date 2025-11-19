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
                    <option value="Otro">Otro</option>
                </select>
                <input type="number" step="0.01" value="0" min="0" placeholder="Importe" class="otro-medio-importe">
                <button type="button" class="btn-remove" onclick="this.parentElement.remove(); app.calcularTotalesCierre()">✗</button>
            `;
            container.appendChild(item);
            item.querySelector('.otro-medio-importe').addEventListener('input', () => this.calcularTotalesCierre());
        });

        ['posEfectivo', 'posTarjetas', 'posBizum', 'posTransferencias'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calcularTotalesCierre());
            }
        });

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
            
            // Recoger productos inventariados
            const productosInventariados = [];
            document.querySelectorAll('.inventario-producto-item').forEach(item => {
                const productoId = parseInt(item.querySelector('.inventario-producto-id').value);
                const producto = this.db.productos.find(p => p.id === productoId);
                
                if (!producto) return;
                
                const tipoConteo = item.querySelector('.inventario-tipo-conteo').value;
                let stockRealUnidades = 0;
                
                if (tipoConteo === 'empaques') {
                    const numEmpaques = parseFloat(item.querySelector('.inventario-num-empaques').value) || 0;
                    const unidadesSueltas = parseFloat(item.querySelector('.inventario-unidades-sueltas').value) || 0;
                    stockRealUnidades = (numEmpaques * producto.unidadesPorEmpaque) + unidadesSueltas;
                } else {
                    stockRealUnidades = parseFloat(item.querySelector('.inventario-stock-real').value) || 0;
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

        // Set today's date
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.value = new Date().toISOString().split('T')[0];
        });

        // Productos - Añadir producto a inventario
        const btnAddProductoInv = document.getElementById('addProductoInventario');
        if (btnAddProductoInv) {
            btnAddProductoInv.addEventListener('click', () => this.addProductoInventario());
        }
    }

    toggleEmpaqueFields() {
        const esEmpaquetado = document.getElementById('productoEsEmpaquetado').value === 'true';
        const fields = document.getElementById('empaqueFields');
        if (esEmpaquetado) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    }

    addProductoInventario() {
        const container = document.getElementById('inventarioProductosContainer');
        const rowId = Date.now();
        
        const productosOptions = this.db.productos.map(p => 
            `<option value="${p.id}">${p.nombre} (${p.unidadBase}${p.esEmpaquetado ? ` - ${p.tipoEmpaque} x${p.unidadesPorEmpaque}` : ''})</option>`
        ).join('');

        const row = document.createElement('div');
        row.className = 'inventario-producto-item';
        row.dataset.id = rowId;
        row.style.cssText = 'padding: 15px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px;';
        row.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Producto</label>
                    <select class="inventario-producto-id" onchange="app.updateInventarioProducto(${rowId})" required>
                        <option value="">Seleccionar...</option>
                        ${productosOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tipo Conteo</label>
                    <select class="inventario-tipo-conteo" onchange="app.toggleInventarioConteo(${rowId})">
                        <option value="unidades">Unidades directas</option>
                        <option value="empaques">Empaques + sueltas</option>
                    </select>
                </div>
            </div>
            <div class="inventario-conteo-unidades">
                <div class="form-group">
                    <label>Stock Real (unidad base)</label>
                    <input type="number" step="0.001" class="inventario-stock-real" required>
                </div>
            </div>
            <div class="inventario-conteo-empaques hidden">
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº Empaques Completos</label>
                        <input type="number" step="1" class="inventario-num-empaques" value="0">
                    </div>
                    <div class="form-group">
                        <label>Unidades Sueltas</label>
                        <input type="number" step="0.001" class="inventario-unidades-sueltas" value="0">
                    </div>
                </div>
            </div>
            <button type="button" class="btn-delete" onclick="app.removeProductoInventario(${rowId})" style="margin-top: 10px;">🗑️ Quitar</button>
        `;
        container.appendChild(row);
    }

    updateInventarioProducto(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const productoId = parseInt(row.querySelector('.inventario-producto-id').value);
        const producto = this.db.productos.find(p => p.id === productoId);
        
        if (producto && producto.esEmpaquetado) {
            row.querySelector('.inventario-tipo-conteo').value = 'empaques';
            this.toggleInventarioConteo(rowId);
        }
    }

    toggleInventarioConteo(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        const tipo = row.querySelector('.inventario-tipo-conteo').value;
        
        const unidadesDiv = row.querySelector('.inventario-conteo-unidades');
        const empaquesDiv = row.querySelector('.inventario-conteo-empaques');
        
        if (tipo === 'empaques') {
            unidadesDiv.classList.add('hidden');
            empaquesDiv.classList.remove('hidden');
        } else {
            unidadesDiv.classList.remove('hidden');
            empaquesDiv.classList.add('hidden');
        }
    }

    removeProductoInventario(rowId) {
        const row = document.querySelector(`.inventario-producto-item[data-id="${rowId}"]`);
        if (row) row.remove();
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
                                <tr>
                                    <td>📲 Bizum</td>
                                    <td>${bizumPOS.toFixed(2)} €</td>
                                    <td>${bizumReal.toFixed(2)} €</td>
                                    <td class="${deltaClass(deltaBizum)}">${deltaBizum >= 0 ? '+' : ''}${deltaBizum.toFixed(2)} €</td>
                                </tr>
                                <tr>
                                    <td>🏦 Transferencias</td>
                                    <td>${transPOS.toFixed(2)} €</td>
                                    <td>${transReal.toFixed(2)} €</td>
                                    <td class="${deltaClass(deltaTrans)}">${deltaTrans >= 0 ? '+' : ''}${deltaTrans.toFixed(2)} €</td>
                                </tr>
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
                facturas = facturas.filter(f => f.fecha >= desde);
                albaranes = albaranes.filter(a => a.fecha >= desde);
            }
            
            if (hasta) {
                facturas = facturas.filter(f => f.fecha <= hasta);
                albaranes = albaranes.filter(a => a.fecha <= hasta);
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
                    <button class="btn-verify-factura" onclick="app.verificarFacturaAlbaranes(${f.id})">🔍</button>
                    <button class="btn-edit" onclick="app.editItem('facturas', ${f.id})">✏️</button>
                    <button class="btn-delete" onclick="app.deleteItem('facturas', ${f.id})">🗑️</button>
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

        // Buscar albaranes del mismo proveedor anteriores o iguales a la fecha de la factura
        const albaranesCandidatos = this.db.albaranes.filter(a => 
            a.proveedor === factura.proveedor && 
            a.fecha <= factura.fecha
        );

        if (albaranesCandidatos.length === 0) {
            alert(`❌ VERIFICACIÓN FALLIDA\n\nNo se encontraron albaranes del proveedor "${factura.proveedor}" anteriores o iguales a la fecha ${factura.fecha}.\n\nFactura: ${factura.numeroFactura}\nTotal: ${factura.total.toFixed(2)}€`);
            return;
        }

        // Mostrar resumen
        const totalAlbaranes = albaranesCandidatos.reduce((sum, a) => sum + (a.total || 0), 0);
        const diferencia = Math.abs(factura.total - totalAlbaranes);
        const coincide = diferencia < 0.01;

        const detalleAlbaranes = albaranesCandidatos.map(a => 
            `  • ${a.numeroAlbaran} (${a.fecha}): ${(a.total || 0).toFixed(2)}€`
        ).join('\n');

        const mensaje = `${coincide ? '✅' : '⚠️'} VERIFICACIÓN DE FACTURA\n\n` +
            `Factura: ${factura.numeroFactura}\n` +
            `Proveedor: ${factura.proveedor}\n` +
            `Fecha: ${factura.fecha}\n` +
            `Total Factura: ${factura.total.toFixed(2)}€\n\n` +
            `Albaranes encontrados (${albaranesCandidatos.length}):\n${detalleAlbaranes}\n\n` +
            `Total Albaranes: ${totalAlbaranes.toFixed(2)}€\n` +
            `Diferencia: ${diferencia.toFixed(2)}€\n\n` +
            `${coincide ? '✅ Los totales coinciden' : '⚠️ Los totales NO coinciden'}`;

        alert(mensaje);
    }

    renderProveedores() {
        const proveedores = this.db.proveedores;
        const html = proveedores.length > 0 ? proveedores.map(p => {
            const nombre = p.nombreFiscal || p.nombre || 'Sin nombre';
            const comercial = p.nombreComercial ? ` (${p.nombreComercial})` : '';
            const tipo = p.tipoProveedor || 'N/A';
            
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
        
        document.getElementById('listaProveedores').innerHTML = html;
        
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

        // Si es PDF, convertir a imagen de alta calidad
        if (file.type === 'application/pdf' || fileExtension === 'pdf') {
            this.showToast('📝 Procesando PDF...');
            try {
                // Verificar que PDF.js está cargado
                if (typeof pdfjsLib === 'undefined') {
                    throw new Error('PDF.js no está cargado');
                }
                
                const imageData = await this.convertPDFToImage(file);
                this.currentImageData = imageData;
                document.getElementById('ocrPreviewImg').src = imageData;
                document.getElementById('ocrPreviewContainer').classList.remove('hidden');
                document.getElementById('ocrUploadCard').classList.remove('hidden');
                this.showToast('✅ PDF cargado correctamente');
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
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, // PSM 6: texto en bloques (facturas/tablas)
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY, // OEM 3: LSTM (máxima calidad)
                preserve_interword_spaces: '1',
                tessedit_char_blacklist: '', // Sin blacklist
                language_model_penalty_non_dict_word: '0.5',
                language_model_penalty_non_freq_dict_word: '0.5'
            });

            // Primera pasada: texto completo
            const { data } = await worker.recognize(imageData, {
                rotateAuto: true // Deskew automático para documentos torcidos
            });
            
            console.log('OCR Completo - Texto extraído:', data.text);
            console.log('OCR Completo - Confianza:', data.confidence + '%');
            console.log('OCR Completo - Palabras detectadas:', data.words?.length || 0);
            
            // Segunda pasada SOLO para números (importes, IVA, totales)
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789,.-€%' // Whitelist numérica
            });
            
            const { data: dataNumeros } = await worker.recognize(imageData);
            console.log('OCR Números - Texto extraído:', dataNumeros.text);
            
            // Combinar resultados (priorizar números de segunda pasada para campos numéricos)
            const resultado = {
                ...data,
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

    parseOCRTextWithConfidence(ocrData) {
        const text = ocrData.text;
        const confidence = ocrData.confidence;
        const lines = text.split('\n');
        
        const data = {
            text: text,
            confidence: confidence,
            proveedor: { value: '', confidence: 0 },
            nif: { value: '', confidence: 0 },
            numero: { value: '', confidence: 0 },
            fecha: { value: '', confidence: 0 },
            baseImponible: { value: 0, confidence: 0 },
            iva: { value: 0, confidence: 0 },
            total: { value: 0, confidence: 0 }
        };

        lines.forEach((line, index) => {
            const lineConfidence = confidence; // Simplificado - en producción calcular por línea
            
            // Proveedor
            if (line.match(/proveedor|supplier|empresa/i) && !data.proveedor.value) {
                const match = line.split(/[:]/)[1]?.trim() || lines[index + 1]?.trim() || '';
                data.proveedor = { value: match, confidence: lineConfidence };
            }
            
            // NIF/CIF
            if (line.match(/NIF|CIF|B[0-9]{8}/i)) {
                const match = line.match(/[A-Z][0-9]{8}/);
                if (match) data.nif = { value: match[0], confidence: lineConfidence };
            }
            
            // Número factura
            if (line.match(/factura|invoice|n[úu]mero|nº/i) && !data.numero.value) {
                const match = line.match(/[A-Z0-9\-]+/);
                if (match) data.numero = { value: match[0], confidence: lineConfidence };
            }
            
            // Fecha
            if (line.match(/fecha|date/i) && !data.fecha.value) {
                const fechaStr = this.parseDateFromText(line);
                data.fecha = { value: fechaStr, confidence: lineConfidence };
            }
            
            // Base Imponible
            if (line.match(/base\s+imponible/i)) {
                const amount = line.match(/[\d.,]+/);
                if (amount) data.baseImponible = { value: parseFloat(amount[0].replace(',', '.')), confidence: lineConfidence };
            }
            
            // IVA
            if (line.match(/IVA|iva/i) && line.match(/[\d.,]+/)) {
                const amount = line.match(/[\d.,]+/g);
                if (amount) data.iva = { value: parseFloat(amount[amount.length - 1].replace(',', '.')), confidence: lineConfidence };
            }
            
            // Total
            if (line.match(/total|importe\s+total/i)) {
                const amount = line.match(/[\d.,]+/g);
                if (amount) data.total = { value: parseFloat(amount[amount.length - 1].replace(',', '.')), confidence: lineConfidence };
            }
        });

        // Si no hay fecha, usar hoy
        if (!data.fecha.value) {
            data.fecha = { value: new Date().toISOString().split('T')[0], confidence: 0 };
        }

        return data;
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
            if (conf > 75) return 'high';
            if (conf > 50) return 'medium';
            return 'low';
        };

        const getConfidenceBadge = (conf) => {
            const cls = getConfidenceClass(conf);
            return `<span class="field-confidence ${cls}" title="Confianza: ${Math.round(conf)}%"></span>`;
        };

        let html = `<div class="form-group">
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

            html += `
                <div class="form-row">
                    <div class="form-group">
                        <label>Proveedor ${getConfidenceBadge(data.proveedor.confidence)}</label>
                        <input type="text" id="ocr_proveedor" value="${data.proveedor.value}" required>
                    </div>
                    <div class="form-group">
                        <label>NIF/CIF ${getConfidenceBadge(data.nif.confidence)}</label>
                        <input type="text" id="ocr_nif" value="${data.nif.value}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Nº Factura ${getConfidenceBadge(data.numero.confidence)}</label>
                        <input type="text" id="ocr_numero" value="${data.numero.value}" required>
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

                const factura = {
                    fecha: document.getElementById('ocr_fecha').value,
                    proveedor: document.getElementById('ocr_proveedor').value,
                    numeroFactura: document.getElementById('ocr_numero').value,
                    nifCif: document.getElementById('ocr_nif').value,
                    baseImponible: baseNeta,
                    total: parseFloat(document.getElementById('ocr_total').value) || baseNeta * 1.10,
                    categoria: 'Comida',
                    periodo: this.currentPeriod,
                    ocrProcessed: true,
                    ocrConfidence: this.currentOCRExtractedData.confidence
                };
                
                this.db.add('facturas', factura);
                this.showModal('✅ Éxito', 'Factura guardada en COMPRAS correctamente con base NETA sin IVA', 'success');
                
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

        // Calcular otros medios
        let totalOtrosMedios = 0;
        let bizumContado = 0;
        let transContadas = 0;
        document.querySelectorAll('.otro-medio-item').forEach(item => {
            const tipo = item.querySelector('.otro-medio-tipo').value;
            const importe = parseFloat(item.querySelector('.otro-medio-importe').value) || 0;
            totalOtrosMedios += importe;
            if (tipo === 'Bizum') bizumContado += importe;
            if (tipo === 'Transferencia') transContadas += importe;
        });
        document.getElementById('totalOtrosMedios').textContent = totalOtrosMedios.toFixed(2) + '€';

        // Obtener valores POS
        const posEfectivo = parseFloat(document.getElementById('posEfectivo').value) || 0;
        const posTarjetas = parseFloat(document.getElementById('posTarjetas').value) || 0;
        const posBizum = parseFloat(document.getElementById('posBizum').value) || 0;
        const posTrans = parseFloat(document.getElementById('posTransferencias').value) || 0;

        // Calcular descuadres
        const descEfectivo = totalEfectivo - posEfectivo;
        const descTarjetas = totalDatafonos - posTarjetas;
        const descBizum = bizumContado - posBizum;
        const descTrans = transContadas - posTrans;
        const descTotal = descEfectivo + descTarjetas + descBizum + descTrans;

        // Actualizar UI
        this.updateDescuadre('descuadreEfectivo', descEfectivo);
        this.updateDescuadre('descuadreTarjetas', descTarjetas);
        this.updateDescuadre('descuadreBizum', descBizum);
        this.updateDescuadre('descuadreTransferencias', descTrans);
        this.updateDescuadre('descuadreTotal', descTotal);
        
        // Actualizar resumen en tiempo real
        this.actualizarResumenTiempoReal({
            posEfectivo, posTarjetas, posBizum, posTrans,
            totalEfectivo, totalDatafonos, bizumContado, transContadas,
            descEfectivo, descTarjetas, descBizum, descTrans, descTotal
        });
    }

    updateDescuadre(elementId, valor) {
        const element = document.getElementById(elementId);
        element.textContent = valor.toFixed(2) + '€';
        element.classList.remove('positive', 'negative', 'zero');
        if (Math.abs(valor) < 0.01) {
            element.classList.add('zero');
        } else {
            element.classList.add(valor > 0 ? 'positive' : 'negative');
        }
    }
    
    actualizarResumenTiempoReal(datos) {
        const { posEfectivo, posTarjetas, posBizum, posTrans,
                totalEfectivo, totalDatafonos, bizumContado, transContadas,
                descEfectivo, descTarjetas, descBizum, descTrans, descTotal } = datos;
        
        // Efectivo
        document.getElementById('resumenPOSEfectivo').textContent = posEfectivo.toFixed(2) + ' €';
        document.getElementById('resumenRealEfectivo').textContent = totalEfectivo.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaEfectivo', descEfectivo);
        
        // Tarjetas
        document.getElementById('resumenPOSTarjetas').textContent = posTarjetas.toFixed(2) + ' €';
        document.getElementById('resumenRealTarjetas').textContent = totalDatafonos.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaTarjetas', descTarjetas);
        
        // Bizum
        document.getElementById('resumenPOSBizum').textContent = posBizum.toFixed(2) + ' €';
        document.getElementById('resumenRealBizum').textContent = bizumContado.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaBizum', descBizum);
        
        // Transferencias
        document.getElementById('resumenPOSTrans').textContent = posTrans.toFixed(2) + ' €';
        document.getElementById('resumenRealTrans').textContent = transContadas.toFixed(2) + ' €';
        this.updateDeltaResumen('resumenDeltaTrans', descTrans);
        
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
            case 'albaranes':
                this.showToast('⚠️ Edición manual no disponible - usar OCR para modificar', true);
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
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
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

    showConfirm(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('confirmTitle');
        const modalMessage = document.getElementById('confirmMessage');
        const btnConfirm = document.getElementById('confirmBtn');
        const btnCancel = document.getElementById('cancelBtn');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
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
