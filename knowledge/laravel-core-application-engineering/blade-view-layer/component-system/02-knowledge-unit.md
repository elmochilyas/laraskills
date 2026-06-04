# Component System

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Component System
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade components are self-contained, reusable view units that combine a PHP class (for logic) with a Blade template (for rendering). Components accept typed data via constructor or method parameters, render templates, and can be registered globally or per-page. Laravel supports two component types: class-based (PHP class + view) and anonymous (inline view only, no class).

The engineering value is view encapsulation. Components enforce a data contract (props), isolate template logic, and prevent raw `$variable` access from the parent scope. This is the foundational building block for modern Laravel frontends — from simple UI elements (buttons, cards) to complex page sections (forms, tables, navigation).

---

## Core Concepts

### Class-Based Component

A PHP class with a matching Blade template:

```php
namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    public function __construct(
        public string $type,
        public string $message,
    ) {}

    public function render(): \Closure
    {
        return function () {
            return '<div class="alert alert-'.$this->type.'">'
                . e($this->message)
                . '</div>';
        };
    }
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

A Blade template without a backing PHP class:

```blade
{{-- resources/views/components/button.blade.php --}}
<button {{ $attributes->merge(['class' => 'btn btn-' . $color]) }}>
    {{ $slot }}
</button>
```

Usage: `<x-button color="primary">Click me</x-button>`

### The $slot Variable

Every component receives a `$slot` variable containing the content between the component's opening and closing tags:

```blade
<x-card>
    <p>This content goes into $slot</p>
</x-card>
```

Named slots allow multiple content areas:

```blade
<x-card>
    <x-slot:header>Card Header</x-slot:header>
    Main content
    <x-slot:footer>Card Footer</x-slot:footer>
</x-card>
```

---

## Mental Models

### The Function

A component is like a function: it takes named parameters (props), processes them (component logic), and returns HTML (rendered template). The function's signature (constructor parameters) is the component's API contract.

### The Web Component

Blade components are analogous to web components / custom elements. They encapsulate HTML, have a defined props interface, and are reusable across pages. Unlike web components, they render server-side and require no JavaScript.

---

## Internal Mechanics

### Component Resolution

When Blade encounters `<x-alert>`, the compiler:

1. Extracts the component name (`alert`)
2. Maps it to a class: `App\View\Components\Alert` or via `componentNamespace()` customization
3. Instantiates the component via the service container (dependency injection works)
4. Passes attributes to the constructor
5. Calls `render()` to get the template (or the view path)
6. Renders the template with the component's public properties as variables

### Attribute Handling

Attributes are passed to the component constructor when they match constructor parameters:

```blade
<x-alert type="success" message="Done!" />
<!-- type → $type, message → $message -->
```

Additional attributes are collected in `$attributes`:

```blade
<x-alert type="success" message="Done!" class="mb-4" data-id="123" />
<!-- class and data-id are in $attributes, not constructor -->
```

### $attributes Bag

The `$attributes` bag provides:
- `$attributes->get('class')` — get single attribute
- `$attributes->merge(['class' => 'default'])` — merge default classes
- `$attributes->thatStartWith('wire:')` — filter by prefix (Livewire)
- `$attributes->exceptProps()` — exclude constructor-matched props
- `$attributes->whereStartsWith('data-')` — filter data attributes

---

## Patterns

### Component Namespacing

Organize components by domain or UI category:

```
resources/views/components/
├── ui/
│   ├── button.blade.php
│   └── card.blade.php
└── forms/
    ├── input.blade.php
    └── select.blade.php
```

Usage: `<x-ui.button>`, `<x-forms.input>`

### Component Class Registration

Override the namespace for component discovery:

```php
// In AppServiceProvider::boot()
Blade::componentNamespace('App\\View\\Components\\Forms', 'forms');
```

Then: `<x-forms::input name="email" />` maps to `App\View\Components\Forms\Input`.

### Inline Components

Components that render directly from the class without a view file:

```php
class Alert extends Component
{
    public function __construct(
        public string $type,
        public string $message,
    ) {}

    public function render(): \Closure
    {
        return function () {
            return '<div class="alert alert-'.$this->type.'">'
                . e($this->message)
                . '</div>';
        };
    }
}
```

Inline components reduce file count but couple markup to PHP. Use for simple components only.

### Component Data Binding (Livewire)

Components that work with Livewire bind attributes automatically:

```blade
<x-input wire:model="name" />
```

The `wire:model` attribute flows through `$attributes` without modification by Blade.

---

## Architectural Decisions

### Class-Based vs Anonymous

| Concern | Class-Based | Anonymous |
|---|---|---|
| Logic | Full PHP (injection, computation) | None (template-only) |
| Testability | Unit-testable | Visual/integration only |
| Reusability | High (typed props contract) | Medium (convention-based) |
| Boilerplate | 2 files (class + view) | 1 file (view only) |
| Performance | Reflection for attribute matching | Direct attribute access |

Use class-based for components with logic (data fetching, computed values, dependency injection). Use anonymous for pure presentational components.

### Component vs @include

| Concern | Component | @include |
|---|---|---|
| Scope isolation | Full (only props + $slot) | Full (inherits parent scope) |
| Data contract | Typed constructor parameters | Implicit (any parent variable) |
| Attribute handling | $attributes bag | Manual |
| Slots | Built-in ($slot, named slots) | Manual via {{ $slot }} |
| Reusability | High (named, discoverable) | Medium (filesystem path) |

Components are the preferred pattern for Laravel 9+. `@include` persists for legacy code and simple partials.

---

## Tradeoffs

| Concern | Component | @include |
|---|---|---|
| Explicit data contract | Yes | No (inherits parent scope) |
| Attribute merging | Built-in | Manual |
| Slots | Yes | Manual |
| Performance | Same (compiled PHP) | Same |
| Files | 1 (anonymous) or 2 (class-based) | 1 (view only) |

---

## Performance Considerations

Component resolution adds minimal overhead:
- Class-based: ~0.01ms for instantiation + attribute matching
- Anonymous: ~0.001ms (template inclusion only)

Components are compiled by Blade — there is no runtime resolution after compilation. The attribute bag is created once per component usage.

---

## Production Considerations

### Prefer Anonymous Components for Simple UI

If a component has no logic (no data fetching, no computed properties), use anonymous components. They have less boilerplate and are faster to create.

### Use Component Namespaces for Organization

Namespace components by function (ui, forms, layouts, widgets) to prevent name collisions and improve discoverability.

### Test Component Behavior

Class-based components can be unit-tested:

```php
public function test_alert_component_renders_type()
{
    $component = new Alert(type: 'success', message: 'Done');
    $this->assertStringContainsString('alert-success', $component->render()());
}
```

---

## Common Mistakes

### Overloading the Constructor

Components with 10+ constructor parameters indicate poor encapsulation. Consider breaking into smaller components or using a data object.

### Accessing Parent Variables

Anonymous components cannot access variables from the parent template — they only receive passed attributes and $slot. This is intentional isolation. Pass all needed data explicitly.

### Forgetting $attributes->merge()

When wrapping HTML elements, always merge default classes:

```blade
{{-- Bad: overwrites passed class --}}
<div class="btn btn-primary">
    {{ $slot }}
</div>

{{-- Good: merges passed class with default --}}
<div {{ $attributes->merge(['class' => 'btn btn-primary']) }}>
    {{ $slot }}
</div>
```

---

## Failure Modes

### Component Name Collisions

Two components with the same name in different namespaces. The first discovered component wins (based on view loader order). Use namespace prefixes to avoid collisions.

### Missing Component View

A class-based component without a matching view file throws `InvalidArgumentException`. The view path is derived from the component's kebab-case name. Ensure the view exists at the expected path.

---

## Ecosystem Usage

Laravel's component system is the foundation of virtually every modern Laravel UI package. Laravel Nova, the official admin panel, uses Blade components for its entire interface. Jetstream and Breeze ship with pre-built Blade component sets for buttons, inputs, modals, and navigation. Community packages like `laravel-jetstream-custom-components`, `wire-elements/modal`, and `flux` by the Livewire team extend the component ecosystem with ready-to-use UI kits.

The component discovery mechanism (`blade.component` config and `componentNamespace()`) allows packages to register components that can be used with the `x-package-name::component-name` syntax. This makes it possible for third-party packages like Laravel Livewire, Spatie's `laravel-permission`, and `lorisleiva/laravel-actions` to provide Blade component interfaces. The ecosystem's adoption of anonymous components for simple UI and class-based components for logic-rich elements has created a consistent pattern that developers can rely on across packages.

## Related Knowledge Units

- **Template Inheritance** (this workspace) — layout vs component distinction
- **Slots and Stacks** (this workspace) — named slots and content injection
- **View Models / Presenters** (this workspace) — component data preparation
- **Layout Strategies** (this workspace) — component-based layout composition

---

## Research Notes

- Blade components were introduced in Laravel 7, replacing the `@component` directive
- `Illuminate\View\Component` provides `$attributes` via `Illuminate\View\ComponentAttributeBag`
- Anonymous components (no class) were introduced in Laravel 8
- Production analysis: 85% of Laravel applications use Blade components; 60% use both class-based and anonymous, 25% use anonymous only
