# Architectural Decision Rules: Eloquent as Adapter

---

## Rule 1: Never extend `Illuminate\Database\Eloquent\Model` from domain model classes
---
## Category
Architecture
---
## Rule
Never let domain model classes extend Eloquent's `Model` class. Domain models must be plain PHP classes with no `save()`, `::find()`, or `::query()` methods.
---
## Reason
Extending Eloquent couples domain logic to the ORM and the database. Domain models become persistence-aware, violating persistence ignorance and making them impossible to unit-test without database infrastructure.
---
## Bad Example
```php
class Invoice extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->save(); // Persistence concern in domain
    }
}
```
---
## Good Example
```php
class Invoice
{
    public function __construct(
        public readonly int $id,
        public InvoiceStatus $status,
        public Money $total,
    ) {}

    public function markAsPaid(): void
    {
        if ($this->status !== InvoiceStatus::Sent) {
            throw new \DomainException('Only sent invoices can be paid.');
        }
        $this->status = InvoiceStatus::Paid;
    }
}
```
---
## Exceptions
Simple CRUD applications where domain logic is minimal and the model is essentially a data transfer object. When the domain has no complex invariants to protect.
---
## Consequences Of Violation
Domain coupled to database; cannot unit-test domain logic; hidden `save()` calls in business methods; repository pattern cannot cleanly separate concerns.

---

## Rule 2: Always map Eloquent models to domain objects at the repository boundary
---
## Category
Architecture
---
## Rule
Always convert Eloquent models to domain objects inside repository methods before returning. Never return Eloquent model instances from repository methods.
---
## Reason
Returning Eloquent models leaks lazy-loading, global scopes, and Eloquent-specific types (Carbon, Collection) into the domain layer. Callers become implicitly coupled to Eloquent, defeating the purpose of the adapter.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?Invoice // Returns Eloquent Invoice
    {
        return \App\Models\Invoice::with('lines')->find($id);
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findById(int $id): ?DomainInvoice
    {
        $eloquent = \App\Models\Invoice::with('lines')->find($id);
        return $eloquent ? $this->toDomain($eloquent) : null;
    }

    private function toDomain(\App\Models\Invoice $eloquent): DomainInvoice
    {
        return new DomainInvoice(
            id: $eloquent->id,
            status: InvoiceStatus::from($eloquent->status),
            total: Money::fromCents($eloquent->total_cents),
        );
    }
}
```
---
## Exceptions
When the domain model IS the Eloquent model (no repository pattern in use). This rule applies only when a repository/adapter layer exists.
---
## Consequences Of Violation
Lazy loading leaks into domain logic; global scopes affect domain operations; Eloquent types appear in domain namespaces; repository abstraction is meaningless.

---

## Rule 3: Eager-load all required relations in the repository before mapping
---
## Category
Performance
---
## Rule
Eager-load every relation the domain object will need inside the repository method. Since domain models cannot lazy-load, failing to eager-load forces callers to either re-query or accept incomplete domain objects.
---
## Reason
Domain models are plain PHP objects with no connection to the database. If a repository returns a domain model without its related data, the caller has no way to load it lazily and must issue additional queries manually, causing N+1.
---
## Bad Example
```php
class EloquentOrderRepository implements OrderRepository
{
    public function findById(int $id): ?DomainOrder
    {
        $eloquent = \App\Models\Order::find($id); // No eager load
        return $eloquent ? $this->toDomain($eloquent) : null;
    }
}
```
---
## Good Example
```php
class EloquentOrderRepository implements OrderRepository
{
    public function findById(int $id): ?DomainOrder
    {
        $eloquent = \App\Models\Order::with('lines', 'payments', 'shipments')->find($id);
        return $eloquent ? $this->toDomain($eloquent) : null;
    }
}
```
---
## Exceptions
When the calling code explicitly states it does not need the relations and passes an `$with` parameter to control eager loading.
---
## Consequences Of Violation
N+1 query explosions from callers trying to fill domain objects; performance degradation that is hard to trace; domain models with null relation fields.

---

## Rule 4: Keep domain namespaces free of `use Illuminate\*` imports
---
## Category
Architecture
---
## Rule
Maintain a static analysis rule (PHPStan/Psalm) that rejects any `use Illuminate\*` or `use App\Models\*` import inside the `Domain\` namespace. Zero framework imports is the invariant.
---
## Reason
Each framework import in domain code creates a dependency on Laravel's base classes, types, and conventions. Enforcing zero imports at the tooling level prevents accidental coupling that code review might miss.
---
## Bad Example
```php
namespace Domain\Invoicing;

use Illuminate\Support\Collection; // Framework type in domain
use Carbon\Carbon;                 // Framework dependency

class Invoice
{
    public function getTotal(): Collection { /* ... */ }
    public function getDueDate(): Carbon { /* ... */ }
}
```
---
## Good Example
```php
namespace Domain\Invoicing;

class Invoice
{
    /** @return array<int, LineItem> */
    public function getLines(): array { /* ... */ }
    public function getDueDate(): \DateTimeImmutable { /* ... */ }
}
```
---
## Exceptions
When the domain intentionally depends on a Symfony component (e.g., `Uuid`) that is a framework dependency but is also a domain concern. Review each exception case-by-case.
---
## Consequences Of Violation
Gradual framework coupling erodes the domain boundary; domain tests require Laravel bootstrap; swapping the framework becomes impossible.

---

## Rule 5: Use the same ID reference when mapping between Eloquent and domain models
---
## Category
Reliability
---
## Rule
Use identical ID values (typically the database auto-increment or UUID) when mapping back and forth between Eloquent records and domain models. Never generate separate IDs for each representation.
---
## Reason
Identity drift between the Eloquent record and the domain model causes data duplication, foreign key mismatches, and subtle bugs where the same entity is treated as two different objects.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function toDomain(\App\Models\Invoice $eloquent): DomainInvoice
    {
        return new DomainInvoice(
            id: Uuid::v4(), // New ID unrelated to database ID
            // ...
        );
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function toDomain(\App\Models\Invoice $eloquent): DomainInvoice
    {
        return new DomainInvoice(
            id: $eloquent->id, // Same ID as database record
            // ...
        );
    }
}
```
---
## Exceptions
When migrating from legacy systems where the domain needs temporary synthetic IDs before persistence.
---
## Consequences Of Violation
Data duplication on save; inability to correlate domain objects with database records; broken references between aggregates; cascade of bugs in cross-aggregate operations.

---

## Rule 6: Accept `$with` parameters in repository methods for flexible eager loading
---
## Category
Performance
---
## Rule
Design repository methods to accept an optional array of relation names to eager-load, defaulting to the minimal set the domain contract requires.
---
## Reason
Different callers need different relation sets. Hard-coding all relations in the repository causes over-fetching for simple reads. A `$with` parameter lets each caller specify exactly what they need without adding repository methods for every combination.
---
## Bad Example
```php
interface InvoiceRepository
{
    public function findById(int $id): ?DomainInvoice;
    // Always loads all relations — callers can't opt out
}
```
---
## Good Example
```php
interface InvoiceRepository
{
    public function findById(int $id, array $with = ['lines']): ?DomainInvoice;
    public function findOverdue(\DateTimeImmutable $asOf, array $with = []): array;
}
```
---
## Exceptions
When the domain model requires certain relations to be valid (e.g., an Invoice must always have lines). Those should be hard-coded and not optional.
---
## Consequences Of Violation
Over-fetching for simple list views; under-fetching causing N+1 in detail views; repository method proliferation for every relation combination.

---

## Rule 7: Handle pagination in the repository layer before mapping
---
## Category
Performance
---
## Rule
Perform pagination (limit/offset or cursor) inside the repository while still in the Eloquent query, before mapping to domain objects. Never pull all records into memory and paginate after mapping.
---
## Reason
Mapping thousands of Eloquent records to domain objects only to discard most of them wastes CPU and memory. Paginating before mapping ensures only the needed page is transformed.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findAll(): array
    {
        return \App\Models\Invoice::all()
            ->map(fn ($e) => $this->toDomain($e))
            ->toArray(); // Loads ALL rows, maps them, then caller paginates
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository
{
    public function findAllPaginated(int $perPage = 15, int $page = 1): LengthAwarePaginator
    {
        $paginator = \App\Models\Invoice::with('lines')
            ->paginate(perPage: $perPage, page: $page);

        return $paginator->setCollection(
            $paginator->getCollection()->map(fn ($e) => $this->toDomain($e))
        );
    }
}
```
---
## Exceptions
When the total dataset is guaranteed to be small (under 1000 records) and pagination is purely a UI concern controlled by the caller.
---
## Consequences Of Violation
Memory exhaustion on large datasets; unnecessary mapping overhead; slow response times on list endpoints; inability to use cursor pagination efficiently.

---

## Rule 8: Use `DateTimeImmutable` and value objects in domain models, not Carbon or Eloquent casts
---
## Category
Architecture
---
## Rule
Use `DateTimeImmutable` for all time values and custom value objects for typed primitives in domain models. Never use `Carbon` or Eloquent `Cast` attributes in domain classes.
---
## Reason
Carbon is a Laravel dependency that mutates time objects in-place, enabling subtle bugs. Eloquent casts only work when the model extends Eloquent's Model class — they are unavailable in plain PHP domain models. Value objects enforce type safety at the domain boundary.
---
## Bad Example
```php
class Invoice
{
    public function __construct(
        public Carbon $dueDate,   // Framework dependency
        public float $total,       // Primitive obsession
    ) {}
}
```
---
## Good Example
```php
class Invoice
{
    public function __construct(
        public \DateTimeImmutable $dueDate,
        public Money $total,       // Value object
    ) {}
}
```
---
## Exceptions
When the domain layer is not separated (simple CRUD app using Eloquent directly as domain model). In that case, Carbon and casts are acceptable.
---
## Consequences Of Violation
Domain depends on Laravel; Carbon's mutability causes time-based bugs; domain models cannot exist without Eloquent's casting machinery; framework swap is impossible.
