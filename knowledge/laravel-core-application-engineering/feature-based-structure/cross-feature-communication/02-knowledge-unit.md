# Cross-Feature Communication

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Cross-Feature Communication
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Cross-feature communication defines how features interact without creating tight coupling. Features should not directly access each other's models. Instead, they communicate through well-defined interfaces: service classes, events, or a shared kernel/bus layer.

The engineering value is maintaining the independence of each feature. When feature A depends on feature B through a stable interface, feature B can be refactored internally without breaking feature A. This prevents the application from devolving into a tangled mess of cross-cutting dependencies.

---

## Core Concepts

### Direct Dependency (Anti-Pattern)

```php
// Billing feature directly accesses Users feature internals
use App\Features\Users\Models\Profile;

class InvoiceController extends Controller
{
    public function sendReminder(Invoice $invoice)
    {
        $profile = Profile::where('user_id', $invoice->user_id)->first();
        // Billing knows about Users' Profile model
    }
}
```

### Interface-Based Communication

```php
// Billing defines what it needs from Users
interface UserProfileProvider
{
    public function getContactEmail(int $userId): string;
    public function getNotificationPreferences(int $userId): array;
}

// Users feature provides the implementation
class UserProfileService implements UserProfileProvider
{
    public function getContactEmail(int $userId): string
    {
        $user = User::findOrFail($userId);
        return $user->email;
    }

    public function getNotificationPreferences(int $userId): array
    {
        return Profile::where('user_id', $userId)->value('preferences') ?? [];
    }
}

// Billing only depends on the interface
class InvoiceReminderService
{
    public function __construct(
        private UserProfileProvider $userProfile,
    ) {}
}
```

### Event-Based Communication

```php
// Billing feature dispatches an event
class InvoicePaid
{
    public function __construct(
        public readonly Invoice $invoice,
        public readonly User $user,
    ) {}
}

// A microservice/package or AppServiceProvider bridges features
class BillingEventSubscriber
{
    public function subscribe(Dispatcher $events): void
    {
        $events->listen(
            App\Features\Billing\Events\InvoicePaid::class,
            [App\Features\Analytics\Listeners\RecordRevenue::class, 'handle'],
        );

        $events->listen(
            App\Features\Billing\Events\InvoicePaid::class,
            [App\Features\Notifications\Listeners\SendReceipt::class, 'handle'],
        );
    }
}
```

---

## Mental Models

### The Facade Pattern

Each feature presents a clean facade (its service layer) to the rest of the application. Other features interact only with the facade, never with the internals. The facade is the feature's public API.

### The Event Marketplace

Events are broadcast to interested listeners. The dispatching feature doesn't know (or care) who listens. The listening features don't know who dispatched it. This is the loosest form of coupling — both sides depend only on the event shape.

---

## Internal Mechanics

| Pattern | Coupling | When to Use |
|---|---|---|
| Shared model (`app/Models/`) | Highest | Model is truly shared (User) |
| Service interface | Medium | One feature needs data from another |
| Event dispatching | Low | Fire-and-forget side effects |
| Job dispatching | Low | Async cross-feature work |
| Shared kernel/bus | Lowest | Complex domain orchestrations |
| Direct model access | ❌ Never | Always an anti-pattern |

---

## Patterns

### Service Interface in Shared Kernel

```php
// app/Kernel/Contracts/BillingInterface.php
namespace App\Kernel\Contracts;

interface BillingInterface
{
    public function charge(User $user, float $amount): Invoice;
    public function refund(Invoice $invoice): void;
    public function hasActiveSubscription(User $user): bool;
}
```

```php
// Features/Billing/Services/BillingService.php
class BillingService implements BillingInterface
{
    public function charge(User $user, float $amount): Invoice
    {
        return DB::transaction(function () use ($user, $amount) {
            $charge = PaymentGateway::charge($user->stripe_id, $amount);
            return Invoice::create([...]);
        });
    }
    // ...
}
```

### DTO-Based Communication

```php
// app/Kernel/DTOs/InvoiceData.php
class InvoiceData
{
    public function __construct(
        public readonly int $id,
        public readonly string $status,
        public readonly float $amount,
        public readonly CarbonInterface $dueDate,
    ) {}
}

// Billing returns a DTO to other features
class BillingService implements BillingInterface
{
    public function charge(User $user, float $amount): InvoiceData
    {
        $invoice = // ... create invoice
        return new InvoiceData(
            id: $invoice->id,
            status: $invoice->status,
            amount: (float) $invoice->amount,
            dueDate: $invoice->due_date,
        );
    }
}
```

### Async Cross-Feature Jobs

```php
// Billing dispatches a job
class InvoicePaid
{
    public function handle(): void
    {
        InvoicePaidJob::dispatch($this->invoice->id);
    }
}

// The job class (can live in a shared location or be duplicated per listener)
class InvoicePaidJob implements ShouldQueue
{
    public function __construct(public int $invoiceId) {}

    public function handle(InvoiceService $billing, AnalyticsService $analytics): void
    {
        // Billing handles its own post-payment logic
        $invoice = $billing->findInvoice($this->invoiceId);

        // Analytics records the event
        $analytics->recordRevenue($invoice->amount, $invoice->paid_at);
    }
}
```

---

## Architectural Decisions

### Direct Service vs Event

| Concern | Service Interface | Event |
|---|---|---|
| Return value | Yes (synchronous response) | No (fire and forget) |
| Error handling | Caller handles errors | Listener handles errors |
| Coupling | Tighter (caller knows interface) | Looser (no direct reference) |
| Debugging | Easier (linear call stack) | Harder (dispatcher + listener) |
| Performance | Synchronous | Can be queued (async) |
| Use case | Data retrieval | Side effects |

### Shared Kernel Location

```
app/
  Kernel/
    Contracts/       # Interfaces that features implement
    DTOs/            # Data transfer objects for cross-feature communication
    Events/          # Application-level events (not feature-specific)
    Exceptions/      # Base exception classes
  Features/
    Billing/
    Users/
```

The `app/Kernel/` (or `app/Shared/`) directory contains only contracts and DTOs — no implementation. Every feature can depend on it.

---

## Tradeoffs

| Concern | Tight Coupling | Loose Coupling |
|---|---|---|
| Development speed | Fast (direct access) | Slow (build abstractions) |
| Refactoring flexibility | Low (ripple effects) | High (hidden behind interface) |
| Code navigation | Simple (follow the code) | Complex (interface → implementation) |
| Testability | Harder (concrete dependencies) | Easier (mock interfaces) |
| Over-engineering risk | Low | High (abstractions for everything) |

---

## Performance Considerations

Cross-feature communication via service interfaces is zero-cost — PHP resolves the concrete class at container resolution. Event-based communication adds minimal overhead for dispatching (~0.1ms). Queued events move the cost to a worker process.

---

## Production Considerations

- Establish a directory for shared contracts (`app/Kernel/Contracts/` or `app/Contracts/`)
- Document which features depend on which other features (dependency graph)
- Enforce a dependency direction: "upper" features can depend on "lower" features, never the reverse
- Use events for cross-cutting concerns (audit logging, notifications, analytics)
- Use service interfaces for data retrieval across features
- Never allow direct model access across feature boundaries — enforce with PHPStan/Psalm rules
- Run a CI step that detects cross-feature model imports

---

## Common Mistakes

### Over-Engineering

Creating an interface + implementation for every cross-feature interaction before there's evidence it's needed. Start with a simple service call. Extract an interface when you need a second implementation or when testing demands it.

### Circular Feature Dependencies

Billing depends on Users for profile data. Users depends on Billing for subscription status. This creates a circular dependency that makes it impossible to test either feature independently. Break the cycle by:
1. Moving the contract to `app/Kernel/Contracts/`
2. Inverting the dependency (Users defines the subscription interface, Billing implements it)

### Event Gone Wild

A single event triggers 15 listeners across 8 features. Debugging becomes difficult because any listener could fail independently. Consider whether some listeners should be jobs (async) and whether the event should be split into multiple specific events.

---

## Failure Modes

### Silent Interface Drift

Feature A depends on an interface in `app/Kernel/Contracts/`. Feature B's implementation changes but forgets to update the interface. The contract is violated but no error is thrown until runtime. Mitigate: write contract tests that verify implementations satisfy the interface.

### Missing Event Listener Registration

An event is dispatched but the listener is not registered. The side effect silently doesn't happen (no notification sent, no analytics recorded). Mitigate: testing against event-listener binding checks in CI.

---

## Ecosystem Usage

Laravel's event system provides built-in support for loose coupling between features. The `EventServiceProvider` can register cross-feature event listeners. Laravel's queue system enables async cross-feature jobs. For service contracts, Laravel's container binding in service providers wires interfaces to implementations across feature boundaries. PHPStan/Psalm custom rules can enforce cross-feature communication policies in CI.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — understanding feature boundaries
- **Module Organization** (this workspace) — where shared contracts live
- **Service Layer Pattern** (this workspace) — service classes as the feature's public API
- **Actions Pattern** (this workspace) — action classes for single cross-feature operations
- **Events** (this workspace) — event system for loose coupling
- **DTOs** (this workspace) — data transfer objects for safe cross-boundary data passing

---

## Research Notes

- Feature independence is the primary benefit of feature-based structure — don't sacrifice it with tight coupling
- The `app/Kernel/` pattern is adapted from Symfony's kernel concept
- Events are the preferred communication mechanism in modular Laravel applications
- Service providers should wire cross-feature dependencies (binding interfaces to implementations)
- PHPStan/Psalm can enforce "no direct import from Features/*/Models/" rules with custom rules
- Feature independence enables parallel development: multiple teams can work on separate features simultaneously
- Consider extracting features into separate packages if cross-feature communication becomes too complex
