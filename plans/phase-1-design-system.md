# Fase 1 — Sistema de diseño (tokens + theming)

> **Criticidad: 🟡 alta.** Establece la base visual coherente que consumen las fases 2, 3 y 4. Usa la skill `design-tokens` (`.agents/skills/frontend/design-tokens`) adaptada a React Native.

---

## 1. Objetivo

1. Crear un **sistema de tokens** (color, espaciado, tipografía, radios, sombras) con paletas **clara y oscura** intencionales.
2. Unificar el theming en **una sola fuente de verdad**, eliminando temas duplicados y hex hardcodeados.
3. Corregir el **dark mode** donde hoy se ignora (`register.tsx`, `mesas.tsx`).
4. Crear un set mínimo de **componentes UI reutilizables** (`Button`, `Card`, `Input`, `Chip`, `EmptyState`, `Skeleton`).

## 2. Depende de / Habilita

- **Depende de:** Fase 0 (estructura `src/`, app estable). No requiere datos.
- **Habilita:**
  - Fase 2 usa `EmptyState`/`Skeleton` y tokens para estados carga/vacío/error.
  - Fase 3 y 4 construyen sus pantallas con los componentes UI y tokens.
- **Puede solaparse** con el inicio de Fase 2, pero se recomienda cerrarla antes para no reescribir estilos.

## 3. Alcance

**Incluye:** tokens, provider de tema, mapeo a React Navigation, migración de colores en pantallas existentes, componentes UI base.

**No incluye:** nuevas pantallas ni lógica de datos. No cambia la información mostrada, solo su presentación.

## 4. Archivos afectados

### Crear
- `src/theme/tokens.ts` — definición de tokens claro/oscuro.
- `src/theme/ThemeProvider.tsx` — provider + `useAppTheme()`.
- `src/theme/navigationTheme.ts` — mapea tokens → `Theme` de `@react-navigation/native`.
- `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `Chip.tsx`, `EmptyState.tsx`, `Skeleton.tsx`.
- `src/hooks/useColorScheme.ts` — migrado desde `hooks/`.

### Modificar
- `app/_layout.tsx` — usar `navigationTheme` derivado de tokens; envolver con `ThemeProvider` propio.
- `app/(drawer)/_layout.tsx` — colores del drawer desde tokens.
- `app/(drawer)/orden.tsx` — reemplazar `#F97316`, `#94A3B8`, etc. por tokens.
- `components/catalogo/*/Table*.tsx` — reemplazar `#7C3AED`, `#059669`, `#2563EB`, `#22C55E`, `#F59E0B`.
- `app/administration/login.tsx` — migrar `createStyles(dark)` a tokens.
- `app/administration/register.tsx` — **añadir dark mode** (hoy fijo claro).
- `app/(drawer)/mesas.tsx` — **respetar tema** (hoy `#0b0d12` fijo).
- `app/administration/{perfil,ajustes}.tsx` — sustituir `#3B82F6`, `#EF4444` por tokens.

### Eliminar
- `constants/Colors.ts` — reemplazado por `src/theme/tokens.ts` (verificar que nada lo importe: hoy solo lo usa `useThemeColor.ts`, que también se retira o migra).
- `hooks/useThemeColor.ts` — obsoleto si nada lo usa tras la migración.

## 5. Pasos detallados

### Paso 5.1 — Elegir dirección visual

La app ya insinúa una identidad: **naranja `#F97316`** como acento en Orden (POS). Se adopta como **color de marca (accent)**. Dirección propuesta (confirmar en revisión):

- **Filosofía:** *Scandinavian* suave (según skill `frontend-design`): cálida, redondeada, accesible; fondos claros/carbón, esquinas 8–12px, sombras suaves.
- **Neutros:** slate (ya usado: `#0F172A`, `#F8FAFC`, `#E5E7EB`).
- **Semánticos:** success verde, warning ámbar, danger rojo (ya presentes de forma dispersa).

### Paso 5.2 — `src/theme/tokens.ts`

Estructura tomada de la skill `design-tokens`, en formato TS para RN:

```ts
export type ThemeColors = {
  bg: string; bgElevated: string; bgSubtle: string;
  text: string; textMuted: string; textInverse: string;
  border: string; borderSubtle: string;
  accent: string; accentText: string; accentSoft: string;
  success: string; warning: string; danger: string;
  overlay: string;
};

const light: ThemeColors = {
  bg: '#F8FAFC', bgElevated: '#FFFFFF', bgSubtle: '#F1F5F9',
  text: '#0F172A', textMuted: '#64748B', textInverse: '#FFFFFF',
  border: '#E5E7EB', borderSubtle: '#EEF2F6',
  accent: '#F97316', accentText: '#FFFFFF', accentSoft: 'rgba(249,115,22,0.14)',
  success: '#22C55E', warning: '#F59E0B', danger: '#DC2626',
  overlay: 'rgba(0,0,0,0.15)',
};

const dark: ThemeColors = {
  bg: '#0B0F19', bgElevated: '#111827', bgSubtle: '#0F172A',
  text: '#F8FAFC', textMuted: '#94A3B8', textInverse: '#0B0F19',
  border: '#1F2937', borderSubtle: 'rgba(255,255,255,0.08)',
  accent: '#F97316', accentText: '#FFFFFF', accentSoft: 'rgba(249,115,22,0.22)',
  success: '#4ADE80', warning: '#FBBF24', danger: '#FCA5A5',
  overlay: 'rgba(0,0,0,0.5)',
};

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;
export const radius = { sm: 8, md: 12, lg: 16, full: 999 } as const;
export const font = {
  size: { xs: 12, sm: 14, base: 16, md: 18, lg: 22, xl: 28, xxl: 34 },
  weight: { normal: '400', medium: '500', semibold: '600', bold: '700', black: '800' },
} as const;
export const shadow = {
  sm: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  md: { shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
};

export const themes = { light, dark };
```

> **Regla:** las pantallas nunca vuelven a escribir un hex; usan `theme.color.accent`, `space[4]`, etc.

### Paso 5.3 — `ThemeProvider` y `useAppTheme()`

```tsx
// src/theme/ThemeProvider.tsx
import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { themes, space, radius, font, shadow, ThemeColors } from './tokens';

type AppTheme = { dark: boolean; color: ThemeColors; space: typeof space; radius: typeof radius; font: typeof font; shadow: typeof shadow };
const Ctx = createContext<AppTheme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const value = useMemo<AppTheme>(() => ({
    dark: scheme === 'dark',
    color: scheme === 'dark' ? themes.dark : themes.light,
    space, radius, font, shadow,
  }), [scheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useAppTheme() {
  const t = useContext(Ctx);
  if (!t) throw new Error('useAppTheme must be used within ThemeProvider');
  return t;
}
```

### Paso 5.4 — Mapear a React Navigation

`app/_layout.tsx` hoy define `LightTheme`/`DarkThemeCustom` inline (<ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\_layout.tsx" lines="9-33" />). Se sustituyen por un mapeo derivado de tokens para que `useTheme()` de React Navigation (usado en muchas pantallas) siga funcionando durante la migración:

```ts
// src/theme/navigationTheme.ts
import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { themes } from './tokens';
export const navLight: Theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors,
  background: themes.light.bg, card: themes.light.bgElevated, text: themes.light.text,
  border: themes.light.border, primary: themes.light.accent } };
export const navDark: Theme = { ...DarkTheme, colors: { ...DarkTheme.colors,
  background: themes.dark.bg, card: themes.dark.bgElevated, text: themes.dark.text,
  border: themes.dark.border, primary: themes.dark.accent } };
```

> **Compatibilidad:** mantener `useTheme()` de RN mapeado a tokens permite migrar pantalla por pantalla sin romper nada. Las pantallas nuevas usan `useAppTheme()` (más rico); las viejas se migran progresivamente.

### Paso 5.5 — Componentes UI base

Reemplazan los patrones repetidos (botón primario, tarjeta, input con icono, chip, estados):

- `Button` — variantes `primary | outline | ghost | danger`, `loading`, `disabled`.
- `Card` — superficie con `bgElevated`, borde y `shadow.sm`.
- `Input` — fila con icono opcional + `TextInput` tematizado (unifica el patrón de login/perfil/tablas).
- `Chip` — pill activa/inactiva (unifica chips de `orden.tsx` y tabs de `catalogo.tsx`).
- `EmptyState` — icono + título + subtítulo (para Fase 2).
- `Skeleton` — placeholder animado con `reanimated` (para Fase 2).

### Paso 5.6 — Migración de pantallas

Orden sugerido (de más visible a menos):
1. `login.tsx` + `register.tsx` (register gana dark mode).
2. `orden.tsx` (mayor cantidad de hex).
3. `components/catalogo/*` (unificar acentos: hoy morado/verde/azul distintos por tabla → usar `accent` + neutros).
4. `mesas.tsx` (adoptar tokens; el canvas puede conservar su rejilla pero con colores del tema).
5. `perfil.tsx`, `ajustes.tsx`, drawer.

## 6. Criterios de aceptación

- [ ] Existe `src/theme/tokens.ts` con paletas clara y oscura.
- [ ] `useAppTheme()` disponible y usado por los componentes UI nuevos.
- [ ] `app/_layout.tsx` deriva el tema de navegación desde tokens (sin objetos inline).
- [ ] `register.tsx` y `mesas.tsx` responden al modo oscuro.
- [ ] No quedan colores hex hardcodeados en las pantallas migradas (salvo casos justificados, p. ej. rejilla del canvas).
- [ ] `constants/Colors.ts` y `hooks/useThemeColor.ts` eliminados o sin referencias.
- [ ] Componentes UI base creados y usados al menos en login/orden.

## 7. Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo start --web
```
- Alternar esquema claro/oscuro del SO y verificar todas las pantallas.
- (Opcional) Ejecutar la skill `design-review` capturando pantallas en 375/768/1280 px, claro y oscuro.

## 8. Riesgos y decisiones abiertas

- **Doble sistema temporal** (`useTheme` de RN + `useAppTheme`): aceptable durante la migración; meta final es `useAppTheme` en todas las pantallas.
- **Dirección visual:** confirmar filosofía (Scandinavian suave) y color de marca (naranja) antes de migrar en masa. Si se prefiere otro acento, solo cambia `tokens.ts`.
- **Tipografía:** hoy solo se carga `SpaceMono`. Decisión abierta: ¿incorporar una fuente de UI (p. ej. Inter/Poppins) o usar la del sistema? Recomendado: sistema por defecto para rendimiento; opcional cargar una display para títulos.
