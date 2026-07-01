# Fase 5 — Limpieza y calidad

> **Criticidad: 🟢 media (transversal).** La limpieza de boilerplate puede iniciarse pronto; el *gate de calidad* (tipos, lint, review) se ejecuta al cierre de cada fase y como validación final del proyecto. Usa las skills `typescript-code-review` y `code-reviewer` del repo.

---

## 1. Objetivo

1. **Eliminar el boilerplate** de la plantilla Expo que no se usa.
2. Reescribir el **README** para que describa `caele-app` (no la plantilla).
3. Quitar **`console.log`** y ruido de depuración.
4. **Tipado estricto**: erradicar `any` en la capa de datos y props.
5. Establecer el **gate de calidad**: `tsc --noEmit` + `expo lint` limpios; base de **tests** para servicios/utilidades.
6. Pasar las **skills de code review** como auditoría final.

## 2. Depende de / Habilita

- **Depende de:** idealmente se ejecuta tras cada fase; la auditoría final requiere las fases 0–4 integradas.
- **Habilita:** entrega mantenible; base para CI futuro.

## 3. Alcance

**Incluye:** borrado de archivos no usados, README, limpieza de logs, tipos, config de lint/TS, tests iniciales, auditoría con skills.

**No incluye:** pipeline de CI completo (se deja recomendado), cobertura exhaustiva de tests (se siembra la base).

## 4. Archivos afectados

### Eliminar (verificar cero referencias antes)
Boilerplate de `create-expo-app` presumiblemente sin uso:
- `components/HelloWave.tsx`
- `components/ParallaxScrollView.tsx`
- `components/Collapsible.tsx`
- `components/ThemedText.tsx`, `components/ThemedView.tsx`
- `components/HapticTab.tsx`
- `components/ExternalLink.tsx`
- `components/ui/IconSymbol.tsx`, `components/ui/IconSymbol.ios.tsx`
- `components/ui/TabBarBackground.tsx`, `components/ui/TabBarBackground.ios.tsx`
- `constants/Colors.ts` y `hooks/useThemeColor.ts` (si no se hizo en Fase 1)
- `scripts/reset-project.js` (script de la plantilla) — opcional
- `+not-found.tsx` se **conserva** (ruta útil).

> **Antes de borrar:** `grep` de cada símbolo (p. ej. `ThemedText`, `HelloWave`, `IconSymbol`, `HapticTab`, `TabBarBackground`, `useThemeColor`, `Colors`) en todo el repo para confirmar que no hay imports vivos. Borrar solo los que den cero resultados.

### Modificar
- `README.md` — descripción real del proyecto, stack, setup, scripts, estructura, variables de entorno.
- `app/(drawer)/mesas.tsx` — quitar `console.log` (líneas ~85, ~95, ~200).
- `firebase/*` y `src/data/*` — reemplazar `any` por tipos de `src/data/types.ts`.
- `app/(drawer)/_layout.tsx` — tipar `CustomDrawerContent(props: any)`.
- `tsconfig.json` — (opcional) activar flags estrictos adicionales.
- `eslint.config.js` — (opcional) reglas para bloquear `console.log` y `any`.
- `package.json` — añadir scripts `typecheck` y (si se añaden) `test`.

### Crear (opcional pero recomendado)
- `AGENTS.md` — comandos de build/verificación y convenciones aprendidas del proyecto.
- `__tests__/` — pruebas de utilidades puras (cálculo de totales, `mapAuthError`, agregaciones de métricas).
- `.github/workflows/ci.yml` — (recomendado) CI que corre `typecheck` + `lint`.

## 5. Pasos detallados

### Paso 5.1 — Auditar y eliminar boilerplate
1. Por cada archivo candidato, `grep` de su símbolo exportado en el repo.
2. Eliminar los que tengan cero referencias.
3. Recompilar (`tsc --noEmit`) para confirmar que no se rompió nada.

### Paso 5.2 — README del proyecto
Sustituir la plantilla de Expo por secciones:
- Qué es caele-app · Stack · Requisitos · Setup (`npm install`, variables en `app.json > extra`) · Scripts (`start`, `android`, `ios`, `web`, `lint`, `typecheck`) · Estructura de carpetas (`app/`, `src/`) · Modelo de datos (enlazar `plans/README.md`) · Reglas de seguridad.

### Paso 5.3 — Quitar logs y ruido
- Eliminar `console.log` de `mesas.tsx`. Conservar `console.error` solo en `catch` con contexto útil, o migrar a un logger mínimo.

### Paso 5.4 — Tipado
- `src/data/*` deja de usar `any`: entradas y salidas tipadas con `src/data/types.ts`.
- `registrarUsuario`/`registrarPyme`/`listar*` reciben tipos concretos.
- `CustomDrawerContent` usa `DrawerContentComponentProps`.

### Paso 5.5 — Gate de calidad
- `package.json`:
  ```json
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "expo lint"
  }
  ```
- (Opcional) `eslint.config.js`: `no-console` (warn, permitiendo `error`/`warn`) y `@typescript-eslint/no-explicit-any` (warn).
- (Opcional) `tsconfig.json`: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` (introducir gradualmente para no romper).

### Paso 5.6 — Tests base
- Añadir `jest-expo` + `@testing-library/react-native` (dev). Sembrar tests de:
  - Cálculo de totales (subtotal/descuento/impuesto/total).
  - `mapAuthError`.
  - Agregaciones de métricas (Fase 4).
- Meta: no cobertura total, sino red de seguridad en lógica pura.

### Paso 5.7 — Auditoría con skills
- Ejecutar `typescript-code-review` (`skills/typescript-code-review-main`) sobre `src/` y `app/`.
- Ejecutar el checklist de `code-reviewer` (`.claude/skills/code-reviewer`).
- Registrar hallazgos y resolver los críticos/importantes.

### Paso 5.8 — CI (recomendado)
- `.github/workflows/ci.yml`: en cada PR corre `npm ci`, `npm run typecheck`, `npm run lint` (y `test` si existe).

## 6. Criterios de aceptación

- [ ] No quedan componentes/archivos de la plantilla sin referencias.
- [ ] `README.md` describe caele-app y su setup real.
- [ ] Sin `console.log` en el código de la app.
- [ ] La capa de datos no usa `any`.
- [ ] `npm run typecheck` y `npm run lint` pasan sin errores.
- [ ] Existen tests para la lógica pura clave y pasan.
- [ ] Auditoría de las skills ejecutada y hallazgos críticos resueltos.

## 7. Verificación

```bash
npm run typecheck
npm run lint
npm test            # si se añadió jest-expo
npx expo start --web
```
- Arranque de la app sin warnings nuevos en consola.
- Revisión de que ninguna funcionalidad se perdió tras las eliminaciones.

## 8. Riesgos y decisiones abiertas

- **Borrado agresivo:** un componente "boilerplate" podría estar referenciado indirectamente. Mitigación: `grep` previo obligatorio + `tsc` tras cada borrado.
- **Flags estrictos de TS:** activarlos de golpe puede producir muchos errores. Decisión: introducir de forma incremental, uno por uno.
- **Elección de framework de test:** `jest-expo` es el estándar para Expo; confirmar antes de añadir dependencias (respetando la política de versiones ≥ 7 días).
- **CI:** depende de que el repo esté en GitHub; si no, dejar los scripts locales como gate manual.
