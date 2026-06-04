# Domain Methods on Models — Rules

---

## Rule: Name Domain Methods in Ubiquitous Language
---
## Category
Maintainability
---
## Rule
Always name domain methods using the same terms domain experts and stakeholders use in conversations. Never use technical database language for method names.
---
## Reason
Ubiquitous language bridges the gap between business requirements and code. A method named `markAsPaid()` communicates intent to a product manager; `updateStatus('paid')` communicates only to a developer familiar with the database schema.
---
## Bad Example
```php
class Invoice extends Model
{
    public function updateStatus(string $status): void
    {
        $this->status = $status;
        $this->save();
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
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }

    public function cancel(): void
    {
        $this->status = 'cancelled';
        $this->cancelled_at = now();
        $this->save();
    }
}
```
---
## Exceptions
Low-level technical methods that have no business meaning (e.g., `scopeActive()`, `getTotalAttribute()`).
---
## Consequences Of Violation
Code that requires constant mental translation between business terms and technical implementation, increasing onboarding time and miscommunication risk.

---

## Rule: Guard Preconditions at the Start of Every Domain Method
---
## Category
Reliability
---
## Rule
Validate all preconditions at the very beginning of each domain method, before any state mutation. Throw a domain-specific exception if any precondition is violated.
---
## Reason
Fail-fast validation prevents the method from performing partial mutations before discovering an invalid state. Checking late allows invalid state to be partially written before the error is thrown.
---
## Bad Example
```php
public function markAsPaid(): void
{
    $this->status = 'paid';
    $this->paid_at = now();
    // ... more mutations ...

    if ($this->status !== 'sent') {
        throw new \DomainException('Invalid status');
        // Too late — state is already partially changed
    }
    $this->save();
}
```
---
## Good Example
```php
public function markAsPaid(): void
{
    if ($this->status === 'paid') {
        throw new InvoiceAlreadyPaidException($this->id);
    }
    if ($this->status !== 'sent') {
        throw new InvalidInvoiceStatusException($this->id, $this->status, 'sent');
    }

    $this->status = 'paid';
    $this->paid_at = now();
    $this->save();
}
```
---
## Exceptions
No common exceptions. Preconditions are always checked first.
---
## Consequences Of Violation
Partial state mutations when validation fails mid-method, inconsistent data, and difficult-to-trace bugs where objects end up in unexpected states.

---

## Rule: Keep Domain Methods Free of External Side Effects
---
## Category
Architecture
---
## Rule
Never dispatch jobs, send emails, call external APIs, or log to external systems from within a domain method on the model.
---
## Reason
Domain methods should concern themselves only with validating business rules and mutating model state. External side effects couple the domain to infrastructure, prevent the method from being tested in isolation, and violate the Single Responsibility Principle.
---
## Bad Example
```php
class Order extends Model
{
    public function place(): void
    {
        $this->status = 'placed';
        $this->save();

        Mail::to($this->user)->send(new OrderConfirmation($this));
        Log::channel('orders')->info('Order placed', ['id' => $this->id]);
        Event::dispatch(new OrderPlaced($this->id));
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    public function place(): void
    {
        $this->status = 'placed';
        $this->save();
    }
}

// Side effects are triggered by the caller:
$order->place();
Event::dispatch(new OrderPlaced($order->id));
```
---
## Exceptions
No common exceptions. Defer all side effects to event listeners, action classes, or controllers.
---
## Consequences Of Violation
Untestable domain logic that requires mocking mail, log, and event infrastructure; domain code that breaks when infrastructure changes; and business logic hidden inside models that appears to do one thing but does many.

---

## Rule: Give Each Domain Method a Single Responsibility
---
## Category
Design
---
## Rule
Design each domain method to perform exactly one conceptual operation. A method named `markAsPaid()` should only mark the invoice as paid — it should not also send receipts, update ledgers, or notify accounting.
---
## Reason
Single-responsibility methods are composable, testable, and predictable. Methods with multiple responsibilities violate Command-Query Separation and force callers to accept side effects they may not want.
---
## Bad Example
```php
public function markAsPaid(): void
{
    $this->status = 'paid';
    $this->paid_at = now();
    $this->save();

    $this->updateAccountsReceivable(); // Unexpected side effect
    $this->notifyAccounting(); // Another surprise
}
```
---
## Good Example
```php
public function markAsPaid(): void
{
    $this->status = 'paid';
    $this->paid_at = now();
    $this->save();
}

// Side effects are explicit in the caller:
$invoice->markAsPaid();
Event::dispatch(new InvoicePaid($invoice->id));
```
---
## Exceptions
When a business rule explicitly requires two atomic changes that must happen in the same method call — but this usually suggests a missing aggregate boundary.
---
## Consequences Of Violation
Unexpected behavior when calling domain methods, difficulty reusing methods in different contexts, and tests that must set up mocks for unrelated side effects.

---

## Rule: Throw Domain-Specific Exception Classes
---
## Category
Maintainability
---
## Rule
Create and throw dedicated exception classes for each type of domain rule violation (e.g., `InvoiceAlreadyPaidException`, `OrderCannotBeModifiedException`) instead of using generic `\DomainException` or `\InvalidArgumentException`.
---
## Reason
Specific exception types allow callers to catch and handle each failure mode independently, enable automated testing of individual error paths, and provide clear documentation of failure modes.
---
## Bad Example
```php
public function markAsPaid(): void
{
    if ($this->status === 'paid') {
        throw new \DomainException('Invoice is already paid.');
    }
}

// Callers must string-match:
try {
    $invoice->markAsPaid();
} catch (\DomainException $e) {
    if (str_contains($e->getMessage(), 'already paid')) { ... }
}
```
---
## Good Example
```php
public function markAsPaid(): void
{
    if ($this->status === 'paid') {
        throw new InvoiceAlreadyPaidException($this->id);
    }
}

// Callers catch specific types:
try {
    $invoice->markAsPaid();
} catch (InvoiceAlreadyPaidException $e) {
    // Handle gracefully
}
```
---
## Exceptions
No common exceptions. Always use typed exceptions for domain rule violations.
---
## Consequences Of Violation
Brittle error handling based on message parsing, poor developer experience, and tests that cannot assert on specific failure modes.

---

## Rule: Call `$this->save()` Inside the Domain Method
---
## Category
Design
---
## Rule
Always call `$this->save()` as the last step inside a domain method, rather than requiring the caller to save the model after invoking the method.
---
## Reason
Requiring an external `save()` creates a split where business logic changes state but doesn't persist it, making the method incomplete and error-prone. Callers may forget to save, or save in the wrong order.
---
## Bad Example
```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        // No save — caller must remember!
    }
}

// Caller:
$invoice->markAsPaid();
$invoice->save(); // Easy to forget
```
---
## Good Example
```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();
    }
}

// Caller:
$invoice->markAsPaid();
```
---
## Exceptions
When the caller must batch multiple mutations in a single transaction. In that case, wrap the entire operation in `DB::transaction()` and have the domain method not call `save()` — but document this clearly.
---
## Consequences Of Violation
Forgotten saves leading to data loss, inconsistent patterns where some methods save and others don't, and increased cognitive load for callers.

---

## Rule: Do Not Pass External Parameters That Change Behavior Semantics
---
## Category
Design
---
## Rule
Design domain methods with fixed behavior — never accept a boolean or flag parameter that changes what the method conceptually does.
---
## Reason
Boolean parameters create methods with two different behaviors, violating Single Responsibility and making the code harder to read. The caller's intent is unclear: `approve($sendNotification: true)` hides the side effect behind a parameter.
---
## Bad Example
```php
public function cancel(bool $sendNotification = false): void
{
    $this->status = 'cancelled';
    $this->save();

    if ($sendNotification) {
        Mail::send(...);
    }
}
```
---
## Good Example
```php
public function cancel(): void
{
    $this->status = 'cancelled';
    $this->cancelled_at = now();
    $this->save();
}

// Notification is a separate concern:
$order->cancel();
Event::dispatch(new OrderCancelled($order->id));
```
---
## Exceptions
Pagination or query parameters on scope methods. Never for domain behavior methods.
---
## Consequences Of Violation
Methods with hidden dual behavior, callers unaware of side effects, and code that is harder to test because each parameter combination creates a different execution path.
