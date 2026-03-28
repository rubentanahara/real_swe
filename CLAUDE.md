# CLAUDE.md — Expo React Native Project

> This file provides Claude (and any AI coding assistant) with the architectural guidelines, conventions,
> and constraints for this Expo React Native codebase. Read this before making any changes.

---

## 1. Project Overview

- **Framework**: Expo SDK (managed workflow) + **EAS** for builds, updates, and submissions
- **Runtime & Package Manager**: Bun — use `bun` for all installs, scripts, and running tasks
- **Language**: TypeScript (strict mode — no `any`, no implicit types)
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- **State Management**: Zustand (global UI state) + React Query (server/Supabase state)
- **Styling**: StyleSheet API + custom design tokens (no inline styles in JSX)
- **Testing**: Bun test runner (`bun test`) + React Native Testing Library
- **CI/CD**: EAS Build + EAS Update (OTA) + EAS Submit

---

## 2. Architecture

### Layer Structure

```
src/
├── app/                    # Expo Router screens (presentation only)
│   ├── (auth)/
│   ├── (tabs)/
│   └── _layout.tsx
├── components/             # Shared UI components (dumb/pure)
│   ├── ui/                 # Primitives: Button, Text, Input, etc.
│   └── shared/             # Composed components reused across features
├── features/               # Vertical slices — one folder per domain feature
│   └── [feature]/
│       ├── components/     # Feature-specific components
│       ├── hooks/          # Feature-specific hooks
│       ├── store/          # Zustand slice
│       ├── api/            # React Query hooks + Supabase queries
│       ├── types.ts
│       └── index.ts        # Public API — only export what consumers need
├── hooks/                  # Global reusable hooks
├── services/               # External service clients (push, analytics, etc.)
│   └── supabase/           # Supabase client + typed helpers
│       ├── client.ts       # Single initialized SupabaseClient
│       ├── auth.ts         # Auth helpers (signIn, signOut, getSession)
│       ├── storage.ts      # Storage bucket helpers
│       └── types.ts        # Generated DB types (via supabase gen types)
├── stores/                 # Global Zustand stores
├── lib/                    # Pure utilities (no React dependencies)
├── constants/              # Colors, spacing, typography tokens
└── types/                  # Global TypeScript types and interfaces
```

```
supabase/                   # Supabase project config (project root, not src/)
├── migrations/             # SQL migration files — never edit manually
├── functions/              # Edge Functions (Deno)
│   └── [function-name]/
│       └── index.ts
├── seed.sql                # Local dev seed data
└── config.toml             # Supabase CLI config
```

### Dependency Rule

```
app → features → components/ui → lib/constants/types
```

- **Screens** (`app/`) are thin orchestrators — no business logic.
- **Features** own their domain logic, API calls, and local state.
- **Components** (`ui/`, `shared/`) are stateless or UI-only — no API calls.
- **`lib/`** has zero React dependencies — pure functions only.

---

## 3. TypeScript Standards

```typescript
// ✅ Always type component props explicitly
interface UserCardProps {
  userId: string
  onPress: (id: string) => void
  isLoading?: boolean
}

// ✅ Use discriminated unions for state modeling
type AuthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  | { status: 'error'; message: string }

// ❌ Never use `any` — use `unknown` and narrow it
// ❌ Never suppress with `// @ts-ignore` — fix the actual type
// ❌ Avoid `as` casts unless absolutely necessary and commented
```

- Enable `strict: true`, `noUncheckedIndexedAccess: true` in `tsconfig.json`.
- Prefer `interface` for object shapes, `type` for unions/intersections.
- Export types from `types.ts` in each feature; don't scatter them.

---

## 4. Component Guidelines

### Rules

1. **One component per file.** Filename matches component name (PascalCase).
2. **Components are pure by default.** Side effects belong in hooks.
3. **No business logic in JSX.** Extract to a custom hook if the component has more than ~2 `useState` calls.
4. **No inline styles** in JSX — use `StyleSheet.create` or design tokens.
5. **Always memoize expensive list items** with `React.memo`.

```typescript
// ✅ Good component structure
const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
  const styles = useStyles(); // dynamic styles from theme
  return (
    <Pressable style={styles.container} onPress={() => onPress(trip.id)}>
      <Text style={styles.title}>{trip.origin}</Text>
    </Pressable>
  );
};

export default React.memo(TripCard);
```

### Component Hierarchy

```
ui/Button        → No dependencies, zero business logic
shared/UserAvatar → May use hooks, no API calls
features/X/components/XCard → May use feature hooks and API
app/(tabs)/home  → Composes everything, thin as possible
```

---

## 5. Hooks Guidelines

- Custom hook names always start with `use`.
- Hooks encapsulate a single concern.
- Prefer composing small hooks over one massive `useScreen` hook.
- **Never call hooks conditionally.**

```typescript
// ✅ Focused, composable hooks
function useTrips() {
  return useQuery({ queryKey: ['trips'], queryFn: fetchTrips })
}

function useTripActions(tripId: string) {
  const queryClient = useQueryClient()
  const cancel = useMutation({
    mutationFn: () => cancelTrip(tripId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })
  return { cancel }
}
```

---

## 6. State Management

### Server State → React Query

Use React Query for **all** remote data. Do not store API responses in Zustand.

```typescript
// features/trips/api/useTrips.ts
export function useTrips() {
  return useQuery<Trip[], ApiError>({
    queryKey: tripKeys.all,
    queryFn: tripsApi.getAll,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

### Client/Global State → Zustand

Use Zustand for **UI state and session data** that is not server-derived.

```typescript
// stores/useAuthStore.ts
interface AuthStore {
  token: string | null
  setToken: (token: string) => void
  clear: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clear: () => set({ token: null }),
    }),
    { name: 'auth-store', storage: createJSONStorage(() => SecureStore) },
  ),
)
```

### Local State → `useState` / `useReducer`

- Form state, toggles, local UI → `useState`.
- Complex local state with multiple sub-values → `useReducer`.
- Never lift state higher than necessary.

---

## 7. Navigation (Expo Router)

- Use **file-based routing** exclusively — no manual `NavigationContainer`.
- Screens live in `app/`; they are thin wrappers around feature components.
- Use **typed routes** (`expo-router`'s `href` typing) — no magic strings.
- Auth guards go in `app/(auth)/_layout.tsx` using `<Redirect>`.

```typescript
// ✅ Typed navigation
import { Link } from 'expo-router';
<Link href="/trips/[id]" params={{ id: trip.id }}>View</Link>

// ✅ Programmatic navigation
import { router } from 'expo-router';
router.push('/trips/123');
```

---

## 8. Styling & Design Tokens

All design values live in `constants/`. Never hardcode colors, spacing, or font sizes.

```typescript
// constants/tokens.ts
export const Colors = {
  primary: '#0057FF',
  background: '#F9FAFB',
  text: { primary: '#111827', secondary: '#6B7280' },
  error: '#EF4444',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
} as const
```

```typescript
// ✅ Always use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
});

// ❌ Never do this
<View style={{ padding: 16, backgroundColor: '#F9FAFB' }} />
```

---

## 9. Performance

| Rule                                          | Detail                                          |
| --------------------------------------------- | ----------------------------------------------- |
| **FlatList over ScrollView**                  | For any list with unknown/dynamic length        |
| **`keyExtractor` always**                     | Use stable unique IDs, never array index        |
| **`React.memo` on list items**                | Prevents re-render on parent state change       |
| **`useCallback` on handlers passed as props** | Stabilize references                            |
| **`useMemo` only when expensive**             | Don't memoize cheap computations                |
| **Lazy load heavy screens**                   | Use `React.lazy` + `Suspense` where possible    |
| **Image optimization**                        | Use `expo-image` over `Image` from React Native |

```typescript
// ✅ Optimized list
<FlatList
  data={trips}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <TripCard trip={item} onPress={handlePress} />}
  removeClippedSubviews
  initialNumToRender={10}
  windowSize={5}
/>
```

---

## 10. Error Handling

- **API errors**: Return typed error objects from React Query; display in UI with `error.message`.
- **Boundaries**: Wrap each major screen in an `ErrorBoundary`.
- **Never swallow errors silently** — always log or surface.
- **User-facing errors**: Show friendly messages; log technical details to the error service.

```typescript
// ✅ Typed API error handling
async function fetchTrip(id: string): Promise<Trip> {
  const res = await api.get(`/trips/${id}`)
  if (!res.ok) {
    throw new ApiError(res.status, await res.json())
  }
  return res.json()
}
```

---

## 11. Security

- **Never store sensitive data in AsyncStorage** — use `expo-secure-store`.
- **Never commit secrets** — use `app.config.ts` + EAS Secrets for all credentials.
- **Validate all external input** before use (deep links, push notification payloads).
- **Sanitize deep link parameters** — treat them as untrusted user input.

### Supabase-Specific Security

```typescript
// ✅ Store Supabase session via the official client — never persist tokens manually
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter, // backed by expo-secure-store
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // required for React Native
  },
})

// ❌ Never store the session JWT yourself
await AsyncStorage.setItem('session', JSON.stringify(session))
```

- **Always use Row Level Security (RLS)** on every Supabase table — no exceptions.
- **Never use the `service_role` key in the mobile app** — it bypasses RLS entirely.
- Only the `anon` key belongs in the app; `service_role` stays server-side in Edge Functions.
- Verify RLS policies cover `SELECT`, `INSERT`, `UPDATE`, `DELETE` per role.
- Use **Supabase Edge Functions** for operations that require elevated privileges (webhooks, admin actions).

```sql
-- ✅ RLS policy example: users can only read their own rows
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own trips"
  ON trips FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 12. Testing

### Test Runner: Bun

This project uses **`bun test`** as the primary test runner — it is faster than Jest and requires zero
additional config for TypeScript. Do **not** add Jest or Vitest.

```jsonc
// package.json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
  },
}
```

### Strategy

```
Unit Tests     → lib/, hooks/, stores/ (pure logic)        bun test
Component Tests → components/ui/, components/shared/        bun test
Integration    → features/ hooks + API mocks               bun test
E2E            → Critical user journeys                    Maestro
```

### Rules

- Each component must have a test file `*.test.tsx` alongside it.
- Use **`bun:test`** imports — not `@jest/globals`.
- Mock network calls with `msw` (Mock Service Worker) — compatible with Bun's fetch.
- Test **behavior**, not implementation — interact via accessible queries.
- Minimum coverage targets: **80% for `lib/`**, **70% for `features/`**.

```typescript
// ✅ Bun test syntax — no Jest import needed
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { render, screen } from '@testing-library/react-native';

describe('TripCard', () => {
  it('calls onPress with the trip id', async () => {
    const onPress = mock();
    render(<TripCard trip={mockTrip} onPress={onPress} />);
    await userEvent.press(screen.getByText(mockTrip.origin));
    expect(onPress).toHaveBeenCalledWith(mockTrip.id);
  });
});
```

```typescript
// ✅ Mocking modules with Bun
import { mock } from 'bun:test'

mock.module('../services/tripsApi', () => ({
  fetchTrips: mock(() => Promise.resolve([])),
}))
```

> **Note**: Bun's test runner is Jest-compatible for most matchers (`expect`, `describe`, `it`,
> `beforeEach`, etc.) so existing patterns translate directly. Prefer `bun:test` named imports
> over the Jest global shim.

---

## 13. Git & Code Quality

### Commit Convention (Conventional Commits)

```
feat(trips): add cancel trip confirmation dialog
fix(auth): resolve token refresh race condition
refactor(ui): extract Button variants into separate files
chore(deps): upgrade expo-router to 3.5.0
```

### Pre-commit Checklist (enforced by Husky + lint-staged)

- [ ] `bun run lint` passes
- [ ] `bun run typecheck` passes (no TypeScript errors)
- [ ] `bun test` passes on affected files
- [ ] No `console.log` left in production code
- [ ] No hardcoded strings — use i18n keys or constants

> Configure lint-staged to use `bun run lint --fix` and `bun test --bail` — not `npx` variants.

### Branch Strategy

```
main          → production-ready, protected
develop       → integration branch
feature/*     → new features
fix/*         → bug fixes
chore/*       → maintenance, dependencies
```

---

## 13.5. Bun-Specific Configuration

### `bunfig.toml` (project root)

```toml
[install]
# Lock to exact versions for reproducible installs
exact = true

[test]
# Map Jest globals so existing test patterns work seamlessly
preload = ["./test/setup.ts"]
```

### `test/setup.ts`

```typescript
// Global test setup — runs before every test file
import '@testing-library/react-native/extend-expect'
// Add any global mocks here (e.g., expo-secure-store, expo-router)
```

### Lockfile

- **Always commit `bun.lockb`** — it is the single source of truth for dependency versions.
- Never delete `bun.lockb` and re-run install without a documented reason in the PR.
- CI must run `bun install --frozen-lockfile` to catch lockfile drift.

---

## 14. Supabase

### Client Setup

There is **one** Supabase client in the entire app. Import it from `services/supabase/client.ts` — never call `createClient` elsewhere.

```typescript
// services/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import { ExpoSecureStoreAdapter } from './secureStoreAdapter'
import type { Database } from './types' // generated — see below

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Database Types (always use generated types)

```bash
# Regenerate after every schema migration
bun run supabase gen types typescript --project-id <project-id> \
  --schema public > src/services/supabase/types.ts
```

- **Always pass `Database` as the generic** to `createClient<Database>` — this gives full type safety on every query.
- Commit the generated `types.ts` — never hand-edit it.
- Add `bun run db:types` as a script and run it after every migration.

### Querying with React Query

Wrap **all** Supabase queries in React Query — never call `supabase` directly in components.

```typescript
// features/trips/api/useTrips.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/services/supabase/client'
import type { Trip } from '../types'

export const tripKeys = {
  all: ['trips'] as const,
  byId: (id: string) => ['trips', id] as const,
}

export function useTrips() {
  return useQuery<Trip[], Error>({
    queryKey: tripKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data
    },
    staleTime: 1000 * 60 * 2,
  })
}
```

```typescript
// ✅ Mutation with cache invalidation
export function useCreateTrip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: NewTrip) => {
      const { data, error } = await supabase.from('trips').insert(payload).select().single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripKeys.all }),
  })
}
```

### Authentication

```typescript
// services/supabase/auth.ts
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}
```

Auth state is observed globally — do not poll for session. Use the listener:

```typescript
// hooks/useAuthListener.ts
export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      session?.user ? setUser(session.user) : clear()
    })
    return () => subscription.unsubscribe()
  }, [])
}
```

### Realtime

Use Supabase Realtime only when live updates are a product requirement, not by default.

```typescript
// ✅ Subscribe and always clean up
useEffect(() => {
  const channel = supabase
    .channel('trips-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.all })
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### Storage

```typescript
// services/supabase/storage.ts
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `avatars/${userId}/${Date.now()}`
  const { error } = await supabase.storage.from('avatars').upload(path, file)
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
```

### Edge Functions

Edge Functions live in `supabase/functions/`. Each function is a separate Deno module.

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // service role is only safe here
  )
  // ...
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
```

### Migrations

```bash
bun run supabase migration new <migration-name>   # Create new migration
bun run supabase db push                          # Push to remote
bun run supabase db reset                         # Reset local DB + re-run all migrations
```

- **Never edit existing migration files** — always create a new one.
- Migration files are append-only historical records.
- Always test migrations locally (`supabase db reset`) before pushing to remote.

---

## 15. EAS (Expo Application Services)

### Profiles (`eas.json`)

```jsonc
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" },
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "env": { "APP_ENV": "staging" },
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": { "APP_ENV": "production" },
    },
  },
  "submit": {
    "production": {
      "ios": { "appleId": "...", "ascAppId": "...", "appleTeamId": "..." },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production",
      },
    },
  },
  "update": {
    "channel": "production",
  },
}
```

### Environment Variables

All secrets live in **EAS Secrets** — never in `.env` files committed to git.

```typescript
// app.config.ts — maps EAS env vars to Expo config
import { ExpoConfig } from 'expo/config'

const APP_ENV = process.env.APP_ENV ?? 'development'

const envConfig = {
  development: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_DEV!,
    appName: 'MyApp (Dev)',
    bundleId: 'com.myapp.dev',
  },
  staging: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY_STAGING!,
    appName: 'MyApp (Preview)',
    bundleId: 'com.myapp.preview',
  },
  production: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    appName: 'MyApp',
    bundleId: 'com.myapp',
  },
} as const

const config = envConfig[APP_ENV as keyof typeof envConfig]

export default (): ExpoConfig => ({
  name: config.appName,
  slug: 'myapp',
  ios: { bundleIdentifier: config.bundleId },
  android: { package: config.bundleId },
  extra: {
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
    eas: { projectId: process.env.EAS_PROJECT_ID },
  },
})
```

- All `EXPO_PUBLIC_*` vars are embedded at build time — safe for the anon key, never for service role.
- Use `Constants.expoConfig?.extra` at runtime to read values from `app.config.ts`.

### OTA Updates (EAS Update)

```bash
# Publish an OTA update (JS bundle only — no native change)
eas update --channel production --message "fix: payment crash on checkout"
eas update --channel preview --message "feat: new trip card UI"
```

- OTA updates are safe for **JS/TS changes only**.
- Any change to native modules, `app.config.ts` plugins, or `package.json` native deps **requires a full EAS build**.
- Always pin the `runtimeVersion` policy in `app.config.ts`:

```typescript
runtimeVersion: { policy: 'appVersion' },  // OTA only applies to matching app version
```

### Workflow Summary

| Action             | Command                                           |
| ------------------ | ------------------------------------------------- |
| Install dev client | `eas build --profile development --platform ios`  |
| Internal QA build  | `eas build --profile preview --platform all`      |
| Production build   | `eas build --profile production --platform all`   |
| OTA JS update      | `eas update --channel production --message "..."` |
| Submit to stores   | `eas submit --platform all --profile production`  |
| View build logs    | `eas build:list`                                  |

### CI/CD Pipeline (GitHub Actions example)

```yaml
# .github/workflows/preview.yml
on:
  push:
    branches: [develop]

jobs:
  build-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - run: bun run typecheck
      - run: bun test
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas update --channel preview --message "${{ github.event.head_commit.message }}" --non-interactive
```

- ❌ Add `// eslint-disable` or `@ts-ignore` to suppress errors
- ❌ Use `any` type anywhere in the codebase
- ❌ Place API calls directly inside components
- ❌ Use `AsyncStorage` for tokens or PII
- ❌ Add new dependencies without noting them in the PR description
- ❌ Create God components (>200 lines is a code smell — refactor)
- ❌ Use array index as `key` in lists
- ❌ Skip error boundaries on new screens
- ❌ Write business logic in `app/` screens
- ❌ Hardcode strings users see — always use i18n
- ❌ Use `npm`, `yarn`, or `npx` — **Bun only**
- ❌ Import from `@jest/globals` — use `bun:test` instead
- ❌ Add a `jest.config.*` file — Bun's test runner replaces Jest entirely
- ❌ Run `node` directly — use `bun` to execute scripts
- ❌ Call `createClient` outside `services/supabase/client.ts` — one client only
- ❌ Use the `service_role` key in the mobile app — Edge Functions only
- ❌ Create a Supabase table without enabling RLS
- ❌ Hand-edit `src/services/supabase/types.ts` — always regenerate via CLI
- ❌ Edit existing migration files — always create a new migration
- ❌ Hardcode Supabase URLs or keys in source — use `app.config.ts` + EAS Secrets
- ❌ Use EAS Update for changes involving native modules — full build required
- ❌ Commit `.env` files — secrets belong in EAS Secrets

---

## 17. Useful Commands

> All commands use **`bun`**. Never use `npm`, `yarn`, or `npx` — these are banned in this project.

```bash
# Dependencies
bun install                          # Install all dependencies
bun add <package>                    # Add a dependency
bun add -d <package>                 # Add a dev dependency
bun remove <package>                 # Remove a dependency

# Development
bun run start                        # Start Expo dev server
bun run start --clear                # Clear Metro cache
bun run ios                          # Run on iOS simulator
bun run android                      # Run on Android emulator

# Type checking
bun run typecheck                    # tsc --noEmit

# Testing
bun test                             # Run all tests
bun test --watch                     # Watch mode
bun test --coverage                  # Coverage report
bun test src/features/trips          # Run tests in a specific folder
bun test --bail                      # Stop on first failure

# Linting
bun run lint                         # Run ESLint
bun run lint --fix                   # Auto-fix lint issues

# Supabase
bun run supabase start               # Start local Supabase stack (Docker)
bun run supabase stop                # Stop local stack
bun run supabase db reset            # Reset local DB + re-run all migrations
bun run supabase migration new <name> # Create a new migration
bun run supabase db push             # Push migrations to remote
bun run db:types                     # Regenerate TypeScript types from schema

# EAS
eas build --profile development --platform ios       # Dev client build
eas build --profile preview --platform all           # Internal QA build
eas build --profile production --platform all        # Production build
eas update --channel production --message "..."      # OTA JS-only update
eas update --channel preview --message "..."         # OTA to preview channel
eas submit --platform all --profile production       # Submit to App Store + Play Store
eas build:list                                       # View recent builds
eas secret:create --name KEY --value VALUE           # Add EAS Secret
```

### `package.json` scripts convention

```jsonc
{
  "scripts": {
    "start":          "expo start",
    "ios":            "expo run:ios",
    "android":        "expo run:android",
    "lint":           "eslint src/ --ext .ts,.tsx",
    "typecheck":      "tsc --noEmit",
    "test":           "bun test",
    "test:watch":     "bun test --watch",
    "test:coverage":  "bun test --coverage",
    "db:types":       "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > src/services/supabase/types.ts",
    "supabase":       "supabase"
  }
}

---

*Keep this file up to date as the project evolves. Architectural decisions that affect these guidelines
should be captured in an ADR (`docs/adr/`) before updating this document.*
```
