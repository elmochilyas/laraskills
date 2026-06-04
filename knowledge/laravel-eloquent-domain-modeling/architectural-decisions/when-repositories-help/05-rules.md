# Architectural Decision Rules: When Repositories Help

---

## Rule 1: Design repository interfaces around domain concepts, not SQL semantics
---
## Category
Architecture
---
## Rule
Name repository methods using domain language that describes what is being retrieved, not how the database finds it. Avoid `findWhere(array)`, `getByFields()`, or `findByCriteria()`. Use `findActiveContracts()`, `getOverdueAccounts()`, `findSubscriberByEmail()`.
---
## Reason
Repository interfaces exist to abstract storage. If the interface mirrors SQL (`WHERE`, `ORDER BY`, `JOIN`), the abstraction is leaky and provides no hiding. Domain-named methods document intent and allow the implementation to vary without changing callers.
---
## Bad Example
```php
interface InvoiceRepository
{
    public function findWhere(array $criteria, array $orderBy = []): array; // SQL leak
    public function findByStatus(string $status): array;
}
```
---
## Good Example
```php
interface InvoiceRepository
{
    public function findAllOverdueSince(\DateTimeImmutable $since): array;
    public function findByCustomer(Customer $customer): array;
    public function findPendingSince(\DateTimeImmutable $since): array;
}
```
---
## Exceptions
When the repository wraps a generic data store (e.g., key-value cache) where `findWhere` is genuinely domain-agnostic.
---
## Consequences Of Violation
Leaky abstraction provides no storage hiding; callers cannot tell what queries run; swapping storage backends is harder because the interface assumes SQL concepts.

---

## Rule 2: Create one repository per aggregate root, not per database table
---
## Category
Architecture
---
## Rule
Define a repository only for aggregate roots. Child entities (lines, items, addresses) are accessed and persisted through their aggregate root's repository.
---
## Reason
Aggregate roots are the consistency boundary in domain-driven design. Providing independent repositories for child entities encourages persisting them independently, which bypasses aggregate invariants and leads to inconsistent state.
---
## Bad Example
```php
interface OrderRepository { /* ... */ }
interface OrderLineRepository { /* ... */ }  // Child — no independent repo
interface OrderPaymentRepository { /* ... */ }  // Child
```
---
## Good Example
```php
interface OrderRepository
{
    public function findById(int $id): ?Order; // OrderLine loaded through Order
    public function store(Order $order): void;
}
```
---
## Exceptions
When a child entity is read-only and queried independently for reporting purposes. In that case, use a Query Object instead of a write repository.
---
## Consequences Of Violation
Repository proliferation (50+ repos for 50 tables); child entities persisted independently, breaking aggregate consistency; unclear domain boundaries.

---

## Rule 3: Keep transaction management out of repositories — let the caller handle it
---
## Category
Reliability
---
## Rule
Repository methods must not begin or commit database transactions. Transaction boundaries belong to the use-case layer (action or controller) that coordinates multiple operations.
---
## Reason
Repositories that manage their own transactions cause nested transaction bugs when the caller also uses transactions. If the repository commits and the caller's outer transaction fails, the repository's changes are already committed and cannot be rolled back.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function store(Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($invoice) {
            $invoice->save();
            return $invoice;
        }); // Repository manages transaction
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function store(Invoice $invoice): Invoice
    {
        $invoice->save();
        return $invoice;
    }
}

// Transaction managed by use-case layer
class PayInvoiceAction
{
    public function __invoke(Invoice $invoice): void
    {
        DB::transaction(function () use ($invoice) {
            $invoice->markAsPaid();
            $this->invoices->store($invoice);
            $this->payments->record($invoice);
        });
    }
}
```
---
## Exceptions
When the repository method needs to ensure atomicity for its own multi-step persistence logic (e.g., saving to two tables within a single repository). Wrap only the internal multi-step operation, not the entire method.
---
## Consequences Of Violation
Nested transaction warnings; partial commits when outer transaction fails; confusing transaction debug logs; repository methods cannot be safely composed.

---

## Rule 4: Abstract only when storage actually varies or will vary within the project lifetime
---
## Category
Architecture
---
## Rule
Create a repository interface only when you have multiple storage backends (MySQL + Redis + API) or a realistic near-term need for one. Do not create repositories preemptively for hypothetical future changes.
---
## Reason
Each repository interface adds maintenance cost: the interface file, the implementation, the binding, and the cognitive load of indirection. YAGNI dictates you should not pay this cost without a concrete current need.
---
## Bad Example
```php
// Interface for a lookup table with one MySQL source — unnecessary abstraction
interface CountryRepository
{
    public function findAll(): array;
    public function findByCode(string $code): ?Country;
}

class EloquentCountryRepository implements CountryRepository { /* ... */ }
```
---
## Good Example
```php
// Direct Eloquent usage — no abstraction overhead until storage varies
class LookupController
{
    public function countries(): array
    {
        return Country::all(['code', 'name'])->toArray();
    }
}
```
---
## Exceptions
When building a package or library that must support multiple storage backends by design. In that case, the interface is a core feature, not an abstraction overhead.
---
## Consequences Of Violation
Interface proliferation with no tangible benefit; developers resent the extra files and ceremony; repository pattern is abandoned after initial enthusiasm, leaving dead interfaces.

---

## Rule 5: Accept `$with` parameters for eager loading in repository methods
---
## Category
Performance
---
## Rule
Design repository methods to accept an optional array of relation names to eager-load, defaulting to the relations the aggregate root always needs.
---
## Reason
Different callers need different relation sets. Hard-coding all relations in every method causes over-fetching for list views. Accepting `$with` lets each caller control the load without adding a new method per relation combination.
---
## Bad Example
```php
interface OrderRepository
{
    public function findById(int $id): ?Order; // No eager-load control
    // Callers must always load all relations or miss some
}
```
---
## Good Example
```php
interface OrderRepository
{
    public function findById(int $id, array $with = ['lines']): ?Order;
    public function findAllRecent(int $days, array $with = []): array;
}
```
---
## Exceptions
Relations that are semantically required for the domain object to be valid (e.g., an Invoice must have Line items). Those should be hard-coded, not optional.
---
## Consequences Of Violation
Over-fetching for list endpoints (loading relations not needed); under-fetching causing N+1 in detail views; repository method explosion for every relation combination.

---

## Rule 6: Never expose Eloquent-specific types (`Builder`, `Model`) in repository interfaces
---
## Category
Architecture
---
## Rule
Repository interface signatures must only use domain types, primitives, and PHP standard types. Never reference `Illuminate\Database\Eloquent\Builder`, `Model`, `Collection`, or any Eloquent-specific class.
---
## Reason
The repository interface is a domain port. Exposing Eloquent types in its signature couples every consumer to Laravel, even if they think they are programming against an abstraction. The interface must be implementable with any storage backend.
---
## Bad Example
```php
interface InvoiceRepository
{
    public function query(): Builder; // Eloquent type leak
    public function findById(int $id): ?Invoice;
    public function store(Invoice $invoice): Model; // Eloquent type leak
}
```
---
## Good Example
```php
interface InvoiceRepository
{
    public function findById(int $id): ?Invoice;
    public function store(Invoice $invoice): Invoice;
    public function delete(Invoice $invoice): void;
}
```
---
## Exceptions
When the repository itself is intentionally tied to Eloquent and the "abstraction" exists solely for testing with in-memory replacements. In this case, document that the interface is not a port but a test seam.
---
## Consequences Of Violation
Repository abstraction provides no decoupling; consumers cannot use non-Eloquent implementations; the interface leaks storage details into domain naming.

---

## Rule 7: Unit-test repository methods with in-memory fakes, not mocked interfaces
---
## Category
Testing
---
## Rule
Write an in-memory implementation of every repository interface and test your domain logic against it. Mocking a repository in tests gives false confidence — the mock doesn't exercise the real persistence contract.
---
## Reason
In-memory fakes exercise the same interface contract as the production implementation, catching behavioral mismatches that mocks would miss. Mocks only verify call patterns, not data integrity or the actual round-trip of domain objects.
---
## Bad Example
```php
// Mock tests the mock, not the contract
$repo = $this->createMock(InvoiceRepository::class);
$repo->method('findById')->willReturn($invoice);
```
---
## Good Example
```php
// In-memory fake tests the real contract
$repo = new InMemoryInvoiceRepository();
$repo->store($invoice);
$retrieved = $repo->findById($invoice->id);
$this->assertTrue($invoice->equals($retrieved));
```
---
## Exceptions
When the repository wraps an external service with no meaningful in-memory implementation (e.g., `PaymentGateway`). In that case, use contract tests that mock the external dependency at the HTTP client level, not the repository interface.
---
## Consequences Of Violation
Tests pass with mocks but fail against the real database; SQL errors in Eloquent implementation go undetected; data mapping bugs between domain and storage are invisible in test runs.

---

## Rule 8: Do not create repositories for read-only queries — use Query Objects instead
---
## Category
Code Organization
---
## Rule
Reserve repositories for write operations and aggregate persistence. For read-only queries that return data for display, use Query Objects instead.
---
## Reason
Repositories that mix read and write concerns accumulate dozens of finder methods, becoming unmanageable. Query Objects are simpler: they are invocable classes with explicit filter parameters, named after the result they return. Separating reads from writes follows CQRS principles and keeps both sides focused.
---
## Bad Example
```php
// Repository with 20 finder methods — bloat
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function store(Order $order): void;
    public function findRecentByCustomer(int $customerId, int $days): array;
    public function findTopSellingProducts(int $limit): array;
    public function findMonthlyReport(int $year, int $month): array;
    public function findByStatusAndDateRange(string $status, ...): array;
    // 14 more finder methods
}
```
---
## Good Example
```php
// Repository — write-focused
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function store(Order $order): void;
    public function delete(Order $order): void;
}

// Query Objects — read-focused
class RecentCustomerOrdersQuery { /* ... */ }
class TopSellingProductsQuery { /* ... */ }
class MonthlyReportQuery { /* ... */ }
```
---
## Exceptions
When the read query is so fundamental to the aggregate that separating it would cause more effort than benefit (e.g., `findById` on the repository is both read and write entry point).
---
## Consequences Of Violation
Repository bloat from accumulating finder methods; query-specific parameters in repository signatures; mixing read optimization (denormalization) with write consistency concerns.
