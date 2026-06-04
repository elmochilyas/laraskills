# ECC Anti-Patterns — Component System

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Component System |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Missing `$attributes->merge()` on Root Elements (Discarded Consumer Attributes)
2. Omitting `{{ $slot }}` in Wrapper Components (Content Disappears Silently)
3. Class-Based Components for Purely Presentational UI (Unnecessary Boilerplate)
4. Excessive Constructor Parameters (10+ Props)
5. Anonymous Components Relying on Parent Scope (Silent Null Values)

---

## Repository-Wide Anti-Patterns

- Components for Everything (Over-Engineering Simple Inline Snippets)
- Deep Component Nesting Beyond 3 Levels
- Flat Component Directory Without Namespacing (Name Collisions)
- Stateful Components with Mutable Public Properties
- Logic in Anonymous Components via `@php` Blocks

---

## Anti-Pattern 1: Missing `$attributes->merge()` on Root Elements

### Category
Design

### Description
The component's root HTML element uses hardcoded attributes instead of `$attributes->merge()`, silently discarding any attributes passed by the consumer.

### Why It Happens
Developers write components as static HTML snippets without considering that consumers need to customize classes, Alpine directives, or inline styles.

### Warning Signs
- Consumer passes `class="mb-4"` but the margin never appears
- Consumers discover that attributes are "silently ignored" and must override the component source
- `x-data`, `wire:model`, or Alpine directives passed to the component have no effect

### Preferred Alternative
Always use `{{ $attributes->merge(['class' => 'default-class']) }}` on the root element to combine consumer attributes with component defaults.

### Related Rules
- Rule: Always Merge `$attributes` on Wrapper Elements

---

## Anti-Pattern 2: Omitting `{{ $slot }}` in Wrapper Components

### Category
Design | Reliability

### Description
A component that wraps consumer-provided content omits `{{ $slot }}` from its template, causing all content between the component's opening and closing tags to disappear silently.

### Why It Happens
Developers design components with named slots only (`$header`, `$footer`) and forget to include the default slot for body content.

### Warning Signs
- Content inside `<x-card>...</x-card>` never appears on the page
- Component has named slots but no `{{ $slot }}` in the template
- Developers report "the content I put inside the component doesn't show up"

### Preferred Alternative
Always include `{{ $slot }}` in wrapper components. Omit it only for self-closing components like `<x-icon name="user" />`.

### Related Rules
- Rule: Always Include `{{ $slot }}` in Components

---

## Anti-Pattern 3: Class-Based Components for Purely Presentational UI

### Category
Architecture | Waste

### Description
Creating a PHP class for a component that has no logic (no dependency injection, no computed properties, no data retrieval) — a simple button, badge, or card with only style variations.

### Why It Happens
Developers learn class-based components first and default to creating a class for every component, not realizing anonymous components exist.

### Warning Signs
- Component class contains only a constructor with string/boolean props and no methods
- The `render()` method returns a hardcoded view path
- No dependency injection or service resolution in the component
- The component is used 20+ times on a page, each requiring container instantiation

### Preferred Alternative
Use anonymous components (single Blade file, no class) for stateless presentational UI. Reserve class-based components for logic that requires DI, computed properties, or unit testing.

### Related Rules
- Rule: Prefer Anonymous Components for Presentational UI, Class-Based for Logic

---

## Anti-Pattern 4: Excessive Constructor Parameters

### Category
Maintainability

### Description
A class-based component constructor accepts 10+ parameters, handling multiple concerns (formatting, display modes, data retrieval, conditional sections).

### Why It Happens
Developers keep adding configuration options to an existing component instead of splitting it into smaller focused components.

### Warning Signs
- Component constructor has 8+ parameters
- Parameters include booleans for toggling different sections (`$showDetails`, `$showTimeline`, `$showPayments`)
- Using the component requires reading the full parameter list to understand which are required
- Component tests require constructing with many arguments

### Preferred Alternative
Split into smaller components or use a typed data object (DTO) to group related configuration. Keep constructor parameters under 5.

### Related Rules
- Rule: Limit Constructor Parameters to 5 Maximum

---

## Anti-Pattern 5: Anonymous Components Relying on Parent Scope

### Category
Architecture | Reliability

### Description
An anonymous component accesses variables (`$user`, `$settings`) from the parent template/controller scope without receiving them as explicit attributes.

### Why It Happens
Developers familiar with `@include` (which inherits parent scope) assume the same behavior for `@component` and anonymous components.

### Warning Signs
- Anonymous component template references `$user`, `$post`, or controller-passed variables
- Variables sometimes work (when set in parent) and sometimes are null
- Refactoring the parent template causes the component to silently break
- No explicit `:attribute="value"` passing in the component usage

### Preferred Alternative
Pass all required data as explicit attributes when using the component. Anonymous components are intentionally isolated from parent scope.

### Related Rules
- Rule: Never Access Parent Scope in Anonymous Components
