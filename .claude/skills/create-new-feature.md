---
name: create-new-feature
description: Checklist y guía para crear nuevas funcionalidades en el HR-System manteniendo consistencia con los patrones de diseño establecidos. Usar al iniciar el desarrollo de cualquier nueva feature.
---

# Crear Nueva Funcionalidad - Checklist

Sigue esta guía para mantener consistencia con la arquitectura del proyecto.

## Paso 1: Planificación

- [ ] Definir los endpoints REST necesarios
- [ ] Identificar si requiere autenticación (JWT)
- [ ] Determinar si necesita rate limiting
- [ ] Identificar patrones de diseño aplicables

## Paso 2: Backend (API)

### 2.1 Crear el Módulo NestJS
```bash
# En apps/api/src
mkdir -p [feature-name]
```

### 2.2 Implementar Service con Patrones

**Si necesitas queries complejas con filtros**:
```typescript
// Usa el Builder
import { createQueryBuilder, PaginatedResponseBuilder } from '../common/builders';

async findAll(companyId: string, search?: string) {
  const queryBuilder = createQueryBuilder('entity')
    .withCompanyId(companyId)
    .withSearch(search, [{ field: 'name' }])
    .withPagination(page, limit);
    
  const [items, total] = await Promise.all([
    this.prisma.entity.findMany(queryBuilder.build()),
    this.prisma.entity.count({ where: queryBuilder.buildWhere() })
  ]);
  
  return PaginatedResponseBuilder.fromPrismaResults(items, total, page, limit);
}
```

**Si necesitas operaciones que involucran múltiples servicios**:
```typescript
// Usa el Facade
@Injectable()
export class FeatureManagementFacade {
  constructor(
    private featureService: FeatureService,
    private otherService: OtherService,
  ) {}
  
  async createWithRelations(data: CreateDto) {
    // Unificar operaciones complejas aquí
  }
}
```

**Si necesitas exportar datos**:
```typescript
// Usa el Adapter
import { ExportsAdapterService } from '../common/adapters';

async exportData(format: 'pdf' | 'excel') {
  const exportData = {
    headers: ['Campo1', 'Campo2'],
    rows: data.map(d => [d.field1, d.field2]),
    title: 'Reporte',
  };
  
  return this.exportsAdapter.export(exportData, format);
}
```

### 2.3 Crear Controller

```typescript
@Controller('features')
@UseGuards(JwtAuthGuard)
export class FeaturesController {
  constructor(
    private readonly featureService: FeatureService,
    // Inyecta facades o adapters si son necesarios
  ) {}

  @Get()
  findAll(@Query() query: QueryDto) {
    return this.featureService.findAll(query.companyId, query.search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featureService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() data: CreateFeatureDto) {
    return this.featureService.create(data);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() data: UpdateFeatureDto) {
    return this.featureService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.featureService.delete(id);
  }
}
```

### 2.4 Registrar en AppModule

```typescript
// apps/api/src/app.module.ts
imports: [
  // ... módulos existentes
  FeaturesModule, // Nuevo módulo
]
```

---

## Paso 3: Frontend (Web)

### 3.1 Crear API Client con Factory

```typescript
// apps/web/src/features/[feature]/api/features-api.ts
import { api } from '../../../lib/api';
import { createCrudApi } from '../../../lib/crud-api-factory';
import type { PaginatedResponse } from '@hr-system/types';

export interface Feature {
  id: string;
  name: string;
  // ... campos
}

export interface CreateFeatureDto {
  name: string;
  // ... campos
}

export interface UpdateFeatureDto {
  name?: string;
  // ... campos opcionales
}

// Factory. Generar API CRUD completa
export const featuresApi = createCrudApi<Feature, CreateFeatureDto, UpdateFeatureDto>(
  'features',
  api
);

export type { PaginatedResponse };
```

### 3.2 Crear Hooks React Query (opcional)

```typescript
// apps/web/src/features/[feature]/hooks/use-features.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresApi } from '../api/features-api';

export const useFeatures = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['features', params],
    queryFn: () => featuresApi.getAll(params),
  });
};

export const useCreateFeature = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: featuresApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
};
```

### 3.3 Crear Componentes

```typescript
// apps/web/src/features/[feature]/components/FeatureList.tsx
import { useFeatures } from '../hooks/use-features';

export const FeatureList = () => {
  const { data, isLoading } = useFeatures({ page: 1, limit: 10 });
  
  if (isLoading) return <Spin />;
  
  return (
    <Table dataSource={data?.items} />
  );
};
```

### 3.4 Crear Página

```typescript
// apps/web/src/pages/FeaturesPage.tsx
import { FeatureList } from '../features/[feature]/components/FeatureList';

export const FeaturesPage = () => {
  return (
    <div>
      <h1>Gestión de Features</h1>
      <FeatureList />
    </div>
  );
};
```

### 3.5 Agregar Ruta

```typescript
// apps/web/src/App.tsx
import { FeaturesPage } from './pages/FeaturesPage';

<Route path="/features" element={<FeaturesPage />} />
```

---

## Paso 4: Documentación

### 4.1 Agregar Swagger Docs (API)

```typescript
@ApiTags('Features')
@Controller('features')
export class FeaturesController {
  @Get()
  @ApiOperation({ summary: 'Get all features' })
  @ApiResponse({ status: 200, description: 'Return all features' })
  findAll() { }
}
```

### 4.2 Actualizar README (si es necesario)

---

## Paso 5: Testing

- [ ] Crear tests unitarios para el service
- [ ] Crear tests para el controller
- [ ] Probar endpoints con Postman/Insomnia
- [ ] Verificar frontend renderiza correctamente

---

## Checklist Final

Antes de hacer commit:

- [ ] **Backend**:
  - [ ] Usa `createQueryBuilder` para queries complejas
  - [ ] Usa `PaginatedResponseBuilder` para respuestas paginadas
  - [ ] Usa `DEFAULT_USER_SELECT` para selects de usuario
  - [ ] Usa LoggerService para logs (no console.log)
  - [ ] Registra nuevos servicios en AppModule si es necesario

- [ ] **Frontend**:
  - [ ] Usa `createCrudApi` para APIs estándar
  - [ ] Tipos definidos en @hr-system/types
  - [ ] Manejo de errores implementado
  - [ ] Estados de loading/skeleton agregados

- [ ] **Seguridad**:
  - [ ] Rutas protegidas con @UseGuards(JwtAuthGuard)
  - [ ] Roles verificados si aplica @Roles(UserRole.ADMIN)
  - [ ] Validación de inputs con class-validator

- [ ] **Código**:
  - [ ] Comentarios con formato `// Patron. Descripción`
  - [ ] Nombres de archivos sin tipo de patrón (no: `feature-service.ts`, sí: `feature.ts`)
  - [ ] ESLint pasa sin errores
  - [ ] TypeScript compila sin errores

---

## Ejemplo Completo: Crear "Evaluaciones"

```bash
# 1. Backend
mkdir -p apps/api/src/evaluations
touch apps/api/src/evaluations/evaluations.module.ts
touch apps/api/src/evaluations/evaluations.service.ts
touch apps/api/src/evaluations/evaluations.controller.ts

# 2. Frontend
mkdir -p apps/web/src/features/evaluations/api
mkdir -p apps/web/src/features/evaluations/components
mkdir -p apps/web/src/features/evaluations/hooks
touch apps/web/src/features/evaluations/api/evaluations-api.ts

# 3. Página
touch apps/web/src/pages/EvaluationsPage.tsx
```

**Service**:
```typescript
@Injectable()
export class EvaluationsService {
  async findAll(companyId: string, search?: string, page = 1, limit = 10) {
    const queryBuilder = createQueryBuilder('evaluation')
      .withCompanyId(companyId)
      .withSearch(search, [{ field: 'title' }, { field: 'description' }])
      .withPagination(page, limit)
      .orderByField('createdAt', 'desc');
      
    const [items, total] = await Promise.all([
      this.prisma.evaluation.findMany(queryBuilder.build()),
      this.prisma.evaluation.count({ where: queryBuilder.buildWhere() })
    ]);
    
    return PaginatedResponseBuilder.fromPrismaResults(items, total, page, limit);
  }
}
```

**Controller**:
```typescript
@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}
  
  @Get()
  findAll(@Request() req, @Query() query) {
    return this.evaluationsService.findAll(
      req.user.companyId,
      query.search,
      parseInt(query.page || '1'),
      parseInt(query.limit || '10')
    );
  }
}
```

**API Frontend**:
```typescript
export const evaluationsApi = createCrudApi<Evaluation, CreateDto, UpdateDto>(
  'evaluations',
  api
);
```

---

**Recuerda**: Cuando dudes, revisa el skill `code-patterns` para ver ejemplos de los patrones.
