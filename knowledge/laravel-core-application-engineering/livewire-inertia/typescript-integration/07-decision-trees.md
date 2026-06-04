# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia TypeScript Integration
**Generated:** 2026-06-03

---

# Decision Inventory

* Module Augmentation vs Per-Component Type Declaration for Shared Data
* Manual Type Definitions vs Code Generation from PHP Types
* Generic usePage<T>() vs Direct usePage() with Augmented Global Type

---

# Architecture-Level Decision Trees

---

## Decision 1: Module Augmentation vs Per-Component Type Declaration for Shared Data

---

## Decision Context

Whether to type shared Inertia data (auth, flash, config) via TypeScript module augmentation or declare types in each component.

---

## Decision Criteria

* Whether the shared data is used across 3+ components
* Whether the team values DRY types or explicit per-component types
* Whether the project has a single `inertia.d.ts` file for global types
* Whether the shared data shape changes frequently

---

## Decision Tree

Is the shared data (auth, flash, config) used in 3+ components?
↓
YES → Use module augmentation — `declare module '@inertiajs/core'` in `inertia.d.ts`
NO → Is the shared data used in only 1-2 components?
    YES → Per-component type — `usePage<{ auth: { user: User } }>()` inline
    NO → Does the team prioritize DRY types?
        YES → Module augmentation — single source of truth
        NO → Per-component type — explicit, no magic

---

## Rationale

Module augmentation types shared data once for the entire application. Every component automatically receives correct types for `usePage().props.auth`. Per-component types are explicit but repetitive — each component must re-declare the shared data types. Module augmentation is the standard approach for shared Inertia data.

---

## Recommended Default

**Default:** Module augmentation in `inertia.d.ts` for all shared data types. Per-component types only for page-specific props.
**Reason:** Module augmentation eliminates repetitive type declarations and ensures shared data types are consistent across all components.

---

## Risks Of Wrong Choice

* Per-component types for 10 components: Same `{ auth: { user: User } }` declared 10 times — repetitive, drift-prone
* Module augmentation for 1 component: Overkill — `inertia.d.ts` with 2 lines for single-use type
* No types at all: `usePage().props.auth` is `any` — no compile-time safety
* Module augmentation without shared data: Types exist but no actual shared data — misleading

---

## Related Rules

* Augment PageProps for Shared Data

---

## Related Skills

* Set Up TypeScript Integration for Inertia

---

---

## Decision 2: Manual Type Definitions vs Code Generation from PHP Types

---

## Decision Context

Whether to write TypeScript types for Inertia props manually or generate them from PHP types using tools like `spatie/typescript-translator`.

---

## Decision Criteria

* Number of page components (threshold: 20+ pages benefits from generation)
* Whether the PHP types (DTOs, Resources) are stable or changing frequently
* Whether the team has set up code generation tooling
* Whether the team prefers explicit control over generated types

---

## Decision Tree

Does the project have 20+ Inertia page components?
↓
YES → Use code generation — manual typing 20+ prop interfaces is tedious and drift-prone
NO → Are the PHP types (DTOs, API Resources) stable and well-defined?
    YES → Use code generation — PHP types are the single source of truth
    NO → Manual types — PHP types are too volatile to generate useful TS types
NO → Does the team have code generation tooling already configured?
    YES → Use code generation — consistent with existing workflow
    NO → Does the team prefer explicit control over type definitions?
        YES → Manual types — full control, no tooling dependency
        NO → Manual types — code generation setup cost isn't justified for small projects

---

## Rationale

Manual type definitions are simpler for small projects (under 20 pages). Code generation becomes valuable at scale, where the effort of maintaining parallel type definitions in PHP and TypeScript exceeds the setup cost of generation tooling. The PHP types must be stable for generation to produce useful output.

---

## Recommended Default

**Default:** Manual TypeScript types for small projects (<20 pages). Code generation for larger projects with stable PHP DTOs/Resources.
**Reason:** Manual types have zero setup cost and are sufficient for small projects. Code generation eliminates drift between PHP and TypeScript at scale.

---

## Risks Of Wrong Choice

* Manual types at 50 pages: 50 interfaces manually maintained — drift guaranteed, updates are painful
* Code generation for 3 pages: Tooling setup cost exceeds manual typing effort
* Generation from volatile PHP types: Generated types irrelevant after next PHP change
* No types at all: `any` props everywhere — no compile-time safety, runtime errors on prop mismatches

---

## Related Rules

* Code Generation for Large Projects

---

## Related Skills

* Set Up TypeScript Integration for Inertia

---

---

## Decision 3: Generic usePage<T>() vs Direct usePage() with Augmented Global Type

---

## Decision Context

Whether to pass a generic type parameter to `usePage<T>()` or rely on the augmented global `PageProps` interface.

---

## Decision Criteria

* Whether the page has page-specific props in addition to shared data
* Whether the global `PageProps` interface is augmented with all page-specific props
* Whether the component needs to access `usePage().props.pageSpecificProp`
* Whether the team uses module augmentation for page-specific props

---

## Decision Tree

Does the component need access to page-specific props (not just shared data)?
↓
YES → Does the component need only shared data (auth, flash)?
    YES → Use `usePage()` — augmented global `PageProps` covers shared data
    NO → Use generic `usePage<SharedData & { pageSpecific: Type }>()` — merge shared and page-specific types
NO → Is the project using module augmentation for all page props?
    YES → Use `usePage()` — all props are covered by the augmented interface
    NO → Use `usePage()` without generic — augmented global type covers shared data

---

## Rationale

Page components have both shared data (auth, flash — available on every page via module augmentation) and page-specific props (passed by the controller). The generic parameter merges shared and page-specific types. Components that only need shared data can use `usePage()` without a generic parameter.

---

## Recommended Default

**Default:** Use `usePage()` without generic for shared-data-only access. Use `usePage<Props>()` with a defined `Props` interface that extends or intersects with shared types for page-specific access.
**Reason:** No generic is simpler when only shared data is needed. The generic parameter adds type safety for page-specific props. The `Props` interface should be defined alongside the page component.

---

## Risks Of Wrong Choice

* No generic for page-specific props: `usePage().props.pageSpecific` is `any` — no type safety
* Generic with wrong type: `usePage<{ user: string }>()` but server sends `{ user: { id: number, name: string } }` — wrong types
* Generic without shared data union: `usePage<{ posts: Post[] }>()` — `auth` and `flash` props not in scope
* Augmenting PageProps with page-specific types: Pollutes global type — type for one page visible in all components

---

## Related Rules

* Generic usePage for Page-Specific Props

---

## Related Skills

* Set Up TypeScript Integration for Inertia
