# App Finanzas - MVP Personal

Proyecto base para una app movil de finanzas personales (1 usuario) con Expo + React Native.

## Como correr

```bash
npm install
npx expo start
```

Expo Router esta configurado para leer rutas desde `src/app` via `app.config.js`.

## Stack

- Expo + React Native + TypeScript
- Expo Router (en `src/app`)
- React Native Paper (solo wrappers en `src/ui/components`)
- SQLite con `expo-sqlite`
- AsyncStorage para settings/PIN
- Zustand para estado
- React Hook Form + Zod para formularios
- date-fns para fechas
- Drawer (expo-router/drawer) con react-native-gesture-handler y react-native-reanimated
  - Requiere `babel.config.js` con el plugin `react-native-reanimated/plugin`.

## Fechas

- Formato UI centralizado en `src/lib/date.ts` (DD-MM-AAAA).
- Los formularios de movimientos y metas guardan fechas en ISO (YYYY-MM-DD) y usan calendario.

## Estructura de carpetas

```
src/
  app/                 (expo-router)
  domain/
    models/
    calculations/
    rules/
    validators/
  data/
    db/
    repositories/
    storage/
  state/
  ui/
    components/
    theme/
  features/
    dashboard/
    movements/
    categories/
    goals/
    budget/
    settings/
  lib/
    date.ts
    money.ts
    ids.ts
```

## PIN (bloqueo local)

- Se guarda un hash simple (no plano) en AsyncStorage.
- Si no hay PIN, aparece la pantalla "Crear PIN".
- Si existe, la app solicita el PIN antes de acceder a las tabs.
- Se puede cambiar el PIN en Ajustes (pide PIN actual).

## SQLite (persistencia real)

- Inicializa en `src/data/db/sqlite.ts` al abrir la app.
- Crea tablas `categories`, `movements`, `goals`.
- Seed automatico en primer inicio: Comida, Transporte, Salidas.

## Navegacion

- Tabs: Dashboard, Movimientos, Nuevo, Metas, Categorias.
- Drawer lateral con Perfil (placeholder), acceso a Ajustes y version.

## Categorias

- CRUD con campos de tipo, color, basica/disfrute, activa, y rango opcional por mes (YYYY-MM).
- El selector de categorias en "Nuevo movimiento" filtra por visibilidad mensual.

## UI premium-ready

- Las pantallas solo importan desde `src/ui/components`.
- Los wrappers encapsulan Paper para permitir reemplazo futuro sin refactor masivo.

## Roadmap MVP -> PRO

- Presupuestos y reglas avanzadas
- Categorias y metodos de pago configurables
- Sincronizacion (multi-dispositivo)
- Reportes visuales y exportacion
