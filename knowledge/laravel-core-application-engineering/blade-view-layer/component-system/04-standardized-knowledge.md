# Component System

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Component System
- **Difficulty Level:** Foundation
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade components are self-contained, reusable view units combining a PHP class (for logic) with a Blade template (for rendering). Components accept typed data via constructor parameters, render templates, and can be registered globally or per-page. Two types exist: **class-based** (PHP class + view) and **anonymous** (view only).

**Engineering value:** View encapsulation. Components enforce a data contract (props), isolate template logic, and prevent raw `$variable` access from the parent scope. This is the foundational building block for modern Laravel frontends.

---

## Core Concepts

### Class-Based Component
```php
namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    public function __construct(
        public string $type,
        public string $message,
    ) {}
}
```
```blade
{{-- resources/views/components/alert.blade.php --}}
<div class="alert alert-{{ $type }}">
    {{ $message }}
</div>
```
Usage: `<x-alert type="success" message="Saved!" />`

### Anonymous Component
```blade
{{-- resources/views/components/button.blade.php --}}
<button {{ $attributes->merge(['class' => 'btn btn-' . $color]) }}>
    {{ $slot }}
</button>
```
Usage: `<x-button color="primary">Click me</x-button>`

### The $slot Variable
Every component receives `$slot` — content between opening/closing tags:
```blade
<x-card>
    <p>This goes into $slot</p>
</x-card>
```

### Component Resolution
When Blade encounters `<x-alert>`:
1. Extracts component name (`alert`)
2. Maps to class: `App\View\Components\Alert`
3. Instantiates via service container (DI works)
4. Passes matching attributes to constructor
5. Calls `render()` to get the template
6. Renders with public properties as variables

### $attributes Bag
- `$attributes->get('class')` — get single attribute
- `$attributes->merge(['class' => 'default'])` — merge default classes
- `$attributes->thatStartWith('wire:')` — filter by prefix
- `$attributes->exceptProps()` — exclude constructor-matched props

---

## When To Use

- **Reusable UI pieces** — buttons, cards, modals, form inputs
- **Logic-backed view fragments** — components that fetch data or compute values
- **Scoped templates** — when a partial should NOT inherit parent scope
- **Slot-based layouts** — card with header/body/footer slots
- **Component testing** — when you need to unit-test view logic
- **Package UI integration** — `x-package::component-name` syntax

---

## When NOT To Use

- **Simple partials with no logic** — use `@include` for stateless inline snippets
- **Page-level layout structure** — use `@extends`/`@yield` for layout inheritance
- **Single-use view fragments** — a component used once on one page doesn't need a class
- **Data formatting only** — use a helper function or view model instead
- **10+ constructor parameters** — indicates poor encapsulation; break into smaller components

---

## Best Practices (WHY)

**WHY prefer anonymous for presentational components.** Anonymous components have less boilerplate (one file, no class) and faster resolution (no container instantiation). A button with only style variations needs no logic class.

**WHY use class-based for logic-rich components.** Constructor injection, computed properties, and dependency resolution work naturally in class components. An alert component that fetches user preferences needs a class.

**WHY always merge $attributes.** `{{ $attributes->merge(['class' => 'btn']) }}` ensures consumers can pass additional classes without overwriting defaults. Without merge, passed classes silently disappear.

**WHY namespace components by domain.** `x-ui.button`, `x-forms.input`, `x-layouts.card` prevents name collisions and improves discoverability in large projects.

**WHY keep constructor parameters under 5.** Each parameter is part of the component's public contract. 5+ parameters mean the component does too much. Split into smaller components or use a data object.

---

## Architecture Guidelines

### Component Namespace Organization
```
resources/views/components/
├── ui/
│   ├── button.blade.php
│   └── card.blade.php
├── forms/
│   ├── input.blade.php
│   └── select.blade.php
└── layouts/
    ├── header.blade.php
    └── sidebar.blade.php
```

### Custom Component Namespace Registration
```php
Blade::componentNamespace('App\\View\\Components\\Forms', 'forms');
```
Then: `<x-forms::input name="email" />` maps to `App\View\Components\Forms\Input`.

### Class-Based vs Anonymous Decision
| Concern | Class-Based | Anonymous |
|---|---|---|
| Logic | Full PHP (injection, computation) | None (template-only) |
| Testability | Unit-testable | Visual/integration only |
| Reusability | High (typed props contract) | Medium (convention-based) |
| Boilerplate | 2 files (class + view) | 1 file (view only) |
| Performance | Reflection for attribute matching | Direct attribute access |

---

## Performance

- Class-based component: ~0.01ms for instantiation + attribute matching
- Anonymous component: ~0.001ms (template inclusion only)
- Components are compiled — no runtime resolution after compilation
- The `$attributes` bag is created once per component usage
- For 20 components per page: ~0.2-0.5ms (class-based) or ~0.05ms (anonymous)

---

## Security

- **XSS prevention:** `{{ $slot }}` escapes HTML automatically. Use `{!! $slot !!}` only for trusted HTML content.
- **Attribute escaping:** Component attributes are escaped when rendered. Raw strings in `$attributes->merge()` are not escaped — avoid passing user input as attribute values.
- **Constructor injection:** Component classes have full access to the service container — never expose container-bound functionality that could mutate state when rendering.

---

## Common Mistakes

### 1. Forgetting $attributes->merge()
- **Description:** Component wraps an HTML element but overwrites passed classes
- **Cause:** `class="btn btn-primary"` hardcoded instead of merged
- **Consequence:** Caller's `class="mb-4"` is silently discarded
- **Better:** Use `$attributes->merge(['class' => 'btn btn-primary'])` on the wrapper element

### 2. Overloading constructor with 10+ parameters
- **Description:** Component accepts excessive props
- **Cause:** Component doing too much; no decomposition
- **Consequence:** Hard to use, hard to test, brittle to changes
- **Better:** Break into smaller components or pass a data object

### 3. Accessing parent variables in anonymous components
- **Description:** Assuming `$user` from controller is available in anonymous component
- **Cause:** Confusing `@include` scope inheritance with component isolation
- **Consequence:** Variable is null; component silently fails or throws
- **Better:** Pass all needed data as component attributes explicitly

### 4. Component name collision
- **Description:** Two components with same name in different namespaces
- **Cause:** Lack of naming convention or namespace prefix
- **Consequence:** First discovered component wins (based on view loader order)
- **Better:** Use namespace prefixes: `x-ui.button`, `x-forms.button`

### 5. Missing component view file
- **Description:** Class-based component without matching view file
- **Cause:** View path derived from component's kebab-case name doesn't exist
- **Consequence:** `InvalidArgumentException` on render
- **Better:** Ensure `resources/views/components/alert.blade.php` exists for `Alert` component

---

## Anti-Patterns

- **Components for everything.** Simple variable interpolation in a loop doesn't need a component. Start with inline code, extract to component when reused.
- **Stateful components.** Components should render based on their props — they should not have settable public properties that mutate between renders.
- **Component-in-component-in-component.** 5+ levels of component nesting makes debugging and performance tracing difficult.
- **Logic in anonymous components.** An anonymous component with `@php` blocks doing database queries would be better as a class-based component.

---

## Examples

### Alert Component with Slot
```blade
{{-- components/alert.blade.php --}}
<div {{ $attributes->merge(['class' => 'alert alert-' . ($type ?? 'info')]) }}>
    {{ $slot }}
</div>

{{-- usage --}}
<x-alert type="success" class="mb-4">
    <strong>Success!</strong> Your changes have been saved.
</x-alert>
```

### Card Component with Named Slots
```blade
{{-- components/card.blade.php --}}
<div class="card">
    @isset($header)
        <div class="card-header">{{ $header }}</div>
    @endisset
    <div class="card-body">{{ $slot }}</div>
    @isset($footer)
        <div class="card-footer">{{ $footer }}</div>
    @endisset
</div>

{{-- usage --}}
<x-card>
    <x-slot:header>User Profile</x-slot:header>
    <p>Name: {{ $user->name }}</p>
    <p>Email: {{ $user->email }}</p>
    <x-slot:footer>
        <small>Last updated: {{ $user->updated_at->diffForHumans() }}</small>
    </x-slot:footer>
</x-card>
```

### Inline Component (no view file)
```php
class Alert extends Component
{
    public function __construct(public string $type, public string $message) {}

    public function render(): \Closure
    {
        return function () {
            return '<div class="alert alert-' . $this->type . '">'
                . e($this->message) . '</div>';
        };
    }
}
```

---

## Related Topics

- **Template Inheritance** — layout vs component distinction
- **Slots and Stacks** — named slots and content injection
- **View Models / Presenters** — component data preparation
- **Layout Strategies** — component-based layout composition
- **Blade Testing** — testing class-based components
- **Custom Directives** — component vs directive comparison

---

## AI Agent Notes

- Components were introduced in Laravel 7, replacing the `@component` directive
- `Illuminate\View\Component` provides `$attributes` via `Illuminate\View\ComponentAttributeBag`
- Anonymous components (no class) introduced in Laravel 8
- Component auto-discovery scans `app/View/Components/` with `resources/views/components/`
- Class-based components can define `shouldRender()` to skip rendering conditionally
- Components support `withAttributes()` for programmatic attribute injection
- The `component()` helper renders components from PHP: `echo component('alert', ['type' => 'success'])`

---

## Verification

- [ ] Component renders with correct props and slot content
- [ ] `$attributes->merge()` preserves passed attributes with defaults
- [ ] Named slots render in correct positions
- [ ] Anonymous component receives only passed attributes (no parent scope leak)
- [ ] Class-based component injects dependencies via constructor
- [ ] Component is discoverable via its `x-` alias
- [ ] No constructor parameter exceeds 5 (reasonable boundary)
- [ ] Component tests pass for data contract and rendering
