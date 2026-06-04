## Rule: One Component Per Concern

Each Livewire component should represent exactly one UI widget, page section, or interaction.

---

## Category

Architecture

---

## Rule

Split components at natural boundaries: one component per form, per table, per widget, per page section. If a component's template exceeds 200 lines or its class exceeds 150 lines, extract sub-components.

---

## Reason

Large monolithic components (500+ lines, 20+ properties, 15+ actions) are hard to understand, test, and maintain. They mix multiple concerns in a single class — search logic, form handling, event dispatching, data fetching. Extracting sub-components isolates each concern, enables independent testing, and improves reusability.

---

## Bad Example

`php
class Dashboard extends Component // 400 lines — forms, charts, tables, filters
{
    public string  = '';
    public array  = [];
    public array  = [];
    public array  = [];
    // 20+ properties, 15+ methods
}
`

---

## Good Example

`php
class Dashboard extends Component
{
    public string  = '';
}

class Chart extends Component { ... } // Separate concern
class DataTable extends Component { ... } // Separate concern
class CreateForm extends Component { ... } // Separate concern
`

---

## Exceptions

Simple components with fewer than 5 properties and 3 actions do not need splitting. Apply this rule when the component becomes difficult to navigate or test.

---

## Consequences Of Violation

Maintenance risks: hard to understand, test, refactor large components. Reusability: logic embedded in one component cannot be reused elsewhere.

---

## Rule: Type All Public Properties

Declare PHP 8+ type annotations on every public property in a Livewire component.

---

## Category

Maintainability

---

## Rule

Add an explicit type declaration (public string  = '', public int  = 0, public ?User  = null) to every public property. Never use untyped properties.

---

## Reason

Untyped public properties accept any value from the frontend — a string where an integer is expected, 
ull where a string is expected, an array where an object is expected. Without types, Livewire silently accepts incorrect types, leading to subtle bugs. Typed properties enforce data integrity at the PHP level.

---

## Bad Example

`php
public  = 0; // Mixed type — string "abc" accepted
public ; // Mixed type — any value accepted
`

---

## Good Example

`php
public int  = 0; // Only integers accepted
public ?User  = null; // Only User or null accepted
`

---

## Exceptions

Properties that genuinely accept multiple types (rare in Livewire) should document the accepted types in a docblock and validate in the updated hook.

---

## Consequences Of Violation

Reliability risks: incorrect types silently accepted, causing downstream errors. Maintenance: harder to understand expected property values.

---

## Rule: Use Computed for Expensive Derived Properties

Apply #[Computed] to methods that perform expensive computations or database queries, caching their result within a single request.

---

## Category

Performance

---

## Rule

When a component repeatedly accesses derived data that requires computation or querying, define it as a #[Computed] method instead of computing it fresh in each hook or template access.

---

## Reason

Without #[Computed], every call to a derived property re-executes the computation. If the template calls the same derived data in multiple places, the query runs multiple times per request. #[Computed] caches the result after the first call within the same request lifecycle.

---

## Bad Example

`php
// Called twice in template — runs two queries
public function recentOrders(): Collection
{
    return Order::where('user_id', ->user->id)->latest()->take(5)->get();
}
`

---

## Good Example

`php
#[Computed]
public function recentOrders(): Collection
{
    return Order::where('user_id', ->user->id)->latest()->take(5)->get();
}
`

---

## Exceptions

Properties that return simple transformed values (string concatenation, number formatting) do not need #[Computed] — the computation cost is negligible.

---

## Consequences Of Violation

Performance risks: repeated database queries or computations within a single request. Scalability risks: unnecessary load on database.

---

## Rule: Separate Presentation from Logic

Keep Blade templates focused on HTML rendering. Move complex conditionals, data formatting, and logic to the component class or Blade components.

---

## Category

Code Organization

---

## Rule

Limit Blade templates to conditionals (@if, @foreach) and output ({{ }}). Move data transformation (date formatting, status calculation, permission checks) to the component class as computed properties or dedicated methods.

---

## Reason

Templates with complex logic (nested ternaries, multiple @php blocks, inline calculations) are hard to read, test, and debug. Logic in templates cannot be unit-tested and is often duplicated across templates. Moving logic to the component class makes it testable and reusable.

---

## Bad Example

`lade
@php
     = ->status === 'pending' ? 'yellow'
        : (->status === 'shipped' ? 'green' : 'gray');
     = number_format(->items->sum(fn() => ->price * ->quantity), 2);
@endphp
`

---

## Good Example

`lade
<div class="status-{{  }}">{{  }}</div>
`

`php
#[Computed]
public function statusClass(): string { ... }

#[Computed]
public function formattedTotal(): string { ... }
`

---

## Exceptions

Simple @if / @unless checks for conditional display are acceptable in templates. The rule targets complex transformations, calculations, and multi-step logic.

---

## Consequences Of Violation

Maintenance risks: logic embedded in templates cannot be unit-tested, hard to debug. Duplication: same formatting logic repeated across templates.

---

## Rule: Name Components in Kebab-Case

Use kebab-case for Livewire component names in Blade tags and route references.

---

## Category

Code Organization

---

## Rule

Reference Livewire components in Blade as <livewire:user-profile /> not <livewire:UserProfile />. Use the same kebab-case convention for full-page component routes and Livewire::component() registration.

---

## Reason

Livewire converts component class names (e.g., UserProfile) to kebab-case (user-profile) by default for Blade tag references. Using a different casing in Blade causes a "component not found" error. Consistent naming across Blade tags, routes, and PHP class names reduces confusion.

---

## Bad Example

`lade
<livewire:UserProfile /> {{-- May fail or be inconsistent --}}
`

---

## Good Example

`lade
<livewire:user-profile /> {{-- Matches Livewire convention --}}
`

---

## Exceptions

Full-page components in routes use the class name directly: Route::get('/profile', App\Livewire\UserProfile::class). The convention applies to Blade tag use.

---

## Consequences Of Violation

Runtime errors: component not found due to case mismatch. Inconsistency: different casing styles across the codebase.

---

## Rule: Use render to Return a View

Every Livewire component's ender() method must return a View instance, not a string or array.

---

## Category

Framework Usage

---

## Rule

Always return iew('livewire.component-name') from the ender() method. Pass data to the view via iew()->with() or the view function's second parameter. Do not return raw HTML strings.

---

## Reason

Returning a View allows Livewire to properly handle auto-discovery of template changes during development (Hot Module Replacement), cache-busting in production, and proper integration with Blade's template inheritance, sections, and stacks.

---

## Bad Example

`php
public function render(): string
{
    return '<div>' . ->count . '</div>'; // String — no template features
}
`

---

## Good Example

`php
public function render(): View
{
    return view('livewire.counter', ['count' => ->count]);
}
`

---

## Exceptions

Inline components that use ender() to return a simple string for prototyping or very simple output may return a string. Production code must return a View.

---

## Consequences Of Violation

Missing Blade features: no template inheritance, sections, or stacks. Development DX: no HMR for template changes.
