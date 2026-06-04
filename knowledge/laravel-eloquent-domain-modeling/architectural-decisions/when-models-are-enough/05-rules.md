# Architectural Decision Rules: When Models Are Enough

---

## Rule 1: Put within-aggregate domain logic on the model, not in an action
---
## Category
Architecture
---
## Rule
Place methods that only read or mutate a single model's own state directly on the Eloquent model class. Extract to an action only when the operation coordinates multiple aggregates or has external side effects.
---
## Reason
Model methods keep the domain visible where the data lives. Unnecessary action classes for single-model operations create indirection, increase file count, and hide domain logic behind a service layer that adds no abstraction value.
---
## Bad Example
```php
// Action class for a single-model state change — over-engineered
class MarkInvoiceAsPaidAction
{
    public function __invoke(Invoice $invoice): void
    {
        $invoice->status = 'paid';
        $invoice->paid_at = now();
        $invoice->save();
    }
}
```
---
## Good Example
```php
// Model method — direct, visible, testable
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = InvoiceStatus::Paid;
        $this->paid_at = now();
        $this->save();
    }
}

// Controller or action just calls the model method
$invoice->markAsPaid();
```
---
## Exceptions
When the same single-model operation needs to be called in a queued context and the model's serialization behavior is undesirable. In that case, extract to a queued action.
---
## Consequences Of Violation
Anemic domain models where all logic lives in services; action class proliferation for trivial operations; domain logic is scattered and harder to discover.

---

## Rule 2: Keep model methods pure — never call external services or dispatch jobs
---
## Category
Maintainability
---
## Rule
Model methods must not call `Mail::to()`, `dispatch()`, `Log::info()`, or any external service. Raise domain events for side effects; let event handlers handle infrastructure concerns.
---
## Reason
Model methods that call external services create hidden dependencies that cannot be mocked in tests. The model becomes coupled to mail, queue, and logging infrastructure, making unit tests slow and complex. Domain events keep the model focused on business rules.
---
## Bad Example
```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->save();
        Mail::to($this->user)->send(new InvoicePaidMail($this)); // External service
    }
}
```
---
## Good Example
```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = InvoiceStatus::Paid;
        $this->paid_at = now();
        $this->save();

        event(new InvoicePaid($this)); // Event — handler sends email
    }
}
```
---
## Exceptions
Logging `$this->log()` for audit trails that are intrinsic to the model's state (not infrastructure logging). Prefer events even for this case.
---
## Consequences Of Violation
Model methods are hard to test (require mail/queue fakes); external service failures break model operations; model cannot be used without Laravel infrastructure booted.

---

## Rule 3: Use explicit state-changing methods, not `update()` with arrays
---
## Category
Maintainability
---
## Rule
Define named methods for every state transition (`markAsPaid()`, `archive()`, `approve()`) instead of calling `$model->update(['status' => 'paid'])` in controllers or actions.
---
## Reason
Named methods document the domain's state machine explicitly and provide a single place where invariants are enforced for each transition. `update()` calls scattered across controllers make the state machine implicit and hard to audit.
---
## Bad Example
```php
// State transition scattered across the codebase
$invoice->update(['status' => 'paid', 'paid_at' => now()]); // Controller 1
$invoice->update(['status' => 'paid']); // Controller 2 (missing paid_at!)
```
---
## Good Example
```php
// Single authoritative method
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        if ($this->status !== InvoiceStatus::Sent) {
            throw new \DomainException('Only sent invoices can be paid.');
        }
        $this->status = InvoiceStatus::Paid;
        $this->paid_at = now();
        $this->save();
    }
}
```
---
## Exceptions
Bulk updates on non-domain fields (e.g., updating `last_viewed_at` timestamps) where a dedicated method would be over-engineering.
---
## Consequences Of Violation
State transition logic duplicated across controllers; invariants enforced inconsistently or not at all; domain state machine is undocumented and implicit.

---

## Rule 4: Keep models under ~300 lines; extract traits or value objects when exceeded
---
## Category
Maintainability
---
## Rule
Monitor model file length. When a model exceeds 300 lines, extract related groups of methods into traits (using the `boot{TraitName}` convention) or push value objects to separate classes.
---
## Reason
Large models become god classes that are hard to navigate and maintain. 300 lines is a warning threshold that prompts evaluation: are all these methods related to the model's single responsibility, or should some be extracted?
---
## Bad Example
```php
// 600-line model — God Model anti-pattern
class User extends Model
{
    // 30 methods covering auth, billing, profile, notifications, admin
}
```
---
## Good Example
```php
class User extends Model
{
    use HasProfile;
    use HasBilling;
    use Notifiable;
}

trait HasBilling
{
    public function charge(Money $amount): void { /* ... */ }
    public function hasActiveSubscription(): bool { /* ... */ }
}
```
---
## Exceptions
Models with many relationship definitions but few methods (e.g., a model with 20 relationships but no domain logic). The 300-line threshold applies to domain logic, not relationship boilerplate.
---
## Consequences Of Violation
Model becomes unmanageable; related logic is hard to find; merge conflicts increase as multiple developers modify the same file; testing requires more setup per test.

---

## Rule 5: Test model methods with model factories, not mocks
---
## Category
Testing
---
## Rule
Test model methods by creating real model instances with factories and asserting state changes. Never mock a model to test its own methods.
---
## Reason
Testing a model method with a mock tests the mock infrastructure, not the model. Factories create real database rows, exercising the method against actual Eloquent behavior, including casts, events, and database constraints.
---
## Bad Example
```php
// Mock tests the mock, not the model
public function test_mark_as_paid(): void
{
    $invoice = $this->createMock(Invoice::class);
    $invoice->expects($this->once())->method('save');
    $invoice->markAsPaid();
}
```
---
## Good Example
```php
// Factory tests the real model against the database
public function test_mark_as_paid(): void
{
    $invoice = Invoice::factory()->sent()->create();
    $invoice->markAsPaid();
    $this->assertEquals(InvoiceStatus::Paid, $invoice->fresh()->status);
    $this->assertNotNull($invoice->fresh()->paid_at);
}
```
---
## Exceptions
When testing a method on a model that requires complex external setup (e.g., a deeply nested relation chain). In that case, mock only the external dependencies, not the model itself.
---
## Consequences Of Violation
Tests pass but production code fails; Eloquent events don't fire in tests; database constraints are never exercised; test false positives hide real bugs.

---

## Rule 6: Never write to another model's table from a model method
---
## Category
Architecture
---
## Rule
Model methods must only modify `$this` attributes and owned relations (hasMany, morphMany). Never call `save()`, `update()`, or `delete()` on a different model class.
---
## Reason
Writing to another model's table from a model method crosses aggregate boundaries. The other aggregate's invariants are not enforced, and the operation's atomicity depends on the caller managing the transaction, which is not visible at the method level.
---
## Bad Example
```php
class Order extends Model
{
    public function cancel(): void
    {
        $this->status = 'cancelled';
        $this->save();
        Inventory::where('order_id', $this->id)->increment('stock'); // Cross-aggregate write
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function cancel(): void
    {
        $this->status = OrderStatus::Cancelled;
        $this->save();

        event(new OrderCancelled($this)); // Action handles cross-aggregate restoration
    }
}

class CancelOrderAction
{
    public function __invoke(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order->cancel();
            Inventory::restockForOrder($order);
        });
    }
}
```
---
## Exceptions
When two models share the same aggregate root (e.g., `Invoice` and `InvoiceLine`). In that case, the root may write to owned children within the aggregate boundary.
---
## Consequences Of Violation
Aggregate boundary violations; invariants on other models are bypassed; transactions are hidden and caller cannot enforce atomicity; debugging cross-model writes is difficult.

---

## Rule 7: Let controllers or actions manage the transaction boundary — not model methods
---
## Category
Reliability
---
## Rule
Model methods that call `$this->save()` should assume the caller manages the transaction boundary. Controllers and actions wrap operations with `DB::transaction()` when atomicity matters.
---
## Reason
If a model method both saves itself and an external service is called sequentially, the caller must wrap both in a transaction. Model methods cannot know whether they are called within or outside a transaction, so they should not manage it.
---
## Bad Example
```php
// Model manages its own transaction — conflicts with outer transaction
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        DB::transaction(function () {
            $this->status = 'paid';
            $this->save();
        });
    }
}
```
---
## Good Example
```php
// Model saves itself; caller manages transaction scope
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = InvoiceStatus::Paid;
        $this->paid_at = now();
        $this->save();
    }
}

// Action manages transaction boundary
class PayInvoiceAction
{
    public function __invoke(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->markAsPaid();
            $this->processPayment->forInvoice($invoice);
        });
    }
}
```
---
## Exceptions
Single-model operations that have no cross-aggregate coordination. In that case, the model can call `save()` without an outer transaction.
---
## Consequences Of Violation
Nested transaction warnings in Laravel; partial writes when a model transaction commits but the outer operation fails; confusing transaction debugging.

---

## Rule 8: Use Accessors only for computed presentation values, not for domain logic
---
## Category
Maintainability
---
## Rule
Limit Eloquent accessors to lightweight computed values for presentation (full name, formatted dates, URLs). Never place domain logic or database queries inside accessors.
---
## Reason
Accessors run on every attribute read, including inside Blade loops and serialization. Domain logic in accessors executes unintentionally during operations that read attributes, causing hidden side effects and performance degradation.
---
## Bad Example
```php
class Invoice extends Model
{
    public function total(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->calculateDiscountedTotal() // Domain logic in accessor
        );
    }

    private function calculateDiscountedTotal(): float
    {
        // Runs every time $invoice->total is accessed, even in Blade loops
    }
}
```
---
## Good Example
```php
class Invoice extends Model
{
    public function total(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => Money::fromCents($value), // Formatting only
        );
    }

    public function calculateDiscountedTotal(): Money // Explicit domain method
    {
        return $this->total->applyDiscount($this->computeDiscount());
    }
}
```
---
## Exceptions
Accessors that cache an expensive computation result using `shouldCache` on `Attribute::make` for genuinely presentation-only logic.
---
## Consequences Of Violation
Performance degradation from accessors running in loops; debugging difficulty when domain logic fires unexpectedly; accessor side effects triggered during serialization and caching.
