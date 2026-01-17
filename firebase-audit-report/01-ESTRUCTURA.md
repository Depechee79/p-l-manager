# 01 - ESTRUCTURA DE DATOS FIRESTORE

## DIAGRAMA COMPLETO

```
firestore/
├── companies/                    # Empresas/Grupos
│   └── {companyId}/
│       ├── nombre: string
│       ├── cif: string
│       ├── direccion: string
│       └── restaurantes: string[]
│
├── restaurants/                  # Restaurantes
│   └── {restaurantId}/
│       ├── companyId: string
│       ├── nombre: string
│       ├── codigo: string
│       ├── configuracion: object
│       └── trabajadores: string[]
│
├── usuarios/                     # Usuarios del sistema
│   └── {userId}/
│       ├── nombre: string
│       ├── email: string
│       ├── rolId: string
│       ├── restaurantes: string[]
│       └── activo: boolean
│
├── roles/                        # Roles y permisos
│   └── {roleId}/
│       ├── nombre: string
│       ├── descripcion: string
│       └── permisos: Permission[]
│
├── cierres/                      # Cierres de caja
│   └── {cierreId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── fecha: string
│       ├── turno: string
│       ├── efectivoContado: number
│       ├── datafonos: Datafono[]
│       └── totalReal: number
│
├── facturas/                     # Facturas de compra
│   └── {facturaId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── proveedorId: string
│       ├── fecha: string
│       ├── total: number
│       ├── productos: InvoiceProduct[]
│       └── status: string
│
├── albaranes/                    # Albaranes de entrega
│   └── {albaranId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── proveedorId: string
│       ├── fecha: string
│       └── productos: []
│
├── proveedores/                  # Proveedores (compartidos)
│   └── {proveedorId}/
│       ├── nombre: string
│       ├── cif: string
│       ├── telefono: string
│       └── contacto: string
│
├── productos/                    # Productos (compartidos)
│   └── {productoId}/
│       ├── nombre: string
│       ├── proveedorId: string
│       ├── categoria: string
│       ├── precioCompra: number
│       └── stockActualUnidades: number
│
├── inventarios/                  # Conteos de inventario
│   └── {inventarioId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── fecha: string
│       ├── productos: InventoryProductCount[]
│       └── valorTotal: number
│
├── escandallos/                  # Recetas/Fichas tecnicas
│   └── {escandalloId}/
│       ├── nombre: string
│       ├── ingredientes: Ingredient[]
│       ├── pvpConIVA: number
│       └── foodCost: number
│
├── delivery/                     # Registros de delivery
│   └── {deliveryId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── fecha: string
│       ├── plataforma: string
│       ├── ventaBruta: number
│       └── comision: number
│
├── workers/                      # Trabajadores
│   └── {workerId}/
│       ├── companyId: string
│       ├── restaurantes: string[]
│       ├── nombre: string
│       └── puesto: string
│
├── transfers/                    # Transferencias entre locales
│   └── {transferId}/
│       ├── companyId: string
│       ├── restauranteOrigen: string
│       ├── restauranteDestino: string
│       └── productos: []
│
├── absences/                     # Ausencias
│   └── {absenceId}/
│       ├── workerId: string
│       ├── startDate: string
│       └── type: string
│
├── vacation_requests/            # Solicitudes vacaciones
│   └── {requestId}/
│       ├── workerId: string
│       ├── startDate: string
│       └── daysCount: number
│
├── nominas/                      # Nominas
│   └── {nominaId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── trabajadorId: string
│       └── importeBruto: number
│
├── gastosFijos/                  # Gastos fijos
│   └── {gastoId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── tipo: string
│       └── importeMensual: number
│
├── mermas/                       # Mermas
│   └── {mermaId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── productoId: string
│       └── cantidad: number
│
├── orders/                       # Pedidos a proveedores
│   └── {orderId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── proveedorId: string
│       └── productos: []
│
├── pnl_adjustments/              # Ajustes P&L
│   └── {adjustmentId}/
│       ├── restaurantId: string  ⚠️ FILTRO NECESARIO
│       ├── period: string
│       └── amount: number
│
└── fichajes/                     # Fichajes trabajadores
    └── {fichajeId}/
        ├── workerId: string
        └── date: string
```

---

## EVALUACION POR COLECCION

| Coleccion | Nivel | Diseno | Tiene restaurantId | Necesita Filtro | Riesgo |
|-----------|-------|--------|-------------------|-----------------|--------|
| companies | 0 | ✅ OK | N/A | No | Bajo |
| restaurants | 0 | ✅ OK | N/A | No | Bajo |
| usuarios | 0 | ✅ OK | Si (array) | Si | Medio |
| roles | 0 | ✅ OK | No | No | Bajo |
| **cierres** | 0 | ⚠️ | **Si** | **SI** | **Alto** |
| **facturas** | 0 | ⚠️ | **Si** | **SI** | **Alto** |
| albaranes | 0 | ⚠️ | Si | SI | Alto |
| proveedores | 0 | ✅ OK | No | No | Bajo |
| productos | 0 | ✅ OK | No | No | Bajo |
| **inventarios** | 0 | ⚠️ | **Si** | **SI** | **Alto** |
| escandallos | 0 | ✅ OK | No | No | Bajo |
| **delivery** | 0 | ⚠️ | **Si** | **SI** | **Alto** |
| workers | 0 | ✅ OK | companyId | Si | Medio |
| transfers | 0 | ✅ OK | companyId | Si | Medio |
| absences | 0 | ✅ OK | workerId | Si | Bajo |
| vacation_requests | 0 | ✅ OK | workerId | Si | Bajo |
| nominas | 0 | ⚠️ | Si | SI | Alto |
| gastosFijos | 0 | ⚠️ | Si | SI | Alto |
| mermas | 0 | ⚠️ | Si | SI | Alto |
| orders | 0 | ⚠️ | Si | SI | Alto |
| pnl_adjustments | 0 | ⚠️ | Si | SI | Alto |
| fichajes | 0 | ✅ OK | workerId | Si | Bajo |

---

## ANALISIS DE ESTRUCTURA

### Puntos Positivos

1. **Esquema bien definido** - Tipos TypeScript claros
2. **Campos restaurantId presentes** - Ya existe la base para filtrar
3. **Relaciones claras** - proveedorId, productoId bien definidos
4. **Sin subcollections innecesarias** - Simplicidad

### Problemas Detectados

1. **Estructura FLAT** - Todos los documentos en el mismo nivel
   - Implicacion: Necesita filtros en cada query
   - Solucion: Migrar a subcolecciones (largo plazo)

2. **Colecciones compartidas sin segregacion**
   - `productos` y `proveedores` son globales
   - Esto es correcto si son compartidos entre restaurantes
   - Pero problematico si cada restaurante tiene sus propios productos

3. **Arrays dentro de documentos**
   - `facturas.productos[]` puede crecer mucho
   - Limite Firestore: 1MB por documento
   - Riesgo: Facturas con muchos productos

---

## ESTRUCTURA RECOMENDADA (MIGRACION FUTURA)

```
firestore/
├── companies/{companyId}/
│   ├── ...datos empresa...
│   └── restaurants/{restaurantId}/    # SUBCOLECCION
│       ├── ...datos restaurante...
│       ├── cierres/{cierreId}/        # SUBCOLECCION
│       ├── facturas/{facturaId}/      # SUBCOLECCION
│       ├── inventarios/{inventarioId}/ # SUBCOLECCION
│       └── delivery/{deliveryId}/     # SUBCOLECCION
│
├── proveedores/                       # GLOBAL (compartido)
├── productos/                         # GLOBAL (compartido)
└── roles/                             # GLOBAL (compartido)
```

**Ventajas:**
- Queries automaticamente filtradas por restaurante
- Reglas de seguridad mas granulares
- Mejor aislamiento multi-tenant
- Menor coste (solo lee documentos del restaurante)

**Desventaja:**
- Requiere migracion de datos
- Cambios en queries existentes

---

## HOTSPOTS DETECTADOS

| Documento | Operaciones/seg estimadas | Riesgo | Solucion |
|-----------|---------------------------|--------|----------|
| cierres (dia activo) | 10-50 writes/dia | Bajo | OK |
| facturas | 5-20 writes/dia | Bajo | OK |
| productos.stockActualUnidades | Variable | Medio | Usar increment() |

**Nota:** No se detectan hotspots criticos en el uso actual. El limite de Firestore es 1 write/segundo por documento.

---

## TAMANO ESTIMADO DE DOCUMENTOS

| Coleccion | Tamano promedio | Tamano maximo | Riesgo |
|-----------|-----------------|---------------|--------|
| cierres | ~2KB | ~5KB | Bajo |
| facturas | ~3KB | ~50KB (muchos productos) | Medio |
| inventarios | ~5KB | ~100KB | Medio |
| escandallos | ~2KB | ~10KB | Bajo |

**Limite Firestore:** 1MB por documento
**Estado:** OK - Ninguna coleccion cerca del limite
