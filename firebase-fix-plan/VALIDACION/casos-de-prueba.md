# CASOS DE PRUEBA DETALLADOS

Este documento contiene casos de prueba mas detallados para escenarios especificos.

---

## CASO 1: USUARIO NUEVO

### Escenario
Un usuario nuevo se registra y empieza a usar la app.

### Pasos
1. El admin crea un nuevo usuario en el sistema
2. El admin asigna el usuario a un restaurante
3. El usuario inicia sesion por primera vez
4. El usuario navega por la app

### Verificaciones
- [ ] El usuario solo ve datos de su restaurante asignado
- [ ] El usuario puede crear nuevos registros (facturas, cierres, etc.)
- [ ] Los registros creados aparecen en Firebase con el restaurantId correcto
- [ ] El usuario NO puede ver datos de otros restaurantes

### Resultado esperado
El usuario tiene una experiencia limpia, solo con sus datos.

---

## CASO 2: RESTAURANTE NUEVO

### Escenario
Se abre un nuevo restaurante y se configura en el sistema.

### Pasos
1. El admin crea un nuevo restaurante en la seccion de configuracion
2. El admin asigna usuarios al nuevo restaurante
3. Los usuarios empiezan a crear registros

### Verificaciones
- [ ] El restaurante aparece en Firebase en la coleccion "restaurants"
- [ ] Los usuarios asignados pueden ver el restaurante
- [ ] Los registros nuevos se crean con el restaurantId del nuevo restaurante
- [ ] Los datos del nuevo restaurante estan aislados de otros

### Resultado esperado
El restaurante funciona de forma independiente.

---

## CASO 3: MIGRACION DE DATOS EXISTENTES

### Escenario
Ya hay datos en el sistema sin restaurantId.

### Pasos
1. Verificar cuantos documentos no tienen restaurantId
2. Ejecutar script de migracion (si existe)
3. O asignar manualmente restaurantId a cada documento

### Verificaciones
- [ ] Antes: algunos documentos no tienen restaurantId
- [ ] Despues: TODOS los documentos tienen restaurantId
- [ ] Las reglas de seguridad funcionan correctamente

### Script para verificar documentos sin restaurantId:

```javascript
// Ejecutar en la consola del navegador
// cuando la app esta en modo desarrollo

const collections = ['facturas', 'cierres', 'inventarios', 'delivery'];

for (const col of collections) {
  const response = await db.cloudService.getAll(col);
  if (response.success) {
    const sinRestaurant = response.data.filter(d => !d.restaurantId);
    console.log(`${col}: ${sinRestaurant.length} sin restaurantId`);
  }
}
```

### Resultado esperado
0 documentos sin restaurantId en colecciones filtradas.

---

## CASO 4: PERDIDA DE CONEXION

### Escenario
El usuario pierde conexion a internet mientras trabaja.

### Pasos
1. Usuario esta trabajando normalmente
2. Se desconecta internet (modo avion o desconectar wifi)
3. Usuario intenta guardar un registro
4. Usuario reconecta internet
5. Usuario intenta guardar de nuevo

### Verificaciones
- [ ] Paso 3: Aparece mensaje de error claro
- [ ] Paso 3: El dato NO se guarda en la lista local
- [ ] Paso 4: La app detecta que hay conexion
- [ ] Paso 5: El guardado funciona correctamente

### Resultado esperado
El usuario sabe exactamente que paso y puede reintentar.

---

## CASO 5: EDICION CONCURRENTE

### Escenario
Dos usuarios editan el mismo registro al mismo tiempo.

### Pasos
1. Usuario A abre factura #123
2. Usuario B abre factura #123
3. Usuario A cambia el total a 100
4. Usuario B cambia el total a 200
5. Usuario A guarda
6. Usuario B guarda (unos segundos despues)

### Verificaciones
- [ ] El ultimo en guardar "gana" (Usuario B)
- [ ] El valor final es 200
- [ ] No hay corrupcion de datos
- [ ] Ambos usuarios pueden seguir trabajando

### Resultado esperado
El sistema acepta el ultimo cambio sin errores.
(Nota: En futuras versiones se podria detectar el conflicto)

---

## CASO 6: CARGA MASIVA

### Escenario
El restaurante tiene muchos datos historicos.

### Pasos
1. Crear 500 facturas de prueba
2. Navegar a la seccion de Facturas
3. Medir tiempo de carga
4. Verificar que solo se cargan 100 (limite)

### Verificaciones
- [ ] La carga no tarda mas de 3 segundos
- [ ] Solo se muestran 100 facturas inicialmente
- [ ] Hay opcion de cargar mas o paginar
- [ ] Firebase Console muestra ~100 reads, no 500

### Resultado esperado
Rendimiento aceptable incluso con muchos datos.

---

## CASO 7: CAMBIO DE RESTAURANTE

### Escenario
Un usuario tiene acceso a multiples restaurantes y cambia entre ellos.

### Pasos
1. Usuario inicia sesion (tiene acceso a Rest A y Rest B)
2. Selector de restaurante muestra ambos
3. Usuario esta en Rest A, ve sus facturas
4. Usuario cambia a Rest B
5. Usuario ve las facturas de Rest B

### Verificaciones
- [ ] El selector muestra solo restaurantes autorizados
- [ ] Al cambiar, los datos se recargan
- [ ] Los datos son del restaurante correcto
- [ ] No hay "mezcla" de datos entre restaurantes

### Resultado esperado
Cambio limpio entre restaurantes.

---

## CASO 8: USUARIO SIN PERMISOS

### Escenario
Un usuario intenta acceder a recursos sin autorizacion.

### Pasos (via consola del navegador)
```javascript
// Intentar leer datos de otro restaurante
const result = await db.cloudService.getByRestaurant('facturas', 'otro-restaurant-id');
console.log(result);
```

### Verificaciones
- [ ] La query retorna error de permisos
- [ ] No se exponen datos del otro restaurante
- [ ] El error es manejado gracefully

### Resultado esperado
Acceso denegado con mensaje apropiado.

---

## CASO 9: BACKUP Y RESTAURACION

### Escenario
Se necesita restaurar datos de un backup.

### Pasos
1. Exportar datos desde Firebase Console
2. Simular perdida de datos (eliminar coleccion de prueba)
3. Importar datos desde el backup
4. Verificar que los datos estan de vuelta

### Verificaciones
- [ ] El export se completa sin errores
- [ ] El import restaura todos los documentos
- [ ] Los indices siguen funcionando
- [ ] La app funciona normalmente despues

### Resultado esperado
Recuperacion completa de datos.

---

## CASO 10: ACTUALIZACION DE REGLAS

### Escenario
Se necesita cambiar las reglas de seguridad en produccion.

### Pasos
1. Hacer backup de reglas actuales
2. Modificar reglas en Firebase Console
3. Publicar nuevas reglas
4. Verificar que la app sigue funcionando
5. Si hay error, restaurar reglas anteriores

### Verificaciones
- [ ] Las nuevas reglas se publican sin error de sintaxis
- [ ] Las operaciones existentes siguen funcionando
- [ ] Las nuevas restricciones aplican correctamente
- [ ] Hay rollback disponible si es necesario

### Resultado esperado
Actualizacion sin interrupcion del servicio.

---

## NOTAS PARA EL TESTER

1. **Documenta todo:** Anota errores, comportamientos raros, tiempos de carga.

2. **Capturas de pantalla:** Guarda capturas de errores para referencia.

3. **Consola del navegador:** Manten la consola abierta (F12) para ver logs.

4. **Firebase Console:** Ten abierta para verificar cambios en tiempo real.

5. **Diferentes navegadores:** Si es posible, prueba en Chrome y Firefox.

6. **Movil:** Prueba la version movil si la hay.
