## Rule: Never Include Business Logic in View Models

---

## Category

Architecture

---

## Rule

View models must contain only presentation logic: formatting, computed display values, null handling, and CSS class selection. Never include write operations, database queries, API calls, or business rule execution.

---

## Reason

View models exist to transform data for display — they are part of the presentation layer, not the business layer. A view model that calls `$this->order->applyDiscount()` or `Order::process()` mutates application state during template rendering. This is unpredictable (the mutation runs every time the view renders), untestable in pure unit tests, and violates the separation of concerns between presentation and business logic.

---

## Bad Example

```php
class OrderShowViewModel
{
    public function __construct(public Order $order)
    {
        $this->order->markAsViewed(); // Side effect in view model
    }

    public function cancelOrder(): void
    {
        $this->order->update(['status' => 'cancelled']); // Business logic
    }
}
```

---

## Good Example

```php
readonly class OrderShowViewModel
{
    public string $formattedTotal;
    public string $statusBadgeClass;

    public function __construct(public Order $order)
    {
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
        $this->statusBadgeClass = match ($order->status) {
            'completed' => 'badge-success',
            'cancelled' => 'badge-danger',
            default => 'badge-warning',
        };
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->order->status, ['pending', 'processing']);
    }
}
```

---

## Exceptions

No common exceptions. Business logic in view models is always an architectural error.

---

## Consequences Of Violation

Maintenance risks: Business logic hidden in presentation layer; side effects execute on every render. Testing risks: View models cannot be tested in isolation without triggering mutations. Security risks: Unintended state changes during view rendering.

---

## Rule: Only Create View Models When Templates Exceed a Complexity Threshold

---

## Category

Maintainability

---

## Rule

Introduce a view model only when the template contains multiple conditionals, complex formatting, null/fallback handling, or computed values. Do not create view models for templates that simply echo model properties.

---

## Reason

A view model for a simple `{{ $user->name }}` and `{{ $user->email }}` template adds ceremony without benefit: a new file, a new class, a new constructor, and a new thing to maintain. View models provide value when they encapsulate formatting logic that would otherwise clutter the template. Premature extraction creates an inflated codebase full of trivial, unused view models.

---

## Bad Example

```php
// View model for a trivial template — unnecessary
class UserProfileViewModel
{
    public function __construct(public User $user) {}
}
```

```blade
{{-- Template could just use $user directly --}}
<h1>{{ $viewModel->user->name }}</h1>
<p>{{ $viewModel->user->email }}</p>
```

---

## Good Example

```php
// View model justified by complex formatting
class UserProfileViewModel
{
    public string $formattedJoinDate;
    public string $statusBadgeClass;
    public bool $canEdit;

    public function __construct(public User $user, ?User $currentUser)
    {
        $this->formattedJoinDate = $user->created_at->format('F j, Y');
        $this->statusBadgeClass = $user->isActive() ? 'badge-success' : 'badge-secondary';
        $this->canEdit = $currentUser?->is($user) || $currentUser?->isAdmin();
    }
}
```

---

## Exceptions

When a team standardizes on view models for all views as a consistency convention, even simple views may use them. However, this should be a deliberate architectural decision, not an accidental default.

---

## Consequences Of Violation

Maintenance risks: Codebase fills with trivial view models that add no value; developers spend time navigating unnecessary indirection. Scalability risks: Class count grows without proportional benefit.

---

## Rule: Test View Models in Isolation Without Views or HTTP

---

## Category

Testing

---

## Rule

Write unit tests for view models by instantiating them directly with factory-made models and asserting on method return values or property values. Do not render views or make HTTP requests in view model tests.

---

## Reason

View models are plain PHP classes with no Laravel framework dependencies (no `View`, no `Request`). They are the most testable part of the Blade layer — instantiate with `make()`, call methods, assert on values. These tests are extremely fast (under 1ms), have no setup overhead, and verify the exact presentation contract that templates rely on.

---

## Bad Example

```php
public function test_formatted_total()
{
    $response = $this->get('/orders/1');
    $response->assertSee('19.99');
    // HTTP test for a unit-testable view model — slow and indirect
}
```

---

## Good Example

```php
public function test_formatted_total_includes_currency()
{
    $order = Order::factory()->make(['total' => 1999]);
    $viewModel = new OrderShowViewModel($order);

    $this->assertStringContainsString('$', $viewModel->formattedTotal());
    $this->assertStringContainsString('19.99', $viewModel->formattedTotal());
}

public function test_can_be_cancelled_for_processing_orders()
{
    $order = Order::factory()->make(['status' => 'processing']);
    $viewModel = new OrderShowViewModel($order);

    $this->assertTrue($viewModel->canBeCancelled());
}
```

---

## Exceptions

View models that depend on Laravel helpers (`route()`, `auth()`, `config()`) need partial framework setup but should still avoid HTTP tests. Mock the helper dependency or inject what the model needs.

---

## Consequences Of Violation

Performance risks: Slow test suite from unnecessary HTTP boots for logic that could be tested in <1ms. Testing risks: View model logic mixed into integration tests, making failures harder to diagnose.

---

## Rule: Use Readonly Properties for Eager-Computed Values

---

## Category

Design

---

## Rule

Declare view models as `readonly class` and compute all derived display values eagerly in the constructor as `readonly` properties. Use methods only for values requiring computation with parameters.

---

## Reason

View models should be immutable after construction — they are snapshots of presentation state at render time. Readonly properties enforce immutability at the compiler level, preventing accidental mutation in templates. Eager computation ensures the template does not trigger expensive computations on property access (no lazy loading surprises).

---

## Bad Example

```php
class OrderShowViewModel
{
    public string $formattedTotal; // Not readonly — can be mutated

    public function __construct(public Order $order)
    {
        // Eager computation correct, but property could be overwritten
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
    }
}
```

---

## Good Example

```php
readonly class OrderShowViewModel
{
    public string $formattedTotal;

    public function __construct(
        public Order $order,
    ) {
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
    }

    public function statusBadgeClass(): string
    {
        return match ($this->order->status) {
            'completed' => 'badge-success',
            'processing' => 'badge-warning',
            default => 'badge-secondary',
        };
    }
}
```

---

## Exceptions

When a computed value is rarely used in the template and expensive to compute, a lazy method (not a property) is acceptable. Use lazy initialization inside the method: `$this->stats ??= $this->computeStats()`.

---

## Consequences Of Violation

Reliability risks: Template may accidentally mutate view model state, causing display bugs. Performance risks: Lazy computations may trigger at unexpected times if the template accesses properties in multiple places.

---

## Rule: Keep Constructor Parameters Focused — Maximum 3

---

## Category

Maintainability

---

## Rule

Limit view model constructor parameters to a maximum of 3. If a view needs more data sources, split the view model or combine inputs into a data object.

---

## Reason

View models with 4+ constructor parameters attempt to serve too many concerns. Each parameter represents a data source the view needs — too many indicates the template is showing too much. A bloated constructor makes the view model hard to instantiate, hard to test (too many arguments to mock), and suggests the view should be split into smaller, focused components.

---

## Bad Example

```php
class DashboardViewModel
{
    public function __construct(
        public User $user,
        public Collection $recentOrders,
        public Collection $notifications,
        public Collection $teamMembers,
        public Collection $recentActivity,
        public array $statistics,
    ) {} // 6 parameters — view does too much
}
```

---

## Good Example

```php
class DashboardViewModel
{
    public function __construct(
        public User $user,
        public DashboardStats $stats,
    ) {}
}

readonly class DashboardStats
{
    public function __construct(
        public int $orderCount,
        public int $notificationCount,
        public int $teamMemberCount,
    ) {}
}
```

---

## Exceptions

When a single Eloquent model plus one or two simple configuration values keeps the total at 3 or fewer, it is acceptable. The limit prevents view models from becoming catch-all data bags.

---

## Consequences Of Violation

Maintenance risks: Difficult to instantiate and mock; brittle constructor. Scalability risks: Adding another data source requires changing every instantiation point.

---

## Rule: Do Not Use View Models for API Responses

---

## Category

Architecture

---

## Rule

Use Laravel API Resources for JSON response transformation. Never reuse Blade view models for API output by calling `toArray()` or similar methods.

---

## Reason

View models are Blade-specific — they may call `route()`, `auth()`, `config()`, or other Laravel helpers that depend on the HTTP request context. These calls break in API context (queue jobs, console commands, API responses) where no Blade template is rendering. API Resources are designed for JSON serialization and do not carry Blade-specific dependencies.

---

## Bad Example

```php
class OrderShowViewModel
{
    public function formattedTotal(): string
    {
        return '$' . number_format($this->order->total / 100, 2);
    }

    public function editUrl(): string
    {
        return route('orders.edit', $this->order); // route() breaks in API context
    }
}

// Used for both Blade and API — fragile
return response()->json(['order' => new OrderShowViewModel($order)]);
```

---

## Good Example

```php
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'formatted_total' => '$' . number_format($this->total / 100, 2),
            'status' => $this->status,
        ];
    }
}

// Blade uses view model; API uses resource — clean separation
return new OrderResource($order);
```

---

## Exceptions

No common exceptions. View models are for Blade templates. API Resources are for JSON responses. Using one for the other's purpose always creates coupling issues.

---

## Consequences Of Violation

Reliability risks: View models fail when called from queue jobs, console commands, or API controllers that lack Blade context. Maintenance risks: View models accumulate `route()` calls that break in non-HTTP contexts.

---

## Rule: Prevent Orphaned View Models

---

## Category

Maintainability

---

## Rule

Remove view model classes when their associated view is deleted or refactored. Run periodic audits to detect unused view models using IDE reference search or static analysis.

---

## Reason

Orphaned view models accumulate dead code. A view model with no corresponding view misleads developers into thinking presentation logic exists where it does not. Dead view models waste maintenance effort — developers must inspect each one to determine if it is still used. Regular cleanup keeps the `app/ViewModels/` directory accurate and trustworthy.

---

## Bad Example

```
app/ViewModels/
├── OldDashboardViewModel.php  {{-- View deleted 6 months ago --}}
├── DeprecatedReportViewModel.php  {{-- Replaced by new component --}}
└── UserProfileViewModel.php  {{-- Actually in use --}}
```

---

## Good Example

```
app/ViewModels/
├── OrderShowViewModel.php    {{-- In use by orders/show.blade.php --}}
├── UserProfileViewModel.php  {{-- In use by users/profile.blade.php --}}
└── DashboardViewModel.php    {{-- In use by dashboard/index.blade.php --}}
```

---

## Exceptions

View models that are part of a public package API (consumed by other packages or applications) should not be removed until the next major version, even if the current application does not use them.

---

## Consequences Of Violation

Maintenance risks: Dead code confuses developers; orphaned view models misrepresent the codebase's actual structure. Scalability risks: Every orphan adds noise to code search and increases the cost of understanding the codebase.
