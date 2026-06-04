# Slots and Stacks

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Slots and Stacks
- **Difficulty Level:** Intermediate
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Slots and stacks are Blade's content injection mechanisms. **Slots** (`$slot`, named slots) allow component consumers to inject content into predefined areas. **Stacks** (`@push`, `@prepend`, `@stack`) allow content injection from any template depth into a rendered output point (typically `<head>` or footer).

**Engineering distinction:** Slots are for component composition (header, body, footer sections). Stacks are for asset injection (CSS, JS) from children into the parent layout. Both enable clean separation between structure and content.

---

## Core Concepts

### Default Slot
```blade
{{-- component --}}
<div class="card">
    <div class="card-body">{{ $slot }}</div>
</div>

{{-- usage --}}
<x-card><p>Content goes into $slot</p></x-card>
```

### Named Slots
```blade
{{-- component --}}
<div class="card">
    <div class="card-header">{{ $header }}</div>
    <div class="card-body">{{ $slot }}</div>
    <div class="card-footer">{{ $footer }}</div>
</div>

{{-- usage --}}
<x-card>
    <x-slot:header><h2>Title</h2></x-slot:header>
    <p>Main content</p>
    <x-slot:footer><small>Updated today</small></x-slot:footer>
</x-card>
```

### Stacks
```blade
{{-- layout --}}
<head>@stack('styles')</head>
<body>
    @yield('content')
    @stack('scripts')
</body>

{{-- child --}}
@push('styles')
    <link href="/css/page.css" rel="stylesheet">
@endpush
```

### Stack Mechanics
- `@push('name')` — appends content to the stack
- `@prepend('name')` — prepends content to the stack
- `@stack('name')` — outputs all pushed content joined
- `@once` — ensures content is pushed only once per render cycle

### Slot Rendering
Named slots compile to section-like storage:
```php
// @slot('header') content @endslot
// Becomes:
$component->slot('header', ['class' => '...']);
// ... content ...
$component->endSlot();
```

---

## When To Use

- **Component with multiple content areas** — card with header/body/footer
- **Asset injection from child pages** — page-specific CSS/JS into layout
- **Component asset dependencies** — dropdown component pushes its JS from any template depth
- **Conditional content injection** — push content only when a section exists
- **Slot attributes** — passing styles or classes to named slots

---

## When NOT To Use

- **Page-level content areas** — use `@yield`/`@section` for layout inheritance content
- **Single content area in component** — use `{{ $slot }}` alone; named slots add ceremony for one area
- **Overriding a single content slot** — `@section`/`@parent` is clearer for single-source content
- **Server-side computed data** — use view composers or component props, not pushed from templates

---

## Best Practices (WHY)

**WHY use stacks for assets, sections for content.** Stacks accumulate (all pushes merge into one output). Sections overwrite (last definition wins). Assets should accumulate; content areas should be overridable.

**WHY standardize stack names across all layouts.** `@stack('styles')`, `@stack('scripts')`, `@stack('head')` — consistent naming ensures components and child pages work across any layout.

**WHY use @once for component-level stack pushes.** Without `@once`, two instances of the same component on a page push duplicate CSS/JS. `@once` guarantees single injection.

**WHY provide slot defaults with ?? operator.** `{{ $header ?? 'Default' }}` ensures the component renders gracefully when the consumer omits a named slot. Without defaults, `$header` is null.

**WHY always include {{ $slot }} in components.** A component that omits `{{ $slot }}` silently discards all child content. Unless the component intentionally discards children (rare), always output the slot.

---

## Architecture Guidelines

### Standard Stack Names
```blade
@stack('styles')        {{-- CSS link tags --}}
@stack('head-scripts')  {{-- Scripts in <head> --}}
@stack('modals')        {{-- Modal dialog containers --}}
@stack('scripts')       {{-- Body scripts --}}
```

### Slot vs @yield Decision
| Concern | Slots (in components) | @yield (in layouts) |
|---|---|---|
| Scope | Component instance | Page layout |
| Named areas | Via named slots | Via named yields |
| Default content | `??` operator | @yield second parameter |
| Parent preservation | Not built-in | @parent directive |

### Deduplication Pattern
```blade
@once
    @push('scripts')
        <script src="/js/dropdown.js"></script>
    @endpush
@endonce
```

---

## Performance

- Slots: O(1) array push per slot, O(1) array access per render
- Stacks: O(1) per push, O(n) on `@stack` (joins all content)
- For typical usage (<20 slots/stacks per page): overhead under 0.01ms
- Slot attributes add negligible overhead (attribute bag creation)

---

## Security

- `{{ $slot }}` escapes HTML — use `{!! $slot !!}` only for trusted content
- Stack content pushed from child templates is rendered as-is — escape user data before pushing
- Slot attribute values are escaped automatically by the attribute bag

---

## Common Mistakes

### 1. Slot variable naming conflict
- **Description:** Component has prop `$header` AND named slot `header`
- **Cause:** Same name used for both prop and slot
- **Consequence:** Named slot takes precedence; prop is inaccessible
- **Better:** Rename the prop (`$headerTitle`) or use different slot name

### 2. Missing {{ $slot }} in component
- **Description:** Component does not output `{{ $slot }}`
- **Cause:** Forgetting to include the default slot in the template
- **Consequence:** All content between component tags is silently discarded
- **Better:** Always include `{{ $slot }}` unless intentionally discarding

### 3. Stack name typos
- **Description:** Pushing to `@push('script')` and stacking `@stack('scripts')`
- **Cause:** Name mismatch between push and stack
- **Consequence:** Content never appears; no error or warning
- **Better:** Standardize stack names and document them

### 4. Stack content duplication
- **Description:** Two instances of same component both push to stack
- **Cause:** No `@once` guard
- **Consequence:** CSS/JS loaded twice on the same page
- **Better:** Wrap stack pushes in `@once` / `@endonce`

### 5. Slot content escaping confusion
- **Description:** Slot content with HTML is escaped unexpectedly
- **Cause:** Using `{{ $slot }}` for HTML content
- **Consequence:** HTML tags display as text, not rendered
- **Better:** Use `{!! $slot !!}` for trusted HTML, `{{ $slot }}` for text

---

## Anti-Patterns

- **Using stacks for content that should be overridable.** A stack accumulates — if you need a single override point, use `@section`/`@yield`.
- **Pushing to undefined stacks.** A stack name that doesn't exist in any layout pushes into nothing. Always define all stack names in the base layout.
- **Deep stack nesting from obscure components.** A component nested 5 levels deep pushing to `scripts` makes asset dependency tracking implicit and hard to debug.
- **Named slots when one suffices.** A component with only a header slot and default slot doesn't need named slots — just use `$slot` and an optional prop.

---

## Examples

### Card Component with Slot Defaults
```blade
<div class="card">
    <div class="card-header">
        {{ $header ?? 'Card' }}
    </div>
    <div class="card-body">
        {{ $slot }}
    </div>
    @isset($footer)
        <div class="card-footer">{{ $footer }}</div>
    @endisset
</div>
```

### Dropdown with Self-Contained Script
```blade
{{-- components/dropdown.blade.php --}}
<div x-data="{ open: false }" @click.away="open = false">
    <button @click="open = !open">{{ $trigger }}</button>
    <div x-show="open">{{ $slot }}</div>
</div>

@once
    @push('scripts')
        <script src="/js/dropdown.js"></script>
    @endpush
@endonce
```

### Multiple Stacks for Different Purposes
```blade
{{-- layouts/base.blade.php --}}
<head>
    @stack('styles')
    @stack('head-scripts')
</head>
<body>
    @yield('content')
    @stack('modals')
    @stack('scripts')
</body>
```

---

## Related Topics

- **Component System** — component composition with slots
- **Template Inheritance** — layout yields vs component slots
- **Custom Directives** — custom @push variants
- **Blade with Alpine.js** — stacking Alpine component scripts
- **Layout Strategies** — asset loading per layout

---

## AI Agent Notes

- Named slots were introduced in Laravel 7 as part of the component system overhaul
- `@once` directive was added in Laravel 8 to prevent duplicate stack content
- Slot attribute system (`$header->attributes`) was added in Laravel 9
- Slot name casing: `x-slot:header` and `<x-slot name="header">` are equivalent
- `@prepend` is the mirror of `@push` — adds content to the beginning of the stack
- Stack output order: prepends first (in registration order), then pushes (in registration order)
- Slots and stacks are compiled — no runtime interpretation overhead

---

## Verification

- [ ] Default slot renders content between component tags
- [ ] Named slots render in correct component positions
- [ ] `@push('scripts')` content appears at `@stack('scripts')` in layout
- [ ] `@prepend` content appears before `@push` content in the same stack
- [ ] `@once` prevents duplicate stack content on multiple component instances
- [ ] Slot default (via `??`) renders when consumer omits the slot
- [ ] No stack name typos between push and stack directives
- [ ] `{{ $slot }}` is present in all components except those intentionally discarding
