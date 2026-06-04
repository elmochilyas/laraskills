# Rules for Infrastructure layer: Eloquent implementations, external adapters

## Map Domain Entities to Eloquent Explicitly
---
## Category
Architecture | Code Organization
---
## Rule
In repository implementations, explicitly map between Domain entities and Eloquent models; do not use Eloquent models as domain entities or return them from repository methods.
---
## Reason
Domain entities are pure PHP business objects with behavior. Eloquent models are ActiveRecord persistence artifacts. Explicit mapping in the repository keeps concerns separate, preserves Domain purity, and makes the mapping logic testable.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice {
        return InvoiceModel::find($id->toString()); // No mapping — returns Eloquent model as domain entity
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function __construct(private InvoiceMapper $mapper) {}
    public function find(InvoiceId $id): ?Invoice {
        $model = InvoiceModel::with('items')->findOrFail($id->toString());
        return $this->mapper->toDomain($model);
    }
}
```
---
## Exceptions
Simple CRUD read operations where the query result is immediately transformed to a response (not passed to Domain) may skip mapping.
---
## Consequences Of Violation
Domain coupled to Eloquent; repository abstraction is cosmetic; mapping logic scattered; Domain purity compromised.

## No Business Logic in Infrastructure
---
## Category
Architecture | Code Organization
---
## Rule
NEVER place business logic (domain calculations, validation rules, business decision logic) in Infrastructure classes including Eloquent models.
---
## Reason
Business logic belongs in Domain. Logic in Eloquent models or repositories scatters business rules across the codebase, making them hard to find, test, and maintain. It also couples business rules to infrastructure concerns.
---
## Bad Example
```php
class InvoiceModel extends Model {
    public function calculateTotal(): float { // Business logic in infrastructure
        return $this->items->sum(fn($item) => $item->price * $item->quantity);
    }
    public function isOverdue(): bool {
        return $this->due_date->isPast(); // Business logic in infrastructure
    }
}
```
---
## Good Example
```php
// In Domain entity:
class Invoice {
    public function total(): Money {
        return $this->items->reduce(fn(Money $carry, LineItem $item) => $carry->add($item->subtotal()), Money::zero());
    }
}
// In Infrastructure:
class InvoiceModel extends Model {
    // Only persistence concerns — relationships, casts, scopes, accessors
}
```
---
## Exceptions
Simple accessors and appends that format data for presentation (e.g., `getFullNameAttribute`) are view concerns, not business logic — these are acceptable on models.
---
## Consequences Of Violation
Business rules scattered across Eloquent models, repositories, and services; business logic coupled to database schema; difficult to test business rules without database.

## Return Domain Types, Not Eloquent Types
---
## Category
Architecture | Framework Usage
---
## Rule
Repository methods MUST return Domain types (entities, value objects) or Application DTOs; NEVER return `Collection`, `LengthAwarePaginator`, or Eloquent model instances.
---
## Reason
Returning framework-specific types from repository methods leaks Laravel concerns into the Application layer. If a consumer imports `Illuminate\Support\Collection`, it now depends on a Laravel class, breaking the Dependency Rule.
---
## Bad Example
```php
interface InvoiceRepository {
    public function search(SearchCriteria $criteria): Collection; // Laravel type leak
    public function paginate(SearchCriteria $criteria): LengthAwarePaginator; // Laravel type leak
}
```
---
## Good Example
```php
interface InvoiceRepository {
    public function search(SearchCriteria $criteria): InvoiceCollection; // Domain type
    public function paginate(SearchCriteria $criteria): PaginatedResult; // Application DTO
}
```
---
## Exceptions
When full framework independence is not required (partial independence, Laravel DDD), returning `Collection` is an accepted tradeoff — document this decision.
---
## Consequences Of Violation
Application layer depends on Laravel types; cannot test Application without Laravel bootstrap; pagination abstraction leaks infrastructure knowledge.

## Write Integration Tests for Infrastructure
---
## Category
Testing | Reliability
---
## Rule
Write integration tests for all Infrastructure code (repositories, external API adapters, mail implementations) that exercise real infrastructure; do not rely solely on mocks.
---
## Reason
Infrastructure code interacts with databases, APIs, and filesystems — these are error-prone environments where mocks hide real-world issues: SQL syntax errors, API contract mismatches, connection timeouts. Integration tests catch these before production.
---
## Bad Example
```php
// Mocked test — passes even if SQL syntax is wrong
$repo->shouldReceive('save')->once()->andReturn(true);
```
---
## Good Example
```php
// Integration test against test database
class EloquentInvoiceRepositoryTest extends TestCase {
    use RefreshDatabase;
    /** @test */
    public function it_saves_and_retrieves_invoice(): void {
        $invoice = Invoice::create(/* ... */);
        $this->repo->save($invoice);
        $found = $this->repo->find($invoice->id());
        $this->assertTrue($invoice->equals($found));
    }
}
```
---
## Exceptions
Pure mapping or transformation logic within Infrastructure that has no external dependencies may use unit tests.
---
## Consequences Of Violation
SQL bugs reach production; API integration errors caught late; low confidence in infrastructure changes; manual testing required.

## Only Layer Importing Laravel Freely
---
## Category
Architecture | Code Organization
---
## Rule
The Infrastructure layer is the designated zone for Laravel-specific code; containment of framework coupling here protects all other layers.
---
## Reason
Clean Architecture concentrates framework coupling in Infrastructure so Domain and Application stay clean. Eloquent, Mail, Queue, Facades, and Laravel-specific packages all belong here.
---
## Bad Example
```php
// Laravel-specific code spread across layers
// app/Domain/Services/InvoiceService.php — uses Eloquent
// app/Application/UseCases/SendMail.php — uses Laravel Mail
// app/Infrastructure/... — some framework code
```
---
## Good Example
```php
// All Laravel-specific code contained:
// app/Infrastructure/Persistence/EloquentInvoiceModel.php
// app/Infrastructure/Mail/LaravelMailSender.php
// app/Infrastructure/Queue/LaravelJobDispatcher.php
// app/Domain/ — zero Laravel imports
// app/Application/ — zero Laravel imports
```
---
## Exceptions
Service providers and configuration files necessarily live outside Infrastructure — they are Laravel bootstrap concerns.
---
## Consequences Of Violation
Framework coupling leaks into Domain and Application; architectural boundaries break; framework migration becomes impossible.

## Avoid Over-Abstracting Infrastructure
---
## Category
Architecture | Design
---
## Rule
Add interface abstractions for Infrastructure classes only when there are or will be multiple implementations; do not create interfaces for every class with only one implementation.
---
## Reason
Every interface adds cognitive load and navigation overhead. An interface with a single implementation that will never have alternatives is ceremony without benefit — it increases code volume without enabling meaningful variation.
---
## Bad Example
```php
interface LoggerInterface { public function log(string $message): void; }
class FileLogger implements LoggerInterface { public function log(string $message): void { /* ... */ } }
// Only one implementation, no realistic alternative — interface is overhead
```
---
## Good Example
```php
interface InvoiceRepository { public function save(Invoice $invoice): void; }
class EloquentInvoiceRepository implements InvoiceRepository { /* ... */ }
class InMemoryInvoiceRepository implements InvoiceRepository { /* ... */ }
// Two implementations (production + testing) — interface justified
```
---
## Exceptions
Interfaces required for testing (e.g., to mock external API calls) are justified even with a single production implementation.
---
## Consequences Of Violation
Excessive indirection; navigation friction; ceremony without benefit; team frustration with abstractions.

## Prefer Aggressive Eager Loading in Repositories
---
## Category
Performance | Architecture
---
## Rule
In repository methods, explicitly eager-load all relationships needed for the returned Domain entity; do not rely on lazy loading.
---
## Reason
Lazy loading from within a mapped Domain entity triggers database queries after the repository has returned, causing N+1 problems. Eager loading in the repository ensures predictable query counts.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice {
        $model = InvoiceModel::find($id->toString()); // No eager load — lazy loading triggers N+1
        return $this->mapper->toDomain($model); // Accessing items relationship fires new query
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice {
        $model = InvoiceModel::with('items.product', 'customer')->findOrFail($id->toString());
        return $this->mapper->toDomain($model);
    }
}
```
---
## Exceptions
Simple entity lookups where no relationships exist need no eager loading.
---
## Consequences Of Violation
N+1 query problems; unpredictable performance; production slowdowns under load.
