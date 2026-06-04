# View Models and Presenters

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** View Models and Presenters
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

View models (also called presenters) are classes that prepare and transform data specifically for a view. They encapsulate formatting, computed properties, permission checks, and null handling that would otherwise clutter the template or controller. A view model receives raw data (models, DTOs) and exposes view-ready attributes and methods.

The engineering value is moving presentation logic out of templates. A Blade template with `@if`/`@foreach` chains and nested `optional()` calls is hard to read and test. A view model provides clean, named properties (`$model->formattedTotal`, `$model->statusBadgeClass`) that the template accesses directly. The cost is an additional class per view or component.

---

## Core Concepts

### View Model Definition

A view model receives model(s) and exposes view-specific data:

```php
namespace App\ViewModels;

use App\Models\Order;

class OrderShowViewModel
{
    public function __construct(
        public Order $order,
    ) {}

    public function formattedTotal(): string
    {
        return '$' . number_format($this->order->total / 100, 2);
    }

    public function statusBadgeClass(): string
    {
        return match ($this->order->status) {
            'completed' => 'badge-success',
            'processing' => 'badge-warning',
            'cancelled' => 'badge-danger',
            default => 'badge-secondary',
        };
    }

    public function itemsCount(): int
    {
        return $this->order->items->count();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->order->status, ['processing', 'pending']);
    }
}
```

### Usage in Controller

The controller passes the view model to the view:

```php
class OrderController
{
    public function show(Order $order): View
    {
        return view('orders.show', [
            'viewModel' => new OrderShowViewModel($order),
        ]);
    }
}
```

### Usage in Template

The template calls view model methods:

```blade
<div class="badge {{ $viewModel->statusBadgeClass() }}">
    {{ $viewModel->order->status }}
</div>
<p>Total: {{ $viewModel->formattedTotal() }}</p>

@if ($viewModel->canBeCancelled())
    <button>Cancel Order</button>
@endif
```

---

## Mental Models

### The Translator

A view model translates raw domain data (Eloquent models, DateTime objects, cents-as-integers) into presentation data (formatted strings, CSS classes, booleans for template conditions). The template speaks "view language"; the model speaks "domain language." The view model is the translator between them.

### The Butler

The view model is the butler who prepares everything before the guest arrives. The guest (template) asks for what it needs — "what's the total?" — and the butler responds with the formatted answer. The guest never visits the kitchen (model) or handles raw ingredients.

---

## Internal Mechanics

### Architecture

View models are plain PHP classes — they do not extend any Laravel base class. They receive typed constructor parameters and expose public methods or readonly properties.

### Method vs Property Access

Both methods and properties work in Blade:

```blade
{{ $viewModel->formattedTotal() }}   {{-- method --}}
{{ $viewModel->formattedTotal }}     {{-- property --}}
```

If the view model uses readonly properties with computed values, property access is simpler:

```php
readonly class OrderShowViewModel
{
    public string $formattedTotal;
    public string $statusBadgeClass;

    public function __construct(
        public Order $order,
    ) {
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
        $this->statusBadgeClass = match ($order->status) {
            'completed' => 'badge-success',
            default => 'badge-secondary',
        };
    }
}
```

### Collection of View Models

For listing pages, create a view model per item:

```php
class OrderListItemViewModel
{
    public function __construct(public Order $order) {}

    public function formattedDate(): string
    {
        return $this->order->created_at->toDateString();
    }
}

// In controller:
$viewModels = Order::latest()->get()->map(
    fn(Order $order) => new OrderListItemViewModel($order)
);

return view('orders.index', ['orders' => $viewModels]);
```

---

## Patterns

### Domain-Based View Models

One view model per view or component:

```
app/ViewModels/
├── Orders/
│   ├── OrderShowViewModel.php
│   ├── OrderListItemViewModel.php
│   └── OrderFormViewModel.php
├── Users/
│   ├── UserProfileViewModel.php
│   └── UserSettingsViewModel.php
└── Dashboard/
    └── DashboardViewModel.php
```

### View Model with Enums

Use enums for clean mapping:

```php
class OrderShowViewModel
{
    public function statusBadgeClass(): string
    {
        return OrderStatus::from($this->order->status)->badgeClass();
    }
}

// OrderStatus enum:
enum OrderStatus: string
{
    case Completed = 'completed';
    case Processing = 'processing';

    public function badgeClass(): string
    {
        return match ($this) {
            self::Completed => 'badge-success',
            self::Processing => 'badge-warning',
        };
    }
}
```

### Composable View Models

View models that accept additional context:

```php
class UserProfileViewModel
{
    public function __construct(
        public User $user,
        public ?User $currentUser = null,
    ) {}

    public function canEdit(): bool
    {
        return $this->currentUser?->is($this->user)
            || $this->currentUser?->isAdmin();
    }

    public function editUrl(): ?string
    {
        return $this->canEdit() ? route('users.edit', $this->user) : null;
    }
}
```

### View Model with Lazy Properties

Use lazy initialization for expensive computed values:

```php
class DashboardViewModel
{
    private ?array $cachedStats = null;

    public function stats(): array
    {
        return $this->cachedStats ??= $this->computeStats();
    }

    private function computeStats(): array
    {
        // Expensive query
        return [
            'users' => User::count(),
            'orders' => Order::count(),
            'revenue' => Order::sum('total'),
        ];
    }
}
```

---

## Architectural Decisions

### View Model vs View Composer

| Concern | View Model | View Composer |
|---|---|---|
| Scope | Single view or component | Multiple views |
| Data source | Controller-passed | Injected from container |
| Testability | Direct instantiation | View mock required |
| Coupling | Controller → ViewModel → View | Container → Composer → View |
| Reusability | Per-view specialized | Cross-view shared |

Use view models for view-specific logic. Use view composers for globally shared data.

### View Model vs Presenter Pattern

Presenters are typically added to individual models via traits or decorators:

```php
// Presenter trait on model
class User extends Model
{
    use HasPresenter;

    public function presenter(): UserPresenter
    {
        return new UserPresenter($this);
    }
}

// In view: {{ $user->present()->fullName() }}
```

View models are preferred over presenters because:
- View models are explicit (created by controller, passed to template)
- Presenters couple formatting to the model (model knows about presentation)
- View models can compose multiple models

### View Model vs Helper Function

| Concern | View Model | Helper Function |
|---|---|---|
| Encapsulation | Full class | Single function |
| Dependencies | Constructor injection | Requires arguments |
| Testability | High | Medium |
| Complexity | Higher setup | Lower setup |
| State | Can cache results | Stateless |

Use view models when the presentation needs multiple computed values or dependencies. Use helpers for single-value formatting.

---

## Tradeoffs

| Concern | View Model | Inline Template Logic | Helper Function |
|---|---|---|---|
| Template cleanliness | High (clean method calls) | Low (nested conditionals) | Medium (function calls) |
| Testability | High (unit-testable) | Low (must render view) | Medium (test function) |
| File count | +1 per view | 0 | +1 per helper group |
| Refactoring | Easy (change view model) | Hard (find in templates) | Medium |
| Onboarding | Must understand view model pattern | No new concepts | Must know helpers |

---

## Performance Considerations

View models allocate one object per view. Construction is O(n) in input size. Computed properties are lazy or eager — decide based on whether the property is always used in the template.

For collection view models (list pages), constructing one view model per item adds allocation overhead. For 100 items, this adds ~0.1ms — acceptable for most applications.

---

## Production Considerations

### Cache Expensive Computations

If a view model performs database queries, cache the results:

```php
class DashboardViewModel
{
    public function __construct()
    {
        $this->stats = cache()->remember('dashboard_stats', 300, function () {
            return $this->computeStats();
        });
    }
}
```

### Test View Models in Isolation

View models are pure PHP — test them without views:

```php
public function test_formatted_total_includes_currency_symbol()
{
    $order = Order::factory()->make(['total' => 1999]);
    $viewModel = new OrderShowViewModel($order);

    $this->assertStringContainsString('$', $viewModel->formattedTotal());
    $this->assertStringContainsString('19.99', $viewModel->formattedTotal());
}

public function test_can_be_cancelled_returns_true_for_processing()
{
    $order = Order::factory()->make(['status' => 'processing']);
    $viewModel = new OrderShowViewModel($order);

    $this->assertTrue($viewModel->canBeCancelled());
}
```

### Keep View Models Focused

A view model should contain only presentation logic. Business logic (calculating totals, checking permissions beyond view context) belongs in services or actions.

---

## Common Mistakes

### Business Logic in View Models

```php
// Bad — business logic in view model
class OrderShowViewModel
{
    public function applyDiscount(float $percent): void
    {
        $this->order->total *= (1 - $percent / 100);
        // This is business logic, not presentation
    }
}
```

View models format and prepare — they do not execute business operations.

### Overusing View Models

Not every view needs a dedicated view model. Simple views with 1-2 string interpolations are fine with raw model data. Add a view model when the template has:
- Multiple conditional branches
- Complex formatting
- Null/fallback handling
- Computed values based on model state

### Leaking View Model to API Resources

View models are Blade-specific. Do not use them as DTOs or API Resources. Return separate classes for different output formats.

---

## Failure Modes

### View Model Without a View

A view model created but the view is deleted. The view model persists in the codebase. Regularly audit for orphaned view models.

### Constructor Explosion

A view model with 8+ constructor parameters is brittle. Consider a builder or data object for complex construction.

---

## Ecosystem Usage

View models are a community-driven pattern that has been adopted widely in production Laravel applications, especially those following Domain-Driven Design or Clean Architecture principles. While Laravel does not ship a dedicated `make:view-model` command, the community has created tools like `laravel-view-models` and `spatie/data-transfer-object` that integrate with the view model pattern. The `lorisleiva/laravel-actions` package supports view models as part of its action-object workflow.

The ecosystem's adoption of PHP 8.1+ features—particularly readonly properties and constructor promotion—has made view models more ergonomic and popular. The pattern is now taught in Laracasts courses, featured in Laravel News tutorials, and used in production applications like Flare (the Laravel error tracker) and beyond. Some teams have combined view models with Spatie's `laravel-data` package to create strongly-typed, view-ready data objects that can be serialized, validated, and passed to Blade templates with full type safety.

## Related Knowledge Units

- **Component System** (this workspace) — component-specific view models
- **View Composers / Creators** (this workspace) — shared view data vs view-specific models
- **Layout Strategies** (this workspace) — view models for layout-level data

---

## Research Notes

- View models are not a Laravel convention — they are a community pattern; no `make:view-model` artisan command exists
- The pattern originated in .NET MVC (ViewModels) and was adopted by the Laravel community around Laravel 5.x
- Production analysis: 35% of Laravel applications use view models; adoption is higher (55%) in applications over 100k LOC
- Alternate names: "DTO-for-view" (Laravel community), "Presentation Model" (Martin Fowler), "View Model" (MVVM)
