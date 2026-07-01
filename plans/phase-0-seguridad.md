# Fase 0 — Seguridad y fundamentos

> **Criticidad: 🔴 máxima.** Es la primera fase y bloquea a todas las demás. Cierra vulnerabilidades reales y reordena la base técnica (Firebase fuera de `app/`, config por entorno, contexto de auth) sobre la que se construyen las fases 1–5.

---

## 1. Objetivo

1. Eliminar el almacenamiento de **contraseñas en texto plano**.
2. Corregir el **orden de registro** (persistir antes de navegar).
3. Sacar la **configuración de Firebase** de `app/` y moverla a `src/lib/firebase.ts` (elimina el hack de "ruta dummy").
4. Mover **secretos/config a variables de entorno** vía `app.json > extra` + `expo-constants`, incluidos los **Client IDs de Google OAuth**.
5. Añadir **reglas de seguridad de Firestore** con aislamiento por PYME.
6. Introducir un **`AuthContext`** centralizado.
7. Renombrar `firebase/*.tsx` → `.ts` (no contienen JSX).

## 2. Depende de / Habilita

- **Depende de:** nada. Es el punto de partida.
- **Habilita:**
  - `AuthContext` → consumido por `app/index.tsx`, drawer y `PymeContext` (Fase 2).
  - `src/lib/firebase.ts` → import único para servicios de datos (Fase 2) y auth.
  - Reglas Firestore → base ampliada en Fase 2 con subcolecciones.

## 3. Alcance

**Incluye:** seguridad de credenciales, reubicación de Firebase, contexto de auth, reglas Firestore base, config por entorno.

**No incluye:** rediseño visual (Fase 1), reemplazo de mocks/CRUD (Fase 2). El flujo de "olvidé mi contraseña" se documenta aquí pero se implementa en Fase 4.

## 4. Archivos afectados

### Crear
- `src/lib/firebase.ts` — init de Firebase (migrado desde `app/config/firebase.ts`, sin el `export default` dummy).
- `src/context/AuthContext.tsx` — provider + `useAuth()`.
- `firestore.rules` — reglas de seguridad (en la raíz del repo).
- `.env.example` — plantilla de variables (documentación; los valores reales van a `app.json > extra` o `.env`).

### Modificar
- `app/administration/register.tsx` — quitar `password` del payload, reordenar `await`/navegación.
- `app/administration/login.tsx` — leer Client IDs desde `expo-constants`; ocultar botón Google si no hay config.
- `app/config/firebase.ts` — **eliminar** tras migrar (ver abajo) y dejar re-export temporal opcional.
- `app.json` — añadir bloque `extra` con la config de Firebase y Google.
- `app/index.tsx` — usar `useAuth()` en lugar del `onAuthStateChanged` inline.
- `app/_layout.tsx` — envolver el árbol en `<AuthProvider>`.
- `firebase/FirestoreAdministracion.tsx` → `.ts`; corregir `registrarPyme` para no aceptar/guardar `password`.
- `firebase/FirestoreUsuarios.tsx` → `.ts`.
- `firebase/FirestoreRestaurante.tsx` → `.ts` (migración completa a `src/data/mesas.ts` ocurre en Fase 2).
- Todos los imports `../config/firebase` / `@/app/config/firebase` → `@/src/lib/firebase`.

### Eliminar (al final de la fase)
- `app/config/firebase.ts` (una vez migrados los imports).

## 5. Pasos detallados

### Paso 5.1 — Quitar contraseña en texto plano 🔴

En <ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\administration\register.tsx" lines="45-54" /> el payload incluye `password: password.trim()`. Firebase Auth ya custodia la credencial; **nunca** debe copiarse a Firestore.

**Antes:**
```ts
await FirestoreAdministracion.registrarPyme({
  id: cred.user.uid,
  nombre: name.trim(),
  email: email.trim(),
  fechaRegistro: new Date(),
  password: password.trim(),   // ❌ eliminar
  celular: celular.trim(),
  nombreNegocio: businessName.trim(),
  isAdmin: true,
});
```

**Después:**
```ts
await FirestoreAdministracion.registrarPyme({
  id: cred.user.uid,
  nombre: name.trim(),
  email: email.trim(),
  fechaRegistro: new Date(),
  celular: celular.trim(),
  nombreNegocio: businessName.trim(),
  isAdmin: true,
});
```

Además, endurecer `registrarPyme` para que **descarte** `password` aunque llegue:
```ts
async registrarPyme(data: PymeInput) {
  const { id, password, ...values } = data as any; // password se ignora explícitamente
  const ref = doc(firestore, 'pymes', id);
  await setDoc(ref, values, { merge: true });
}
```

**Migración de datos existentes:** ejecutar una limpieza única para borrar el campo `password` de documentos ya creados (script puntual o consola de Firebase). Documentar en la sección de riesgos.

### Paso 5.2 — Orden correcto de registro 🔴

Hoy se llama `router.replace('/(drawer)/dashboard')` **antes** de `registrarPyme`, así que si Firestore falla el usuario ya salió y el doc de la PYME queda sin crear.

**Después (persistir → luego navegar):**
```ts
setLoading(true);
try {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });

  await FirestoreAdministracion.registrarPyme({
    id: cred.user.uid,
    nombre: name.trim(),
    email: email.trim(),
    fechaRegistro: new Date(),
    celular: celular.trim(),
    nombreNegocio: businessName.trim(),
    isAdmin: true,
  });

  router.replace('/(drawer)/dashboard'); // ✅ solo si todo lo anterior tuvo éxito
} catch (e: any) {
  setError(mapAuthError(e)); // mensaje amigable (ver Fase 4)
} finally {
  setLoading(false);
}
```

### Paso 5.3 — Mover Firebase fuera de `app/`

`app/config/firebase.ts` está dentro de `app/`, así que Expo Router intenta tratarlo como ruta; por eso existe el hack `export default function FirebaseConfigRoute() { return null; }` (<ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\config\firebase.ts" lines="46-49" />).

1. Crear `src/lib/firebase.ts` con el **mismo contenido** salvo:
   - Quitar `export default FirebaseConfigRoute`.
   - Leer `firebaseConfig` desde `expo-constants` (Paso 5.4).
2. Buscar y reemplazar imports en todo el repo:
   - `../config/firebase` y `../../app/config/firebase` → `@/src/lib/firebase`.
   - Archivos afectados conocidos: `app/index.tsx`, `app/(drawer)/_layout.tsx`, `app/administration/{login,register,perfil}.tsx`, `firebase/Firestore*.tsx`.
3. Eliminar `app/config/firebase.ts` (y la carpeta `app/config/` si queda vacía).

### Paso 5.4 — Config por entorno (`expo-constants`)

Las claves web de Firebase no son "secretas" (viajan al cliente), pero deben salir del código y centralizarse; los **Client IDs de Google** sí deben parametrizarse.

**`app.json` → añadir `expo.extra`:**
```jsonc
{
  "expo": {
    // …
    "extra": {
      "firebase": {
        "apiKey": "…",
        "authDomain": "caele-app.firebaseapp.com",
        "projectId": "caele-app",
        "storageBucket": "caele-app.firebasestorage.app",
        "messagingSenderId": "54754152307",
        "appId": "…",
        "measurementId": "…"
      },
      "google": {
        "expoClientId": "",
        "iosClientId": "",
        "androidClientId": "",
        "webClientId": ""
      }
    }
  }
}
```

**`src/lib/firebase.ts`:**
```ts
import Constants from 'expo-constants';
const firebaseConfig = Constants.expoConfig?.extra?.firebase;
```

**`.env.example`** (documenta lo que hay que rellenar; opcionalmente cargado con `app.config.ts`):
```
FIREBASE_API_KEY=
FIREBASE_APP_ID=
GOOGLE_WEB_CLIENT_ID=
GOOGLE_IOS_CLIENT_ID=
GOOGLE_ANDROID_CLIENT_ID=
```

### Paso 5.5 — Google OAuth robusto

En <ref_snippet file="C:\Users\sergi\ExpoApps\caele-app\app\administration\login.tsx" lines="22-29" /> los IDs son `REPLACE_WITH_…`.

```ts
const g = Constants.expoConfig?.extra?.google ?? {};
const googleConfigured = !!(g.webClientId || g.expoClientId);

const [request, , promptAsync] = Google.useAuthRequest({
  clientId: g.expoClientId,
  iosClientId: g.iosClientId,
  androidClientId: g.androidClientId,
  webClientId: g.webClientId,
  responseType: 'id_token',
  scopes: ['openid', 'profile', 'email'],
});

// En el render: ocultar/deshabilitar el botón si !googleConfigured,
// evitando un flujo roto en móvil.
```

> **Bloqueante externo:** los valores reales los debe proporcionar el usuario desde Google Cloud Console. Hasta entonces, el botón queda oculto en móvil y en web sigue funcionando `signInWithPopup`.

### Paso 5.6 — `AuthContext`

Centraliza `onAuthStateChanged` (hoy duplicado en `app/index.tsx`).

**`src/context/AuthContext.tsx`:**
```tsx
import { onAuthStateChanged, User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/src/lib/firebase';

type AuthState = { user: User | null; initializing: boolean };
const Ctx = createContext<AuthState>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, initializing: true });
  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, initializing: false })), []);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
```

- `app/_layout.tsx`: envolver `<ThemeProvider>` con `<AuthProvider>`.
- `app/index.tsx`: reemplazar el `useEffect`/`useState` por `const { user, initializing } = useAuth();`.

### Paso 5.7 — Reglas de seguridad de Firestore

**`firestore.rules`:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /pymes/{pymeId} {
      allow read, write: if request.auth != null && request.auth.uid == pymeId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == pymeId;
      }
    }
    match /usuarios/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
- Publicación manual (consola de Firebase) o vía `firebase deploy --only firestore:rules` si se añade Firebase CLI (opcional, documentar).

### Paso 5.8 — Renombrar servicios a `.ts`

`firebase/FirestoreAdministracion.tsx`, `FirestoreUsuarios.tsx`, `FirestoreRestaurante.tsx` no tienen JSX → renombrar a `.ts`. (La migración a `src/data/` ocurre en Fase 2; aquí solo se renombra y se corrige el import de Firebase.)

## 6. Criterios de aceptación

- [ ] Ningún documento de Firestore contiene el campo `password` (nuevos y migrados).
- [ ] El registro solo navega al dashboard tras crear usuario **y** doc de PYME; si falla, muestra error y no navega.
- [ ] No existe `app/config/firebase.ts`; todos los imports apuntan a `@/src/lib/firebase`.
- [ ] La app arranca sin la "ruta fantasma" de config.
- [ ] `firebaseConfig` y Google IDs se leen de `expo-constants`.
- [ ] Botón de Google oculto/deshabilitado en móvil si no hay Client IDs.
- [ ] `AuthProvider` envuelve la app y `app/index.tsx` usa `useAuth()`.
- [ ] `firestore.rules` publicado; un usuario no puede leer datos de otra PYME.
- [ ] Servicios Firestore con extensión `.ts`.

## 7. Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo start --web
```
Pruebas manuales:
1. Registrar una PYME nueva → verificar en consola de Firebase que **no** hay `password`.
2. Forzar un error de Firestore (regla temporal) → el registro no debe navegar.
3. Cerrar y reabrir la app → la sesión persiste (AsyncStorage en nativo / localStorage en web).
4. Intentar (con reglas) leer `pymes/{otroUid}` → denegado.

## 8. Riesgos y decisiones abiertas

- **Datos legacy con `password`:** requiere limpieza única. Confirmar si hay usuarios reales en producción antes de purgar.
- **Google OAuth:** pendiente de Client IDs del usuario (bloqueante parcial).
- **`app.config.ts` vs `app.json`:** si se quiere cargar `.env` de verdad, conviene migrar `app.json` → `app.config.ts`. Decisión: empezar con `extra` en `app.json` (simple) y migrar a `app.config.ts` solo si se necesitan `.env` por ambiente.
- **Firebase CLI:** opcional para desplegar reglas; si no se añade, se publican a mano.
