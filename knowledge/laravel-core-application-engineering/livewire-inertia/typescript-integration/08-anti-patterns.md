# Inertia TypeScript Integration — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia TypeScript Integration |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Using `any` as a Type for Page Props or Form Data
2. Missing Module Augmentation — Shared Data Untyped
3. Single Monolithic Type File
4. Stale Generated Types
5. Over-Engineering Types with Complex Generics

---

## Repository-Wide Anti-Patterns

- **Type-only security mindset**: Believing TypeScript prevents runtime errors — server-side validation is still required.
- **Ignoring generated types in `.gitignore`**: Generated types should be committed or regenerated in CI.
- **Inline type duplication**: Same interface repeated in every component instead of shared type definitions.
- **Overly broad catch-all types**: `[key: string]: unknown` as `PageProps` — no type safety.

---

## Anti-Pattern 1: Using `any` as a Type for Page Props or Form Data

### Category

Maintainability

### Description

Using the `any` type for page component props, form data interfaces, or shared data types, disabling all TypeScript checking for those values.

### Why It Happens

Developers use `any` as a quick way to silence the TypeScript compiler when they don't know the exact type or when migrating JS to TS. It "works" — the code compiles and runs — so the incentive to fix it is low.

### Warning Signs

- `props: any` in page component signatures
- `usePage<any>()` in component code
- `useForm()` without generic type parameter
- `interface Props { [key: string]: any }` in type declarations

### Why Harmful

`any` disables all type checking for that value — misspellings, incorrect access patterns, and type mismatches become runtime errors instead of compile-time errors. This defeats the primary purpose of TypeScript integration with Inertia: catching prop mismatch bugs before deployment.

### Consequences

- Misspelled prop names (`user.name` vs `user.fullName`) go undetected
- Wrong value types (string where number expected) cause runtime bugs
- Prop shape changes from the server are not caught by the compiler
- Refactoring becomes risky — no compiler safety net

### Alternative

Use explicit TypeScript types for all Inertia-related type declarations. If a type is unknown, use `unknown` with proper type narrowing instead of `any`.

### Refactoring Strategy

1. Search for `any` in prop declarations, form data, and shared data types
2. Replace each with an explicit interface matching the actual data shape
3. For genuinely uncertain types, use `unknown` with type guards
4. Enable `noImplicitAny` in `tsconfig.json` to prevent future `any` usage

### Detection Checklist

- [ ] No `any` type in page component props
- [ ] No `any` type in form data interfaces
- [ ] No `any` type in shared data module augmentation
- [ ] `noImplicitAny` is enabled in `tsconfig.json`
- [ ] All unknown types use `unknown` with proper guards

### Related Rules

- Avoid any in Prop Declarations (05-rules.md)

### Related Skills

- Set Up TypeScript Integration for Inertia (06-skills.md)

### Related Decision Trees

- Manual Type Definitions vs Code Generation from PHP Types (07-decision-trees.md)

---

## Anti-Pattern 2: Missing Module Augmentation — Shared Data Untyped

### Category

Code Organization

### Description

Not extending Inertia's `PageProps` interface via module augmentation, leaving `usePage().props.auth` and other shared props typed as `any`.

### Why It Happens

Module augmentation requires knowledge of TypeScript's declaration merging feature. Developers new to Inertia or TypeScript may not know this pattern exists. The app compiles and runs, so the missing types are invisible unless you inspect the inferred types.

### Warning Signs

- `usePage().props.auth` is typed as `any`
- No `inertia.d.ts` file in `resources/js/types/`
- Components manually cast or assert types for shared data
- Shared data shape changes require updating every component that uses it

### Why Harmful

Without augmentation, `usePage().props.auth` is typed as `any` or the default Inertia type. Developers must remember the shape of shared data and manually type it in every component, leading to errors and drift. A shared data key rename or shape change requires searching the entire codebase for access points — and any missed spot becomes a runtime error.

### Consequences

- No autocompletion for shared props in IDE
- Runtime errors from misspelled or renamed shared data keys
- Type errors when accessing nested shared data properties
- Shared data shape changes require manual updates in every component

### Alternative

Create a `resources/js/types/inertia.d.ts` file that extends `@inertiajs/core`'s `PageProps` interface with interfaces matching every key returned by the `HandleInertiaRequests` `share()` method.

### Refactoring Strategy

1. Create `resources/js/types/inertia.d.ts` with module augmentation for all shared data keys
2. Define interfaces for auth user, flash messages, app config, and any other shared data
3. Remove manual type assertions for shared data in components
4. Verify that `usePage().props.auth.user.name` provides autocompletion

### Detection Checklist

- [ ] `inertia.d.ts` exists with `declare module '@inertiajs/core' { interface PageProps { ... } }`
- [ ] All shared data keys (auth, flash, app) are typed in the augmentation
- [ ] `usePage().props.auth` is typed (not `any`)
- [ ] No manual type assertions for shared data in components

### Related Rules

- Augment PageProps for Shared Data (05-rules.md)

### Related Skills

- Set Up TypeScript Integration for Inertia (06-skills.md)

### Related Decision Trees

- Module Augmentation vs Per-Component Type Declaration for Shared Data (07-decision-trees.md)

---

## Anti-Pattern 3: Single Monolithic Type File

### Category

Maintainability

### Description

Putting all TypeScript type definitions for the entire Inertia application into a single `types.ts` file that grows to hundreds or thousands of lines.

### Why It Happens

Starting with one types file is convenient. As the project grows, new types are added to the same file because "that's where the types are." The file grows monotonically until it becomes unmanageable.

### Warning Signs

- `types.ts` exceeds 500 lines
- A single file contains auth types, user types, post types, form interfaces, API response types, etc.
- Developers spend time searching for the right type in the file
- Merge conflicts on the types file are frequent

### Why Harmful

A single large file is hard to navigate, understand, and maintain. Types for unrelated domains are mixed together, increasing cognitive load. The file becomes a bottleneck for parallel development — multiple developers touching it causes merge conflicts.

### Consequences

- Poor developer experience — hard to find the right type
- Increased merge conflicts from multiple developers editing the same file
- No logical organization — unrelated types mixed together
- Hard to understand the domain structure from the types

### Alternative

Organize types by domain in separate files within a `types/` directory. Keep generated types separate from manual types. Each domain or page group gets its own type file.

### Refactoring Strategy

1. Create a `types/` directory structure: `types/generated/`, `types/app/`, `types/pages/`
2. Extract type definitions from the monolithic file into domain-specific files
3. Group page-specific prop interfaces with their page components
4. Configure `tsconfig.json` with `typeRoots` for the type directory

### Detection Checklist

- [ ] No single type file exceeds 300 lines
- [ ] Types are organized by domain (auth, user, post, shared)
- [ ] Generated types are in a separate directory from manual types
- [ ] Page-specific prop types are alongside page components
- [ ] Type imports are explicit and isolated

### Related Rules

- Separate Generated from Manual Types (05-rules.md)

### Related Skills

- Set Up TypeScript Integration for Inertia (06-skills.md)

### Related Decision Trees

- Manual Type Definitions vs Code Generation from PHP Types (07-decision-trees.md)

---

## Anti-Pattern 4: Stale Generated Types

### Category

Maintainability

### Description

Running code generation from PHP types once and never again, causing TypeScript types to drift from the actual server-side prop shapes.

### Why It Happens

Code generation is often set up as a manual step: "run this command when you change PHP types." Without enforcement, the command is forgotten. The generated types become gradually outdated as PHP models change, and TypeScript confidently compiles against wrong types.

### Warning Signs

- `php artisan typescript:generate` is not in any build script
- Generated type files have old field names or types that don't match current PHP code
- TypeScript compiles successfully, but runtime props differ from the declared types
- No CI step validates that generated types match the current PHP source

### Why Harmful

Generated types in the repository quickly become out of sync with the PHP source as models change. TypeScript compiles successfully with stale type definitions. The mismatch is only discovered at runtime when the server sends data that doesn't match the outdated types — causing crashes or undefined behavior.

### Consequences

- TypeScript compiles with wrong types — false confidence
- Runtime errors from prop shape mismatches
- Debugging difficulty — types say one thing, server sends another
- Developers lose trust in the type system

### Alternative

Run the TypeScript type generation command as a pre-build step, git hook, or CI step so generated types are never stale.

### Refactoring Strategy

1. Add `php artisan typescript:generate` to the `build` script in `package.json`
2. Add a pre-commit hook that regenerates types and fails if they changed
3. In CI, regenerate types before the TypeScript type-check step
4. If using generated types in version control, commit the updated files alongside the PHP changes

### Detection Checklist

- [ ] Type generation runs automatically (pre-build, pre-commit, or CI)
- [ ] Generated type file modification dates match recent code changes
- [ ] No stale field names or types in generated files
- [ ] CI fails if generated types don't match PHP source
- [ ] Team members don't need to remember to run generation manually

### Related Rules

- Generate Types as Pre-Build Step (05-rules.md)

### Related Skills

- Set Up TypeScript Integration for Inertia (06-skills.md)

### Related Decision Trees

- Manual Type Definitions vs Code Generation from PHP Types (07-decision-trees.md)

---

## Anti-Pattern 5: Over-Engineering Types with Complex Generics

### Category

Maintainability

### Description

Creating overly complex TypeScript types — deeply nested generics, conditional types, mapped types — for Inertia props and forms that are harder to understand than the runtime code they type.

### Why It Happens

TypeScript's powerful type system encourages type-level programming. Developers may try to create "perfect" types that automatically derive from other types, enforce complex constraints, or provide extreme flexibility — at the cost of readability.

### Warning Signs

- Nested generic type chains spanning 10+ lines
- Conditional types (`T extends U ? X : Y`) in prop declarations
- Complex mapped types that transform prop shapes
- Type errors that produce unreadable error messages spanning 50+ lines
- Junior developers avoid touching types because they don't understand them

### Why Harmful

Complex types make the codebase harder to maintain. A simple prop shape change requires updating an incomprehensible type chain. Type errors become cryptic and hard to debug. The types, intended to help developers, become a barrier to productivity.

### Consequences

- Junior developers cannot work with types effectively
- Type errors produce incomprehensible messages
- Simple prop changes require complex type changes
- Types are a net productivity loss rather than gain

### Alternative

Keep types simple. Use explicit interfaces for page props, straightforward generics for forms, and basic utility types (`Partial<T>`, `Pick<T>`). If a type definition is hard to read, simplify it.

### Refactoring Strategy

1. Review complex type definitions for readability
2. Replace conditional types with union types or overloads where appropriate
3. Replace deeply nested generics with explicit intermediate types
4. Add comments explaining any remaining complexity with real-world examples

### Detection Checklist

- [ ] Type definitions are readable by developers with basic TypeScript knowledge
- [ ] Type errors produce understandable error messages
- [ ] No conditional types in prop or form declarations
- [ ] Generic types are limited to 1-2 levels of nesting
- [ ] Any complex type has a comment explaining its purpose

### Related Rules

- Avoid any in Prop Declarations (05-rules.md)

### Related Skills

- Set Up TypeScript Integration for Inertia (06-skills.md)

### Related Decision Trees

- Generic usePage<T>() vs Direct usePage() with Augmented Global Type (07-decision-trees.md)
