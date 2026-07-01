# Fase 4 — Dashboard, UX y accesibilidad

> **Criticidad: 🟢 media.** Cierra la experiencia: convierte el dashboard placeholder en métricas reales, hace funcionales los ajustes, y sube el listón de UX (feedback, errores amigables) y accesibilidad.

---

## 1. Objetivo

1. **Dashboard real**: ventas del día, órdenes activas, mesas ocupadas, top de productos.
2. **Ajustes funcionales**: cablear acciones reales u ocultar las no implementadas; configuración del negocio (impuesto/descuento/moneda).
3. **UX**: feedback consistente (toasts), mensajes de error amigables, "olvidé mi contraseña".
4. **Accesibilidad (a11y)**: labels, roles, contraste, foco y áreas táctiles.

## 2. Depende de / Habilita

- **Depende de:** Fase 1 (UI/tokens), Fase 2 (datos), Fase 3 (`ventas`/`ordenes` con las que se calculan métricas).
- **Habilita:** cierre de producto; entra directo al gate de calidad (Fase 5).

## 3. Alcance

**Incluye:** pantalla de dashboard con datos agregados, configuración de negocio en ajustes, reset de contraseña, sistema de toasts, pase de accesibilidad.

**No incluye:** reportes avanzados/exportación (posible fase futura), notificaciones push.

## 4. Archivos afectados

### Crear
- `src/components/ui/Toast.tsx` + `src/context/ToastContext.tsx` — feedback no bloqueante (reemplaza muchos `Alert`).
- `src/data/metrics.ts` — funciones de agregación (ventas del día, top productos…).
- `src/hooks/useDashboardMetrics.ts` — combina `ventas`/`ordenes`/`mesas`.
- `app/administration/negocio.tsx` — configuración del negocio (moneda, impuesto, descuento).
- `app/administration/reset-password.tsx` — flujo "olvidé mi contraseña".

### Modificar
- `app/(drawer)/dashboard.tsx` — reemplazar placeholder (<ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\(drawer)\dashboard.tsx" lines="5-13" />) por tarjetas de métricas.
- `app/administration/ajustes.tsx` — enlazar filas reales (perfil ya existe) u ocultar las vacías; añadir "Negocio" y logout.
- `app/administration/login.tsx` — enlazar "¿Olvidaste tu contraseña?" (hoy `TODO`, <ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\administration\login.tsx" lines="121-127" />).
- `app/administration/perfil.tsx` — reemplazar `Alert` de guardado por toast; habilitar/afinar "eliminar cuenta".
- Pantallas con `Alert` de placeholder (`orden.tsx`, tablas de catálogo) → toasts o acciones reales.
- Errores de Firebase Auth → `mapAuthError()` con mensajes en español.

## 5. Pasos detallados

### Paso 5.1 — Métricas del dashboard

```ts
// src/data/metrics.ts (boceto)
// Ventas del día: sum(ventas where fecha >= inicioDelDia)
// Órdenes activas: count(ordenes where estado == 'abierta')
// Mesas ocupadas: count(tables where estado != 'libre') en los layouts
// Top productos: agregación de items de ventas del día (cliente o Cloud Function futura)
```
- Para PYMES pequeñas, agregación en cliente es suficiente. Documentar el umbral en el que convendría una Cloud Function.

### Paso 5.2 — UI del dashboard

- Fila de **tarjetas KPI** (`Card` de Fase 1): Ventas hoy · Órdenes activas · Mesas ocupadas · Ticket promedio.
- Lista **Top 5 productos** del día.
- Estados carga/vacío (`Skeleton`, `EmptyState`).
- Responsive: 1 columna en móvil, grid en ancho (patrón ya usado en `catalogo`/`orden`).

### Paso 5.3 — Configuración de negocio

`app/administration/negocio.tsx`:
- Campos: nombre del negocio, moneda, **tasa de impuesto**, **descuento por defecto**.
- Guarda en `pymes/{pymeId}.config` (consumido por checkout en Fase 3).
- Enlazado desde `ajustes.tsx`.

### Paso 5.4 — Toasts y errores amigables

- `ToastProvider` global; hook `useToast()` con `success | error | info`.
- Reemplazar `Alert.alert('Guardado', …)` de perfil (<ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\administration\perfil.tsx" lines="66-66" />) y los `Alert` de placeholder por toasts o acciones reales.
- `mapAuthError(code)` → traduce `auth/invalid-credential`, `auth/email-already-in-use`, etc. a mensajes claros en español (usado en login/register/reset).

### Paso 5.5 — Reset de contraseña

- `sendPasswordResetEmail(auth, email)` desde `reset-password.tsx`.
- Enlazar el `Pressable` de login que hoy no hace nada.

### Paso 5.6 — Pase de accesibilidad

- `accessibilityRole="button"` + `accessibilityLabel` en todos los `Pressable` con solo icono (drawer, steppers de carrito, dots de acciones, filtros).
- `accessibilityLabel` en `TextInput` (o `Text` asociado) en login/registro/perfil/búsquedas.
- Verificar **contraste** de texto sobre `accent`/estados con tokens de Fase 1.
- **Áreas táctiles** mínimas (`hitSlop` / tamaño ≥ 44px) en iconos pequeños.
- `Modal` del carrito/checkout: foco inicial y `onRequestClose` (Android back) correctos.

## 6. Criterios de aceptación

- [ ] El dashboard muestra métricas reales del día y se actualiza en vivo.
- [ ] Existe configuración de negocio y el checkout la respeta.
- [ ] "¿Olvidaste tu contraseña?" envía correo de restablecimiento.
- [ ] Los `Alert` de placeholder se sustituyen por toasts o acciones reales.
- [ ] Errores de auth muestran mensajes claros en español.
- [ ] Los controles con icono tienen `accessibilityLabel`; áreas táctiles ≥ 44px.

## 7. Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo start --web
```
- Generar una venta (Fase 3) → verla reflejada en el dashboard.
- Cambiar la tasa de impuesto en Negocio → el checkout recalcula.
- Probar reset de contraseña con un correo real.
- (Opcional) Revisión con lector de pantalla (VoiceOver/TalkBack) y verificación de contraste con la skill `design-review`.

## 8. Riesgos y decisiones abiertas

- **Agregación en cliente vs servidor:** si el volumen de ventas crece, mover top-productos/reportes a Cloud Functions o colección de agregados. Documentado como mejora futura.
- **Zona horaria:** "ventas del día" depende de la TZ del dispositivo; decisión: usar TZ local del negocio (guardar TZ en `config` si se opera en varias regiones).
- **Eliminar cuenta:** requiere reautenticación reciente en Firebase; definir si se implementa completo aquí o se deja para después (hoy es un `Alert` "próximamente").
