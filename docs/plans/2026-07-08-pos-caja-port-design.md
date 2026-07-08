# Port POS (caja) de scale-flow-pos a caele-app — Diseño

Fecha: 2026-07-08
Estado: Aprobado, listo para implementación

## Objetivo

Portar de `scale-flow-pos` a `caele-app` las funcionalidades de: registro de
máquina/terminal, artículos, orden/venta con pago, cortes de caja, retiros
parciales y estado de cajón. Meta inmediata: una **demo** que registre artículos
y ejecute el flujo de caja completo (venta → retiro → estado de cajón → corte).

## Decisiones tomadas

- **Estrategia**: adaptar a las convenciones de caele-app (rutas
  `pymes/{uid}/...`, design tokens, componentes UI existentes, expo-router).
  No copiar verbatim; no portar Redux (código muerto en el origen) ni Electron.
- **Identidad de máquina**: `expo-device` + `expo-application` en móvil
  (installationId/androidId/idForVendor); UUID persistido en AsyncStorage en web.
- **Artículos**: nueva colección `articulos` enriquecida (campos de caele +
  UPC/código de barras + descuento del POS). La Orden lee de `articulos`.
- **Ventas**: reusar la colección `ordenes` existente, añadiéndole método de
  pago y montos. El dashboard ya agrega `ordenes`.
- **IVA**: 16% incluido en el precio (subtotal = total / 1.16), como el origen.
- Multi-tenant: `uid` = pyme (regla firestore existente `request.auth.uid == pymeId`).

## Modelo de datos (Firestore, bajo `pymes/{uid}/`)

### `articulos/{id}`
`nombre, descripcion, precio (IVA incluido), descuento (%), categoriaId,
imagen, stock, codigoBarras/upc, unidadVenta, activo, fechaRegistro`

### `terminales/{machineId}`
`nombreEquipo, tipoMaquina ('punto_de_venta'|'administrativo'),
device { machineId, modelo, marca, so, installationId },
usuarioRegistro { uid, email }, activa, fechaRegistro,
logSesion { [sessionId]: { fechaInicio, activa } }, ultimaSesion`

`machineId` = installationId (móvil) o UUID en AsyncStorage `@device_id` (web).

### `ordenes/{id}` (extiende la actual)
Conserva `items[], subtotal, impuestos (16% incl.), total, estado, mesaId,
timestamps`. Se añade:
`metodoPago ('efectivo'|'tarjeta'|'transferencia'|'pendiente'), montoRecibido,
cambio, terminalId, corteId, codigoVenta (ORD001…)`

### `cortes/{id}` — eje de caja (por terminal + usuario + día)
`usuarioId, terminalId, fechaInicio, fechaCierre?, efectivoInicial (fondo caja),
totales { efectivo, tarjeta, transferencia, pendiente, ventas, retiros },
ventas[], retiros[{ id, monto, motivo, fecha }],
estatus ('Activo'|'Cerrado'|'Pendiente'),
efectivoEsperado, efectivoFinal, diferencia, observaciones`

- Retiros embebidos en el corte activo (sin colección aparte).
- Estado de cajón = vista de solo-lectura sobre el corte activo.

## Arquitectura de servicios/hooks

Patrón caele: tipos → servicio → hook → pantalla → registro en drawer.

- `src/utils/deviceInfo.ts` (nuevo): `getDeviceId()`, `getDeviceInfo()`.
- `src/services/terminales.ts`: `registrarTerminal`, `verificarTerminal`,
  `abrirSesion`, `cerrarSesion`.
- `src/services/cortes.ts`: `obtenerOCrearCorteActivo`, `agregarVentaAlCorte`,
  `registrarRetiro`, `cerrarCorte`, `subscribeCorteActivo`.
- `src/services/ordenes.ts` (extender): `pagarOrden(PaymentData)` escribe la
  orden y acumula en el corte; `calcularTotales` con IVA 16% incluido.
- `src/hooks/useTerminal.ts`, `src/hooks/useCorteActivo.ts`.
- `TerminalProvider` ligero para exponer terminal + corte activos.

### Flujo de arranque (expo-router)
`app/index.tsx` (gate auth) → si POS y terminal no registrado →
`/administration/registro-equipo` → registrado → `/(drawer)/dashboard`.
Sin Electron: si falta terminal, se muestra el registro (no se cierra la app).

## Pantallas

1. `app/administration/registro-equipo.tsx` (nueva) — form + device info detectada.
2. Catálogo → Artículos — conectar CRUD (hoy stub) con modal de alta/edición
   escribiendo a `articulos`.
3. `app/(drawer)/orden.tsx` (modificar) — lee `articulos`; búsqueda por UPC;
   `ModalPago` (método, monto recibido, cambio); al pagar registra orden +
   acumula corte + ticket; botón Retiro parcial (`ModalRetiroParcial`).
4. `app/(drawer)/estado-cajon.tsx` (nueva) — vista del corte activo; gate PIN
   supervisor (constante configurable, default `1234` para demo — marcar).
5. `app/(drawer)/corte-final.tsx` (nueva) — cierre esperado vs real + diferencia
   + comprobante.

Drawer: añadir Estado de cajón y Corte final; Retiro desde Orden. Visibles según
`tipoMaquina === 'punto_de_venta'`.

## Guion de la demo
1. Registrar terminal (primera vez).
2. Abrir corte con fondo de caja inicial.
3. Registrar 2–3 artículos en Catálogo.
4. Ventas en Orden (efectivo/tarjeta) → se acumulan al corte.
5. Retiro parcial con motivo.
6. Estado de cajón (saldo esperado).
7. Corte final (esperado vs real + diferencia).

## Notas / deuda técnica a vigilar
- PIN supervisor de Estado de cajón: hardcodeado en origen (`1234`). Aquí queda
  como constante marcada; mover a config/pyme fuera de la demo.
- No portar: Redux (`features/`), dependencias de Electron, `TableProductos` con
  datos MOCK del origen.
