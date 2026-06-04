# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia TypeScript Integration |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Inertia TypeScript integration bridges server-side PHP prop definitions with client-side JavaScript via shared type definitions. The server defines the shape of props (via PHP controllers), and the client consumes them as typed interfaces. The bridge is manual (types are duplicated between PHP and TypeScript), but tooling like `spatie/typescript-translator` and `laravel-ide-helper` can automate the mapping. The engineering value is type safety across the full-stack boundary — catching prop mismatch errors at compile time instead of runtime, and enabling IDE autocompletion for page props, shared data, and form objects.

---

## Core Concepts

- **Module augmentation**: Extending Inertia's `PageProps` interface via `declare module '@inertiajs/core'` to inject app-wide types
- **`usePage<PageProps>()`**: Generic hook returning typed props — types flow from server through to the component
- **`useForm<T>()`**: Generic form hook — pass the form data interface for type-safe form handling
- **`InertiaForm<T>`**: Type exported by Inertia for typed form objects
- **Code generation**: Tools like `spatie/typescript-translator` generate TypeScript types from PHP classes/DTOs
- **Runtime validation**: Zod or similar for runtime prop validation alongside compile-time types

---

## When To Use

- Any Inertia project using TypeScript (default recommendation)
- Teams where server and client evolve independently — types catch breaking changes
- Large projects with many page components and complex prop shapes
- Projects using shared data with nested structures

## When NOT To Use

- Small prototypes or MVPs where speed of iteration is more important than type safety
- Projects using plain JavaScript (Inertia works fine without TypeScript)
- Teams without TypeScript experience (learning curve adds overhead)

---

## Best Practices

- **Use module augmentation for app-wide shared props** (auth, flash, errors) — define once, use everywhere
- **Use explicit generics for page-specific props** — precise types per component instead of a global catch-all
- **Maintain a single `resources/js/types/` directory** for all shared types
- **Keep generated and manual types in separate files** (`generated/` vs `app/`) — clear ownership
- **Run type generation as a pre-build step or git hook** — prevents stale generated types
- **Use `strict: true` in `tsconfig.json`** for maximum type safety
- **Type form data with the full form interface** — not just `Record<string, string>`
- **Avoid `any` in type declarations** — it defeats the purpose of TypeScript integration

---

## Architecture Guidelines

- Types exist in two places: PHP docblocks/validation rules and TypeScript interfaces — they must stay in sync
- Module augmentation: `declare module '@inertiajs/core' { interface PageProps { ... } }` extends Inertia's base types
- `usePage().props` is typed via the generic — without augmentation, props is `{ auth?: any }`
- `@inertiajs/core` exports `PageProps`, `Errors`, `FormDataConvertable`, and other types
- Each adapter package (`@inertiajs/react`, `@inertiajs/vue3`) re-exports core types
- Code generation is not built into Inertia core — it's ecosystem tooling (spatie/typescript-translator, laravel-ide-helper)
- TypeScript types are compile-time only — zero runtime performance impact

---

## Performance

TypeScript types are compile-time only — stripped during the Vite/Webpack build. There is zero runtime performance impact. Module augmentation files (`*.d.ts`) are not included in the JS bundle. Code generation scripts add negligible time to the build process. The only performance consideration is developer experience — overly complex generic types can slow down IDE intellisense.

---

## Security

- TypeScript types provide compile-time safety but zero runtime security
- Types do not prevent malicious data from being passed — use server-side validation for security
- Code-generated types from PHP models don't expose hidden attributes if the PHP model uses `$hidden`
- Don't rely on TypeScript to hide sensitive data — server-side prop serialization is the security boundary

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Missing module augmentation | Not extending `@inertiajs/core` PageProps | `usePage().props.auth` is typed as `any` | Add module augmentation for shared props |
| Outdated generated types | Running code generation once and never again | Silent type mismatches — TS trusts the stale file | Run generation on every deploy |
| Inline type duplication | Repeating same interface in every component | Maintenance burden, drift between files | Create shared type definitions in `types/` |
| Overly broad types | `[key: string]: unknown` as PageProps | No type safety — defeats the purpose | Define explicit shapes for all props |
| Broken augmentation on upgrade | Inertia core types change between versions | Module augmentation conflicts with new types | Review upgrade guide and update declarations |

---

## Anti-Patterns

- **`any` as a type**: Using `any` for page props or form data — removes all type safety benefits
- **Single monolithic type file**: Having one `types.ts` with everything — hard to maintain and navigate
- **Type-only security**: Believing TypeScript prevents runtime errors — validation is still needed
- **Ignoring generated types in `.gitignore`**: Generated types should be committed or generated in CI
- **Over-engineering types**: Complex conditional types and generics that are harder to understand than the code they type

---

## Examples

### Module Augmentation for Shared Props

```typescript
// resources/js/types/inertia.d.ts
import { User, Flash } from '@/types';

declare module '@inertiajs/core' {
    interface PageProps {
        auth: { user: User | null };
        flash?: Flash;
        app: { name: string; locale: string };
    }
}
```

### Typed Page Component

```tsx
// resources/js/Pages/Users/Index.tsx
import { User, PaginatedResponse } from '@/types';

interface Props {
    users: PaginatedResponse<User>;
    filters: { search?: string; role?: string };
}

export default function Index({ users, filters }: Props) {
    return <UserTable users={users} filters={filters} />;
}
```

### Typed Form

```tsx
interface CreateUserForm {
    name: string;
    email: string;
    password: string;
    role_id: number;
}

function CreateUser() {
    const { data, setData, post, errors } = useForm<CreateUserForm>({
        name: '',
        email: '',
        password: '',
        role_id: 0,
    });
    // data.name is string — fully typed
}
```

### Code Generation from PHP

```bash
# Using spatie/typescript-translator
php artisan typescript:generate
```

---

## Related Topics

- Server Props — the prop shape being typed
- Shared Data — typing shared props
- Form Handling — typed form interfaces
- Page Components — where types are consumed
- API Resources — response transformation types

---

## AI Agent Notes

- Inertia v3 provides full TypeScript support
- Module augmentation is the idiomatic pattern for shared props
- `@inertiajs/core` exports `PageProps`, `Errors`, `FormDataConvertable`, and other types
- Each adapter package re-exports core types
- `useForm<T>()` is generically typed — pass the form data interface
- `router.visit()` / `router.post()` options callbacks receive typed page responses
- Code generation is ecosystem tooling, not core Inertia

---

## Verification

- Module augmentation exists for shared props (auth, flash, app config)
- All page components have typed props (either inline or imported interfaces)
- All forms use `useForm<T>()` with a typed interface
- Generated types run as a build step or git hook
- `strict: true` is set in `tsconfig.json`
- No `any` types are used in page component props or form data
