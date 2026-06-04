## Rule: Always Merge `$attributes` on Wrapper Elements

---

## Category

Design

---

## Rule

Use `$attributes->merge(['class' => 'default-class'])` on the root HTML element of every component that accepts additional HTML attributes from the consumer.

---

## Reason

Without `$attributes->merge()`, consumer-passed attributes (like `class="mb-4"` or `x-data="{...}"`) are silently discarded. The component's hardcoded attributes always win. Merging ensures that consumer customizations compose with component defaults without breaking existing styling.

---

## Bad Example

```blade
{{-- components/button.blade.php --}}
<button class="btn btn-primary">
    {{ $slot }}
</button>
{{-- Usage: <x-button class="w-full">Submit</x-button> --}}
{{-- class="w-full" is silently discarded --}}
```

---

## Good Example

```blade
{{-- components/button.blade.php --}}
<button {{ $attributes->merge(['class' => 'btn btn-primary']) }}>
    {{ $slot }}
</button>
{{-- Usage: <x-button class="w-full">Submit</x-button> --}}
{{-- Result: class="btn btn-primary w-full" --}}
```

---

## Exceptions

Components that should NOT accept arbitrary HTML attributes (e.g., internal structural components that encapsulate their own markup) may omit the merge pattern, but this must be documented.

---

## Consequences Of Violation

Maintenance risks: Consumers discover silently ignored attributes; confusion and workarounds. Reliability risks: Styling and behavior customizations fail without errors.

---

## Rule: Prefer Anonymous Components for Presentational UI, Class-Based for Logic

---

## Category

Architecture

---

## Rule

Use anonymous components (single view file, no class) for stateless, presentational UI pieces like buttons, badges, and cards. Use class-based components (PHP class + view) when the component requires dependency injection, computed properties, or data retrieval.

---

## Reason

Anonymous components have zero class instantiation overhead, one file instead of two, and no reflection-based attribute matching. Class-based components provide constructor injection, unit-testable logic, and the ability to conditionally render via `shouldRender()`. Choosing the wrong type adds unnecessary complexity or misses needed functionality.

---

## Bad Example

```php
// Class for a simple button — unnecessary boilerplate
class Button extends Component
{
    public function __construct(public string $color = 'primary') {}
}
```

```blade
{{-- components/button.blade.php --}}
<button {{ $attributes->merge(['class' => "btn btn-$color"]) }}>
    {{ $slot }}
</button>
```

---

## Good Example

```blade
{{-- Anonymous component: components/button.blade.php --}}
<button {{ $attributes->merge(['class' => 'btn btn-primary']) }}>
    {{ $slot }}
</button>
```

---

## Exceptions

When a presentational component must be unit-tested for rendering contract verification, a class-based component may be warranted even without complex logic.

---

## Consequences Of Violation

Performance risks: Unnecessary service container resolution for every button on every page. Maintenance risks: More files and boilerplate than needed for simple presentational output.

---

## Rule: Limit Constructor Parameters to 5 Maximum

---

## Category

Maintainability

---

## Rule

Keep class-based component constructor parameters to 5 or fewer. If a component requires more, split it into smaller components or pass a typed data object.

---

## Reason

Each constructor parameter is part of the component's public contract. More than 5 parameters indicates the component does too much: it formats data, handles multiple concerns, or renders multiple distinct sections. Excessive parameters make the component hard to use, hard to test (too many arguments to construct), and brittle to changes.

---

## Bad Example

```php
class OrderDashboardWidget extends Component
{
    public function __construct(
        public Order $order,
        public string $displayMode,
        public bool $showDetails,
        public bool $showTimeline,
        public bool $showPayments,
        public bool $showNotes,
        public bool $compact,
    ) {}
    // 7 parameters — too many responsibilities
}
```

---

## Good Example

```php
class OrderDashboardWidget extends Component
{
    public function __construct(
        public Order $order,
        public DisplayConfig $config,
    ) {}
}

readonly class DisplayConfig
{
    public function __construct(
        public string $mode = 'full',
        public bool $showTimeline = true,
        public bool $showPayments = true,
    ) {}
}
```

---

## Exceptions

Components that accept a single Eloquent model plus a few configuration booleans (3-4 total parameters) are acceptable. The limit is about distinct concerns, not raw count.

---

## Consequences Of Violation

Maintenance risks: Components are hard to instantiate, refactor, and test. Scalability risks: Each new parameter increases the blast radius of changes.

---

## Rule: Namespace Components by Domain

---

## Category

Code Organization

---

## Rule

Organize components into domain-based subdirectories (e.g., `components/ui/`, `components/forms/`, `components/layouts/`) and use prefixed `x-` tags like `x-ui.button`, `x-forms.input`.

---

## Reason

Flat component directories cause name collisions (two `button` components from different domains) and poor discoverability. Domain-based namespacing prevents conflicts, groups related components together, and makes the component hierarchy visible in the template syntax. New developers can immediately understand which part of the application a component belongs to.

---

## Bad Example

```
resources/views/components/
├── button.blade.php      {{-- Which domain? --}}
├── card.blade.php        {{-- Admin card or public card? --}}
├── input.blade.php       {{-- Form input or search input? --}}
```

---

## Good Example

```
resources/views/components/
├── ui/
│   ├── button.blade.php      {{-- <x-ui.button> --}}
│   └── card.blade.php        {{-- <x-ui.card> --}}
├── forms/
│   ├── input.blade.php       {{-- <x-forms.input> --}}
│   └── select.blade.php      {{-- <x-forms.select> --}}
└── layouts/
    ├── header.blade.php      {{-- <x-layouts.header> --}}
    └── sidebar.blade.php     {{-- <x-layouts.sidebar> --}}
```

---

## Exceptions

Small applications with fewer than 15 total components may not benefit from domain namespacing. Introduce subdirectories when the flat list becomes difficult to scan.

---

## Consequences Of Violation

Maintenance risks: Component name collisions; difficulty finding the right component for a given context. Scalability risks: Flat structure does not scale to 50+ components.

---

## Rule: Never Access Parent Scope in Anonymous Components

---

## Category

Architecture

---

## Rule

Pass all required data as explicit component attributes. Never rely on `$variables` from the controller or parent template being available inside an anonymous component.

---

## Reason

Anonymous components are isolated — they do not inherit the parent template's variable scope. A variable like `$user` from the controller is `null` inside the component unless explicitly passed as an attribute. This isolation is intentional but surprising to developers familiar with `@include`. Relying on implicit scope inheritance creates brittle components that silently fail when the parent context changes.

---

## Bad Example

```blade
{{-- Controller passes $user to page --}}
@foreach ($orders as $order)
    <x-order-card :$order />
    {{-- Assumes $user is available inside order-card --}}
@endforeach
```

```blade
{{-- components/order-card.blade.php --}}
<div>
    <p>{{ $order->id }}</p>
    <p>{{ $user->name }}</p> {{-- $user is null — no error visible --}}
</div>
```

---

## Good Example

```blade
@foreach ($orders as $order)
    <x-order-card :$order :user="$user" />
@endforeach
```

```blade
{{-- components/order-card.blade.php --}}
<div {{ $attributes }}>
    <p>{{ $order->id }}</p>
    <p>{{ $user->name }}</p> {{-- Explicitly passed --}}
</div>
```

---

## Exceptions

When using class-based components with `public $user` as a constructor parameter, the component class makes the dependency explicit. Anonymous components have no such mechanism — always pass attributes.

---

## Consequences Of Violation

Reliability risks: Components silently render with null values; missing data without errors. Maintenance risks: Refactoring parent template breaks child components invisibly.

---

## Rule: Keep Component Nesting Within 3 Levels

---

## Category

Maintainability

---

## Rule

Limit component nesting depth to 3 levels (page > section > item). Refactor deeply nested component trees into flatter compositions or extract intermediate components.

---

## Reason

Each nesting level adds cognitive load — developers must open multiple files to trace rendering. Beyond 3 levels, the component hierarchy becomes a debugging maze: slot content passes through multiple layers, attribute merging compounds, and determining which component controls which part of the output requires tracing the full chain. Flatter trees are easier to understand, test, and maintain.

---

## Bad Example

```blade
{{-- Level 5 nesting --}}
<x-page>                    {{-- Level 1 --}}
    <x-dashboard>           {{-- Level 2 --}}
        <x-widget>          {{-- Level 3 --}}
            <x-card>        {{-- Level 4 --}}
                <x-button>  {{-- Level 5 --}}
                    Click
                </x-button>
            </x-card>
        </x-widget>
    </x-dashboard>
</x-page>
```

---

## Good Example

```blade
{{-- Max 3 levels --}}
<x-page>                    {{-- Level 1 --}}
    <x-dashboard>           {{-- Level 2 --}}
        <x-widget>          {{-- Level 3 --}}
        </x-widget>
    </x-dashboard>
</x-page>
{{-- button is inside widget's view, not nested via composition --}}
```

---

## Exceptions

UI component libraries (like a design system with `Button` inside `Card` inside `Modal`) may exceed 3 levels where the hierarchy is a documented, stable composition pattern.

---

## Consequences Of Violation

Maintenance risks: Debugging component output requires tracing through 4+ files. Performance risks: Each nesting level adds attribute bag creation and slot processing overhead.

---

## Rule: Always Include `{{ $slot }}` in Components

---

## Category

Design

---

## Rule

Every component that wraps consumer-provided content must output `{{ $slot }}` in its view template. Never omit it unless the component intentionally discards child content.

---

## Reason

The slot is the primary mechanism for component consumers to pass content. Omitting `{{ $slot }}` silently discards everything between the component's opening and closing tags — content disappears without an error, warning, or visual indication. This creates baffling bugs where "the content I put inside the component doesn't appear."

---

## Bad Example

```blade
{{-- components/card.blade.php --}}
<div class="card">
    <div class="card-header">{{ $header }}</div>
    {{-- Missing {{ $slot }} — card body content disappears --}}
    <div class="card-footer">{{ $footer }}</div>
</div>
```

```blade
<x-card>
    <p>This content will never appear</p>
</x-card>
```

---

## Good Example

```blade
{{-- components/card.blade.php --}}
<div class="card">
    <div class="card-header">{{ $header }}</div>
    <div class="card-body">{{ $slot }}</div>
    <div class="card-footer">{{ $footer }}</div>
</div>
```

---

## Exceptions

Components intentionally designed not to accept children (e.g., a self-closing `<x-icon name="user" />` or `<x-spinner />`) do not need a slot.

---

## Consequences Of Violation

Reliability risks: Content silently lost; confusing bugs for component consumers. Maintenance risks: Developers waste time debugging content that was swallowed by a missing slot.
