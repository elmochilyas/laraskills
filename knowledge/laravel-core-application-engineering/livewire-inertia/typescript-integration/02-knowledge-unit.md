# Inertia TypeScript Integration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia TypeScript Integration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Inertia TypeScript integration bridges the server-side PHP prop definitions with client-side JavaScript via shared type definitions. The server defines the shape of props (via PHP controllers), and the client consumes them as typed interfaces. The bridge is manual (types are duplicated between PHP and TypeScript), but tooling like `laravel-ide-helper` and custom code generation can automate the mapping.

The engineering value is type safety across the full-stack boundary — catching prop mismatch errors at compile time instead of runtime, and enabling IDE autocompletion for Inertia page props, shared data, and form objects.

---

## Core Concepts

### Page Prop Types

Define interfaces that mirror the server's prop structure:

```typescript
// types/index.d.ts
export interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    created_at: string;
}

export interface PageProps {
    auth: {
        user: User;
    };
}
```

### Using Inertia Types

```tsx
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { User } from '@/types';

// Extend Inertia's PageProps with your app-specific props
declare module '@inertiajs/core' {
    interface PageProps extends InertiaPageProps {
        auth: { user: User };
        flash?: { success?: string; error?: string };
    }
}

// In a page component
import { usePage } from '@inertiajs/react';

function Profile() {
    const { props } = usePage<{ user: User }>();
    return <h1>{props.user.name}</h1>;
}
```

### Shared Data Types

```typescript
// types/shared.d.ts
export interface SharedProps {
    appName: string;
    locale: string;
    auth: { user: User | null };
}
```

---

## Mental Models

### The Type Contract

Think of the type interface as a contract between PHP and TypeScript. The PHP controller promises to send props of shape X. The TypeScript component expects to receive props of shape X. When either side changes the contract, TypeScript fails to compile — catching the mismatch before it reaches production.

### The Duplication Boundary

Types exist in two places: PHP docblocks/validation rules and TypeScript interfaces. They must stay in sync. The duplication is the cost of the cross-language boundary. Automate it where possible, document it where not.

---

## Internal Mechanics

### Inertia's Type System

Inertia core provides:

- `PageProps` — base interface extended by your app
- `usePage<PageProps>()` — generic hook returning typed props
- `InertiaForm` — generic form type (`InertiaForm<T>`)
- `router` methods accept typed options

```typescript
import { router } from '@inertiajs/react';

router.visit('/users', {
    onSuccess: (page) => {
        // page.props is typed via the generic
    },
});
```

### Module Augmentation

The standard pattern is module augmentation to inject app-wide types:

```typescript
// resources/js/types/inertia.d.ts
import { User } from '@/types';

declare module '@inertiajs/core' {
    interface PageProps {
        auth: { user: User };
        flash?: { success?: string; error?: string };
        errors?: Record<string, string>;
    }
}
```

This makes `usePage().props.auth` typed without explicit generics on every component.

### Form Type Safety

```typescript
import { useForm } from '@inertiajs/react';

interface CreateUserForm {
    name: string;
    email: string;
    password: string;
    role_id: number;
}

function CreateUser() {
    const { data, setData, post, processing, errors } = useForm<CreateUserForm>({
        name: '',
        email: '',
        password: '',
        role_id: 0,
    });
    // data.name is string, data.role_id is number — fully typed
}
```

---

## Patterns

### Code Generation from PHP

Generate TypeScript types from PHP models/requests using `spatie/typescript-translator` or `laravel-ide-helper`:

```bash
php artisan typescript:generate
```

Example config:

```php
// config/typescript-translator.php
return [
    'paths' => [
        app_path('Models'),
        app_path('Data'),
    ],
    'output' => resource_path('js/types/generated'),
];
```

### Shared Type Definitions File

```typescript
// resources/js/types/index.ts
export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    email_verified_at: string | null;
    roles: Role[];
}

export interface Role {
    id: number;
    name: 'admin' | 'editor' | 'viewer';
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}
```

### Page Component with Generics

```tsx
// resources/js/Pages/Users/Index.tsx
import { User, PaginatedResponse } from '@/types';
import Layout from '@/Layouts/Authenticated';

interface Props {
    users: PaginatedResponse<User>;
    filters: { search?: string; role?: string };
}

export default function Index({ users, filters }: Props) {
    return <UserTable users={users} filters={filters} />;
}

Index.layout = (page: React.ReactNode) => <Layout children={page} />;
```

### Prop Validation with Zod

```typescript
import { z } from 'zod';

const UserPropsSchema = z.object({
    id: z.number(),
    name: z.string().min(1),
    email: z.string().email(),
});

export default function Profile({ user }: { user: unknown }) {
    const parsed = UserPropsSchema.safeParse(user);
    if (!parsed.success) return <ErrorState />;
    // parsed.data is typed and validated
}
```

---

## Architectural Decisions

### Module Augmentation vs Explicit Generics

| Concern | Module Augmentation | Explicit Generics |
|---|---|---|
| Boilerplate | Once (global declaration) | Every component |
| Type safety | Global (risk of stale types) | Per-component (precise) |
| IDE support | Excellent | Excellent |
| Maintenance | Update one file | Update all components |

Use module augmentation for app-wide shared props (auth, flash, errors). Use explicit generics per page for page-specific props.

### Generated vs Manual Types

| Concern | Generated | Manual |
|---|---|---|
| Accuracy | Matches PHP exactly | May drift |
| Maintenance | Auto-updated | Requires manual sync |
| Setup | Requires package + config | Zero setup |
| Flexibility | Limited by generator | Full control |

Prefer generated types for models and DTOs. Write manual types for page-specific view models and composed props.

---

## Tradeoffs

| Concern | TypeScript Integration | Plain JavaScript |
|---|---|---|
| Compile-time safety | Catches prop mismatches | Runtime errors only |
| Developer velocity | Slower initial setup | Faster prototyping |
| Refactoring | Confidence (compiler guards) | Risk of silent breakage |
| Bundle size | Unchanged (types compile away) | Unchanged |
| Learning curve | Requires TS knowledge | Lower barrier |

---

## Performance Considerations

TypeScript types are compile-time only. There is zero runtime performance impact. The type information is stripped during the Vite/Webpack build. Module augmentation files (`*.d.ts`) are not included in the bundle.

---

## Production Considerations

- Maintain a single `resources/js/types/` directory for all shared types
- Keep generated and manual types in separate files (`generated/` vs `app/`)
- Run type generation as a pre-build step or git hook
- Use `strict: true` in `tsconfig.json` for maximum type safety
- Export shared types from a barrel file (`types/index.ts`)
- Type form data with the full form interface — not just `Record<string, string>`
- Avoid `any` in type declarations — it defeats the purpose of TypeScript integration
- Consider `zod` runtime validation for critical data (API responses, user input)

---

## Common Mistakes

### Missing Module Augmentation

```typescript
// Bad — accessing auth without augmentation
const { auth } = usePage().props; // auth is 'any'

// Good — augmentation makes it typed
const { auth } = usePage().props; // auth is { user: User }
```

### Outdated Generated Types

Generated types that run only once and never update cause silent mismatches. The PHP model adds a field, the generated type lacks it, TypeScript compiles fine because it trusts the generated file. Run generation on every deploy.

### Inline Type Duplication

```typescript
// Bad — duplicated in every component
const { data, setData } = useForm<{ name: string; email: string }>(...);

// Good — shared type
interface CreateUserForm { name: string; email: string; }
const { data, setData } = useForm<CreateUserForm>(...);
```

### Overly Broad Types

```typescript
// Bad — loose types
interface PageProps {
    [key: string]: unknown;
}

// Good — explicit shape
interface PageProps {
    auth: AuthData;
    errors: Record<string, string>;
    flash?: FlashData;
}
```

---

## Failure Modes

### Type Mismatch Between PHP and TypeScript

PHP adds a required key, TypeScript hasn't been updated. The component doesn't receive the key, but TypeScript assumes it exists. Result: the prop is `undefined` at runtime but typed as the expected type. This is the primary failure mode — mitigated by code generation and runtime validation.

### Breaking Change in Inertia Core Types

When upgrading Inertia, core type definitions may change (e.g., `PageProps` base interface gains new fields). Module augmentation may conflict with the new types. Review the upgrade guide's type changes and update declarations accordingly.

---

## Ecosystem Usage

TypeScript integration in Inertia leverages the TypeScript compiler, Vite, and module augmentation patterns. Ecosystem tools like `spatie/typescript-translator` and `laravel-ide-helper` can generate TypeScript types from PHP code. Zod provides runtime validation alongside compile-time types.

## Related Knowledge Units

- **Server Props** (this workspace) — the prop shape being typed
- **Shared Data** (this workspace) — typing shared props
- **Form Handling** (this workspace) — typed form interfaces
- **Page Components** (this workspace) — where types are consumed
- **API Resources** (this workspace) — response transformation types

---

## Research Notes

- Inertia v3 provides full TypeScript support
- Module augmentation is the idiomatic pattern for shared props
- `@inertiajs/core` exports `PageProps`, `Errors`, `FormDataConvertable`, and other types
- Each adapter package (`@inertiajs/react`, `@inertiajs/vue3`) re-exports core types
- `useForm<T>()` is generically typed — pass the form data interface
- `router.visit()` / `router.post()` options callbacks receive typed page responses
- Code generation is not built into Inertia core — it's ecosystem tooling
