# Fase 2 — Datos reales (Firestore)

> **Criticidad: 🟡 alta.** Reemplaza todos los datos MOCK por Firestore, define el modelo de datos por PYME y crea la capa de servicios tipada + el `PymeContext`. Es la columna vertebral funcional sobre la que se apoya el flujo POS (Fase 3) y el dashboard (Fase 4).

---

## 1. Objetivo

1. Definir el **modelo de datos** en Firestore, todo bajo `pymes/{pymeId}`.
2. Crear **servicios tipados** (productos, insumos, categorías, órdenes, mesas) con lectura en tiempo real (`onSnapshot`).
3. Introducir **`PymeContext`** para resolver el `pymeId` activo una sola vez (= `uid`).
4. Reemplazar los **arrays MOCK** de catálogo y orden por datos reales, con estados **carga/vacío/error**.
5. Implementar **modales CRUD** para crear/editar/eliminar productos, insumos y categorías (hoy son `Alert`).

## 2. Depende de / Habilita

- **Depende de:** Fase 0 (`src/lib/firebase.ts`, `AuthContext`, reglas), Fase 1 (`EmptyState`, `Skeleton`, tokens, `Input`, `Button`).
- **Habilita:** Fase 3 (necesita productos y mesas reales + colección `ordenes`), Fase 4 (dashboard lee `ordenes`/`ventas`).

## 3. Alcance

**Incluye:** tipos, servicios de datos, contexto de PYME, conexión de catálogo y grid de orden a Firestore, CRUD de catálogo, hooks de lectura.

**No incluye:** el checkout/pago ni estados de mesa (Fase 3), ni las métricas agregadas del dashboard (Fase 4). La colección `ordenes` se **define** aquí pero su ciclo de vida completo es de la Fase 3.

## 4. Archivos afectados

### Crear
- `src/data/types.ts` — todas las interfaces del dominio.
- `src/data/productos.ts`, `src/data/insumos.ts`, `src/data/categorias.ts` — servicios CRUD + listeners.
- `src/data/ordenes.ts`, `src/data/mesas.ts` — definidos aquí (uso pleno en Fase 3).
- `src/data/paths.ts` — helpers de rutas de colección (`productosCol(pymeId)`…).
- `src/context/PymeContext.tsx` — provider + `usePyme()`.
- `src/hooks/useCollection.ts` — hook genérico `onSnapshot` → `{ data, loading, error }`.
- `src/components/catalogo/ProductoFormModal.tsx`, `InsumoFormModal.tsx`, `CategoriaFormModal.tsx`.

### Modificar
- `app/_layout.tsx` — envolver con `<PymeProvider>` (dentro de `AuthProvider`).
- `components/catalogo/productos/TableProductos.tsx` — quitar `MOCK`, usar `useProductos()`.
- `components/catalogo/insumos/TableInsumos.tsx` — quitar `MOCK`, usar `useInsumos()`.
- `components/catalogo/categorias/TableCategorias.tsx` — quitar `MOCK`, usar `useCategorias()`.
- `app/(drawer)/orden.tsx` — reemplazar `PRODUCTS`/`CATEGORIES` locales por datos reales.
- `firebase/FirestoreRestaurante.ts` — migrar su lógica a `src/data/mesas.ts` (mantener wrapper temporal o actualizar `mesas.tsx`).

### Eliminar (al final de la fase)
- Arrays `MOCK` en los tres `Table*.tsx` y en `orden.tsx`.
- `firebase/FirestoreRestaurante.ts` una vez migrado (opcional; puede quedar como re-export).

## 5. Pasos detallados

### Paso 5.1 — `src/data/types.ts`

```ts
export type Unidad = 'kg' | 'g' | 'l' | 'ml' | 'pz';

export interface Negocio {
  id: string; nombre: string; nombreNegocio: string; email: string; celular?: string;
  isAdmin: boolean;
  config?: { moneda: string; tasaImpuesto: number; descuento: number };
}
export interface Categoria { id: string; nombre: string; activa: boolean; orden?: number; }
export interface Producto {
  id: string; nombre: string; categoriaId: string; precio: number;
  stock: number; imagen?: string; descripcion?: string; activo: boolean;
}
export interface Insumo { id: string; nombre: string; unidad: Unidad; stock: number; costo: number; }

export type EstadoMesa = 'libre' | 'ocupada' | 'por_cobrar';
export interface Mesa { id: string; x: number; y: number; label?: string; shape?: 'circle' | 'rect'; estado?: EstadoMesa; }
export interface MesaLayout { id: string; nombre: string; tables: Mesa[]; }

export type EstadoOrden = 'abierta' | 'cerrada' | 'cancelada';
export interface OrdenItem { productoId: string; nombre: string; precio: number; qty: number; }
export interface Orden {
  id: string; mesaId?: string; items: OrdenItem[]; estado: EstadoOrden;
  subtotal: number; descuento: number; impuesto: number; total: number;
  creada: number; cerrada?: number;   // epoch ms
}
export interface Venta { id: string; ordenId: string; total: number; metodoPago: string; fecha: number; }
```

### Paso 5.2 — `src/data/paths.ts`

```ts
import { collection, doc } from 'firebase/firestore';
import { firestore } from '@/src/lib/firebase';
export const pymeDoc = (p: string) => doc(firestore, 'pymes', p);
export const productosCol  = (p: string) => collection(firestore, 'pymes', p, 'productos');
export const insumosCol    = (p: string) => collection(firestore, 'pymes', p, 'insumos');
export const categoriasCol = (p: string) => collection(firestore, 'pymes', p, 'categorias');
export const ordenesCol    = (p: string) => collection(firestore, 'pymes', p, 'ordenes');
export const ventasCol     = (p: string) => collection(firestore, 'pymes', p, 'ventas');
export const mesasCol      = (p: string) => collection(firestore, 'pymes', p, 'mesas');
```

### Paso 5.3 — `PymeContext`

```tsx
// src/context/PymeContext.tsx
import { onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { pymeDoc } from '@/src/data/paths';
import type { Negocio } from '@/src/data/types';

type Value = { pymeId: string | null; negocio: Negocio | null; loading: boolean };
const Ctx = createContext<Value>({ pymeId: null, negocio: null, loading: true });

export function PymeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<Value>({ pymeId: null, negocio: null, loading: true });
  useEffect(() => {
    if (!user) { setState({ pymeId: null, negocio: null, loading: false }); return; }
    return onSnapshot(pymeDoc(user.uid), (snap) => {
      setState({ pymeId: user.uid, negocio: snap.exists() ? ({ id: snap.id, ...snap.data() } as Negocio) : null, loading: false });
    });
  }, [user?.uid]);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
export const usePyme = () => useContext(Ctx);
```

> **Mejora clave:** elimina `FirestoreRestaurante.getPymeIdByEmail`, que hacía una query por email en **cada** guardado/carga. Ahora el `pymeId` = `uid` está disponible al instante.

### Paso 5.4 — Hook genérico `useCollection`

```ts
// src/hooks/useCollection.ts
import { onSnapshot, Query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useCollection<T>(queryRef: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    if (!queryRef) { setLoading(false); return; }
    setLoading(true);
    return onSnapshot(queryRef,
      (snap) => { setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T))); setLoading(false); },
      (err) => { setError(err); setLoading(false); });
  }, [queryRef]);
  return { data, loading, error };
}
```

### Paso 5.5 — Servicios de datos (ejemplo productos)

```ts
// src/data/productos.ts
import { addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { productosCol } from './paths';
import type { Producto } from './types';

export const productosService = {
  create: (pymeId: string, data: Omit<Producto, 'id'>) => addDoc(productosCol(pymeId), data),
  update: (pymeId: string, id: string, data: Partial<Producto>) =>
    setDoc(doc(productosCol(pymeId), id), data, { merge: true }),
  remove: (pymeId: string, id: string) => deleteDoc(doc(productosCol(pymeId), id)),
};
```
Análogos para `insumos` y `categorias`. Hooks de lectura:
```ts
// dentro de productos.ts o un hooks file
export function useProductos() {
  const { pymeId } = usePyme();
  const q = useMemo(() => pymeId ? query(productosCol(pymeId), orderBy('nombre')) : null, [pymeId]);
  return useCollection<Producto>(q);
}
```

### Paso 5.6 — Conectar las tablas de catálogo

Para cada `Table*.tsx`:
1. Sustituir `const items = useMemo(() => MOCK.filter(...))` por:
   ```ts
   const { data, loading, error } = useProductos();
   const items = useMemo(() => filtrar(data, query), [data, query]);
   ```
2. Render con estados:
   - `loading` → `<Skeleton>` (filas).
   - `error` → `<EmptyState variant="error">`.
   - `data.length === 0` → `<EmptyState>` "Sin productos, crea el primero".
3. Botón **"Nuevo …"** → abre el `*FormModal` en vez del `Alert` actual.
4. Menú `dots-vertical` → editar / eliminar (con confirmación para eliminar).

### Paso 5.7 — Conectar el grid de `orden.tsx`

- `CATEGORIES` locales → `useCategorias()` (solo activas).
- `PRODUCTS` locales → `useProductos()` filtrados por `categoriaId`.
- Mantener el carrito en estado local por ahora (su persistencia como `Orden` es de Fase 3).
- Añadir estados carga/vacío en el grid.

### Paso 5.8 — Migrar mesas a `src/data/mesas.ts`

Portar `guardarMesas`/`cargarMesas` de `FirestoreRestaurante` usando `pymeId` del contexto (sin lookup por email). `mesas.tsx` usará el nuevo servicio. (El estado de mesa y su relación con órdenes llega en Fase 3.)

### Paso 5.9 — Seed opcional

Script/documento para sembrar categorías y productos de ejemplo (los mismos del MOCK) en una PYME de prueba, para no partir de vacío durante el desarrollo.

## 6. Criterios de aceptación

- [ ] `src/data/types.ts` define todas las entidades del dominio.
- [ ] Ninguna pantalla usa arrays `MOCK`.
- [ ] Catálogo (productos/insumos/categorías) lee y escribe en Firestore en tiempo real.
- [ ] Crear/editar/eliminar funciona desde modales, con validación básica.
- [ ] `orden.tsx` muestra categorías y productos reales.
- [ ] `usePyme()` provee `pymeId` sin queries por email.
- [ ] Estados carga/vacío/error visibles y consistentes (componentes de Fase 1).
- [ ] Las reglas de seguridad cubren las nuevas subcolecciones.

## 7. Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo start --web
```
Pruebas manuales:
1. Crear categoría → aparece al instante en el tab y como filtro en Orden.
2. Crear producto con imagen y precio → aparece en tabla y en el grid de Orden.
3. Editar y eliminar → se refleja en tiempo real; eliminar pide confirmación.
4. Con dos ventanas (misma PYME) → cambios se propagan por `onSnapshot`.
5. Verificar (reglas) que otra PYME no ve estos datos.

## 8. Riesgos y decisiones abiertas

- **Índices de Firestore:** consultas con `orderBy` + `where` pueden requerir índices compuestos; Firebase indica el enlace para crearlos.
- **Imágenes de producto:** decisión abierta — ¿subir a Firebase Storage o guardar URL externa? Recomendado: empezar con URL (como el MOCK), añadir carga a Storage como mejora posterior.
- **Costo de lectura:** `onSnapshot` en muchas pantallas incrementa lecturas; aceptable para PYMES pequeñas. Revisar si se agregan muchas sucursales.
- **Migración de `insumos` ↔ productos:** por ahora insumos es catálogo independiente; la relación receta (producto→insumos) queda fuera de alcance (posible fase futura).
