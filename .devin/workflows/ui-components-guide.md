---
description: Guía de componentes UI para el frontend web - cuándo usar drawers vs modales, títulos, espaciado y patrones de formularios
---

# Guía de Componentes UI - Frontend Web

## 📐 Drawers vs Modales

### **DRAWER (Panel Lateral)** - PREDETERMINADO para formularios

**Uso:**
- ✅ Formularios de creación/edición (CRUD)
- ✅ Detalle de registros con edición inline
- ✅ Filtros avanzados de búsqueda
- ✅ Configuración de ítems complejos

**Características:**
- Ancho: `480px` - `600px` (formularios simples), `720px` - `900px` (formularios complejos)
- Posición: Derecha (`placement="right"`)
- Header fijo con título y botón cerrar
- Body con scroll interno
- Footer fijo con botones de acción (Cancelar | Guardar)

**Ejemplo Drawer de formulario:**
```tsx
<Drawer
  title={<Title level={4}>Nueva Empresa</Title>}
  placement="right"
  width={560}
  onClose={onClose}
  open={isOpen}
  footer={
    <Space>
      <Button onClick={onClose}>Cancelar</Button>
      <Button type="primary" onClick={handleSubmit}>Guardar</Button>
    </Space>
  }
>
  <Form layout="vertical">...</Form>
</Drawer>
```

---

### **MODAL (Diálogo Central)**

**Uso:**
- ✅ Confirmaciones (eliminar, cambiar estado)
- ✅ Mensajes de alerta/éxito/error
- ✅ Acciones rápidas (2-3 campos máximo)
- ✅ Preview de documentos/imágenes
- ✅ Selección simple de opciones

**Características:**
- Ancho: `400px` (confirmaciones), `600px` (contenido), `800px` (preview)
- Centrado en pantalla
- backdrop con blur opcional
- NO usar para formularios de más de 3 campos

**Ejemplo Modal de confirmación:**
```tsx
<Modal
  title="Confirmar eliminación"
  open={isOpen}
  onOk={handleDelete}
  onCancel={onClose}
  okText="Eliminar"
  okButtonProps={{ danger: true }}
  cancelText="Cancelar"
>
  <p>¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.</p>
</Modal>
```

---

## 📏 Títulos y Jerarquía de Páginas

### **Estructura de Página de Gestión**

```
┌─────────────────────────────────────────────────────────┐
│  Título Principal (H3)                    [Botón Nuevo] │
│  Descripción breve de la sección                        │
├─────────────────────────────────────────────────────────┤
│  │ Filtros │                    │ Buscar │ [Filtros]  │
├─────────────────────────────────────────────────────────┤
│  Tabla de datos...                                      │
└─────────────────────────────────────────────────────────┘
```

### **Jerarquía de Títulos**

| Nivel | Componente | Uso | Estilo |
|-------|------------|-----|--------|
| H1 | `<Title level={1}>` | Dashboard principal | 32px, font-weight 600 |
| H2 | `<Title level={2}>` | Módulos principales | 24px, font-weight 600 |
| H3 | `<Title level={3}>` | Páginas de listado | 20px, font-weight 500 |
| H4 | `<Title level={4}>` | Drawers de formulario | 18px, font-weight 500 |
| H5 | `<Title level={5}>` | Secciones de formulario | 16px, font-weight 500 |

**Ejemplo de página de listado:**
```tsx
<div style={{ marginBottom: 24 }}>
  <Title level={3} style={{ marginBottom: 8 }}>Empresas</Title>
  <Text type="secondary">Gestiona las empresas registradas en el sistema</Text>
</div>
```

---

## 📐 Espaciado y Layout

### **Espaciado Base**

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 8px | Espacio entre campos relacionados |
| `sm` | 16px | Padding interno de cards |
| `md` | 24px | Margen entre secciones |
| `lg` | 32px | Separación de bloques principales |
| `xl` | 48px | Padding de página |

### **Estructura de Página**

```tsx
// Padding de página
<div style={{ padding: '24px 32px' }}>
  {/* Header con título y acciones */}
  <div style={{ marginBottom: 24 }}>
    <Title level={3}>Título</Title>
  </div>

  {/* Content principal */}
  <Card>
    {/* Contenido */}
  </Card>
</div>
```

### **Drawer Layout**

```tsx
<Drawer width={560} ...>
  {/* Header: Título + Subtítulo */}
  <div style={{ marginBottom: 24 }}>
    <Title level={4}>Nueva Sucursal</Title>
    <Text type="secondary">Completa los datos de la sucursal</Text>
  </div>

  {/* Formulario con espaciado */}
  <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {/* Campos */}
  </Form>
</Drawer>
```

---

## 📝 Patrones de Formularios

### **Drawer de Creación/Edición**

**Estructura estándar:**
```tsx
<Drawer
  title={
    <div>
      <Title level={4}>{isEditing ? 'Editar' : 'Nueva'} Empresa</Title>
      {isEditing && <Text type="secondary">ID: {record.id}</Text>}
    </div>
  }
  placement="right"
  width={560}
  onClose={onClose}
  open={isOpen}
  footer={
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button onClick={onClose}>Cancelar</Button>
      <Button type="primary" loading={isLoading} onClick={handleSubmit}>
        {isEditing ? 'Guardar cambios' : 'Crear'}
      </Button>
    </div>
  }
>
  <Form form={form} layout="vertical">
    <Form.Item name="nombre" label="Nombre" rules={[{ required: true }]}>
      <Input />
    </Form.Item>

    <Form.Item name="descripcion" label="Descripción">
      <TextArea rows={4} />
    </Form.Item>
  </Form>
</Drawer>
```

### **Reglas de Formularios en Drawers**

1. **Ancho del drawer:**
   - Formularios simples (1-4 campos): `480px - 560px`
   - Formularios medianos (5-8 campos): `600px - 720px`
   - Formularios complejos (9+ campos, secciones): `800px - 900px`

2. **Estructura de campos:**
   - Usar `layout="vertical"` siempre
   - Agrupar campos relacionados en secciones con `<Divider />`
   - Campos de 1 columna (ancho completo) por defecto
   - Grid de 2 columnas solo para campos cortos relacionados (ej: Nombre + Apellido)

3. **Botones de acción:**
   - Footer fijo del drawer
   - Orden: Cancelar (izquierda) → Guardar (derecha, primario)
   - Loading state en el botón de guardar

4. **Validación:**
   - Mostrar errores inline en cada campo
   - Deshabilitar botón Guardar hasta que el formulario sea válido (opcional)

---

## 🎨 Componentes Específicos del Proyecto

### **Página de Listado con Tabs**

```tsx
<Tabs
  activeKey={activeTab}
  onChange={setActiveTab}
  tabBarExtraContent={
    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
      Nuevo
    </Button>
  }
>
  <Tabs.TabPane tab="Empresas" key="empresas">
    <EmpresasTable />
  </Tabs.TabPane>
  <Tabs.TabPane tab="Configuración" key="configuracion">
    <ConfigPanel />
  </Tabs.TabPane>
</Tabs>
```

### **Tabla de Datos con Acciones**

```tsx
<Table
  columns={[
    { title: 'Nombre', dataIndex: 'nombre' },
    { title: 'Estado', dataIndex: 'activo', render: (v) => <Badge status={v ? 'success' : 'default'} text={v ? 'Activo' : 'Inactivo'} /> },
    {
      title: 'Acciones',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Editar</Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Eliminar</Button>
        </Space>
      )
    }
  ]}
/>
```

---

## ✅ Checklist de Implementación

### **Antes de crear un formulario:**
- [ ] ¿Es un formulario de creación/edición? → **USAR DRAWER**
- [ ] ¿Es una confirmación simple? → Usar Modal
- [ ] ¿El drawer tiene ancho apropiado para la cantidad de campos?
- [ ] ¿Hay un footer con botones Cancelar/Guardar?

### **Estructura de drawer:**
- [ ] Header con `<Title level={4}>`
- [ ] Subtítulo descriptivo (opcional)
- [ ] Form con `layout="vertical"`
- [ ] Espaciado de 16-24px entre campos
- [ ] Footer fijo con acciones

### **NO HACER:**
- ❌ NO usar Modales para formularios de más de 3 campos
- ❌ NO usar Modales para edición de registros
- ❌ NO poner formularios completos en el cuerpo de la página (siempre drawer)
- ❌ NO usar ancho fijo de modal para formularios largos
