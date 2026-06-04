# Rules for Mapping between domain entities and Eloquent models

## Maintain Mappers in Infrastructure Layer
---
## Category
Architecture | Code Organization
---
## Rule
Place all mapping logic between Domain entities and Eloquent models in the Infrastructure layer; do not place mappers in Domain or Application.
---
## Reason
Mapping is an infrastructure concern — it translates between persistence technology (Eloquent) and business objects (Domain). Placing it in Infrastructure respects layer boundaries and keeps Domain free of persistence concerns.
---
## Bad Example
```php
namespace App\Domain\Services;
class InvoiceMapper {
    public function toDomain(array $data): Invoice { /* ... */ }
    public function toEloquent(Invoice $invoice): array { /* ... */ }
}
```
---
## Good Example
```php
namespace App\Infrastructure\Persistence;
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice { /* ... */ }
    public function toEloquent(Invoice $invoice): array { /* ... */ }
}
```
---
## Exceptions
No common exceptions. Mapping always belongs in Infrastructure.
---
## Consequences Of Violation
Domain or Application layer contaminated with persistence mapping logic; layer boundaries violated.

## Write Bidirectional Mapper Tests
---
## Category
Testing | Reliability
---
## Rule
Write dedicated roundtrip tests for every mapper that verify domain→Eloquent→domain produces an equivalent object; test both directions separately.
---
## Reason
Mappers that lose data or transform asymmetrically (e.g., timezone truncation, floating-point rounding, null handling) cause data corruption that is difficult to debug. Roundtrip tests catch these failures deterministically.
---
## Bad Example
No mapper tests. A timezone conversion bug in the mapper silently stores all dates as UTC but reads them as America/New_York. Users see wrong dates for months before discovery.
---
## Good Example
```php
class InvoiceMapperTest extends TestCase {
    /** @test */
    public function it_preserves_all_fields_in_roundtrip(): void {
        $original = new Invoice(InvoiceId::generate(), Money::fromCents(1000, 'USD'), InvoiceStatus::PENDING);
        $eloquentData = $this->mapper->toEloquent($original);
        $model = new InvoiceModel($eloquentData);
        $restored = $this->mapper->toDomain($model);
        $this->assertTrue($original->equals($restored));
    }
}
```
---
## Exceptions
Trivial mappers that copy fields without transformation may have lighter test coverage — but at minimum test the roundtrip for each aggregate.
---
## Consequences Of Violation
Silent data corruption; asymmetric mapping (domain→model≠model→domain); difficult-to-debug production data issues; timezone, floating point, and null handling bugs.

## Eager Load Before Mapping
---
## Category
Performance | Reliability
---
## Rule
Explicitly eager-load all relationships needed by the mapper before calling `toDomain()`; do not let the mapper trigger lazy loading.
---
## Reason
Lazy loading during mapping fires additional database queries after the repository has returned, causing N+1 performance problems that are hard to predict and diagnose.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice {
        $model = InvoiceModel::find($id->toString()); // No eager load
        return $this->mapper->toDomain($model); // Mapper accesses $model->items → N+1
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice {
        $model = InvoiceModel::with('items.product.category', 'customer.addresses')
            ->findOrFail($id->toString());
        return $this->mapper->toDomain($model);
    }
}
```
---
## Exceptions
Simple entities with no relationships need no eager loading — a scalar field mapping is safe.
---
## Consequences Of Violation
N+1 query problems; unpredictable performance degradation; production slowdown under concurrent load.

## Avoid Partial Mapping
---
## Category
Maintainability | Reliability
---
## Rule
Map ALL fields between Domain entity and Eloquent model explicitly; do not map some fields and pass through others directly.
---
## Reason
Partial mapping creates confusion about where transformations happen. Some fields are mapped in the mapper, others are set directly on the model or entity — this scattered logic is hard to audit and maintain.
---
## Bad Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function save(Invoice $invoice): void {
        $data = [
            'id' => $invoice->id()->toString(),
            'total_cents' => $invoice->total()->toCents(),
            // status not mapped — passed through from controller
        ];
        $model = InvoiceModel::updateOrCreate(['id' => $data['id']], $data);
        $model->status = request('status'); // External field set directly — not mapped
    }
}
```
---
## Good Example
```php
class EloquentInvoiceRepository implements InvoiceRepository {
    public function save(Invoice $invoice): void {
        $data = $this->mapper->toEloquent($invoice); // All fields mapped in one place
        InvoiceModel::updateOrCreate(['id' => $data['id']], $data);
    }
}
```
---
## Exceptions
Read-only queries that project specific fields for a query model may use partial mapping — but this should be intentional and documented.
---
## Consequences Of Violation
Scattered transformation logic; difficult to audit which fields are mapped where; bugs when new fields are added but not consistently mapped.

## Test Roundtrip for Every Aggregate
---
## Category
Testing | Reliability
---
## Rule
Every aggregate root with a mapper MUST have a roundtrip test (domain→model→domain) that verifies all fields are preserved identically.
---
## Reason
Aggregate roots are the consistency boundary of the domain. A corrupted aggregate means corrupted business state. Roundtrip tests are the safety net that ensures mapping preserves all invariants.
---
## Bad Example
```php
// Only test: $this->mapper->toDomain($model) — one direction only
// No roundtrip: domain → model → domain
```
---
## Good Example
```php
/** @test */
public function it_roundtrips_invoice_with_items(): void {
    $original = $this->createComplexInvoice();
    $model = $this->repo->save($original);
    $restored = $this->repo->find($original->id());
    $this->assertTrue($original->equals($restored));
}
```
---
## Exceptions
Entities with no mapper (direct Eloquent usage, partial independence) need no roundtrip tests — but this is a documented architectural decision, not an omission.
---
## Consequences Of Violation
Silent data corruption in production; bugs in timezone, floating point, null, or relationship mapping; hard-to-debug state inconsistencies.

## Consider DTO as Intermediate Form
---
## Category
Architecture | Design
---
## Rule
For complex mappings, use an intermediate DTO between Domain entity and Eloquent model instead of mapping directly between the two.
---
## Reason
Direct entity-to-model mapping couples the mapper to both representations simultaneously. An intermediate DTO decouples the mapping steps, making each transformation simpler, testable, and reusable.
---
## Bad Example
```php
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice {
        return new Invoice(
            new InvoiceId($model->id),
            new Money($model->total_cents, 'USD'),
            InvoiceStatus::from($model->status),
            // Direct mapping — hard to test individual field transformations
        );
    }
}
```
---
## Good Example
```php
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice {
        return $this->toDomainFromDto($this->modelToDto($model));
    }
    private function modelToDto(InvoiceModel $model): InvoiceData {
        return new InvoiceData($model->id, $model->total_cents, $model->status);
    }
    private function toDomainFromDto(InvoiceData $dto): Invoice {
        return new Invoice(
            new InvoiceId($dto->id),
            Money::fromCents($dto->totalCents),
            InvoiceStatus::from($dto->status),
        );
    }
}
```
---
## Exceptions
Simple mappings with 3-5 straightforward field transformations do not need an intermediate DTO — the overhead exceeds the benefit.
---
## Consequences Of Violation
Complex mappers with hard-to-test field transformations; coupling between mapping steps; difficulty reusing partial transformations.

## Avoid Identity Crisis in Mappers
---
## Category
Design | Maintainability
---
## Rule
Do not duplicate transformation logic that already exists in Eloquent casts or accessors; use those features when Domain independence is not compromised.
---
## Reason
Mapping logic split between Eloquent casts and the mapper creates two sources of truth for the same transformation. Changes must be made in both places, and they can drift apart.
---
## Bad Example
```php
// Eloquent model has cast
class InvoiceModel extends Model {
    protected $casts = ['total_cents' => 'integer'];
}
// Mapper also transforms total_cents
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice {
        return new Invoice(Money::fromCents((int) $model->total_cents));
    }
}
// Two places handling the same transformation — casts change without mapper update
```
---
## Good Example
```php
// Eloquent cast handles persistence formatting
class InvoiceModel extends Model {
    protected $casts = ['total_cents' => 'integer'];
}
// Mapper handles domain-specific transformation only
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice {
        return new Invoice(Money::fromCents($model->total_cents)); // Single source
    }
}
```
---
## Exceptions
When full framework independence is required, Eloquent casts cannot be used in Domain — the mapper must handle all transformations, and casts should be kept minimal.
---
## Consequences Of Violation
Duplicated transformation logic; drift between cast and mapper; bugs when one is updated without the other.
