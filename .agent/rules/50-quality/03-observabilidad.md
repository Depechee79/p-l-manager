# REGLA: Observabilidad

---

## Cuando aplica
- Aplicaciones en produccion
- Debugging de problemas
- Monitoreo de salud del sistema

---

## Objetivo
Entender que pasa en el sistema sin tener que adivinarlo.
Previene: debugging a ciegas, problemas no detectados, downtime prolongado.

---

## PILARES DE OBSERVABILIDAD

| Pilar | Proposito | Ejemplo |
|-------|-----------|---------|
| **Logs** | Que paso | "Usuario X creo pedido Y" |
| **Metricas** | Cuanto/cuando | "100 pedidos/min, latencia p95: 200ms" |
| **Trazas** | Como fluyo | "Request -> API -> DB -> Response" |

---

## 1. LOGGING

### Niveles de log

| Nivel | Cuando usar | Ejemplo |
|-------|-------------|---------|
| **ERROR** | Algo fallo y requiere atencion | Error de BD, API externa caida |
| **WARN** | Algo inesperado pero manejado | Retry exitoso, fallback usado |
| **INFO** | Eventos de negocio importantes | Usuario logueado, pedido creado |
| **DEBUG** | Detalles para debugging | Valores de variables, flujo de ejecucion |

### Estructura de logs

```typescript
// MAL: Logs no estructurados
console.log('User logged in');
console.log('Error: ' + error.message);

// BIEN: Logs estructurados
const logger = {
  info: (message: string, context?: object) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },

  error: (message: string, error: Error, context?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
      ...context,
    }));
  },
};

// Uso
logger.info('User logged in', { userId: user.id, method: 'email' });
logger.error('Order creation failed', error, { orderId, userId });
```

### Que loggear

```typescript
// EVENTOS DE NEGOCIO
logger.info('ORDER_CREATED', { orderId, userId, total, items: items.length });
logger.info('PAYMENT_COMPLETED', { paymentId, amount, method });
logger.info('USER_REGISTERED', { userId, source: 'google' });

// ERRORES
logger.error('PAYMENT_FAILED', error, { orderId, provider: 'stripe' });
logger.error('DB_CONNECTION_LOST', error, { retryCount: 3 });

// WARNINGS
logger.warn('RATE_LIMIT_APPROACHING', { userId, requests: 95, limit: 100 });
logger.warn('FALLBACK_USED', { service: 'pricing', fallbackValue: defaultPrice });
```

### Que NO loggear

```typescript
// NUNCA LOGGEAR:
// - Passwords
// - Tokens de autenticacion
// - Datos personales sensibles (DNI, tarjetas)
// - PII sin necesidad

// MAL
logger.info('Login', { email, password }); // Password!
logger.info('User', { user }); // Puede tener datos sensibles

// BIEN
logger.info('Login attempt', { email, success: true });
logger.info('User action', { userId: user.id, action: 'purchase' });
```

---

## 2. METRICAS

### Metricas clave (Golden Signals)

| Metrica | Que mide | Alerta si |
|---------|----------|-----------|
| **Latencia** | Tiempo de respuesta | p95 > 500ms |
| **Traffic** | Requests por segundo | +/-50% vs normal |
| **Errores** | Tasa de errores | > 1% |
| **Saturacion** | Uso de recursos | > 80% |

### Implementacion basica

```typescript
// Contador de requests
const metrics = {
  requestCount: 0,
  errorCount: 0,
  responseTimes: [] as number[],

  recordRequest(startTime: number, success: boolean) {
    this.requestCount++;
    if (!success) this.errorCount++;
    this.responseTimes.push(Date.now() - startTime);
  },

  getStats() {
    const sorted = this.responseTimes.sort((a, b) => a - b);
    return {
      requests: this.requestCount,
      errors: this.errorCount,
      errorRate: this.errorCount / this.requestCount,
      latencyP50: sorted[Math.floor(sorted.length * 0.5)],
      latencyP95: sorted[Math.floor(sorted.length * 0.95)],
      latencyP99: sorted[Math.floor(sorted.length * 0.99)],
    };
  },
};

// Middleware para medir
async function metricsMiddleware(req, res, next) {
  const start = Date.now();
  try {
    await next();
    metrics.recordRequest(start, true);
  } catch (error) {
    metrics.recordRequest(start, false);
    throw error;
  }
}
```

### Metricas de negocio

```typescript
// Ademas de metricas tecnicas, medir negocio
const businessMetrics = {
  recordOrder(order: Order) {
    this.emit('order.created', {
      value: order.total,
      items: order.items.length,
      paymentMethod: order.paymentMethod,
    });
  },

  recordConversion(funnel: string, step: string) {
    this.emit('funnel.step', { funnel, step });
  },
};
```

---

## 3. ALERTAS

### Configuracion de alertas

| Severidad | Respuesta | Ejemplo |
|-----------|-----------|---------|
| **Critical** | Inmediata (24/7) | Sitio caido, datos corruptos |
| **High** | < 1 hora | Error rate > 5%, latencia muy alta |
| **Medium** | < 4 horas | Error rate > 1%, warnings frecuentes |
| **Low** | Siguiente dia | Metricas degradadas, deuda tecnica |

### Reglas de alertas

```typescript
// Alertas basicas
const alertRules = [
  {
    name: 'High Error Rate',
    condition: (stats) => stats.errorRate > 0.05,
    severity: 'high',
    message: 'Error rate above 5%',
  },
  {
    name: 'High Latency',
    condition: (stats) => stats.latencyP95 > 1000,
    severity: 'high',
    message: 'P95 latency above 1s',
  },
  {
    name: 'Service Down',
    condition: (stats) => stats.requests === 0,
    severity: 'critical',
    message: 'No requests received in last 5 minutes',
  },
];
```

---

## 4. ERROR TRACKING

### Captura de errores

```typescript
// Error boundary para React
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Reportar a servicio de errores
    errorTracker.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Error handler global
window.onerror = (message, source, lineno, colno, error) => {
  errorTracker.captureException(error, {
    extra: { source, lineno, colno },
  });
};

// Promesas no manejadas
window.onunhandledrejection = (event) => {
  errorTracker.captureException(event.reason);
};
```

### Contexto en errores

```typescript
// Anadir contexto para debugging
function createOrder(orderData: OrderInput) {
  try {
    return orderService.create(orderData);
  } catch (error) {
    logger.error('Order creation failed', error, {
      userId: orderData.userId,
      items: orderData.items.length,
      total: calculateTotal(orderData.items),
      // NO incluir datos sensibles
    });
    throw error;
  }
}
```

---

## HACER (obligatorio)

- Loggear eventos de negocio importantes
- Estructurar logs en JSON
- Medir latencia y errores
- Configurar alertas para metricas criticas
- Capturar errores con contexto

---

## EVITAR (prohibido)

- Loggear datos sensibles (passwords, tokens, PII)
- Logs no estructurados (solo strings)
- Ignorar errores silenciosamente
- Alertas sin accion definida

---

## Verificacion

- [ ] Logs estructurados en JSON?
- [ ] Eventos de negocio loggeados?
- [ ] Sin datos sensibles en logs?
- [ ] Metricas de latencia/errores?
- [ ] Alertas configuradas?
- [ ] Errores capturados con contexto?

---

*Lo que no se mide no se puede mejorar.*
