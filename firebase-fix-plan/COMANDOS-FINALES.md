# COMANDOS FINALES - EJECUTAR EN ORDEN

Copia y pega estos comandos en tu terminal (PowerShell o Command Prompt).

---

## PASO 1: Navegar al proyecto

```bash
cd "C:\Users\AITOR\Desktop\P&L Antigravity"
```

---

## PASO 2: Verificar que Firebase CLI esta instalado

```bash
firebase --version
```

**Si dice "firebase no se reconoce como comando":**
```bash
npm install -g firebase-tools
firebase login
```

---

## PASO 3: Seleccionar el proyecto correcto

```bash
firebase use pylhospitality
```

**Si no funciona, lista los proyectos disponibles:**
```bash
firebase projects:list
```

---

## PASO 4: Desplegar los indices (PRIMERO)

```bash
firebase deploy --only firestore:indexes
```

**Espera 5-10 minutos** para que los indices se construyan.
Puedes verificar el progreso en Firebase Console > Firestore > Indices.

---

## PASO 5: Desplegar las reglas de seguridad

```bash
firebase deploy --only firestore:rules
```

---

## PASO 6: Verificar el deploy

```bash
firebase firestore:indexes
```

Deberia mostrar 15 indices.

---

## RESUMEN DE COMANDOS (COPIAR TODO)

```bash
cd "C:\Users\AITOR\Desktop\P&L Antigravity"
firebase use pylhospitality
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

---

## VERIFICACION POST-DEPLOY

1. **Firebase Console:** https://console.firebase.google.com
2. **Ir a:** Firestore Database > Indices
3. **Verificar:** Todos los indices dicen "Enabled"
4. **Ir a:** Firestore Database > Rules
5. **Verificar:** Las reglas nuevas estan publicadas

---

## SI HAY ERRORES

### Error: "firebase: command not found"
```bash
npm install -g firebase-tools
firebase login
```

### Error: "No project active"
```bash
firebase projects:list
firebase use [nombre-del-proyecto]
```

### Error: "Permission denied"
```bash
firebase logout
firebase login
```
(Usa la cuenta de Google correcta)

### Error en las reglas: "Syntax error"
Las reglas ya estan corregidas en el archivo. Si hay error, restaura la version anterior desde Firebase Console.

---

## TIEMPO TOTAL ESTIMADO

- Comandos: 2 minutos
- Construccion de indices: 5-15 minutos
- Verificacion: 2 minutos

**TOTAL: ~20 minutos**
