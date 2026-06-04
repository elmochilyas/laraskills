## Rule: Use Stacks for Assets, Sections for Content

---

## Category

Framework Usage

---

## Rule

Use `@push`/`@stack` for assets that should accumulate (CSS, JavaScript, meta tags). Use `@section`/`@yield` for content areas that should be overridable. Never use stacks for single-override content areas.

---

## Reason

Stacks accumulate — every `@push` appends to the stack, and `@stack` outputs all content joined together. This is correct for assets where you want multiple pushes from different components to all appear. Sections overwrite — the last `@section` definition wins. Using stacks for content inevitably causes duplication (multiple blocks of content stacked together), while using sections for assets causes asset loss (only the last push survives).

---

## Bad Example

```blade
{{-- Using sections for assets — only last one survives --}}
@section('styles')
    <link href="/css/page.css" rel="stylesheet">
@stop

@section('styles')
    <link href="/css/components.css" rel="stylesheet"> {{-- Overwrites page.css --}}
@stop
```

---

## Good Example

```blade
{{-- Stacks for assets — accumulates --}}
@push('styles')
    <link href="/css/page.css" rel="stylesheet">
@endpush

@push('styles')
    <link href="/css/components.css" rel="stylesheet"> {{-- Both appear --}}
@endpush
```

---

## Exceptions

No common exceptions. The accumulation vs. overwrite distinction is fundamental to how these mechanisms work. Using them incorrectly always produces the wrong result.

---

## Consequences Of Violation

Reliability risks: Assets silently lost or duplicated; content areas show multiple blocks instead of one.

---

## Rule: Always Use `@once` for Component Stack Pushes

---

## Category

Performance

---

## Rule

Wrap every `@push` inside a component's view with `@once` / `@endonce` to prevent duplicate asset injection when the component is used multiple times on the same page.

---

## Reason

When a component appears multiple times on a page (e.g., two instances of a dropdown component), each instance pushes its required CSS/JS to the stack. Without `@once`, the same stylesheet or script tag is injected multiple times, creating duplicate asset loads, redundant HTTP requests, and potential JavaScript re-execution issues.

---

## Bad Example

```blade
{{-- components/dropdown.blade.php --}}
<div x-data="{ open: false }">
    {{-- component content --}}
</div>

@push('scripts')
    <script src="/js/dropdown.js"></script>
@endpush
{{-- Used twice on page → dropdown.js loads twice --}}
```

---

## Good Example

```blade
{{-- components/dropdown.blade.php --}}
<div x-data="{ open: false }">
    {{-- component content --}}
</div>

@once
    @push('scripts')
        <script src="/js/dropdown.js"></script>
    @endpush
@endonce
{{-- Used twice on page → dropdown.js loads once --}}
```

---

## Exceptions

Components that generate unique dynamic assets per instance (rare — typically indicates a design issue) may need to bypass `@once`, but this is almost never the correct approach.

---

## Consequences Of Violation

Performance risks: Duplicate CSS/JS loads; increased page weight and HTTP requests. Reliability risks: JavaScript re-execution may cause event listener duplication or state reset issues.

---

## Rule: Standardize Stack Names Across All Layouts

---

## Category

Maintainability

---

## Rule

Define a fixed set of stack names in the base layout and reuse the same names in every section layout. Document the standard stack names in a project-level convention guide.

---

## Reason

Inconsistent stack names cause silent failures — a component pushing to `@stack('scripts')` is invisible in a layout that uses `@stack('footer-scripts')`. No error is raised; the content simply never appears. Standardized names ensure all components work across all layouts and that developers always know which stacks are available.

---

## Bad Example

```blade
{{-- layouts/public.blade.php --}}
<body>
    @yield('content')
    @stack('public-scripts')
</body>

{{-- layouts/admin.blade.php --}}
<body>
    @yield('content')
    @stack('admin-footer-scripts')
</body>

{{-- Component pushes to @stack('scripts') — invisible in both layouts --}}
```

---

## Good Example

```blade
{{-- layouts/base.blade.php — canonical stack names --}}
<head>
    @stack('styles')
    @stack('head-scripts')
</head>
<body>
    @yield('content')
    @stack('modals')
    @stack('scripts')
</body>

{{-- admin.blade.php extends base — same stack names --}}
{{-- public.blade.php extends base — same stack names --}}
```

---

## Exceptions

When a layout needs a specialized stack that is truly unique to that section (e.g., admin chart initialization scripts that should NEVER exist outside admin), use the documented base stacks plus a prefix: `@stack('admin-chart-scripts')`.

---

## Consequences Of Violation

Reliability risks: Assets and scripts silently missing from pages using different layouts. Maintenance risks: Components are not portable between layouts; each layout requires separate penetration testing for asset injection.

---

## Rule: Always Provide Slot Defaults with the `??` Operator

---

## Category

Design

---

## Rule

Use `{{ $slotName ?? 'Default' }}` for every named slot in a component. Never assume the consumer will always provide content for every slot.

---

## Reason

Named slots are optional — a consumer may omit any slot they do not need. Without a default value, the slot variable is `null`, producing either blank output or a PHP error depending on how the slot is used. Providing defaults ensures the component renders gracefully regardless of which slots the consumer provides.

---

## Bad Example

```blade
{{-- components/card.blade.php --}}
<div class="card">
    <div class="card-header">{{ $header }}</div> {{-- null if omitted --}}
    <div class="card-body">{{ $slot }}</div>
    <div class="card-footer">{{ $footer }}</div> {{-- null if omitted --}}
</div>
```

---

## Good Example

```blade
{{-- components/card.blade.php --}}
<div class="card">
    <div class="card-header">{{ $header ?? 'Card' }}</div>
    <div class="card-body">{{ $slot }}</div>
    @isset($footer)
        <div class="card-footer">{{ $footer }}</div>
    @endisset
</div>
```

---

## Exceptions

Required slots that must always be provided should throw an exception if missing, not silently default. Use `@throw` or a `when(null)` pattern for required slots.

---

## Consequences Of Violation

Reliability risks: Blank or broken output when consumers omit optional slots. Maintenance risks: Consumers discover missing defaults through trial and error rather than documentation.

---

## Rule: Never Create Slot and Prop with the Same Name

---

## Category

Maintainability

---

## Rule

Avoid naming a component's constructor property and a named slot identically. If a prop `$header` exists, do not define a named slot `header` in the same component.

---

## Reason

When a named slot has the same name as a component prop, the named slot takes precedence — the prop becomes inaccessible in the template. This creates confusing behavior where `{{ $header }}` returns slot content instead of the expected prop value. The conflict is silent and hard to debug.

---

## Bad Example

```php
class Card extends Component
{
    public function __construct(
        public string $header = 'Default Title', // Prop named $header
    ) {}
}
```

```blade
@if($header) {{-- This is now the slot, not the prop --}}
    <div class="card-header">{{ $header }}</div>
@endif
<x-slot:header>{{-- Named slot overwrites the prop --}}
    Overridden Title
</x-slot:header>
```

---

## Good Example

```php
class Card extends Component
{
    public function __construct(
        public string $headerTitle = 'Default Title', // Renamed prop
    ) {}
}
```

```blade
@if($headerTitle) {{-- Prop is accessible --}}
    <div class="card-header">{{ $headerTitle ?? $header }}</div>
@endif
```

---

## Exceptions

No common exceptions. Prop and slot names must always be distinct to avoid silent shadowing.

---

## Consequences Of Violation

Maintenance risks: Prop values silently replaced by slot content; confusing debugging. Reliability risks: Component behaves differently than expected based on which slots the consumer provides.

---

## Rule: Use `@prepend` for Content That Must Come Before Existing Stack Content

---

## Category

Framework Usage

---

## Rule

Use `@prepend` when a component's asset must load before previously pushed assets of the same stack (e.g., a library script that must load before dependent plugin scripts).

---

## Reason

`@push` appends content to the end of the stack. When asset loading order matters (a library must load before its plugins), `@push` places dependencies after dependent scripts. `@prepend` inserts content at the beginning of the stack, ensuring critical dependencies load first.

---

## Bad Example

```blade
{{-- Layout stack order: plugin.js loads first, library.js after --}}
{{-- @push('scripts') plugin.js --}}
{{-- @push('scripts') library.js — Wrong order --}}
```

---

## Good Example

```blade
{{-- Component pushes library dependency --}}
@once
    @prepend('scripts')
        <script src="/js/library.js"></script>
    @endprepend
@endonce

{{-- Another component pushes plugin — uses @push --}}
@once
    @push('scripts')
        <script src="/js/plugin.js"></script>
    @endpush
@endonce

{{-- Output: library.js first, then plugin.js --}}
```

---

## Exceptions

When order does not matter (most CSS files, independent utility scripts), `@push` is simpler and preferred. Use `@prepend` only when execution order is semantically important.

---

## Consequences Of Violation

Reliability risks: JavaScript errors from dependencies loading in wrong order (library not defined when plugin initializes). Maintenance risks: Order-dependent bugs that only appear in specific component combinations on the same page.
