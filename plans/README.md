# Plan de Mejora Integral — `caele-app`

> **Índice maestro de integración.** Este documento explica *qué* se va a construir, *en qué orden*, *cómo encajan las fases entre sí* y *qué se va a ocupar* (stack, librerías, estructura de carpetas y convenciones compartidas). Cada fase tiene su propio archivo detallado en esta misma carpeta.

---

## 1. Contexto del proyecto

**`caele-app`** es una app de **punto de venta / gestión para PYMES de restaurante** construida con:

| Área | Tecnología |
|------|-----------|
| Framework | Expo SDK **53** · React Native **0.79.5** · React **19** |
| Navegación | Expo Router **v5** (rutas por archivos) + `@react-navigation/drawer` |
| Backend | Firebase **12** (Auth, Firestore, Realtime DB, Storage) |
| Lenguaje | TypeScript `strict` |
| Gestos/anim. | `react-native-gesture-handler`, `react-native-reanimated` |
| Iconos | `@expo/vector-icons` (MaterialCommunityIcons / Ionicons) |

### Mapa actual de rutas

```
app/
├─ _layout.tsx            Root Stack + ThemeProvider (Light/DarkThemeCustom inline)
├─ index.tsx             Gate de auth → dashboard o login
├─ config/firebase.ts    ⚠ Config Firebase DENTRO de app/ (hack de ruta dummy)
├─ (drawer)/
│  ├─ _layout.tsx        Drawer: Inicio · Catálogo · Orden · Mesas
│  ├─ dashboard.tsx      Placeholder
│  ├─ catalogo.tsx       Tabs: Productos / Ingredientes / Categorías
│  ├─ orden.tsx          POS con carrito (MOCK, pago = Alert)
│  └─ mesas.tsx          Canvas drag&drop → Firestore (tema oscuro fijo)
└─ administration/
   ├─ login.tsx          Email/pass + Google (IDs placeholder)
   ├─ register.tsx       ⚠ Guarda password en TEXTO PLANO
   ├─ perfil.tsx         Editar nombre/teléfono
   └─ ajustes.tsx        Lista de ajustes (casi sin acción)

firebase/
├─ FirestoreAdministracion.tsx   colección `pymes`
├─ FirestoreUsuarios.tsx        colección `usuarios`
└─ FirestoreRestaurante.tsx     `pymes/{id}/mesas/{layout}`

components/catalogo/*/Table*.tsx  Tablas con arrays MOCK (sin Firestore)
```

### Hallazgos que motivan el plan

- 🔴 Contraseña en **texto plano** en Firestore (`register.tsx`).
- 🔴 Google OAuth con IDs `REPLACE_WITH_…` → login social roto en móvil.
- 🔴 En registro se navega **antes** de persistir en Firestore.
- 🟡 **Datos mock** en catálogo y órdenes; dashboard vacío.
- 🟡 Sin sistema de diseño: colores hardcodeados e inconsistentes; dark mode ignorado en `register.tsx` y `mesas.tsx`.
- 🟡 Flujo POS desconectado (Mesas ✕ Orden ✕ Pago).
- 🟡 Boilerplate de Expo sin usar, `README` de plantilla, `console.log`, `any` extendido.

---

## 2. Las 6 fases

| Fase | Nombre | Objetivo | Archivo |
|------|--------|----------|---------|
| **0** | Seguridad y fundamentos | Cerrar riesgos críticos y reordenar la base técnica | [`phase-0-seguridad.md`](./phase-0-seguridad.md) |
| **1** | Sistema de diseño | Tokens y theming coherente claro/oscuro | [`phase-1-design-system.md`](./phase-1-design-system.md) |
| **2** | Datos reales (Firestore) | Modelo de datos + servicios + reemplazo de mocks | [`phase-2-datos-firestore.md`](./phase-2-datos-firestore.md) |
| **3** | Flujo POS | Enlazar Mesas → Orden → Pago con datos reales | [`phase-3-flujo-pos.md`](./phase-3-flujo-pos.md) |
| **4** | Dashboard + UX + a11y | Métricas reales, ajustes funcionales, accesibilidad | [`phase-4-dashboard-ux-a11y.md`](./phase-4-dashboard-ux-a11y.md) |
| **5** | Limpieza y calidad | Quitar boilerplate, tipado, lint, tests, review | [`phase-5-limpieza-calidad.md`](./phase-5-limpieza-calidad.md) |

---

## 3. Grafo de dependencias entre fases

```
Fase 0 (Seguridad/base)
   │  produce: src/lib/firebase.ts, config por entorno, reglas Firestore, .ts services
   ▼
Fase 1 (Design system) ──────────┐
   │  produce: src/theme/*        │ (independiente de datos; puede ir en paralelo a F2)
   ▼                              │
Fase 2 (Datos Firestore) ◄───────┘  usa theme para estados carga/vacío/error
   │  produce: src/data/*, tipos, contexto usePyme, servicios CRUD
   ▼
Fase 3 (Flujo POS)  usa F1 (UI) + F2 (ordenes/mesas/productos)
   │  produce: checkout, estados de mesa, venta registrada
   ▼
Fase 4 (Dashboard/UX/a11y)  consume ventas de F3 y datos de F2, estilos de F1
   │
   ▼
Fase 5 (Limpieza/calidad)  transversal; cierre final (puede iniciarse antes en paralelo)
```

**Reglas de orden:**
1. **Fase 0 primero, siempre.** Reubica `firebase.ts` y crea el contexto de auth del que dependen las demás.
2. **Fase 1 y Fase 2 pueden solaparse**, pero la 2 consume tokens de la 1 para sus estados visuales. Recomendado: 1 → 2.
3. **Fase 3 requiere 1 y 2 completas** (necesita productos/mesas reales + UI con tokens).
4. **Fase 4 requiere 3** (el dashboard lee las ventas que genera el checkout).
5. **Fase 5 es transversal**: la limpieza de boilerplate puede hacerse en cualquier momento; el gate de calidad (`lint` + `tsc` + review) se ejecuta al cierre de cada fase y como validación final.

---

## 4. Estructura de carpetas objetivo

Se introduce una carpeta `src/` para **todo lo que no es una ruta**, dejando `app/` exclusivamente para pantallas (requisito de Expo Router). Migración progresiva, fase por fase.

```
src/
├─ lib/
│  └─ firebase.ts            (F0) init de Firebase, fuera de app/
├─ theme/
│  ├─ tokens.ts             (F1) colores/espaciado/tipografía/radios/sombras
│  ├─ ThemeProvider.tsx     (F1) provider + hook useAppTheme()
│  └─ navigationTheme.ts    (F1) mapea tokens → tema de React Navigation
├─ data/
│  ├─ types.ts              (F2) Producto, Insumo, Categoria, Orden, Mesa, Venta…
│  ├─ productos.ts          (F2) servicio tipado + onSnapshot
│  ├─ insumos.ts            (F2)
│  ├─ categorias.ts         (F2)
│  ├─ ordenes.ts            (F2/F3)
│  ├─ mesas.ts              (F2/F3) migra FirestoreRestaurante
│  └─ ventas.ts             (F3) registro de ventas para dashboard
├─ context/
│  ├─ AuthContext.tsx       (F0) usuario + estado de sesión
│  └─ PymeContext.tsx       (F2) pymeId activo (= uid) + datos del negocio
├─ components/
│  ├─ ui/                   (F1) Button, Card, Input, Chip, EmptyState, Skeleton…
│  └─ catalogo/             (F2) migra components/catalogo actuales
└─ hooks/
   └─ useColorScheme.ts      (F1) migra hooks/ actuales

app/                          solo rutas (pantallas)
firebase/                     se vacía → migrado a src/data (F2) y src/lib (F0)
constants/Colors.ts           se elimina (F1, reemplazado por src/theme/tokens.ts)
```

> **Nota sobre alias:** `tsconfig.json` ya define `@/*` → raíz del proyecto, así que `@/src/theme` funciona sin configuración extra.

---

## 5. Contratos compartidos (lo que varias fases van a ocupar)

Estos artefactos se crean en una fase y se **consumen** en las siguientes. Se documentan aquí para que las fases no se contradigan.

### 5.1 `AuthContext` (Fase 0)
```ts
type AuthState = {
  user: import('firebase/auth').User | null;
  initializing: boolean;
};
// Provee: useAuth() → AuthState. Reemplaza el onAuthStateChanged suelto de app/index.tsx.
```

### 5.2 `PymeContext` (Fase 2)
```ts
type PymeContextValue = {
  pymeId: string | null;      // = user.uid (el registro ya usa uid como doc id)
  negocio: Negocio | null;    // nombre, config de impuestos/descuento, moneda
  loading: boolean;
};
// Elimina la búsqueda por email de FirestoreRestaurante.getPymeIdByEmail en cada llamada.
```

### 5.3 Tokens de tema (Fase 1)
```ts
// src/theme/tokens.ts — nombres semánticos, NO valores crudos en las pantallas
tokens.color.bg / bgElevated / text / textMuted / border / accent / success / warning / danger
tokens.space[0..8]   // escala 4/8px
tokens.radius.sm|md|lg|full
tokens.font.size.* / weight.*
// useAppTheme() devuelve el set claro u oscuro según useColorScheme.
```

### 5.4 Modelo Firestore (Fase 2) — todo bajo la PYME
```
pymes/{pymeId}
  ├─ (doc)  { nombre, nombreNegocio, email, celular, isAdmin, config:{ moneda, tasaImpuesto, descuento } }
  ├─ productos/{id}    { nombre, categoriaId, precio, stock, imagen, activo }
  ├─ insumos/{id}      { nombre, unidad, stock, costo }
  ├─ categorias/{id}   { nombre, activa, orden }
  ├─ mesas/{layoutId}  { tables: [{ id, x, y, label, shape, estado }] }
  ├─ ordenes/{id}      { mesaId, items:[{productoId,nombre,precio,qty}], estado, subtotal,descuento,impuesto,total, creada, cerrada }
  └─ ventas/{id}       { ordenId, total, metodoPago, fecha }
```

### 5.5 Reglas de seguridad (Fase 0, ampliadas en Fase 2)
```
match /pymes/{pymeId} {
  allow read, write: if request.auth != null && request.auth.uid == pymeId;
  match /{sub=**} {
    allow read, write: if request.auth != null && request.auth.uid == pymeId;
  }
}
```

---

## 6. Skills del repo que se usarán

| Skill | Ubicación | Se usa en |
|-------|-----------|-----------|
| `design-tokens` | `.agents/skills/frontend/design-tokens` | Fase 1 (generar tokens) |
| `design-brief` / `frontend-design` | `.agents/skills/frontend/` | Fase 1/3 (dirección visual, componentes) |
| `design-review` | `.agents/skills/frontend/design-review` | Cierre de Fase 1, 3, 4 |
| `typescript-code-review` | `skills/typescript-code-review-main` | Fase 5 (auditoría de tipos/seguridad) |
| `code-reviewer` | `.claude/skills/code-reviewer` | Fase 5 (checklist de calidad) |

> Los tokens se implementan como **objetos TypeScript** (no CSS variables) porque es React Native; se toma la *estructura* de categorías del skill `design-tokens` pero el *formato* se adapta al stack.

---

## 7. Convenciones transversales

- **Nada de hex hardcodeado** en pantallas a partir de Fase 1: siempre `theme.color.*`.
- **Sin `any`** en código nuevo: todos los servicios de datos devuelven tipos de `src/data/types.ts`.
- **Estados de UI obligatorios** en cualquier vista con datos: *loading*, *empty*, *error* (componentes en `src/components/ui`).
- **Servicios de datos** siguen el patrón *singleton* existente (`export default new Servicio()`), migrado a `.ts`.
- **Nombres**: archivos de componentes en PascalCase; servicios/hooks en camelCase.
- **Commits** por fase, pequeños y verificables; no romper la app entre fases.

---

## 8. Gate de verificación (cada fase debe pasarlo)

```bash
npx tsc --noEmit      # sin errores de tipos
npm run lint          # expo lint sin errores
npx expo start --web  # prueba manual del flujo afectado
```

Además, criterios específicos de aceptación están al final de cada archivo de fase.

---

## 9. Riesgos transversales

- **Google OAuth**: requiere Client IDs reales de Google Cloud (bloqueante solo para login social nativo). Pendiente del usuario.
- **Migración de datos**: purgar el campo `password` de documentos ya existentes en `pymes`/`usuarios`.
- **Reubicación de `firebase.ts`**: hay que actualizar todos los imports (`app/config/firebase` → `@/src/lib/firebase`).
- **Refactor grande**: se ejecuta por fases dejando la app funcional en cada paso; nunca un "big bang".

---

## 10. Cómo leer cada archivo de fase

Cada `phase-N-*.md` sigue la misma plantilla:

1. **Objetivo** — qué resuelve.
2. **Depende de / Habilita** — relación con otras fases.
3. **Alcance** (in / out).
4. **Archivos afectados** — crear / modificar / eliminar.
5. **Pasos detallados** — con bocetos de código y modelo de datos.
6. **Criterios de aceptación** — checklist verificable.
7. **Verificación** — comandos y pruebas manuales.
8. **Riesgos y decisiones abiertas.**
