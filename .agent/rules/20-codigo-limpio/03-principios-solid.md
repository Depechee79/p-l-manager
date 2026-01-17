# REGLA: Principios SOLID y Clean Code

---

## Cuando aplica
- Al disenar nuevas funcionalidades
- Al refactorizar codigo existente
- Al revisar arquitectura de modulos

---

## Objetivo
Crear codigo flexible, mantenible y testeable.
Previene: rigidez, fragilidad, codigo dificil de modificar.

---

## PRINCIPIOS SOLID

### S - Single Responsibility Principle (SRP)

**Una clase/modulo/funcion debe tener una sola razon para cambiar.**

```typescript
// MAL: Multiples responsabilidades
class UserManager {
  createUser(data) { /* crear usuario */ }
  sendWelcomeEmail(user) { /* enviar email */ }
  generateReport(users) { /* generar reporte */ }
  validateUserData(data) { /* validar */ }
}

// BIEN: Una responsabilidad cada uno
class UserRepository {
  create(data) { /* solo persistencia */ }
  findById(id) { /* solo consulta */ }
}

class EmailService {
  sendWelcome(user) { /* solo emails */ }
}

class UserReportGenerator {
  generate(users) { /* solo reportes */ }
}

class UserValidator {
  validate(data) { /* solo validacion */ }
}
```

---

### O - Open/Closed Principle (OCP)

**Abierto para extension, cerrado para modificacion.**

```typescript
// MAL: Hay que modificar para anadir tipos
function calculateArea(shape) {
  if (shape.type === 'circle') {
    return Math.PI * shape.radius ** 2;
  } else if (shape.type === 'rectangle') {
    return shape.width * shape.height;
  }
  // Anadir triangulo requiere modificar esta funcion
}

// BIEN: Extender sin modificar
interface Shape {
  calculateArea(): number;
}

class Circle implements Shape {
  constructor(private radius: number) {}
  calculateArea() {
    return Math.PI * this.radius ** 2;
  }
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  calculateArea() {
    return this.width * this.height;
  }
}

// Anadir triangulo: solo crear nueva clase
class Triangle implements Shape {
  calculateArea() { /* ... */ }
}
```

---

### L - Liskov Substitution Principle (LSP)

**Los subtipos deben ser sustituibles por sus tipos base.**

```typescript
// MAL: Penguin no puede volar, viola LSP
class Bird {
  fly() { /* volar */ }
}

class Penguin extends Bird {
  fly() {
    throw new Error("Los pinguinos no vuelan!");
  }
}

// BIEN: Separar comportamientos
interface Bird {
  eat(): void;
}

interface FlyingBird extends Bird {
  fly(): void;
}

class Sparrow implements FlyingBird {
  eat() { /* ... */ }
  fly() { /* ... */ }
}

class Penguin implements Bird {
  eat() { /* ... */ }
  // No tiene fly()
}
```

---

### I - Interface Segregation Principle (ISP)

**Muchas interfaces especificas son mejores que una general.**

```typescript
// MAL: Interface gorda
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  writeReport(): void;
}

// BIEN: Interfaces segregadas
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Meetable {
  attendMeeting(): void;
}

// Un robot solo implementa lo que necesita
class Robot implements Workable {
  work() { /* ... */ }
}

// Un humano implementa mas
class Human implements Workable, Eatable, Meetable {
  work() { /* ... */ }
  eat() { /* ... */ }
  attendMeeting() { /* ... */ }
}
```

---

### D - Dependency Inversion Principle (DIP)

**Depender de abstracciones, no de implementaciones concretas.**

```typescript
// MAL: Dependencia directa de implementacion
class OrderService {
  private emailService = new GmailService(); // Acoplado a Gmail

  notifyOrder(order) {
    this.emailService.send(order.userEmail, 'Tu pedido...');
  }
}

// BIEN: Depender de abstraccion
interface NotificationService {
  notify(recipient: string, message: string): void;
}

class EmailNotification implements NotificationService {
  notify(recipient, message) { /* email */ }
}

class SMSNotification implements NotificationService {
  notify(recipient, message) { /* SMS */ }
}

class OrderService {
  constructor(private notificationService: NotificationService) {}

  notifyOrder(order) {
    this.notificationService.notify(order.userEmail, 'Tu pedido...');
  }
}

// Facil cambiar implementacion
const orderService = new OrderService(new EmailNotification());
// o
const orderService = new OrderService(new SMSNotification());
```

---

## OTROS PRINCIPIOS CLEAN CODE

### DRY - Don't Repeat Yourself

```typescript
// MAL: Codigo duplicado
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function checkEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// BIEN: Una sola funcion
function isValidEmail(email: string): boolean {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(email);
}
```

### KISS - Keep It Simple, Stupid

```typescript
// MAL: Over-engineered
class DateFormatterFactory {
  createFormatter(locale, timezone, format) {
    return new DateFormatterBuilder()
      .withLocale(locale)
      .withTimezone(timezone)
      .withFormat(format)
      .build();
  }
}

// BIEN: Simple
function formatDate(date: Date, format = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}
```

### YAGNI - You Aren't Gonna Need It

```typescript
// MAL: Funcionalidad "por si acaso"
interface User {
  id: string;
  name: string;
  email: string;
  futureFeatureFlag?: boolean;  // "Por si acaso"
  legacyField?: string;          // "Por compatibilidad futura"
  unusedMetadata?: object;       // "Quizas lo necesitemos"
}

// BIEN: Solo lo que se usa ahora
interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## Verificacion

- [ ] Cada clase/modulo tiene una sola responsabilidad?
- [ ] Puedo extender funcionalidad sin modificar codigo existente?
- [ ] Los subtipos son intercambiables con sus tipos base?
- [ ] Las interfaces son especificas y pequenas?
- [ ] Las dependencias son inyectadas, no hardcodeadas?
- [ ] No hay codigo duplicado?
- [ ] La solucion es la mas simple posible?
- [ ] No hay funcionalidad "por si acaso"?

---

*SOLID + Clean Code = Codigo profesional.*
