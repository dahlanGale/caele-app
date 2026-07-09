---
name: code-patterns
description: Guía de patrones de diseño implementados en el HR-System. Usar cuando se necesite implementar nuevas funcionalidades siguiendo los patrones establecidos (Singleton, Builder, Factory, Facade, Adapter, Strategy, Observer, Twingate Security).
---

# Patrones de Código - HR System

Este proyecto implementa 8 patrones de diseño principales para mantener un código limpio, mantenible y escalable.

## 1. Singleton - Servicios Únicos Globales

**Uso**: Cuando necesitas una única instancia de un servicio en toda la aplicación.

**Ubicación**: `apps/api/src/common/singletons/`

**Implementación**:
```typescript
import { LoggerService } from '../common/singletons';

// El logger es un singleton - misma instancia en todo el código
LoggerService.getInstance().debug('Mensaje', 'Contexto', metadata);

// Constantes singleton para selects reutilizables
import { DEFAULT_USER_SELECT } from '../common/constants';

// Uso en Prisma
include: {
  user: { select: DEFAULT_USER_SELECT }
}
```

**Servicios disponibles**:
- `LoggerService` - Logging centralizado
- `CacheService` - Caché global con TTL
- `DEFAULT_USER_SELECT` - Constante de selección de usuario

---

## 2. Builder - Construcción Paso a Paso

**Uso**: Cuando necesitas construir queries complejas o respuestas paginadas de forma flexible.

**Ubicación**: `apps/api/src/common/builders/`

**Implementación**:
```typescript
import { createQueryBuilder, PaginatedResponseBuilder } from '../common/builders';

// Construir query Prisma dinámica
const queryBuilder = createQueryBuilder('employee')
  .withCompanyId(companyId)
  .withSearch(search, [
    { field: 'employeeNumber' },
    { field: 'department' },
    { field: 'name', nested: 'user' }
  ])
  .withDateRange('createdAt', startDate, endDate)
  .withPagination(page, limit)
  .orderByField('createdAt', 'desc');

const [items, total] = await Promise.all([
  prisma.employee.findMany(queryBuilder.build()),
  prisma.employee.count({ where: queryBuilder.buildWhere() })
]);

// Construir respuesta paginada
return PaginatedResponseBuilder.fromPrismaResults(items, total, page, limit);
```

**Métodos disponibles**:
- `withCompanyId()` - Filtro por compañía
- `withSearch()` - Búsqueda por texto
- `withExactMatch()` - Coincidencia exacta
- `withNestedFilter()` - Filtros anidados
- `withDateRange()` - Rango de fechas
- `withPagination()` - Paginación
- `orderByField()` - Ordenamiento

---

## 3. Factory - Creación de Objetos

**Uso**: Cuando necesitas crear instancias configurables de servicios similares.

**Ubicación**: `apps/web/src/lib/api-factory.ts` y `apps/mobile/src/lib/api-factory.ts`

**Implementación**:
```typescript
import { createApiClient, createCrudApi } from '../lib/api-factory';

// Crear cliente API configurado
export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  platform: 'web', // o 'mobile'
  getToken: () => store.getState().auth.accessToken,
  onUnauthorized: () => store.dispatch(logout()),
  enableLogs: process.env.NODE_ENV !== 'production',
});

// Generar API CRUD completa
export const employeesApi = createCrudApi<Employee, CreateDto, UpdateDto>(
  'employees', 
  api
);
// Métodos disponibles: getAll, getById, create, update, delete
```

---

## 4. Facade - Interfaz Simplificada

**Uso**: Cuando necesitas ocultar la complejidad de operaciones que involucran múltiples servicios.

**Ubicación**: `apps/api/src/common/facades/`

**Implementación**:
```typescript
import { UserManagementFacade } from '../common/facades';

@Injectable()
export class EmployeesController {
  constructor(
    private userManagementFacade: UserManagementFacade
  ) {}

  @Post()
  async create(@Body() data: CreateEmployeeDto) {
    // Facade unifica creación de usuario + empleado
    return this.userManagementFacade.createEmployeeWithUser(data);
  }
}
```

**Facades disponibles**:
- `UserManagementFacade` - Gestión de usuarios y empleados
- `CourseManagementFacade` - Gestión de cursos y sesiones

---

## 5. Adapter - Conversión de Interfaces

**Uso**: Cuando necesitas adaptar datos para diferentes formatos de salida (PDF, Excel) o sistemas de almacenamiento.

**Ubicación**: `apps/api/src/common/adapters/`

**Implementación**:
```typescript
import { ExportsAdapterService, ExportData } from '../common/adapters';

@Controller('reports')
export class ReportsController {
  constructor(private exportsAdapter: ExportsAdapterService) {}

  @Get(':id/export/:format')
  async export(
    @Param('format') format: 'pdf' | 'excel',
    @Param('id') id: string
  ) {
    const exportData: ExportData = {
      headers: ['Nombre', 'Email', 'Estado'],
      rows: data.map(item => [item.name, item.email, item.status]),
      title: 'Reporte de Usuarios',
      metadata: { reportId: id }
    };

    return this.exportsAdapter.export(exportData, format);
  }
}
```

**Adapters disponibles**:
- `PdfExportAdapter` - Exportación a PDF
- `ExcelExportAdapter` - Exportación a Excel
- `LocalStorageAdapter` - Almacenamiento local
- `ExportsAdapterService` - Servicio que orquesta adapters

---

## 6. Strategy - Algoritmos Intercambiables

**Uso**: Cuando necesitas cambiar el comportamiento de un algoritmo en tiempo de ejecución.

**Ubicación**: `apps/api/src/common/strategies/`

**Implementación**:
```typescript
import { PartialMatchStrategy, ExactMatchStrategy } from '../common/strategies';

@Injectable()
export class EmployeeSearchService {
  private strategy = new PartialMatchStrategy();

  setStrategy(strategy: SearchStrategy) {
    this.strategy = strategy;
  }

  search(query: string, employees: Employee[]) {
    return this.strategy.search(query, employees, [
      'employeeNumber',
      'department', 
      'user.name'
    ]);
  }
}
```

**Strategies disponibles**:
- `ExactMatchStrategy` - Coincidencia exacta
- `PartialMatchStrategy` - Coincidencia parcial (contiene)

---

## 7. Observer - Eventos y Notificaciones

**Uso**: Cuando necesitas desacoplar componentes mediante eventos.

**Ubicación**: `apps/api/src/common/events/`

**Implementación**:
```typescript
import { eventEmitter } from '../common/events';

// Emitir evento
eventEmitter.emit('auth:logout', { userId: user.id });

// Escuchar evento (en servicios)
@Injectable()
export class AuthEventsListener implements OnModuleInit {
  onModuleInit() {
    eventEmitter.on('auth:logout', () => {
      this.cache.invalidateByTag('user-data');
    });
  }
}
```

**Eventos disponibles**:
- `auth:logout` - Usuario cierra sesión
- `auth:token-expired` - Token expira
- `auth:unauthorized` - Acceso no autorizado

---

## 8. Twingate Security - Zero Trust

**Uso**: Para seguridad reforzada con validación de dispositivos.

**Ubicación**: `apps/api/src/common/security/`

**Implementación**:
```typescript
import { ZeroTrustGuard, DeviceValidatorService } from '../common/security';

// Aplicar guard a rutas sensibles
@Controller('admin')
@UseGuards(JwtAuthGuard, ZeroTrustGuard)
export class AdminController {
  // Solo dispositivos trusteados pueden acceder
}
```

**Servicios disponibles**:
- `ZeroTrustGuard` - Guard de autorización
- `DeviceValidatorService` - Validación de dispositivos
- `SecureConnectionMiddleware` - Middleware HTTPS

---

## Reglas de Oro

1. **Nunca repitas código de queries** - Usa el Builder
2. **Unifica APIs CRUD** - Usa la Factory
3. **Simplifica operaciones complejas** - Usa el Facade
4. **Soporta múltiples formatos** - Usa el Adapter
5. **Intercambia algoritmos** - Usa el Strategy
6. **Desacopla componentes** - Usa el Observer
7. **Protege rutas sensibles** - Usa Twingate
