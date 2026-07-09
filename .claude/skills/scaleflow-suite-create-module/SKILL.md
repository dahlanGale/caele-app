---
name: scaleflow-suite-create-module
description: >
  Crea e integra un modulo nuevo en Scaleflow Suite (Next.js App Router, Ant Design, Redux Toolkit, Firestore).
  Usalo cuando el usuario pida un modulo, submodulo, pantalla CRUD, entrada de menu, permisos por empresa o por rol,
  API interna tipo Stripe, o integracion con Cloud Functions. Tambien si menciona catalogo MODULOS, LayoutMain,
  branding, o replicar patrones de colaboradores/finanzas/ventas/fraccionamientos. Si el usuario dice "agrega modulo",
  "nuevo modulo", "crear pantalla", "necesito un CRUD de X", "quiero una seccion para Y", o cualquier variante en
  espanol o ingles que implique anadir funcionalidad de gestion a la suite, activa esta skill. Antes de codificar,
  aclara alcance, dependencias entre modulos y fuente de datos; si falta contexto, pregunta.
---

# Crear e integrar un modulo en Scaleflow Suite

Este skill te guia paso a paso para crear un modulo completo que se integre correctamente con el sistema de permisos, navegacion, branding y datos de la suite.

## Antes de implementar: entrevista minima

Si el usuario no lo dejo explicito, pregunta y documenta:

1. **Nombre del modulo y submodulos** — IDs en kebab-case coherentes con rutas (ej. `mi-modulo`, `mi-submodulo`).
2. **Funcionalidad** — listados, formularios, flujos, reportes, integraciones externas.
3. **Dependencias con otros modulos** — necesita sucursales, clientes, inventario, usuarios, pagos? Si no esta claro, pregunta que entidades existen y bajo que rutas o colecciones viven.
4. **Fuente de datos** — Firestore bajo `empresas/{idEmpresa}/...`, API Route en `src/app/api`, Cloud Run / URL externa, o combinacion? (Colaboradores mezcla Firestore + servicio HTTP.)
5. **Permisos CRUD deseados** por submodulo (create/read/update/delete) para el catalogo y los roles.
6. **Quien habilita el modulo** — solo empresas con ese modulo en su whitelist (branding + empresa); no asumas que todas lo tienen.

No inventes integraciones criticas sin confirmar; mejor una lista de supuestos y una pregunta concreta.

---

## Sistema de modulos y permisos — como encaja

### Capa 1: Catalogo global de modulos

**Archivo:** `src/data/modules.ts`

Define `MODULOS` con id, name, description, price, submodulos[] y crud por submodulo. Cada nuevo modulo que deba contratarse o mostrarse en catalogo se anade aqui.

```typescript
// Interfaz de referencia
interface CrudRules { create: boolean; read: boolean; update: boolean; delete: boolean; }
interface Submodulo { id: string; name: string; crud: CrudRules; }
interface Modulo {
  id: string; name: string; description: string;
  price: { mensual: number; anual: number; };
  features?: string[];
  submodulos?: Submodulo[];
}
```

### Capa 2: Catalogo empresa (toggle on/off)

**Archivo:** `src/constants/modulosCatalog.ts`

Define `MODULOS_EMPRESA_CATALOGO` — lo que SuperAdmin puede habilitar/deshabilitar por empresa en pre-configuraciones.

```typescript
interface EmpresaSubmoduloCatalog { id: string; label: string; }
interface EmpresaModuloCatalog { id: string; label: string; submodulos?: EmpresaSubmoduloCatalog[]; }
```

### Capa 3: Nivel empresa + branding (que esta "encendido")

**Archivo:** `src/utils/modulosEmpresa.ts`

- `normalizeEmpresaModulos` — normaliza datos crudos de empresa
- `mergeModulosWithBranding` — combina modulos del branding con modulos habilitados en la empresa; si un modulo no esta en la empresa, queda deshabilitado aunque exista en el catalogo
- `filterMenuItemsByModulos` — filtra items del menu recursivamente
- `isModuloKeyEnabled` — checa si una key `moduloId` o `moduloId/submoduloId` esta activa

### Capa 4: Nivel usuario (rol)

Los permisos del rol en Firestore (`FireStoreConfiguracion.buscarRol`) incluyen modulo, submodulo y flags CRUD. `LayoutMain.tsx` construye el menu lateral y valida rutas con `userPermissions` y `moduleRoutes`.

Las claves de menu y rutas siguen el patron `{moduloId}/{submoduloId}` (ej. `recursos-humanos/colaboradores`).

---

## Checklist de implementacion

Sigue estos pasos en orden. Cada paso es un archivo o grupo de archivos que debes tocar.

### Paso 1: `src/data/modules.ts` — Catalogo global

Anade una entrada `Modulo` con sus `Submodulo[]` y reglas CRUD:

```typescript
{
  id: "mi-modulo",
  name: "Mi Modulo",
  description: "Descripcion del modulo para el catalogo.",
  price: { mensual: 0, anual: 0 },
  features: ["Feature 1", "Feature 2"],
  submodulos: [
    {
      id: "mi-submodulo",
      name: "Mi Submodulo",
      crud: { create: true, read: true, update: true, delete: true },
    },
  ],
},
```

### Paso 2: `src/constants/modulosCatalog.ts` — Catalogo empresa

Anade entrada en `MODULOS_EMPRESA_CATALOGO`:

```typescript
{
  id: "mi-modulo",
  label: "Mi Modulo",
  submodulos: [
    { id: "mi-submodulo", label: "Mi Submodulo" },
  ],
},
```

### Paso 3: `src/components/LayoutMain.tsx` — Menu y rutas

Hay **CUATRO** cosas que tocar en LayoutMain. Si falta alguna, el modulo no aparecera en el sidebar o las rutas no funcionaran.

#### 3a. `menu.push()` — OBLIGATORIO para que aparezca en el sidebar

**CRITICO:** El sidebar se construye con `menu.push()` hardcodeados. Sin esto, el modulo NO aparece aunque este habilitado en pre-configuraciones. Busca la seccion donde estan los `menu.push(...)` (despues de los modulos existentes, antes del comentario `// Aplicar personalización ANTES de filtrar`) y anade el modulo. El patron exacto es:

```typescript
menu.push({
  key: "mi-modulo",
  icon: <AppstoreOutlined style={{ color: isActiveColor("mi-modulo") }} />,
  label: <span style={{ color: isActiveColor("mi-modulo") }}>Mi Modulo</span>,
  children: [
    {
      key: "mi-modulo/mi-submodulo",
      icon: <FileTextOutlined style={{ color: isActiveColor("mi-modulo/mi-submodulo") }} />,
      label: (
        <span style={{ color: isActiveColor("mi-modulo/mi-submodulo") }}>
          Mi Submodulo
        </span>
      ),
      onClick: () => router.push("/mi-modulo/mi-submodulo"),
    },
  ],
});
```

Iconos: importa de `@ant-design/icons` al inicio de LayoutMain. Iconos comunes del proyecto:
`AppstoreOutlined`, `ShoppingCartOutlined`, `DollarOutlined`, `TeamOutlined`, `EnvironmentOutlined`, `ApartmentOutlined`, `TruckOutlined`, `FileTextOutlined`, `BarChartOutlined`, `SettingOutlined`, `CodeOutlined`, `WechatOutlined`, `SafetyCertificateOutlined`, `GlobalOutlined`, `ProjectOutlined`, `CalendarOutlined`, `UnorderedListOutlined`.

**IMPORTANTE:** `filterMenuItemsByModulos()` filtra estos items contra los modulos activos de la empresa. Si el `menu.push()` no existe, el filtro no tiene nada que mostrar y el modulo queda invisible en el sidebar.

#### 3b. `moduleRoutes`

Busca el objeto `moduleRoutes` y anade todas las rutas del modulo:

```typescript
"mi-modulo": [
  "mi-modulo",
  "mi-modulo/mi-submodulo",
],
```

Esto es critico para el guard de rutas — sin esto, el usuario no podra acceder aunque tenga permisos.

#### 3c. `getModuleIcon` y `getSubIcon`

Busca estas funciones y anade las entradas correspondientes:

```typescript
// En getModuleIcon:
"mi-modulo": <AppstoreOutlined />,

// En getSubIcon:
"mi-submodulo": <FileTextOutlined />,
```

### Paso 4: Pagina — `src/app/{modulo}/{submodulo}/page.tsx`

Todas las paginas de la suite son `"use client"`. El patron estandar compone Header + Search + Table + Drawer/Form:

```typescript
"use client";
import React from "react";
import { Button, Col, Drawer, Form, Row, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { setOpenDrawer, setDetalleRegistro } from "@/features/miModuloSlice";
import SearchMiSubmodulo from "@/components/mi-modulo/mi-submodulo/SearchMiSubmodulo";
import TableMiSubmodulo from "@/components/mi-modulo/mi-submodulo/TableMiSubmodulo";
import FormMiSubmodulo from "@/components/mi-modulo/mi-submodulo/FormMiSubmodulo";

const MiSubmoduloPage = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { openDrawer, detalleRegistro } = useSelector(
    (state: any) => state.miModulo
  );

  return (
    <div>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={4}>Mi Submodulo</Typography.Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                dispatch(setDetalleRegistro(null));
                dispatch(setOpenDrawer(true));
              }}
            >
              Nuevo registro
            </Button>
          </Col>
        </Row>
      </Space>

      <Drawer
        title={detalleRegistro?.id ? "Editar registro" : "Nuevo registro"}
        open={openDrawer}
        onClose={() => dispatch(setOpenDrawer(false))}
        width={600}
      >
        {openDrawer && <FormMiSubmodulo form={form} />}
      </Drawer>

      <SearchMiSubmodulo />
      <TableMiSubmodulo form={form} />
    </div>
  );
};

export default MiSubmoduloPage;
```

### Paso 5: Componentes — `src/components/{modulo}/{submodulo}/`

Crea estos archivos siguiendo los patrones del proyecto:

#### `SearchMiSubmodulo.tsx`

```typescript
"use client";
import React from "react";
import { Col, Input, Row, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { setFiltros } from "@/features/miModuloSlice";

const SearchMiSubmodulo = () => {
  const dispatch = useDispatch();

  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={12}>
        <Input
          placeholder="Buscar..."
          prefix={<SearchOutlined />}
          onChange={(e) => dispatch(setFiltros({ busqueda: e.target.value }))}
          allowClear
        />
      </Col>
      <Col span={6}>
        <Select
          placeholder="Filtrar por estado"
          style={{ width: "100%" }}
          onChange={(value) => dispatch(setFiltros({ estado: value }))}
          allowClear
        >
          <Select.Option value="activo">Activo</Select.Option>
          <Select.Option value="inactivo">Inactivo</Select.Option>
        </Select>
      </Col>
    </Row>
  );
};

export default SearchMiSubmodulo;
```

#### `TableMiSubmodulo.tsx`

```typescript
"use client";
import React, { useEffect, useState } from "react";
import { Button, Dropdown, message, Table } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import FireStoreMiModulo from "@/firebase/FireStoreMiModulo";
import { setOpenDrawer, setDetalleRegistro } from "@/features/miModuloSlice";

const TableMiSubmodulo = ({ form }: { form: any }) => {
  const dispatch = useDispatch();
  const { auth } = useSelector((state: any) => state.configuracion);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!auth?.empresa?.id) return;
    setLoading(true);
    try {
      const result = await FireStoreMiModulo.listar({ idEmpresa: auth.empresa.id });
      setData(result);
    } catch (error) {
      message.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [auth?.empresa?.id]);

  const columns = [
    { title: "Nombre", dataIndex: "nombre", key: "nombre" },
    // ... mas columnas
    {
      title: "Acciones",
      key: "acciones",
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "editar",
                label: "Editar",
                onClick: () => {
                  dispatch(setDetalleRegistro(record));
                  form.setFieldsValue(record);
                  dispatch(setOpenDrawer(true));
                },
              },
              {
                key: "eliminar",
                label: "Eliminar",
                danger: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const handleDelete = async (record: any) => {
    try {
      await FireStoreMiModulo.eliminar(auth.empresa.id, record.id);
      message.success("Eliminado exitosamente");
      fetchData();
    } catch {
      message.error("Error al eliminar");
    }
  };

  return (
    <Table
      loading={loading}
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{ pageSize: 10, showSizeChanger: true }}
    />
  );
};

export default TableMiSubmodulo;
```

#### `FormMiSubmodulo.tsx`

```typescript
"use client";
import React, { useEffect } from "react";
import { Button, Form, Input, Select, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import FireStoreMiModulo from "@/firebase/FireStoreMiModulo";
import { setOpenDrawer } from "@/features/miModuloSlice";

const FormMiSubmodulo = ({ form }: { form: any }) => {
  const dispatch = useDispatch();
  const { auth } = useSelector((state: any) => state.configuracion);
  const { detalleRegistro } = useSelector((state: any) => state.miModulo);

  useEffect(() => {
    if (detalleRegistro) {
      form.setFieldsValue(detalleRegistro);
    } else {
      form.resetFields();
    }
  }, [detalleRegistro, form]);

  const onFinish = async (values: any) => {
    try {
      if (detalleRegistro?.id) {
        await FireStoreMiModulo.actualizar(auth.empresa.id, {
          id: detalleRegistro.id,
          ...values,
        });
        message.success("Actualizado exitosamente");
      } else {
        await FireStoreMiModulo.crear(auth.empresa.id, values);
        message.success("Creado exitosamente");
      }
      dispatch(setOpenDrawer(false));
      form.resetFields();
    } catch {
      message.error("Error al guardar");
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Nombre"
        name="nombre"
        rules={[{ required: true, message: "Campo requerido" }]}
      >
        <Input placeholder="Ingrese el nombre" />
      </Form.Item>
      {/* Mas campos segun el modulo */}
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          {detalleRegistro ? "Actualizar" : "Crear"}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormMiSubmodulo;
```

### Paso 6: Servicio Firestore — `src/firebase/FireStore{Modulo}.ts`

Todas las colecciones viven bajo `empresas/{idEmpresa}/`. Los metodos siguen verbos en espanol:

```typescript
import {
  addDoc, collection, deleteDoc, doc, getDocs,
  orderBy, query, setDoc, Timestamp,
} from "firebase/firestore";
import { firestore } from "@/app/firebaseConfig";

class FireStoreMiModulo {
  async listar({ idEmpresa }: { idEmpresa: string }) {
    const empresaRef = doc(firestore, "empresas", idEmpresa);
    const colRef = collection(empresaRef, "mi-coleccion");
    const q = query(colRef, orderBy("fechaRegistro", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async crear(idEmpresa: string, data: any) {
    const empresaRef = doc(firestore, "empresas", idEmpresa);
    const colRef = collection(empresaRef, "mi-coleccion");
    const docRef = await addDoc(colRef, {
      ...data,
      eliminado: false,
      fechaRegistro: Timestamp.now(),
    });
    return docRef.id;
  }

  async actualizar(idEmpresa: string, data: any) {
    const { id, ...values } = data;
    const docRef = doc(firestore, "empresas", idEmpresa, "mi-coleccion", id);
    await setDoc(docRef, values, { merge: true });
  }

  async eliminar(idEmpresa: string, id: string) {
    const docRef = doc(firestore, "empresas", idEmpresa, "mi-coleccion", id);
    await deleteDoc(docRef);
  }
}

export default new FireStoreMiModulo();
```

### Paso 7: Redux Slice — `src/features/{modulo}Slice.ts`

Solo si necesitas estado compartido entre componentes (drawers, listas, filtros):

```typescript
import { createSlice } from "@reduxjs/toolkit";

const initialState: any = {
  loading: false,
  loadingTable: false,
  openDrawer: false,
  detalleRegistro: null,
  filtros: {},
};

export const miModuloSlice = createSlice({
  name: "miModulo",
  initialState,
  reducers: {
    setLoading: (state, action) => { state.loading = action.payload; },
    setLoadingTable: (state, action) => { state.loadingTable = action.payload; },
    setOpenDrawer: (state, action) => { state.openDrawer = action.payload; },
    setDetalleRegistro: (state, action) => { state.detalleRegistro = action.payload; },
    setFiltros: (state, action) => { state.filtros = { ...state.filtros, ...action.payload }; },
  },
});

export const {
  setLoading, setLoadingTable, setOpenDrawer, setDetalleRegistro, setFiltros,
} = miModuloSlice.actions;

export default miModuloSlice.reducer;
```

### Paso 8: Registrar en store — `src/app/store.ts`

Anade el reducer del slice nuevo:

```typescript
import miModuloReducer from "@/features/miModuloSlice";

// En el objeto reducer:
miModulo: miModuloReducer,
```

Si usas RTK Query API, tambien registra `[miModuloApi.reducerPath]: miModuloApi.reducer` y agrega `miModuloApi.middleware` al concat de middleware.

### Paso 9 (opcional): API Routes — `src/app/api/{modulo}/`

Si el modulo necesita endpoints publicos o de integracion, sigue el patron de autenticacion existente:

```typescript
import { validateApiKeyGlobal, checkPermission, createErrorResponse, createSuccessResponse } from "@/app/api/lib/apiAuth";

export async function GET(request: Request) {
  try {
    const auth = await validateApiKeyGlobal(request);
    if (!auth.valid || !auth.empresaId) {
      return createErrorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
    }
    if (!checkPermission(auth.permissions, "mi-permiso")) {
      return createErrorResponse("Sin permisos", 403);
    }
    const data = await FireStoreMiModulo.listar({ idEmpresa: auth.empresaId });
    return createSuccessResponse(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error interno";
    return createErrorResponse(msg, 500);
  }
}
```

---

## Branding y UI — reglas obligatorias

- **No hardcodear colores** — el tema Ant Design ya usa `colorPrimary` desde `branding.colorPrincipal` en `src/app/provider.tsx`. Usa `Button type="primary"`, no `style={{ background: "#009b9b" }}`.
- **Usa componentes Ant Design estandar** — `Button`, `Table`, `Form`, `Drawer`, `Input.Search`, `Select`, `Row`/`Col`/`Space`, `Pagination`, `Spin`, `Dropdown`, `message`.
- **LayoutMain maneja el shell** — las paginas internas deben confiar en el `ConfigProvider` global, no en hex fijos.
- **Copia estructura, no estilos sueltos** — reutiliza el patron Header+Search+Table+Drawer de un modulo cercano (ej. `recursos-humanos/colaboradores`, `ventas/clientes`, `finanzas/cuentas-por-cobrar`).

---

## APIs servidor — dos estilos del proyecto

### Estilo "Stripe" (API key + permiso)

- Ubicacion: `src/app/api/stripe/*/route.ts`
- Autenticacion: `validateApiKeyGlobal(request)` → `checkPermission(permissions, "<permiso>")`
- Opcionalmente: `Authorization: Bearer <idToken>` verificado con Firebase Admin
- Respuestas: `createErrorResponse(msg, status)` / `createSuccessResponse(data)`

### Estilo "Colaboradores" (RTK Query + Cloud Run)

- Cliente: `src/services/recursosHumanosApi.ts` con `createApi` + `fetchBaseQuery`
- Endpoints: `builder.query()` y `builder.mutation()`
- Registro: reducer + middleware en `src/app/store.ts`

Al disenar un modulo nuevo, elige uno de estos estilos (o hibrido) y siguelo de forma uniforme.

---

## Verificacion antes de dar por hecho

- [ ] **`menu.push()` existe en LayoutMain** — sin esto el modulo NO aparece en el sidebar aunque este habilitado
- [ ] `moduleRoutes` actualizado en LayoutMain — sin esto el route guard redirige a `/inicio`
- [ ] `getModuleIcon` y `getSubIcon` actualizados en LayoutMain
- [ ] Imports de `@ant-design/icons` agregados en LayoutMain si se usan iconos nuevos
- [ ] Rutas accesibles con un rol que tenga `read` (y `create`/`update`/`delete` segun botones mostrados)
- [ ] Modulo aparece solo si empresa + branding lo tienen habilitado
- [ ] Sin colores fijos que ignoren branding; botones primarios respetan tema
- [ ] Menu keys y `moduleRoutes` alineados (misma clave `modulo/submodulo`)
- [ ] Store incluye reducers/middleware de APIs nuevas
- [ ] Linter sin errores en archivos tocados (`npm run lint`)
