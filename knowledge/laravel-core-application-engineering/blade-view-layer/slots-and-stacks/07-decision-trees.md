# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Slots and Stacks
**Generated:** 2026-06-03

---

# Decision Inventory

* Slots (Component) vs @yield (Layout Inheritance)
* Single Named Slot vs Multiple Named Slots
* @push vs @prepend for Stack Injection Order

---

# Architecture-Level Decision Trees

---

## Decision 1: Slots (Component) vs @yield (Layout Inheritance)

---

## Decision Context

Whether to define injectable content areas using component slots (`{{ $slot }}`, named slots) or layout inheritance yields (`@yield('content')`, `@section`).

---

## Decision Criteria

* Whether the content area is inside a reusable component or a page layout
* Whether multiple content areas need distinct names
* Whether the content should accumulate (stack) or override (section)

---

## Decision Tree

Is this content area inside a reusable UI component (card, modal, alert)?
↓
YES → Component slots:
    Default slot: `{{ $slot }}` for content between tags
    Named slots: `{{ $header }}` for distinct content areas
NO → Is this content area in a page layout (master layout)?
    YES → `@yield('content')` with `@section('content')` in child pages
NO → Do you need content to ACCUMULATE (multiple sources contribute)?
    YES → `@stack('scripts')` with `@push('scripts')` for assets
    NO → Do you need content to OVERRIDE (last definition wins)?
        YES → `@yield('title')` with `@section('title')`
        NO → Component slots

---

## Rationale

Slots are for component composition — the component consumer provides content between tags. `@yield` is for layout inheritance — the child page defines what goes in a section. Stacks accumulate (correct for assets). Sections overwrite (correct for content areas).

---

## Recommended Default

**Default:** Component slots for reusable UI components; @yield for page layout inheritance; @stack/@push for assets
**Reason:** Each mechanism has a distinct purpose. Using slots in layouts or yields in components creates confusion about the rendering pattern.

---

## Risks Of Wrong Choice

* `@yield` in a component: Component cannot be used with `@parent`, conflicts with component lifecycle
* Slots for layout: Cannot use `@parent` for extending parent layouts
* `@push` for content: Multiple pushes accumulate content (wrong for page content)
* `@section` for assets: Only last definition survives (wrong for multiple asset files)

---

## Related Rules

* Use Stacks for Assets, Sections for Content (05-rules.md)

---

## Related Skills

* Skill: Implement Content Injection with Slots and Stacks

---

## Decision 2: Single Named Slot vs Multiple Named Slots

---

## Decision Context

Whether a component needs only a default `{{ $slot }}` or additional named slots for multiple content areas.

---

## Decision Criteria

* Number of distinct content areas in the component
* Whether each area should be independently overridable
* Whether the component needs header, body, footer separation

---

## Decision Tree

How many distinct content areas does the component have?
↓
1 (just the main content body) → Default `{{ $slot }}` only — no named slots needed
2-3 (e.g., header, body, footer) → Named slots:
    `{{ $header ?? 'Default' }}`
    `{{ $slot }}` (default, always present)
    `{{ $footer ?? '' }}`
4+ named slots → Evaluate: Is the component doing too much?
    YES → Split into smaller components with fewer slots each
    NO → Named slots are acceptable for complex components (tables, modals, page sections)
NO → Can some named slots be replaced by props?
    YES → Use props for simple string/boolean overrides, slots for HTML content
    NO → Named slots

---

## Rationale

Named slots add ceremony — each one requires a `<x-slot:name>` tag from the consumer. A component with one content area only needs `{{ $slot }}`. Named slots are justified when multiple independently overridable content areas are needed.

---

## Recommended Default

**Default:** Default `{{ $slot }}` only for simple components; add named slots only when 2+ distinct content areas are needed
**Reason:** Named slots add consumer ceremony. Only add them when they serve a clear purpose (header/body/footer separation, optional sections).

---

## Risks Of Wrong Choice

* Named slot for single area: Unnecessary `<x-slot:content>` wrapper when `{{ $slot }}` suffices
* No named slots for complex component: Consumer cannot customize header/footer separately
* 4+ named slots: Component API becomes complex, consumers must provide many slots

---

## Related Rules

* Always Provide Slot Defaults with the `??` Operator (05-rules.md)
* Never Create Slot and Prop with the Same Name (05-rules.md)

---

## Related Skills

* Skill: Implement Content Injection with Slots and Stacks

---

## Decision 3: @push vs @prepend for Stack Injection Order

---

## Decision Context

Whether to use `@push` (append to end) or `@prepend` (insert at beginning) when pushing content onto a stack.

---

## Decision Criteria

* Whether the content has load-order dependencies (library before plugin)
* Whether the content is a library (load first) or an extension (load after)
* Whether order among peer items matters

---

## Decision Tree

Does this content need to load BEFORE previously pushed items on the same stack?
↓
YES → `@prepend('stack-name')` — inserts at beginning of the stack
NO → `@push('stack-name')` — appends to end of the stack (default)
NO → Is this content a library dependency that must load before all extensions?
    YES → `@prepend('scripts')` — library loads before plugins
NO → Is this content an extension or plugin that must load after its library?
    YES → `@push('scripts')` — extension loads after base
NO → Does order not matter (CSS files, independent utility scripts)?
    YES → `@push` — simpler and preferred

---

## Rationale

`@push` appends content to the end of the stack. When asset loading order matters (a library must load before its plugins), `@push` places dependencies after dependent scripts. `@prepend` inserts content at the beginning, ensuring critical dependencies load first.

---

## Recommended Default

**Default:** `@push` for all stack injections; `@prepend` only when a specific load order dependency exists
**Reason:** `@push` is simpler and handles the majority of cases. `@prepend` adds complexity that should only be used when load order is critical.

---

## Risks Of Wrong Choice

* `@push` for library: Library loads after plugin, causing JavaScript errors
* `@prepend` for everything: All items prepend, reversing natural order
* Wrong order: `library.js not defined` errors in browser console

---

## Related Rules

* Always Use `@once` for Component Stack Pushes (05-rules.md)
* Standardize Stack Names Across All Layouts (05-rules.md)
* Use `@prepend` for Content That Must Come Before Existing Stack Content (05-rules.md)

---

## Related Skills

* Skill: Implement Content Injection with Slots and Stacks
