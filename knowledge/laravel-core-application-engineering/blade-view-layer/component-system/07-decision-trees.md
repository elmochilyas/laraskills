# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade View Layer
**Knowledge Unit:** Component System
**Generated:** 2026-06-03

---

# Decision Inventory

* Anonymous vs Class-Based Component
* Component Namespace Organization
* Component vs @include vs Layout Inheritance

---

# Architecture-Level Decision Trees

---

## Decision 1: Anonymous vs Class-Based Component

---

## Decision Context

Whether to create an anonymous component (single view file, no PHP class) or a class-based component (PHP class + view file).

---

## Decision Criteria

* Whether the component needs dependency injection
* Whether it needs computed properties or data retrieval
* Whether it needs unit testing
* Whether it is purely presentational

---

## Decision Tree

Does the component need dependency injection (services, repositories)?
↓
YES → Class-based component
NO → Does it compute or retrieve data?
    YES → Class-based component
    NO → Is it purely presentational (buttons, badges, cards)?
        YES → Anonymous component (single file, no class)
        NO → Does it need unit testing for rendering contract?
            YES → Class-based component (unit-testable)
            NO → Anonymous component

---

## Rationale

Anonymous components have zero class instantiation overhead, one file instead of two, and no reflection-based attribute matching. Class-based components provide constructor injection, unit-testable logic, and the ability to conditionally render via `shouldRender()`.

---

## Recommended Default

**Default:** Anonymous components for presentational UI (buttons, badges, cards). Class-based for any component with logic, injection, or testing needs.
**Reason:** Anonymous components minimize boilerplate for simple cases. Class-based components provide necessary infrastructure when logic is required. Using class-based for everything adds unnecessary overhead.

---

## Risks Of Wrong Choice

* Class-based for simple button: Unnecessary container resolution, extra file to manage
* Anonymous for data-fetching component: No DI, no testability, logic leaks into view with `@php` blocks

---

## Related Rules

* Prefer Anonymous Components for Presentational UI, Class-Based for Logic (05-rules.md)
* Limit Constructor Parameters to 5 Maximum (05-rules.md)

---

## Related Skills

* Skill: Create and Use Blade Components

---

## Decision 2: Component Namespace Organization

---

## Decision Context

Whether to keep components in a flat directory or organize them into domain-based subdirectories.

---

## Decision Criteria

* Total number of components
* Number of distinct UI domains
* Risk of component name collisions
* Team size

---

## Decision Tree

How many components does the application have?
↓
< 15 components?
YES → Flat directory is acceptable (no namespacing needed)
NO → 15+ components?
    YES → Are there distinct UI domains (ui, forms, layouts)?
        YES → Use domain-based subdirectories: `x-ui.button`, `x-forms.input`, `x-layouts.card`
        NO → Use domain-based subdirectories anyway (prevents future collisions)
NO → Are there any name collisions (two `button` components)?
    YES → Namespace immediately to resolve collisions
    NO → Add namespacing as the component count grows

---

## Rationale

Flat component directories cause name collisions and poor discoverability at scale. Domain-based namespacing prevents conflicts, groups related components together, and makes the component hierarchy visible in template syntax.

---

## Recommended Default

**Default:** Domain-based subdirectories for 15+ components or any multi-domain app
**Reason:** Namespace prefixes like `x-ui.button` prevent collisions and provide immediate context about where a component belongs.

---

## Risks Of Wrong Choice

* Flat directory at scale: Name collisions, difficulty finding components, poor discoverability
* Domain namespacing for tiny app: Unnecessary directory depth, verbose component tags

---

## Related Rules

* Namespace Components by Domain (05-rules.md)
* Keep Component Nesting Within 3 Levels (05-rules.md)

---

## Related Skills

* Skill: Create and Use Blade Components

---

## Decision 3: Component vs @include vs Layout Inheritance

---

## Decision Context

Whether to extract reusable view code as a component, use `@include` for a partial, or use `@extends`/`@yield` for layout structure.

---

## Decision Criteria

* Whether the fragment is a reusable UI piece or page-level structure
* Whether it has logic or is purely presentational
* Whether it needs scope isolation
* Whether it is used once or multiple times

---

## Decision Tree

Is this a page-level layout structure (HTML shell, navigation, footer)?
↓
YES → Use `@extends`/`@yield` (layout inheritance)
NO → Is it a reusable UI piece used on multiple pages?
    YES → Does it have logic (DI, computed properties, data)?
        YES → Class-based component
        NO → Does it need scope isolation from parent?
            YES → Anonymous component (isolated scope)
            NO → Simple partial with no logic?
                YES → `@include` is acceptable (inherits parent scope)
                NO → Anonymous component
NO → Is it a single-use view fragment?
    YES → Keep inline or use `@include` — component abstraction not justified

---

## Rationale

Layout inheritance is for page-level structure. Components provide encapsulation and data contracts. `@include` shares parent scope with no isolation. Components should be used for reusable pieces; `@include` for simple inline snippets that don't need their own data contract.

---

## Recommended Default

**Default:** Layout inheritance for page shell, components for reusable UI pieces, `@include` only for simple stateless inline snippets
**Reason:** Each tool has its appropriate use. Components provide the best encapsulation and reusability. Layout inheritance is for structure. `@include` is for simple shared snippets with no data contract.

---

## Risks Of Wrong Choice

* Component for everything: Over-engineering for simple variable interpolation
* `@include` for logic-backed partials: No DI, no testability, parent scope coupling
* Layout inheritance for reusable widgets: Misuse of inheritance system, confusing semantics

---

## Related Rules

* Never Access Parent Scope in Anonymous Components (05-rules.md)
* Always Include `{{ $slot }}` in Components (05-rules.md)

---

## Related Skills

* Skill: Create and Use Blade Components
* Skill: Implement Template Inheritance Hierarchy
