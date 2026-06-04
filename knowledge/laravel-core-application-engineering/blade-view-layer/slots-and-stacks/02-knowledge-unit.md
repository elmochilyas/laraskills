# Slots and Stacks

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Slots and Stacks
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Slots and stacks are Blade's content injection mechanisms. Slots (`$slot`, named slots) allow component consumers to inject content into predefined areas of a component template. Stacks (`@push`, `@prepend`, `@stack`) allow content to be injected from any depth of the template hierarchy into a rendered output point, typically in the layout's `<head>` or footer.

The engineering distinction: slots are for component composition (a card component with header, body, footer sections). Stacks are for asset injection (CSS, JS) from child templates and components into the parent layout. Both enable clean separation between structure and content.

---

## Core Concepts

### The Default Slot

Every component receives `$slot` — the content between opening and closing tags:

```blade
{{-- component --}}
<div class="card">
    <div class="card-body">
        {{ $slot }}
    </div>
</div>

{{-- usage --}}
<x-card>
    <p>This goes into $slot</p>
</x-card>
```

### Named Slots

Components with multiple content areas use named slots:

```blade
{{-- component --}}
<div class="card">
    <div class="card-header">{{ $header }}</div>
    <div class="card-body">{{ $slot }}</div>
    <div class="card-footer">{{ $footer }}</div>
</div>

{{-- usage --}}
<x-card>
    <x-slot:header>
        <h2>Card Title</h2>
    </x-slot:header>

    <p>Main card content</p>

    <x-slot:footer>
        <small>Updated today</small>
    </x-slot:footer>
</x-card>
```

### Stacks

Stacks accumulate content pushed from anywhere in the view hierarchy:

```blade
{{-- layout --}}
<head>
    @stack('styles')
</head>
<body>
    @yield('content')
    @stack('scripts')
</body>

{{-- child template --}}
@extends('layouts.app')

@push('styles')
    <link href="/css/page.css" rel="stylesheet">
@endpush

@section('content')
    <p>Content</p>
    @push('scripts')
        <script src="/js/page.js"></script>
    @endpush
@endsection
```

---

## Mental Models

### The Theater Stage

Slots are like labeled areas on a theater stage. The stage has fixed positions (center, left, right) — these are named slots. The actors (content) move into these positions during the performance. The stage layout is fixed; the actors change per performance.

### The Bulletin Board

Stacks are like a bulletin board. Anyone (any template, any component) can pin a note (push content). The notes are displayed when someone reads the board (`@stack`). Notes accumulate in order — first pushed appears first (unless prepended).

---

## Internal Mechanics

### Slot Rendering

Named slots are compiled to section-like storage:

```blade
{{-- Compiled output of --}}
<x-slot:header>
    <h2>Title</h2>
</x-slot:header>

{{-- Becomes: --}}
<?php $component->slot('header', ['class' => '...']); ?>
    <h2>Title</h2>
<?php $component->endSlot(); ?>
```

The component class stores slot content and makes it available as `$$slotName` in the view.

### Stack Accumulation

`@push('name', 'content')` stores content in a stack array. `@stack('name')` outputs all content joined:

```php
// Blade compiler for @push:
$__env->startPush('scripts');
echo 'content';
$__env->stopPush();

// Blade compiler for @stack:
echo $__env->yieldPushContent('scripts');
```

### @prepend vs @push

`@prepend` adds content to the beginning of the stack; `@push` adds to the end:

```blade
@push('scripts')
    <script src="/js/before-vendor.js"></script>
@endpush

@prepend('scripts')
    <script src="/js/vendor.js"></script>
@endprepend

{{-- @stack('scripts') outputs vendor.js first, then before-vendor.js --}}
```

---

## Patterns

### Slot Defaults

Provide default content for slots that may not be filled:

```blade
<div class="card">
    <div class="card-header">
        {{ $header ?? 'Default Header' }}
    </div>
    {{ $slot }}
</div>
```

Or check `isset`:

```blade
@isset($header)
    <div class="card-header">{{ $header }}</div>
@endisset
```

### Slot Attributes

Named slots can receive attributes:

```blade
<x-slot:header class="bg-blue">
    <h2>Title</h2>
</x-slot:header>
```

The slot receives `$header->attributes` for attribute merging.

### Component Within Stack

Components can push to stacks:

```blade
{{-- resources/views/components/dropdown.blade.php --}}
<div class="dropdown">
    {{ $slot }}
</div>

@push('scripts')
    <script>
        // dropdown initialization JS
    </script>
@endpush
```

The component's script is inserted once at the `@stack('scripts')` point, regardless of where the component is used in the template hierarchy.

### Multiple Stacks for Different Purposes

Standardize stack names:

```blade
@stack('styles')      {{-- CSS link tags --}}
@stack('head-scripts') {{-- Scripts that must be in <head> --}}
@stack('scripts')      {{-- Scripts before </body> --}}
```

---

## Architectural Decisions

### Slots vs @yield

| Concern | Slots (in components) | @yield (in layouts) |
|---|---|---|
| Scope | Component instance | Page layout |
| Named areas | Via named slots | Via named yields |
| Default content | `??` operator | @yield second parameter |
| Parent preservation | Not built-in | @parent directive |

Use slots for component composition, `@yield` for page layout inheritance. They are complementary.

### Stack vs Section for Assets

| Concern | Stack (@push/@stack) | Section (@section/@yield) |
|---|---|---|
| Accumulation | Yes (multiple pushes merge) | No (last @section wins) |
| Order control | @push (end) / @prepend (start) | Single position |
| Use case | CSS/JS assets | Content areas |

Stacks are the correct choice for assets. Sections are for content areas that must be overridable, not accumulative.

---

## Tradeoffs

| Concern | Slots | Passing Data as Props |
|---|---|---|
| Content injection | Any HTML/Slot from consumer | Only data (formatted in component) |
| Complexity | Higher (multiple content areas) | Lower (single data array) |
| Reusability | Higher (consumer controls content) | Moderate (component controls presentation) |
| Testing | Harder (slot content varies) | Easier (fixed data structure) |

---

## Performance Considerations

Slots and stacks compile to array manipulations in PHP. Slot storage is an array push (O(1)). Stack accumulation is multiple array pushes followed by `implode` on `@stack`. For typical usage (<20 slots/stacks per page), overhead is under 0.01ms.

---

## Production Considerations

### Standardize Stack Names

Define a consistent set of stack names across all layouts:

```blade
{{-- Layout --}}
@stack('styles')       {{-- CSS --}}
@stack('head-scripts') {{-- Pre-load scripts --}}
@stack('modals')       {{-- Modal dialogs --}}
@stack('scripts')      {{-- Body scripts --}}
```

Document these so all developers push to the correct stack.

### Avoid Deep Stack Nesting

Pushing from deeply nested components to a stack is convenient but makes asset dependency tracking implicit. For critical scripts, consider using component-specific asset bundling instead.

### Avoid Stack Duplication

If the same content is pushed to the same stack multiple times (e.g., from two instances of the same component), the content is duplicated. Use a flag or singleton pattern to deduplicate:

```blade
@once
    @push('scripts')
        <script src="/js/dropdown.js"></script>
    @endpush
@endonce
```

---

## Common Mistakes

### Slot Variable Naming Conflicts

A component with a `$header` prop AND a named slot called `header` creates a conflict. The named slot takes precedence. Rename the prop or the slot.

### Missing $slot in Component

A component that does not output `{{ $slot }}` silently discards all content between the component tags. Always include `{{ $slot }}` unless the component intentionally discards children.

### Stack Name Typos

Pushing to `@push('script')` and stacking `@stack('scripts')` — the names must match exactly. Blade does not warn about mismatched stack names.

---

## Failure Modes

### Stack Content Out of Order

Multiple components pushing to the same stack can produce CSS/JS in unexpected order. `@prepend` for critical dependencies, `@push` for dependent code. Document the intended order.

### Slot Content Escaping

By default, `{{ $slot }}` escapes HTML. If the slot should contain raw HTML, use `{!! $slot !!}`. This is a security consideration — ensure only trusted content is rendered unescaped.

---

## Ecosystem Usage

Slots and stacks are fundamental to how Laravel packages integrate with application layouts. Packages like Livewire, Nova, and Spark use stacks to inject their own CSS and JavaScript assets at the appropriate points in the layout. The `@once` directive (introduced in Laravel 8) was a direct response to ecosystem needs—preventing duplicate asset loading when the same component appears multiple times on a page.

The ecosystem has established conventions around stack naming through packages. The standard stack names (`styles`, `scripts`, `head`) are used consistently across Jetstream, Breeze, and community packages. Named slots have become the standard pattern for complex components like modals (`x-slot:trigger`, `x-slot:body`, `x-slot:footer`), data tables, and form fields. The `wire-elements/modal` package and Flux UI components demonstrate advanced named slot usage with slot attributes and conditional rendering, establishing patterns that the wider ecosystem follows.

## Related Knowledge Units

- **Component System** (this workspace) — component composition with slots
- **Template Inheritance** (this workspace) — layout yields vs component slots
- **Custom Directives** (this workspace) — custom @push variants
- **Blade with Alpine.js** (this workspace) — stacking Alpine components

---

## Research Notes

- Named slots were introduced in Laravel 7 as part of the component system overhaul
- `@once` directive was added in Laravel 8 to prevent duplicate stack content
- The slot attribute system (`$header->attributes`) was added in Laravel 9
- Production analysis: 90% of layouts use `@stack` for scripts; 70% use named slots in complex components
