# Enciclopedia de Skills

Guía de referencia de **qué skill usar en cada proceso**. El proyecto tiene 18 skills repartidas entre `.agents/skills/frontend/` (flujo de diseño frontend) y `.claude/skills/` (diseño general, ingeniería, utilidades y la skill propia del repo).

Para invocar una skill desde Claude Code se usa `/<nombre-skill>`. Algunas son **obligatorias antes de cierto tipo de trabajo** (ver tabla).

---

## 1. Tabla maestra de skills

### Flujo de diseño frontend — `.agents/skills/frontend/`

Estas 8 forman una cadena. `design-flow` las orquesta en orden; cada una también se puede usar suelta.

| Skill | Qué hace | Cuándo usarla |
|---|---|---|
| **grill-me** | Te interroga sin tregua sobre un plan o diseño hasta llegar a entendimiento compartido. Resuelve cada rama del árbol de decisiones. | Para estresar un plan/diseño antes de construir. Cuando hay supuestos sin validar. |
| **design-brief** | Crea un brief de diseño completo vía entrevista estructurada + exploración del código. Documenta intención, metas, dirección estética e inventario de componentes. | Al planear una feature/pantalla nueva o definir la dirección de UI. |
| **information-architecture** | Define la capa estructural antes del diseño visual: navegación, jerarquía de contenido, estructura de páginas, patrones de URL, flujos de usuario. Produce `INFORMATION_ARCHITECTURE.md`. | Para planear estructura de sitio, navegación y flujos. |
| **design-tokens** | Genera tokens fundacionales (CSS vars / Tailwind / theme) con paletas light+dark, escala de espaciado, rampa tipográfica y tokens a nivel componente. | Al iniciar proyecto o establecer el sistema visual. |
| **brief-to-tasks** | Descompone un brief en un checklist ordenado de "vertical slices" construibles de forma independiente. Produce `TASKS.md`. | Para convertir un brief/diseño en tareas accionables. |
| **frontend-design** | Construye UI de calidad producción guiada por filosofías estéticas nombradas (Dieter Rams, Swiss, Minimalismo Japonés, Brutalista, Editorial, etc.). Genera código funcional. | Al implementar componentes/páginas con foco en calidad de diseño. |
| **design-review** | Crítica de diseño estructurada contra el brief y el código: captura screenshots de la app corriendo y revisa jerarquía, consistencia, responsividad, accesibilidad. Produce lista priorizada (must/should/could-fix). | QA/pulido de UI después de construir. |
| **design-flow** | Orquesta toda la cadena anterior en secuencia guiada: Grill Me → Design Brief → IA → Tokens → Brief to Tasks → Frontend Design → Design Review. | Para arrancar un proyecto/feature de cero y recorrer todo el flujo. |

### Diseño general — `.claude/skills/`

| Skill | Qué hace | Cuándo usarla |
|---|---|---|
| **brainstorming** | Convierte ideas en diseños y especificaciones formadas vía diálogo colaborativo. Explora intención, requisitos y diseño antes de implementar. | **OBLIGATORIA antes de cualquier trabajo creativo**: crear features, componentes, funcionalidad o modificar comportamiento. |
| **canvas-design** | Crea arte visual en `.png` y `.pdf` con filosofía de diseño (calidad museo/revista, sin copiar artistas). | Cuando se pide un póster, pieza de arte, diseño o gráfico estático. |
| **ui-ux-pro-max** | Inteligencia de UI/UX: 50 estilos, 21 paletas, 50 pares tipográficos, 20 charts, 9 stacks. Recomendaciones priorizadas de color, tipografía, accesibilidad, animación, layout. | Al elegir paleta/tipografía/charts, diseñar dashboards, landings, o revisar/mejorar UI. |
| **mobile-design** | Pensamiento mobile-first para iOS/Android: interacción táctil, performance, convenciones de plataforma, anti-patrones, Fitts' Law, zona del pulgar. | Al construir React Native, Flutter o nativo. |

### Ingeniería — `.claude/skills/`

| Skill | Qué hace | Cuándo usarla |
|---|---|---|
| **senior-architect** | Arquitectura de sistemas escalables: diagramas, patrones de diseño, frameworks de decisión de stack, análisis de dependencias. Cubre React/Next/Node/Go/Python/Postgres/GraphQL/móvil. | Al diseñar arquitectura, decidir stack, evaluar trade-offs o definir patrones de integración. |
| **senior-backend** | Desarrollo backend escalable: scaffolding de APIs, optimización de DB, seguridad, tuning de performance. Node/Express/Go/Python/Postgres/GraphQL/REST. | Al diseñar APIs, optimizar queries, lógica de negocio, auth o revisar backend. |
| **react-best-practices** | 40+ reglas de optimización React/Next: eliminar waterfalls, fetching paralelo, bundles, dynamic imports, Suspense, re-render, micro-optimizaciones. | Al optimizar performance React o refactorizar componentes. |
| **code-reviewer** | Revisión de código multi-lenguaje (TS/JS/Python/Swift/Kotlin/Go): análisis automático, best practices, escaneo de seguridad, checklist de revisión. | Al revisar PRs, dar feedback, identificar issues o asegurar estándares. |

### Utilidad y específica del repo — `.claude/skills/`

| Skill | Qué hace | Cuándo usarla |
|---|---|---|
| **file-organizer** | Organiza archivos/carpetas entendiendo contexto, detecta duplicados y sugiere mejores estructuras. | Al limpiar directorios, organizar descargas, quitar duplicados o reestructurar proyectos. |
---

## 2. Mapa: qué skill usar en cada proceso

| Fase del proceso | Skill(s) recomendada(s) |
|---|---|
| **Idear / aclarar intención** | `brainstorming` (obligatoria) → `grill-me` para estresar supuestos |
| **Definir alcance + diseño visual** | `design-brief` → `information-architecture` → `design-tokens` |
| **Decisiones de UI** (paleta, tipografía, charts, estilo) | `ui-ux-pro-max` |
| **Descomponer en tareas** | `brief-to-tasks` |
| **Diseñar arquitectura técnica** | `senior-architect` |
| **Implementar backend / Firestore / API** | `senior-backend` |
| **Implementar UI** | `frontend-design` |
| **Optimizar render/bundle React** | `react-best-practices` |
| **Revisar calidad antes de merge** | `code-reviewer` (lógica) + `design-review` (visual) |
| **App móvil** | `mobile-design` |
| **Arte / pósters / recursos visuales** | `canvas-design` |
| **Ordenar/limpiar el repo** | `file-organizer` |
| **Orquestar todo de principio a fin** | `design-flow` |

> Regla práctica: para **cualquier** feature nueva empieza con `brainstorming`. Cierra siempre con `code-reviewer` + `design-review`.

---

## 3. Ejemplo aplicado — Dashboard Personal del Asesor

Cómo se recorrería el flujo para la feature que estamos construyendo (vista unificada de prospectos asignados + tareas pendientes con fecha y prioridad, renderizada por rol en `/inicio`):

| Paso | Skill | Salida |
|---|---|---|
| 1. Aclarar qué métricas y comportamiento por rol necesita el asesor | `brainstorming` | Spec del dashboard (KPIs, bloques, reglas por rol) |
| 2. Estresar supuestos (¿cómo se detecta "asesor"? ¿scope de datos?) | `grill-me` | Decisiones cerradas (asesor = id en `pipeline.asesores`) |
| 3. Definir layout, jerarquía y navegación de los bloques | `information-architecture` | Estructura: KPIs → tareas pendientes → prospectos asignados |
| 4. Elegir tarjetas KPI, colores de urgencia, tabla de tareas | `ui-ux-pro-max` | Paleta de estado (verde/amarillo/rojo), estilo de KPI |
| 5. Implementar `DashboardAsesor` y subcomponentes | `frontend-design` | Componentes en `src/components/crm/dashboard-asesor/` |
| 6. Reutilizar servicios Firestore y lógica de vencimiento | `senior-backend` | `listarTodosProspectos`, util `tareasVencimiento` |
| 7. Verificar performance del fetch (barrido de pipelines) | `react-best-practices` | Memoización / filtrado client-side eficiente |
| 8. Revisar código y diseño antes de merge | `code-reviewer` + `design-review` | Lista de fixes priorizada |

---

_Última actualización: 2026-06-08. Mantener sincronizada esta tabla al agregar/quitar skills en `.agents/skills/` o `.claude/skills/`._

---

## 5. Recursos del Proyecto

### Workflows y Guías en `.devin/workflows/`

| Recurso | Descripción |
|---|---|
| `ui-components-guide.md` | **OBLIGATORIO antes de implementar UI**: Cuándo usar Drawers vs Modales, espaciado, títulos, patrones de formularios |
| `admin.md` | Workflow del módulo de administración (empresas, sucursales, auditorios, turnos) |
| `speckit.*.md` | Workflows para especificación, planificación y tareas (Speckit framework) |

> **Nota**: Antes de implementar cualquier formulario en el frontend, revisar `ui-components-guide.md` para seguir los patrones de Drawer/Modal establecidos.

---

## 4. Convencion de idioma

**Todo el proyecto se escribe en español**, tanto en el frontend como en el backend. Se evita la letra `n~` (ñ) en identificadores de código.

### Reglas por capa

| Capa | Regla | Ejemplo correcto | Ejemplo incorrecto |
|---|---|---|---|
| **Variables y funciones** | Español sin ñ | `obtenerPersonas`, `crearVacante` | `getPersons`, `createVacancy` |
| **Clases y tipos** | Español sin ñ | `Persona`, `Vacante`, `Asignacion` | `Person`, `Vacancy`, `Assignment` |
| **Campos de BD / DTOs** | Español sin ñ | `fechaNacimiento`, `numeroEmpleado` | `birthDate`, `employeeNumber` |
| **Comentarios en código** | Español libre (se permite ñ en comentarios) | `// Verifica si el email ya existe` | `// Check if email already exists` |
| **Texto del frontend** | Español libre | `"Crear colaborador"` | `"Create collaborator"` |
| **Nombres de archivos** | Español sin ñ, kebab-case | `lista-personas.tsx` | `persons-list.tsx` |
| **Rutas de API** | Español sin ñ, kebab-case | `/api/personas`, `/api/vacantes` | `/api/persons`, `/api/vacancies` |

### Excepciones (se mantienen en inglés)

- Nombres de librerías y frameworks (`useState`, `useEffect`, `prisma`, etc.)
- Métodos de APIs externas
- Enums del esquema de Prisma que ya existen (no romper migraciones)
- Propiedades de objetos JSON de librerías de terceros

### Proceso de refactorizacion

Al encontrar código en inglés durante el desarrollo:
1. Renombrar variables, funciones y campos al equivalente en español
2. Traducir comentarios
3. Actualizar rutas de API si no rompe compatibilidad
4. Traducir etiquetas y textos del frontend

> Esta convención aplica a **todo código nuevo** y se va aplicando progresivamente al código existente durante refactorizaciones.
