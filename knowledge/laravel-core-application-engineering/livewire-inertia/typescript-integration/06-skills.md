# Skill: Set Up TypeScript Integration for Inertia

## Purpose

Configure TypeScript module augmentation, typed page props, typed forms, and code generation to provide end-to-end type safety across the Inertia server-client boundary.

## When To Use

Setting up a new Inertia + TypeScript project, or adding type safety to an existing Inertia project. Also when auditing an existing codebase for `any` types in Inertia-related code.

## When NOT To Use

- Plain JavaScript projects (no TypeScript)
- Small prototypes where iteration speed outweighs type safety benefits
- Teams without TypeScript experience

## Prerequisites

- Inertia installed with TypeScript-enabled adapter
- `tsconfig.json` with `strict: true`
- TypeScript installed in the project

## Inputs

- Shared data shape (auth, flash, app config)
- Page component list with their prop shapes
- Form data interfaces

## Workflow

1. Enable `strict: true` in `tsconfig.json`
2. Create `resources/js/types/inertia.d.ts` with module augmentation for shared props:
   ```typescript
   declare module '@inertiajs/core' {
       interface PageProps {
           auth: { user: User | null };
           flash?: { success?: string; error?: string };
           app: { name: string; locale: string };
       }
   }
   ```
3. Define per-page prop interfaces — never use a global catch-all or `any`:
   ```tsx
   interface Props { users: User[]; filters: { search?: string } }
   export default function Index({ users, filters }: Props) { ... }
   ```
4. Type all forms with `useForm<T>()` generic:
   ```tsx
   interface CreateUserForm { name: string; email: string; password: string; }
   const { data, setData } = useForm<CreateUserForm>({ ... });
   ```
5. If using `spatie/typescript-translator`, set up `php artisan typescript:generate` as a pre-build step in `package.json`
6. Keep generated types in `types/generated/` and manual types in `types/app/` to avoid overwrites
7. Audit the codebase for `any` types in page props, form data, and shared data — replace with explicit interfaces

## Validation Checklist

- [ ] Module augmentation exists for shared props (auth, flash, app config)
- [ ] All page components have typed props (inline or imported interfaces)
- [ ] All forms use `useForm<T>()` with a typed interface
- [ ] `strict: true` set in `tsconfig.json`
- [ ] No `any` types used in page component props or form data
- [ ] Generated types run as a build step or git hook
- [ ] Generated and manual types stored in separate directories

## Common Failures

- Missing module augmentation — `usePage().props.auth` typed as `any`
- Outdated generated types — run generation once and never again, types drift from PHP source
- Inline type duplication — same interface repeated in every component instead of shared type
- Overly broad types — `[key: string]: unknown` as PageProps, no type safety
- `any` as a type — defeats the purpose of TypeScript integration

## Decision Points

- Use module augmentation for app-wide shared props, per-component interfaces for page-specific props
- Use `spatie/typescript-translator` when PHP models and DTOs change frequently; manual types suffice for stable projects
- Use `unknown` (with type narrowing) instead of `any` when type is genuinely not known

## Performance Considerations

TypeScript types are compile-time only — stripped during the Vite/Webpack build. Zero runtime performance impact. Module augmentation files (`*.d.ts`) are not included in the JS bundle.

## Security Considerations

TypeScript provides compile-time safety but zero runtime security. Types do not prevent malicious data — use server-side validation for security. Code-generated types from PHP models don't expose hidden attributes if the PHP model uses `$hidden`.

## Related Rules

- Augment PageProps for Shared Data (05-rules.md)
- Use Explicit Generics for Page Props (05-rules.md)
- Separate Generated from Manual Types (05-rules.md)
- Generate Types as Pre-Build Step (05-rules.md)
- Enable strict TypeScript Mode (05-rules.md)
- Avoid any in Prop Declarations (05-rules.md)
- Type Form Data Interfaces (05-rules.md)

## Related Skills

- Set Up Typed Server Props with Secure Serialization (inertia/server-props)
- Configure and Type Shared Data (inertia/shared-data)
- Implement a Secure Inertia Form with Validation (inertia/form-handling)
- Create an Inertia Page Component with Typed Props (inertia/page-components)

## Success Criteria

- `usePage().props` returns fully typed objects for shared data
- Every page component receives typed props — misspellings caught at compile time
- Every form has typed data and setData
- `strict: true` enabled — no implicit `any` anywhere
- Generated types stay in sync with PHP source via build-step execution
- No `any` types in Inertia-related code
