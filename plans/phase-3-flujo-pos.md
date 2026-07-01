# Fase 3 — Flujo POS (Mesas → Orden → Pago)

> **Criticidad: 🟡 alta (núcleo del producto).** Convierte piezas hoy inconexas en el flujo central de un POS: seleccionar una mesa, tomar su orden, cobrar y registrar la venta liberando la mesa.

---

## 1. Objetivo

1. Enlazar **Mesas → Orden**: tocar una mesa abre/gestiona su orden.
2. Dar **estado a cada mesa** (`libre | ocupada | por_cobrar`) reflejado visualmente.
3. Persistir la **orden por mesa** en Firestore (colección `ordenes` definida en Fase 2).
4. Implementar el **checkout/pago**: método de pago, confirmación, cierre de orden, **registro de venta** y liberación de la mesa.
5. Mejorar el **editor de mesas**: varias salas/layouts, renombrar/eliminar mesa, capacidad, forma.

## 2. Depende de / Habilita

- **Depende de:** Fase 1 (UI/tokens), Fase 2 (`ordenes`, `mesas`, `productos`, `PymeContext`, `Negocio.config` de impuestos/descuento).
- **Habilita:** Fase 4 (el dashboard consume `ventas` y `ordenes` que esta fase genera).

## 3. Alcance

**Incluye:** navegación mesa↔orden, estados de mesa, persistencia de orden, pantalla de pago, registro de venta, mejoras del editor de mesas.

**No incluye:** métricas/gráficas del dashboard (Fase 4), impresión de tickets ni pasarelas de pago reales (posible fase futura; aquí el "pago" es registro interno de método + monto).

## 4. Archivos afectados

### Crear
- `app/(drawer)/orden/[mesaId].tsx` — orden asociada a una mesa concreta (ruta dinámica) **o** parámetro en la pantalla actual (ver decisión 8).
- `app/(drawer)/checkout.tsx` — pantalla de pago/cobro.
- `src/data/ordenes.ts` — completar ciclo: `abrirOrden`, `actualizarItems`, `cerrarOrden` (transaccional con venta).
- `src/data/ventas.ts` — `registrarVenta`.
- `src/components/pos/MesaSelector.tsx` — (opcional) selector rápido de mesa desde Orden.
- `src/hooks/useOrdenDeMesa.ts` — obtiene/crea la orden abierta de una mesa.

### Modificar
- `app/(drawer)/mesas.tsx` — al tocar mesa (fuera de modo edición) → navegar a su orden; pintar color por `estado`; añadir toolbar de salas y edición de mesa (nombre/forma/eliminar).
- `app/(drawer)/orden.tsx` — aceptar `mesaId`; cargar/crear la orden abierta; el carrito pasa a persistirse como `Orden`; botón "Continuar al pago" → `checkout`.
- `src/data/mesas.ts` — soportar múltiples layouts/salas y actualización de `estado` por mesa.
- Drawer `_layout.tsx` — `checkout` y la ruta de orden por mesa se registran como pantallas ocultas si aplica.

## 5. Pasos detallados

### Paso 5.1 — Estado y navegación de mesas

- En `mesas.tsx`, separar **modo edición** (colocar/mover/renombrar/eliminar) del **modo operación** (tocar mesa abre su orden).
- Color de la mesa según `estado` usando tokens: `libre` = neutro, `ocupada` = `accent`, `por_cobrar` = `warning`.
- Al tocar en modo operación: `router.push('/(drawer)/orden/' + mesa.id)` (o `router.push({ pathname:'/(drawer)/orden', params:{ mesaId } })` según decisión 8).

### Paso 5.2 — Abrir/crear la orden de la mesa

```ts
// src/hooks/useOrdenDeMesa.ts (boceto)
// Busca una orden 'abierta' de la mesa; si no existe, la crea al añadir el primer item.
export function useOrdenDeMesa(mesaId?: string) {
  const { pymeId } = usePyme();
  // query(ordenesCol, where('mesaId','==',mesaId), where('estado','==','abierta'), limit(1))
  // devuelve { orden, addItem, incItem, decItem, removeItem, loading }
}
```
- El carrito local de `orden.tsx` se sincroniza con la orden abierta (escritura con debounce o al confirmar cada cambio).
- Marcar mesa como `ocupada` al abrir la primera orden.

### Paso 5.3 — Totales desde configuración de la PYME

Hoy los totales usan valores fijos (`discount = 5`, `taxRate = 0.06`) en <ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\(drawer)\orden.tsx" lines="143-150" />. Sustituir por `negocio.config`:
```ts
const { negocio } = usePyme();
const taxRate = negocio?.config?.tasaImpuesto ?? 0.16;
const descuento = negocio?.config?.descuento ?? 0;
```

### Paso 5.4 — Checkout / pago

`app/(drawer)/checkout.tsx`:
- Muestra resumen (items, subtotal, descuento, impuesto, total).
- Selección de **método de pago** (efectivo, tarjeta, transferencia) — enum simple.
- Botón **Cobrar** → ejecuta cierre transaccional:

```ts
// src/data/ordenes.ts — cerrar orden + registrar venta + liberar mesa, atómico
import { runTransaction, doc, serverTimestamp } from 'firebase/firestore';
export async function cobrarOrden(pymeId: string, ordenId: string, metodoPago: string) {
  await runTransaction(firestore, async (tx) => {
    const oRef = doc(ordenesCol(pymeId), ordenId);
    const oSnap = await tx.get(oRef);
    if (!oSnap.exists()) throw new Error('Orden no encontrada');
    const orden = oSnap.data() as Orden;
    tx.update(oRef, { estado: 'cerrada', cerrada: Date.now() });
    const vRef = doc(ventasCol(pymeId));
    tx.set(vRef, { ordenId, total: orden.total, metodoPago, fecha: Date.now() });
    if (orden.mesaId) {
      // marcar mesa como 'libre' en el layout correspondiente
    }
  });
}
```
- Al éxito: volver a Mesas (mesa liberada) o mostrar confirmación.

### Paso 5.5 — Editor de mesas mejorado

- **Salas/layouts múltiples:** selector en la toolbar; `mesas.tsx` hoy usa `'sala-principal'` fijo (<ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\(drawer)\mesas.tsx" lines="84-101" />). Permitir crear/renombrar salas → `mesas/{layoutId}`.
- **Editar mesa:** al tocar en modo edición, abrir hoja con nombre (`label`), forma (`circle|rect`) y **eliminar**.
- **Capacidad** (opcional): campo `capacidad` en `Mesa`.
- Reemplazar `console.log` y `Alert` por feedback con toasts/estados (ver Fase 4).

## 6. Criterios de aceptación

- [ ] Tocar una mesa (modo operación) abre su orden.
- [ ] La orden se persiste en `ordenes` y sobrevive a recargar la app.
- [ ] La mesa cambia a `ocupada` con orden abierta y a `libre` tras cobrar.
- [ ] Totales calculados con `negocio.config` (sin valores hardcodeados).
- [ ] Checkout registra una `venta` y cierra la orden de forma **atómica** (transacción).
- [ ] Editor de mesas: crear/renombrar sala, renombrar/eliminar mesa, elegir forma.
- [ ] Sin `console.log` en `mesas.tsx`.

## 7. Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo start --web
```
Prueba de flujo completa:
1. Crear sala y colocar 3 mesas.
2. Tocar mesa 1 → agregar productos → verificar orden persistida y mesa `ocupada`.
3. Ir a checkout → cobrar (efectivo) → verificar `venta` creada, orden `cerrada`, mesa `libre`.
4. Reabrir app → estados correctos.
5. Cancelar una orden → mesa vuelve a `libre` sin generar venta.

## 8. Riesgos y decisiones abiertas

- **Ruta dinámica vs parámetro:** decisión abierta entre `orden/[mesaId].tsx` (más limpio, deep-linkable) y reutilizar `orden.tsx` con `params`. Recomendado: ruta dinámica.
- **Órdenes sin mesa (mostrador/para llevar):** permitir `mesaId` opcional; contemplar un "modo mostrador".
- **Concurrencia:** dos meseros en la misma mesa → la transacción protege el cobro, pero conviene bloquear UI si la orden ya está `cerrada`.
- **Modelo de mesas + estado:** el `estado` vive dentro del array `tables` del layout; actualizarlo implica reescribir el doc del layout. Alternativa futura: subcolección de mesas para updates más finos.
- **Pagos reales:** fuera de alcance; si más adelante se integra pasarela (Stripe/Mercado Pago), el registro de `venta` ya deja el punto de extensión.
