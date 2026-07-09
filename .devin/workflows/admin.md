---
description: Workflow para el módulo de administración de reglas de negocio
---

# Admin Module Workflow

## Propósito

Este workflow documenta el desarrollo y mantenimiento del **Módulo de Administración** que permite a usuarios con rol ADMIN gestionar:
- Empresas
- Sucursales
- Auditorios/Zonas de asistencia
- Turnos de trabajo

## Estructura del Módulo

```
apps/
├── api/                          # Backend NestJS
│   └── src/
│       └── companies/
│           ├── companies.controller.ts    # CRUD Empresas
│           ├── sucursales.controller.ts # CRUD Sucursales
│           ├── auditorios.controller.ts # CRUD Auditorios
│           ├── turnos.controller.ts     # CRUD Turnos
│           ├── *.service.ts             # Lógica de negocio
│           └── dto/
│               ├── crear-*.dto.ts         # Validaciones create
│               └── actualizar-*.dto.ts    # Validaciones update
│
└── web/                          # Frontend React
    └── src/
        ├── app/                       # Pages y routing
        │   └── admin/
        │       ├── AdminPage.tsx         # Tabs Empresas/Config
        │       ├── AdminConfigPage.tsx   # Sub-tabs Suc/Aud/Turn
        │       ├── DepartamentosPage.tsx
        │       └── PuestosPage.tsx
        ├── componentes/               # Todos los componentes
        │   └── admin/
        │       ├── empresas/
        │       │   ├── EmpresasList.tsx
        │       │   └── EmpresaForm.tsx      # Drawer 560px
        │       ├── sucursales/
        │       │   ├── SucursalesList.tsx
        │       │   └── SucursalForm.tsx     # Drawer 560px
        │       ├── auditorios/
        │       │   ├── AuditoriosList.tsx
        │       │   └── AuditorioForm.tsx    # Drawer 600px
        │       └── turnos/
        │           ├── TurnosList.tsx
        │           └── TurnoForm.tsx        # Drawer 720px
        ├── api/                       # Clientes API
        │   └── admin/
        │       ├── admin-api.ts
        │       └── types.ts
        └── hooks/                     # React Query hooks
            └── admin/
                ├── use-empresas.ts
                ├── use-sucursales.ts
                ├── use-auditorios.ts
                └── use-turnos.ts
```

## Guías de Implementación

### 🔗 Referencias Obligatorias

Antes de implementar cualquier cambio en el frontend, revisar:
- **`.devin/workflows/ui-components-guide.md`** - Guía de componentes UI (Drawers vs Modales, espaciado, títulos)

### 🎨 Patrones de UI Obligatorios

**Formularios de Creación/Edición:**
- ✅ **SIEMPRE usar Drawer** (panel lateral derecho)
- ❌ **NUNCA usar Modal** para formularios de más de 3 campos
- Ancho según complejidad:
  - `560px` - Formularios simples (Empresa, Sucursal)
  - `600px` - Formularios con campos técnicos (Auditorio)
  - `720px` - Formularios complejos (Turno)

**Estructura del Drawer:**
```tsx
<Drawer
  title={<Title level={4}>...</Title>}  // H4 para drawers
  placement="right"                     // SIEMPRE derecha
  width={560}                           // Según complejidad
  footer={
    <Space>
      <Button>Cancelar</Button>
      <Button type="primary">Guardar</Button>
    </Space>
  }
>
  <Form layout="vertical" style={{ gap: 16 }}>
    {/* Campos con 16px de espaciado */}
  </Form>
</Drawer>
```

### 🔒 Seguridad

**Backend - Todos los controllers deben tener:**
```typescript
@Controller('...')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
```

**Frontend - Menú solo para ADMIN:**
```typescript
const isAdmin = user?.role === 'ADMIN';
// Menú "Administración" solo visible si isAdmin
```

## Rutas del Módulo

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/admin` | `AdminPage` | Tabs: Empresas / Configuración |
| `/admin/configuracion` | `AdminConfigPage` | Sub-tabs: Sucursales / Auditorios / Turnos |

## API Endpoints

| Entidad | Base URL | Endpoints |
|---------|----------|-----------|
| Empresas | `/companies` | GET /, POST /, PUT /:id, DELETE /:id |
| Sucursales | `/sucursales` | GET /, POST /, PUT /:id, DELETE /:id |
| Auditorios | `/auditorios` | GET /, POST /, PUT /:id, DELETE /:id |
| Turnos | `/turnos` | GET /, POST /, PUT /:id, DELETE /:id |

## Checklist de Revisión de Código

### Backend
- [ ] Controller tiene `@Roles('ADMIN')`
- [ ] DTOs tienen validaciones class-validator
- [ ] Servicios manejan errores con mensajes claros
- [ ] Relaciones de Prisma correctamente definidas

### Frontend
- [ ] **UI Components**: Revisar `.devin/workflows/ui-components-guide.md`
- [ ] Formularios usan Drawer (no Modal)
- [ ] Ancho de drawer según complejidad (560/600/720px)
- [ ] Footer con botones Cancelar/Guardar
- [ ] Títulos `<Title level={4}>` en drawers
- [ ] Espaciado de 16px entre campos
- [ ] Hooks de React Query implementados
- [ ] Menú solo visible para rol ADMIN

## Multi-empresa (contexto de razón social activa)

### Modelo
- `UserAccount.companyId` = empresa principal / home.
- `UserCompany` = empresas adicionales a las que el usuario tiene acceso.
- Acceso total = `companyId` ∪ `UserCompany`. SuperAdmin = todas.

### Flujo
1. Al iniciar sesión, el frontend carga `GET /companies/accesibles` y guarda la lista en el slice `empresaActiva`.
2. El selector en el inicio (`HeroCard`) permite cambiar la empresa activa.
3. Cada request envía el header `X-Company-Id` con la empresa activa.
4. El interceptor `EmpresaActiva` valida el header y sobre-escribe `req.user.companyId`, scopeando todos los módulos a la empresa seleccionada.

### Formulario de usuarios
- Campo "Empresa principal" (solo editable por SuperAdmin).
- Multi-select "Empresas con acceso adicional" para asignar múltiples razones sociales.

## Especificación Completa

Ver especificación detallada en: `specs/001-admin-module/spec.md`

Ver plan de organigrama multi-empresa en: `specs/002-organigrama-multiempresa/plan.md`
