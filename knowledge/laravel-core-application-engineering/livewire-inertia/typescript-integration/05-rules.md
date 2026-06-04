## Rule: Augment PageProps for Shared Data

Use TypeScript module augmentation to type all shared (global) Inertia props once, not per-component.

---

## Category

Code Organization

---

## Rule

Declare a single `inertia.d.ts` file that extends `@inertiajs/core`'s `PageProps` interface with your shared prop shapes (auth, flash, app config). Do not redeclare shared prop types in individual page components.

---

## Reason

Without module augmentation, `usePage().props.auth` is typed as `any` — type safety is lost. By augmenting the global `PageProps` interface, every component in the project automatically receives correct types for shared data, eliminating repetitive type declarations and preventing drift.

---

## Bad Example

```tsx
// Every component repeats the same type
interface PageProps {
    auth: { user: User | null };
    flash?: { success: string };
}
```

---

## Good Example

```typescript
// resources/js/types/inertia.d.ts — declared once
declare module '@inertiajs/core' {
    interface PageProps {
        auth: { user: User | null };
        flash?: { success?: string; error?: string };
        app: { name: string; locale: string };
    }
}
```

---

## Exceptions

If a page component receives a scoped prop that happens to share a name with a shared prop, type it locally in that component's prop interface rather than modifying the global augmentation.

---

## Consequences Of Violation

Maintenance risks: shared prop types duplicated across components, drift inevitable. Developer experience: no intellisense for shared props, runtime errors from misspelled keys.

---

## Rule: Use Explicit Generics for Page Props

Type each page component's props with a specific interface — never use a single `Props` catch-all or `any`.

---

## Category

Code Organization

---

## Rule

Define an interface for each page component's props that lists only the props that component receives. Pass the interface as a generic to the component function. Do not import and use the global `PageProps` interface as the component's prop type.

---

## Reason

A global catch-all interface that includes every possible prop causes the component to accept props it does not use (no error on misspelling), and does not catch missing required props. Per-component interfaces provide precise, compiler-checked contracts.

---

## Bad Example

```tsx
// Global catch-all — any prop is accepted, no type errors for missing props
interface Props {
    [key: string]: unknown;
}
export default function Index({ users }: Props) { ... }
```

---

## Good Example

```tsx
interface Props {
    users: PaginatedResponse<User>;
    filters: { search?: string; role?: string };
}
export default function Index({ users, filters }: Props) { ... }
```

---

## Exceptions

Small components with a single simple prop may define the interface inline instead of in a separate file. The interface must still be explicit, not `any` or `Record<string, unknown>`.

---

## Consequences Of Violation

Runtime risks: accessing props that do not exist, no compile-time error. Developer experience: no autocompletion, no type-checking for prop shapes.

---

## Rule: Separate Generated from Manual Types

Keep auto-generated TypeScript types (from `spatie/typescript-translator`, etc.) in a `types/generated/` directory and manual types in `types/app/`.

---

## Category

Code Organization

---

## Rule

Store code-generated TypeScript interfaces in a dedicated `generated/` subdirectory. Store hand-written types in a separate `app/` or root types directory. Never edit generated files manually.

---

## Reason

Generated files are overwritten on every code generation run. Mixing them with manual types creates confusion about ownership — developers waste time editing files that will be overwritten. A clear directory boundary makes it obvious which files are safe to edit and which must be regenerated from PHP source.

---

## Bad Example

```
types/
  User.ts           # Is this generated or hand-written?
  Post.ts           # Edited manually, then overwritten by generator
```

---

## Good Example

```
types/
  generated/
    User.ts         # Auto-generated from PHP models
    Post.ts         # Auto-generated from PHP models
  app/
    PageProps.ts    # Hand-written interfaces
    Forms.ts        # Hand-written form interfaces
```

---

## Exceptions

For small projects where code generation is not used, all types can live in `types/` without subdirectories. The rule applies only when generators are part of the workflow.

---

## Consequences Of Violation

Maintenance risks: manually edited generated files overwritten on next generation run. Confusion: unclear which files are source of truth.

---

## Rule: Generate Types as Pre-Build Step

Run the TypeScript type generation command as a pre-build step, git hook, or CI step so generated types are never stale.

---

## Category

Maintainability

---

## Rule

Configure `php artisan typescript:generate` (or equivalent) to run before `npm run build`, in a pre-commit hook, or in the CI pipeline. Generated type files must be committed to the repository or regenerated in CI.

---

## Reason

Generated types in the repository quickly become out of sync with the PHP source as models change. Running generation on every build ensures types match the current PHP code. This prevents silent type mismatches where TypeScript trusts stale type definitions that no longer match the actual server response.

---

## Bad Example

```bash
# Developer runs this once, forgets, types drift
php artisan typescript:generate
```

---

## Good Example

```json
{
    "scripts": {
        "build": "php artisan typescript:generate && vite build",
        "postinstall": "php artisan typescript:generate"
    }
}
```

---

## Exceptions

If the code generator produces types that are checked into version control and the team has a strict policy to regenerate before any model change commit, CI enforcement is sufficient without pre-build generation.

---

## Consequences Of Violation

Reliability risks: TypeScript compiles successfully with stale types, runtime prop shape mismatches. Debugging difficulty: errors appear only in production when server sends unexpected data.

---

## Rule: Enable strict TypeScript Mode

Set `"strict": true` in `tsconfig.json` for maximum type safety across Inertia page components.

---

## Category

Framework Usage

---

## Rule

Enable `strict: true` in `tsconfig.json` to enforce `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and other strict-mode checks. Do not disable individual strict flags unless there is a compelling, documented reason.

---

## Reason

Without strict mode, `null` and `undefined` values in Inertia props may silently flow through the application, causing runtime crashes when code accesses properties on null values. Strict mode catches these errors at compile time, especially important for props that can be conditionally present.

---

## Bad Example

```json
{
    "compilerOptions": {
        "strict": false,
        "noImplicitAny": false
    }
}
```

---

## Good Example

```json
{
    "compilerOptions": {
        "strict": true
    }
}
```

---

## Exceptions

When integrating with a third-party library that is not typed for strict mode, you may exempt its types with a `// @ts-ignore` comment at the call site or a `skipLibCheck: true` option. Application code must remain strict.

---

## Consequences Of Violation

Reliability risks: null reference errors in production. Developer experience: fewer compile-time warnings, more runtime debugging.

---

## Rule: Avoid any in Prop Declarations

Never use `any` for Inertia page props, form data interfaces, or shared data types.

---

## Category

Maintainability

---

## Rule

Use explicit TypeScript types (`string`, `number`, `boolean`, `User[]`, `PaginatedResponse<T>`, etc.) for all Inertia-related type declarations. If a type is unknown, create an interface or use `unknown` with proper type narrowing instead of `any`.

---

## Reason

`any` disables all type checking for that value — misspellings, incorrect access patterns, and type mismatches become runtime errors instead of compile-time errors. This defeats the primary purpose of TypeScript integration with Inertia: catching prop mismatch bugs before deployment.

---

## Bad Example

```typescript
// Any type — no safety
const { props } = usePage<any>();
```

---

## Good Example

```typescript
// Properly typed
interface DashboardProps {
    stats: { users: number; revenue: number };
    recentOrders: Order[];
}
const { props } = usePage<DashboardProps>();
```

---

## Exceptions

When migrating an existing JavaScript codebase to TypeScript incrementally, you may temporarily use `any` for files that have not been converted. The goal must be zero `any` types in Inertia-related code after migration.

---

## Consequences Of Violation

Reliability risks: prop shape mismatches caught only at runtime. Maintenance risks: refactoring becomes risky without type safety.

---

## Rule: Type Form Data Interfaces

Always pass a typed interface to `useForm<T>()` instead of using the bare form without generics.

---

## Category

Framework Usage

---

## Rule

Define a full interface for every form's data shape and pass it as the generic parameter to `useForm<T>()`. Include all fields with their types. Never use `useForm()` without a generic.

---

## Reason

Without the generic, form `data` properties are typed as `any`, `setData` accepts any key name with any value, and the `transform` callback receives untyped data. This makes form handling error-prone — misspelled field names, wrong value types, and missing fields go undetected until runtime.

---

## Bad Example

```tsx
const { data, setData } = useForm({ name: '', email: '' }); // data is any
```

---

## Good Example

```tsx
interface CreateUserForm {
    name: string;
    email: string;
    password: string;
    role_id: number;
}

const { data, setData } = useForm<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role_id: 0,
});
```

---

## Exceptions

For extremely simple forms (e.g., a single search input), `useForm({ q: '' })` without a generic is acceptable. The form object must still have explicit property types.

---

## Consequences Of Violation

Runtime risks: misspelled field names silently create separate properties. Developer experience: no autocompletion for form fields in templates.
