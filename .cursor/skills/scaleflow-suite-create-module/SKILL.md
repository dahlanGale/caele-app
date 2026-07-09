---
name: scaleflow-suite-create-module
description: Crea e integra un módulo nuevo en Scaleflow Suite (Next.js, Ant Design, Redux, Firestore). Úsalo cuando el usuario pida un módulo, submódulo, pantalla CRUD, entrada de menú, permisos por empresa o por rol, API interna tipo Stripe, o integración con Cloud Functions. También si menciona catálogo MODULOS, LayoutMain, branding, o replicar patrones de colaboradores/finanzas/ventas. Antes de codificar, aclara alcance, dependencias entre módulos y fuente de datos; si falta contexto, pregunta.
---

# Crear e integrar un módulo en Scaleflow Suite

## Documentación de referencia

- Lee **`docs/Scaleflow_Suite_Documentation.pdf`** para el modelo conceptual de módulos, permisos a nivel empresa y usuario, y flujos del sistema. Úsalo como fuente de verdad cuando el código y el PDF difieran en detalle; el PDF explica el “porqué” organizacional.
- El código fuente confirma el “cómo” implementado hoy (rutas, menú, Firestore).

## Antes de implementar: entrevista mínima

Si el usuario no lo dejó explícito, pregunta (y documenta en el PR o comentario de tarea):

1. **Nombre del módulo y submódulos** (ids en kebab-case coherentes con rutas, ej. `mi-modulo`, `mi-submodulo`).
2. **Funcionalidad**: listados, formularios, flujos, reportes, integraciones externas.
3. **Dependencias con otros módulos**: ¿necesita sucursales, clientes, inventario, usuarios, pagos, etc.? Si no está claro, pregunta qué entidades ya existen y bajo qué rutas o colecciones viven.
4. **Datos**: ¿Firestore bajo `empresas/{idEmpresa}/...`, API Route en `src/app/api`, Cloud Run / URL externa, o combinación? (Colaboradores mezcla Firestore + servicio HTTP.)
5. **Permisos CRUD** deseados por submódulo (create/read/update/delete) para el catálogo y para los roles.
6. **Quién habilita el módulo**: solo empresas con ese módulo en su whitelist (branding + empresa); no asumas que todas lo tienen.

No inventes integraciones críticas sin confirmar; mejor una lista de supuestos y una pregunta concreta.

## Cómo encaja el sistema de módulos y permisos

### Catálogo global de módulos

- **`src/data/modules.ts`**: define `MODULOS` con `id`, `name`, `description`, `price`, `submodulos[]` y `crud` por submódulo. Cada nuevo módulo o submódulo que deba contratarse o mostrarse en catálogo debe añadirse aquí con las reglas CRUD correctas.

### Nivel empresa + branding (qué está “encendido”)

- **`src/utils/modulosEmpresa.ts`**: `normalizeEmpresaModulos`, `mergeModulosWithBranding`, `filterMenuItemsByModulos`, `isModuloKeyEnabled`. El menú efectivo combina **módulos del branding** con **módulos habilitados en la empresa**; si un módulo no está en la empresa, queda deshabilitado aunque exista en el catálogo.

### Nivel usuario (rol)

- Los permisos vienen del **rol** en Firestore (`FireStoreConfiguracion.buscarRol`): cada permiso incluye módulo, submódulo y flags CRUD (`selectedCrud`, p. ej. `read`). **`src/components/LayoutMain.tsx`** construye el menú lateral y valida rutas con `userPermissions` y `moduleRoutes`.
- Las claves de menú y rutas siguen el patrón **`{moduloId}/{submoduloId}`** (ej. `recursos-humanos/colaboradores`).

### Qué tocar al añadir un módulo (checklist)

1. **`src/data/modules.ts`**: entrada `Modulo` / `Submodulo` con `crud`.
2. **`src/components/LayoutMain.tsx`**:
   - Ítems de menú (hay secciones paralelas para distintos modos de UI; mantén consistencia con entradas existentes del mismo módulo).
   - `moduleRoutes[moduloId]`: lista **todas** las rutas base del módulo y submódulos (usado para guard de rutas).
   - `getModuleIcon` / `getSubIcon`: iconos Ant Design para módulo y submódulos nuevos.
   - Cualquier mapa de etiquetas (`getSubmoduleLabel` u equivalente) si aplica.
3. **Rutas App Router**: `src/app/{modulo}/{submodulo}/page.tsx` (y layouts si el módulo lo necesita).
4. **Componentes**: `src/components/{area}/{submodulo}/` — separa `Search*`, `Table*`, `Form*` como en colaboradores.
5. **Estado**: slice en `src/features/*Slice.ts` si hace falta estado compartido (drawers, listas, loading de tabla).
6. **APIs cliente**: RTK Query en `src/services/*Api.ts` + registro en **`src/app/store.ts`** (reducer + middleware).
7. **APIs servidor** (si aplica): ver sección siguiente.
8. **Permisos en datos**: coordinar con quien gestione Firestore que los roles nuevos incluyan el permiso del submódulo con el CRUD adecuado; el código del menú no sustituye la asignación en BD.

## Branding y UI (obligatorio)

- **No hardcodear colores corporativos** en botones, spinners, barras de progreso o bordes de drawer “para que se vea bien”: el tema Ant Design ya usa `colorPrimary` desde Redux `configuracion.branding` en **`src/app/provider.tsx`** (`branding.colorPrincipal`).
- Usa componentes Ant Design estándar: `Button type="primary"`, `Spin`, `Table`, `Pagination`, `Input.Search`, filtros con `Row`/`Col`/`Space` como en módulos existentes.
- **`LayoutMain`** usa `branding.colorPrincipal` / `colorSecundario` para shell y menú; las páginas internas deben confiar en el ConfigProvider global, no en hex fijos.
- Reutiliza patrones de **búsqueda, filtros, tabla, paginación, drawer de alta/edición** de un módulo cercano (ej. **colaboradores**). Copia estructura, no estilos sueltos.

Referencia de página típica:

- `src/app/recursos-humanos/colaboradores/page.tsx`: título + botón nuevo + `Drawer` + `Search*` + `Table*`.

## CRUD y capa de datos

- **Preferencia**: mutaciones y lecturas a través de **APIs** (Next Route Handlers o servicios HTTP), con el cliente usando **RTK Query** o `fetch` centralizado, siempre con contexto de empresa (`auth.empresa.id`, headers, etc.).
- **Firestore directo** desde el cliente existe en el proyecto (`FireStore*` classes); si el módulo nuevo sigue ese patrón, mantén la misma convención de rutas `empresas/{id}/...` y no expongas reglas indebidas.
- Si el módulo depende de otro dominio (ej. sucursales), reutiliza selectores y acciones ya existentes en lugar de duplicar colecciones.

## Cómo exponer APIs (metodología del repo)

### Patrón “Stripe” (API key + permiso + usuario Firebase)

Ubicación: `src/app/api/stripe/*/route.ts` y contexto en `src/app/api/stripe/getStripeContext.ts`.

Flujo típico:

1. `validateApiKeyGlobal(request)` desde **`src/app/api/lib/apiAuth.ts`** (header `X-API-Key` o query `apiKey`).
2. `checkPermission(permissions, "<permiso>")` — los permisos vienen de la API key en Firestore.
3. Autenticación adicional si aplica: `Authorization: Bearer <idToken>` verificado con **`getMtcAdminAuth().verifyIdToken`**.
4. Respuestas: `createErrorResponse(mensaje, status)` / `NextResponse.json({ ok: true, ... })` coherente con el resto del código.
5. Errores de negocio con códigos HTTP claros (400, 401, 403, 404, 409, 503).

Para nuevas APIs “públicas” o de integración, define un **permiso string** documentado y validado con `checkPermission`, igual que `"payments"` en Stripe.

### Utilidades comunes

- **`src/app/api/lib/apiAuth.ts`**: `validateApiKey`, `validateApiKeyGlobal`, `checkPermission`, `createErrorResponse`, `createSuccessResponse`.

### Patrón “Colaboradores” (servicio HTTP + Firestore)

- Cliente RTK Query: **`src/services/recursosHumanosApi.ts`** (`createApi`, `fetchBaseQuery`, endpoints `query`/`mutation`). Registro en **`src/app/store.ts`**.
- La página y tablas también usan clases **`FireStoreRecursosHumanos`** / **`FireStoreConfiguracion`** para datos ligados a empresa.

Al diseñar un módulo nuevo, elige explícitamente uno de estos estilos (o híbrido documentado) y síguelo de forma uniforme en todos los endpoints.

## Estructura de archivos sugerida

```text
src/app/{modulo-id}/{submodulo-id}/page.tsx
src/components/{modulo-id}/{submodulo-id}/Search*.tsx
src/components/{modulo-id}/{submodulo-id}/Table*.tsx
src/components/{modulo-id}/{submodulo-id}/Form*.tsx
src/features/{modulo}Slice.ts          # si hace falta
src/services/{modulo}Api.ts            # RTK Query opcional
src/app/api/{modulo}/.../route.ts      # Route Handlers opcional
```

## Verificación antes de dar por hecho

- Rutas accesibles con un rol que tenga `read` (y create/update/delete según botones mostrados).
- Módulo aparece solo si empresa + branding lo tienen habilitados.
- Sin colores fijos que ignoren branding; botones primarios respetan tema.
- Menú y `moduleRoutes` alineados (misma clave `modulo/submodulo`).
- Store incluye reducers/middleware de APIs nuevas.
- Linter sin errores en archivos tocados.

## Resumen

Integrar un módulo es **catálogo + menú y rutas en LayoutMain + páginas y componentes alineados al diseño existente + permisos empresa/rol + APIs coherentes (estilo Stripe o estilo Colaboradores/Firestore)**. Si falta información de negocio o dependencias entre módulos, **pregunta antes** de fijar modelos de datos o contratos de API.
