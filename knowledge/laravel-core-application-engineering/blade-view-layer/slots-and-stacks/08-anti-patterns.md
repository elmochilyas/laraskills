# ECC Anti-Patterns — Slots and Stacks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Slots and Stacks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using Sections for Assets (Overwrite Instead of Accumulate)
2. Missing `@once` Guard on Component Stack Pushes (Duplicate Assets)
3. Inconsistent Stack Names Across Layouts (Silent Failures)
4. Missing Slot Defaults (Null Output When Slot Omitted)
5. Prop and Slot with the Same Name (Silent Shadowing)

---

## Repository-Wide Anti-Patterns

- Pushing to Undefined Stacks
- Deep Stack Nesting from Obscure Components
- Named Slots When Default `$slot` Suffices
- Using Stacks for Content That Should Be Overridable
- Missing `{{ $slot }}` in Component (Content Disappears)

---

## Anti-Pattern 1: Using Sections for Assets

### Category
Framework Usage | Reliability

### Description
Using `@section('styles')` / `@yield('styles')` for CSS and JavaScript injection instead of `@push('styles')` / `@stack('styles')`, causing asset loss when multiple components push to the same section.

### Why It Happens
Developers are more familiar with `@section`/`@yield` (layout inheritance) and use it everywhere without understanding the accumulate-vs-overwrite distinction.

### Warning Signs
- Layout uses `@yield('styles')` and `@yield('scripts')` instead of `@stack`
- Multiple components define `@section('scripts')` — only the last one renders
- Adding a second component causes the first component's assets to disappear
- "Works with one component, breaks with two" pattern

### Preferred Alternative
Use `@push`/`@stack` for assets (accumulate). Reserve `@section`/`@yield` for page content (overwrite).

### Related Rules
- Rule: Use Stacks for Assets, Sections for Content

---

## Anti-Pattern 2: Missing `@once` Guard on Component Stack Pushes

### Category
Performance

### Description
Pushing assets to a stack inside a component's view without wrapping in `@once`, causing duplicate CSS/JS injection when the component appears multiple times on the same page.

### Why It Happens
Developers test with one component instance and don't think about the multi-instance case.

### Warning Signs
- Same `<script>` or `<link>` tag appears multiple times in the rendered HTML
- Browser console shows "unexpected token" or re-declaration errors from duplicate scripts
- Network tab shows duplicate requests for the same asset
- Multiple instances of the same component on a page

### Preferred Alternative
Always wrap `@push` inside component views with `@once` / `@endonce`.

### Related Rules
- Rule: Always Use `@once` for Component Stack Pushes

---

## Anti-Pattern 3: Inconsistent Stack Names Across Layouts

### Category
Maintainability

### Description
Using different stack names in different layouts (e.g., `@stack('scripts')` in public layout, `@stack('footer-scripts')` in admin layout), causing components to silently fail in some sections.

### Why It Happens
Developers create layouts independently without defining a standard set of stack names.

### Warning Signs
- Components push to `@stack('scripts')` but admin layout stacks `@stack('admin-scripts')`
- Page works in public section but components are unstyled in admin section
- No documented convention for available stack names
- Testing reveals that stack content renders in some layouts but not others

### Preferred Alternative
Define a fixed set of standard stack names in the base layout that all section layouts reuse.

### Related Rules
- Rule: Standardize Stack Names Across All Layouts

---

## Anti-Pattern 4: Missing Slot Defaults

### Category
Design | Reliability

### Description
Using `{{ $header }}` and `{{ $footer }}` without default values (`?? 'Default'`), producing blank or broken output when the consumer omits an optional named slot.

### Why It Happens
Developers assume all named slots will always be provided by the consumer.

### Warning Signs
- Component renders blank areas where optional slots were omitted
- `$header` and `$footer` render as empty or produce PHP notices
- Consumer must provide all named slots to avoid broken render
- No documentation indicating which slots are required vs optional

### Preferred Alternative
Use `{{ $header ?? 'Default' }}` for every named slot. Provide meaningful fallback content.

### Related Rules
- Rule: Always Provide Slot Defaults with the `??` Operator

---

## Anti-Pattern 5: Prop and Slot with the Same Name

### Category
Maintainability

### Description
Naming a component's constructor property `$header` and also defining a named slot `header` in the same component, causing the slot to silently shadow the prop.

### Why It Happens
Developers add a named slot to an existing component that already has a prop with the same descriptive name.

### Warning Signs
- Component prop `$header` value never appears — slot content always wins
- Changing the prop value has no effect on rendered output
- `{{ $header }}` in the template returns slot content, not the prop
- Confusing behavior: component works differently depending on whether consumer provides the slot

### Preferred Alternative
Rename the prop to avoid conflict (e.g., `$headerTitle` instead of `$header`). Prop and slot names must always be distinct.

### Related Rules
- Rule: Never Create Slot and Prop with the Same Name
