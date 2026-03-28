# Decisiones de Producto Pendientes

> Estas decisiones requieren input de Aitor antes de implementarse.
> Cada una tiene impacto en seguridad, arquitectura o experiencia de usuario.
> Ultima actualizacion: 2026-03-28 (Sesion #006)

---

## DP-1: Migrar autenticacion de localStorage a Firebase Auth real

**Que pasa ahora:**
La app autentica usuarios guardando `{ name: "Carlos" }` en localStorage.
Cualquiera puede abrir las herramientas del navegador y escribir un nombre para "loguearse".
No hay contraseña real, no hay token de sesión, no hay verificación con el servidor.

**Por que es importante:**
Si alguien accede al navegador de un camarero, puede hacerse pasar por cualquier usuario.
Los datos del restaurante (cierres de caja, nóminas, inventarios) quedan expuestos.

**Que se propone:**
Usar el sistema de login real que ya existe en el código (AuthService.ts con Firebase Auth:
email + contraseña). Conectar AppContext.tsx con Firebase Auth para que el login sea real.

**Que implica:**
- Modificar AppContext.tsx para usar onAuthStateChanged de Firebase
- Cada usuario necesitará email + contraseña reales
- Los usuarios actuales de prueba necesitarán crearse en Firebase Auth
- Estimación: 1 sesión dedicada

**Opciones:**
A) Migrar ahora (recomendado si se va a producción pronto)
B) Mantener localStorage para desarrollo y migrar antes del primer deploy real
C) Migrar parcialmente: login real pero mantener localStorage como fallback offline

---

## DP-2: Endurecer reglas de seguridad de Firestore con aislamiento por restaurante

**Que pasa ahora:**
Las reglas de seguridad de la base de datos solo verifican "¿está logueado?".
No verifican "¿tiene acceso a ESTE restaurante?".
Resultado: un camarero del Restaurante A puede leer las nóminas del Restaurante B
si sabe cómo hacer la consulta.

**Por que es importante:**
En un sistema multi-restaurante (que es el objetivo del producto), los datos de cada
restaurante deben estar completamente aislados. Ahora mismo, el aislamiento solo
existe en la interfaz (se filtran los datos al mostrarlos), pero la base de datos
permite acceso a todo.

**Que se propone:**
Activar las funciones `hasRestaurantAccess()` y `canAccessDocument()` que YA están
escritas en firestore.rules pero no se usan. Cada consulta verificaría que el usuario
tiene asignado el restaurante que está intentando leer/escribir.

**Que implica:**
- Los datos existentes en Firebase podrían no tener el campo `restaurantId`
  (datos de prueba o legacy). Necesitan migración.
- Hay que verificar que TODAS las consultas del código incluyen `restaurantId`
- Si se activan las reglas sin migrar los datos, las consultas fallarán
- Estimación: 1-2 sesiones (1 migración datos + 1 activación reglas)

**Opciones:**
A) Migrar datos y endurecer reglas (recomendado)
B) Solo endurecer reglas nuevas, legacy sin cambio (riesgo: datos legacy inaccesibles)
C) Posponer hasta que haya datos reales de producción

---

## DP-3: Migrar timestamps de texto a formato nativo de Firebase

**Que pasa ahora:**
Las fechas se guardan como texto ("2026-03-28T14:30:00.000Z") en vez de usar
el formato nativo de Firebase (Timestamp). Esto funciona, pero tiene limitaciones.

**Por que es importante:**
- Firebase puede ordenar y filtrar Timestamps de forma eficiente en el servidor
- Con texto, Firebase ordena alfabéticamente (funciona para ISO 8601, pero es frágil)
- Si se necesitan consultas como "todos los cierres del último mes", con Timestamps
  Firebase las resuelve en el servidor. Con texto, hay que descargar todo y filtrar.

**Que implica:**
- Cambiar `BaseEntity.createdAt/updatedAt` de `string` a `Timestamp | string`
- Migrar todos los datos existentes en Firebase (script de migración)
- Actualizar ~50 lugares del código que usan `new Date().toISOString()`
- Estimación: 1-2 sesiones

**Opciones:**
A) Migrar todo a Timestamp (recomendado a largo plazo)
B) Mantener ISO strings (funciona, menor riesgo, menor beneficio)
C) Dual: nuevos datos en Timestamp, legacy en string (complejidad de lectura)

---

## DP-4: Mejorar seguridad de tokens de invitacion

**Que pasa ahora:**
Los enlaces de invitación para nuevos usuarios se generan con `Math.random()`,
que no es criptográficamente seguro. Un atacante sofisticado podría predecir tokens.

**Por que es importante:**
Bajo. El espacio de tokens (62^32) es enorme, así que la predicción es poco práctica.
Pero es una buena práctica usar generadores seguros para tokens de acceso.

**Que se propone:**
Mover la generación de tokens a una Cloud Function que use `crypto.randomBytes()`.

**Que implica:**
- Crear Cloud Function `generateInvitationToken` (europe-west1)
- Cambiar el flujo de creación de invitaciones para llamar a la CF
- Estimación: incluido en la sesión de Cloud Functions

**Opciones:**
A) Implementar con Cloud Functions (cuando se creen)
B) Usar crypto.getRandomValues() en el cliente (disponible en todos los navegadores modernos)
C) Mantener Math.random() (riesgo bajo, funcional)

---

## Prioridad recomendada

1. **DP-1 (Auth real)** — Bloquea cualquier deploy a producción
2. **DP-2 (Firestore rules)** — Bloquea multi-restaurante real
3. **DP-3 (Timestamps)** — Mejora rendimiento, no bloquea
4. **DP-4 (Tokens seguros)** — Se resuelve con Cloud Functions
