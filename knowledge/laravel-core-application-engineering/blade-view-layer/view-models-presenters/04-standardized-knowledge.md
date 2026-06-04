# View Models and Presenters

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** View Models and Presenters
- **Difficulty Level:** Advanced
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

View models (also called presenters) are classes that prepare and transform data specifically for a view. They encapsulate formatting, computed properties, permission checks, and null handling that would otherwise clutter the template or controller. A view model receives raw data and exposes view-ready attributes and methods.

**Engineering value:** Moving presentation logic out of templates. A Blade template with `@if`/`@foreach` chains and nested `optional()` calls is hard to read and test. A view model provides clean, named properties that the template accesses directly. The cost is an additional class per view or component.

---

## Core Concepts

### View Model Definition
```php
namespace App\ViewModels;

use App\Models\Order;

class OrderShowViewModel
{
    public function __construct(public Order $order) {}

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

    public function canBeCancelled(): bool
    {
        return in_array($this->order->status, ['processing', 'pending']);
    }
}
```

### Controller Usage
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

### Template Usage
```blade
<div class="badge {{ $viewModel->statusBadgeClass() }}">
    {{ $viewModel->order->status }}
</div>
<p>Total: {{ $viewModel->formattedTotal() }}</p>

@if ($viewModel->canBeCancelled())
    <button>Cancel Order</button>
@endif
```

### Collection View Models
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

## When To Use

- **Templates with complex formatting** — currency, dates, status badges, conditional CSS classes
- **Multiple conditional branches in templates** — `@if`/`@elseif`/`@else` chains that determine display
- **Null/fallback handling** — `$user?->profile?->bio ?? 'No bio'` logic in a single method
- **Computed values from model state** — `isOverdue`, `canBeCancelled`, `progressPercent`
- **Views combining multiple models** — a dashboard view model combining User, Order, and Stats data
- **Templates exceeding 50 lines of complex logic** — indicator that presentation logic should be extracted

---

## When NOT To Use

- **Simple variable interpolation** — `{{ $user->name }}` needs no view model
- **Single-string formatting** — a helper function (`money_format()`) is sufficient
- **Globally shared data** — use view composers for data shared across many views
- **API responses** — use API Resources or DTOs, not view models
- **Every view by default** — only extract when template logic reaches a complexity threshold (multiple conditionals, formatting, fallbacks)

---

## Best Practices (WHY)

**WHY use readonly properties for eager-computed values.** Computed in constructor, immutable after instantiation. `readonly class OrderShowViewModel { public string $formattedTotal; }` — the template cannot accidentally mutate it.

**WHY keep view models free of business logic.** A view model formats and prepares — it does not execute business operations. `applyDiscount()` in a view model is a mistake. Move that to a service or action.

**WHY name view models after their view.** `OrderShowViewModel`, `UserProfileViewModel`, `DashboardViewModel`. The name tells you which view it serves and makes the mapping obvious.

**WHY test view models in isolation.** View models are plain PHP classes — test them without views, without HTTP, without the framework. `new OrderShowViewModel($order)` and assert on method return values.

**WHY not use view models as DTOs.** View models are Blade-specific. They may contain methods that call `route()`, `auth()`, or `config()`. DTOs are layer-agnostic and should not depend on Laravel helpers.

**WHY use lazy properties for expensive computations.** If a computed value is rarely used in the template, use lazy initialization: `$this->stats ??= $this->computeStats()`. Avoid paying the cost on every render if the template conditionally uses the value.

---

## Architecture Guidelines

### Directory Organization
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

### View Model vs View Composer
| Concern | View Model | View Composer |
|---|---|---|
| Scope | Single view or component | Multiple views |
| Data source | Controller-passed | Injected from container |
| Testability | Direct instantiation | View mock required |
| Coupling | Controller → ViewModel → View | Container → Composer → View |

### View Model vs Presenter Pattern
| Concern | View Model | Model Presenter |
|---|---|---|
| Coupling | Independent class | Coupled to model via trait |
| Composability | Multiple models | Single model per presenter |
| Controller visibility | Explicit (created in controller) | Implicit (called in template) |
| Reusability | Per-view specialized | Per-model (applied everywhere) |

View models are preferred over presenters because they are explicit, compose multiple models, and don't couple presentation logic to the model.

---

## Performance

- View models allocate one object per view — O(n) in input size
- Collection view models (100 items): ~0.1ms overhead — acceptable
- Computed properties: eager (in constructor) vs lazy (on first access) — choose based on template usage
- No framework overhead — view models are plain PHP classes
- Cache expensive computations: `$this->stats ??= $this->computeStats()`

---

## Security

- View models should not expose methods that write to the database or mutate state
- Be cautious when passing the request or authenticated user — view models can access `auth()` and `request()` via helpers
- View models may receive unauthorized data — the controller is responsible for authorization, not the view model
- Do not pass raw passwords, tokens, or secrets through view models

---

## Common Mistakes

### 1. Business logic in view models
- **Description:** View model contains `applyDiscount()`, `updateStatus()`, or other mutation methods
- **Cause:** Confusing "presentation logic" with "business logic"
- **Consequence:** Business rules leak into the presentation layer; untestable outside view context
- **Better:** View models format and prepare data only. Business logic belongs in services/actions.

### 2. Overusing view models for simple views
- **Description:** A view model for a page that just echoes `{{ $user->name }}` and `{{ $user->email }}`
- **Cause:** Applying the pattern by default
- **Consequence:** Unnecessary class that adds ceremony without benefit; codebase fills with trivial view models
- **Better:** Add a view model when the template has multiple conditionals, complex formatting, or null handling

### 3. Leaking view model to API response
- **Description:** Returning `new OrderShowViewModel($order)->toArray()` as JSON response
- **Cause:** Using view model as a DTO for API output
- **Consequence:** View model methods that call `route()` or `auth()` break in API context
- **Better:** Use API Resources for JSON responses; view models for Blade templates only

### 4. Constructor explosion (8+ parameters)
- **Description:** View model accepting many models and dependencies
- **Cause:** Trying to serve too many concerns in one view
- **Consequence:** Brittle construction; hard to test
- **Better:** Split view model or use a data object as single parameter

### 5. Orphaned view models
- **Description:** View model exists but the view was deleted or refactored
- **Cause:** No regular audit of view model usage
- **Consequence:** Dead code accumulates; developers unsure if a view model is used
- **Better:** Use IDE reference searching or a custom artisan command to detect unused view models

---

## Anti-Patterns

- **View model calling route() or url() in constructor.** Constructor should receive data, not depend on request context. Move URL generation to methods called by the template.
- **View model with static factory methods.** `OrderShowViewModel::fromRequest($request)` — this couples the view model to HTTP concerns. Pass data explicitly from the controller.
- **Inheriting from a base view model.** View models are concrete, single-purpose classes. Inheritance adds coupling without benefit.
- **Global view model registration.** Registering a view model as a container binding defeats the purpose — the controller should explicitly create it with the data it needs.
- **ViewModel suffix on everything.** Not every class in `app/ViewModels/` needs the suffix if the namespace already indicates its purpose.

---

## Examples

### Readonly View Model with Eager Computation
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
            'processing' => 'badge-warning',
            'cancelled' => 'badge-danger',
            default => 'badge-secondary',
        };
    }
}
```

### View Model with Enum
```php
class OrderShowViewModel
{
    public function statusBadgeClass(): string
    {
        return OrderStatus::from($this->order->status)->badgeClass();
    }
}

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

### Composable View Model with Context
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

### Unit Test for View Model
```php
public function test_formatted_total_includes_currency_symbol()
{
    $order = Order::factory()->make(['total' => 1999]);
    $viewModel = new OrderShowViewModel($order);

    $this->assertStringContainsString('$', $viewModel->formattedTotal());
    $this->assertStringContainsString('19.99', $viewModel->formattedTotal());
}

public function test_can_be_cancelled_for_processing()
{
    $order = Order::factory()->make(['status' => 'processing']);
    $viewModel = new OrderShowViewModel($order);

    $this->assertTrue($viewModel->canBeCancelled());
}
```

---

## Related Topics

- **Component System** — component-specific view models
- **View Composers / Creators** — shared view data vs view-specific models
- **DTOs** — data transport vs presentation models
- **API Resources** — view models for Blade vs Resources for JSON
- **Layout Strategies** — view models for layout-level data

---

## AI Agent Notes

- View models are not a Laravel convention — no `make:view-model` artisan command exists
- Pattern originated in .NET MVC and was adopted by Laravel community around Laravel 5.x
- ~35% of Laravel applications use view models; adoption is higher (55%) in applications over 100k LOC
- Also called "DTO-for-view" (Laravel community), "Presentation Model" (Martin Fowler), "View Model" (MVVM)
- PHP 8.1 readonly properties and constructor promotion made view models more ergonomic
- View models are plain PHP — they don't extend any Laravel base class
- Consider combining with Spatie's `laravel-data` for typed, serializable view objects

---

## Verification

- [ ] View model contains only presentation logic (formatting, computed values, null handling)
- [ ] No write/mutation methods exist in view model
- [ ] View model is unit-testable without views or HTTP
- [ ] Constructor parameters are typed and specific (not loose arrays)
- [ ] View model passes data to template via clean method/property calls
- [ ] No business logic (queries, calculations, state changes) in view model
- [ ] View model is not used for API responses or DTO purposes
- [ ] Orphaned view models are detected and removed regularly
