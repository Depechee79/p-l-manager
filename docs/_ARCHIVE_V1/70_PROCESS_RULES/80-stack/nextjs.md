# REGLA: Next.js

---

## Cuando aplica
- Proyectos Next.js (Registra3D)
- Routing y navegacion
- Server/Client components

---

## APP ROUTER (Next.js 13+)

### Estructura de carpetas

```
app/
├── layout.tsx          # Layout raiz
├── page.tsx            # Pagina principal
├── loading.tsx         # UI de carga
├── error.tsx           # UI de error
├── not-found.tsx       # 404
│
├── (auth)/             # Grupo de rutas (no afecta URL)
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
│
├── dashboard/
│   ├── layout.tsx      # Layout anidado
│   ├── page.tsx
│   └── [id]/           # Ruta dinamica
│       └── page.tsx
│
└── api/                # API routes
    └── users/
        └── route.ts
```

---

## SERVER VS CLIENT COMPONENTS

```typescript
// Server Component (default) - Sin "use client"
// Puede: fetch data, acceder a backend, usar async/await
async function ProductList() {
  const products = await getProducts(); // Fetch en servidor
  return <ul>{products.map(p => <li key={p.id}>{p.name}</li>)}</ul>;
}

// Client Component - Con "use client"
// Puede: useState, useEffect, event handlers, browser APIs
'use client';

function AddToCartButton({ productId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await addToCart(productId);
    setLoading(false);
  };

  return <button onClick={handleClick} disabled={loading}>Add</button>;
}
```

---

## DATA FETCHING

```typescript
// En Server Components
async function Page() {
  // Fetch con cache automatico
  const data = await fetch('https://api.example.com/data');

  // Sin cache
  const fresh = await fetch('https://api.example.com/data', {
    cache: 'no-store'
  });

  // Revalidar cada hora
  const timed = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }
  });

  return <Component data={data} />;
}
```

---

## API ROUTES

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const users = await getUsers();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await createUser(body);
  return NextResponse.json(user, { status: 201 });
}
```

---

## METADATA Y SEO

```typescript
// Static metadata
export const metadata = {
  title: 'Mi Pagina',
  description: 'Descripcion para SEO',
};

// Dynamic metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.id);
  return {
    title: product.name,
    description: product.description,
  };
}
```

---

## Verificacion

- [ ] Server Components por defecto?
- [ ] "use client" solo donde necesario?
- [ ] Metadata configurado?
- [ ] Loading y error states?
- [ ] API routes validando input?

