# Rules for Domain Entity to Eloquent Model Mapping

## Mapper in Infrastructure Layer
---
## Category
Architecture | Persistence
---
## Rule
Mapping logic between Domain Entities and Eloquent Models MUST reside in the Infrastructure layer; it MUST NOT be placed in Domain Entities, Domain Repositories, or Eloquent Models.
---
## Reason
Mapping is an Infrastructure concern that bridges two representations. Placing mapping code in Domain Entities couples them to database structure. Placing it in Eloquent Models couples them to Domain structure. Infrastructure is the correct layer for this bridging code.
---
## Bad Example
```php
// In Domain Entity
class Invoice {
    public static function fromModel(InvoiceModel $model): self { /* ... */ }
    public function toModel(): InvoiceModel { /* ... */ }
}
```
---
## Good Example
```php
// In Infrastructure/Mappers/
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice { /* ... */ }
    public function toModel(Invoice $invoice): InvoiceModel { /* ... */ }
}
```
---
## Exceptions
Eloquent custom casts for simple Value Objects may live in Infrastructure alongside the cast class.
---
## Consequences Of Violation
Domain entities coupled to database structure; Eloquent models coupled to Domain; layer boundaries violated.

## Repository Returns Domain Entities
---
## Category
Architecture | Persistence
---
## Rule
Repository interface methods MUST return Domain Entities/Aggregates, NOT Eloquent Models, collections, or paginators.
---
## Reason
The Repository interface is a Domain concept. Its contract must use Domain types. Returning Eloquent types leaks database concerns into the Domain layer and forces Domain consumers to depend on Eloquent.
---
## Bad Example
```php
interface InvoiceRepository {
    public function find(string $id): ?InvoiceModel; // Returns Eloquent model
    public function paginate(): LengthAwarePaginator; // Returns Eloquent paginator
}
```
---
## Good Example
```php
interface InvoiceRepository {
    public function find(InvoiceId $id): ?Invoice; // Returns Domain entity
    public function findByCustomer(CustomerId $id): array; // Returns array of Domain entities
}
```
---
## Exceptions
CQRS query-side repositories may return read models (DTOs) rather than Domain entities.
---
## Consequences Of Violation
Domain layer depends on Eloquent; framework coupling; impossible to extract Domain to separate package.

## Map Bidirectionally
---
## Category
Architecture | Persistence
---
## Rule
Mapping MUST be bidirectional — implement both `toDomain()` (Model → Domain) and `toModel()` (Domain → Model) with separate, explicit code paths.
---
## Reason
The read path and write path are different concerns. The database schema and Domain model may evolve independently. Separate code paths allow each direction to be tested and maintained independently without affecting the other.
---
## Bad Example
```php
class InvoiceMapper {
    public function map(InvoiceModel $model, ?Invoice $domain = null): mixed {
        // Single method trying to handle both directions
    }
}
```
---
## Good Example
```php
class InvoiceMapper {
    public function toDomain(InvoiceModel $model): Invoice { /* ... */ }
    public function toModel(Invoice $invoice): InvoiceModel { /* ... */ }
}
```
---
## Exceptions
No exceptions. Bidirectional mapping with separate paths is a hard requirement.
---
## Consequences Of Violation
Direction coupling; changes to one direction break the other; testing complexity.

## Handle Nested Entities Recursively
---
## Category
Architecture | Persistence
---
## Rule
Mappers MUST recursively handle nested Entities, Value Objects, and collections within an Aggregate; partial mapping that ignores nesting produces incomplete Domain objects.
---
## Reason
Aggregates contain nested structures. A mapper that only maps root-level properties and ignores line items, addresses, or sub-entities produces incomplete Aggregates that lose business data.
---
## Bad Example
```php
public function toDomain(InvoiceModel $model): Invoice {
    return new Invoice(
        id: new InvoiceId($model->id),
        total: new Money($model->total_cents, new Currency($model->currency)),
        lineItems: [], // Ignored — line items not mapped
    );
}
```
---
## Good Example
```php
public function toDomain(InvoiceModel $model): Invoice {
    return new Invoice(
        id: new InvoiceId($model->id),
        total: new Money($model->total_cents, new Currency($model->currency)),
        lineItems: $model->lineItems->map(
            fn(LineItemModel $item) => new LineItem(/* ... */)
        )->toArray(),
    );
}
```
---
## Exceptions
Read-only projections or query models may use partial mapping for performance reasons.
---
## Consequences Of Violation
Incomplete Domain objects; missing business data; nested business rules broken.

## Mapping Is Structural, Not Behavioral
---
## Category
Architecture | Persistence
---
## Rule
Mapper methods MUST be purely structural — they copy data between representations; they MUST NOT invoke Domain behavior methods, trigger Domain Events, or execute business logic.
---
## Reason
Mapping code should be safe to call at any time without side effects. If mapping triggers business behavior, calling the mapper has unintended consequences (events dispatched, state changed, invariants evaluated incorrectly).
---
## Bad Example
```php
public function toModel(Invoice $invoice): InvoiceModel {
    $invoice->validate(); // Domain behavior during mapping
    $model = new InvoiceModel();
    // ...
}
```
---
## Good Example
```php
public function toModel(Invoice $invoice): InvoiceModel {
    $model = new InvoiceModel();
    $model->id = $invoice->id()->toString();
    // ... structural copy only
    return $model;
}
```
---
## Exceptions
No exceptions. Mapping must be free of behavioral side effects.
---
## Consequences Of Violation
Side effects during persistence; unpredictable behavior; events triggered unexpectedly.

## Write Round-Trip Mapping Tests
---
## Category
Testing | Architecture
---
## Rule
Write round-trip tests that create a Domain Aggregate, map to Model, map back to Domain, and assert the result equals the original; this validates mapping completeness and correctness.
---
## Reason
Mapping errors are silent — they produce wrong Domain objects without throwing exceptions. Round-trip tests catch missing fields, incorrect Value Object conversion, and nested entity gaps by comparing the original and reconstructed Aggregate.
---
## Bad Example
```php
// Testing only one direction
public function test_toDomain_works(): void {
    $model = InvoiceModel::factory()->create();
    $domain = (new InvoiceMapper())->toDomain($model);
    $this->assertNotNull($domain);
}
```
---
## Good Example
```php
public function test_round_trip(): void {
    $original = InvoiceFactory::createDomainAggregate();
    $mapper = new InvoiceMapper();
    $model = $mapper->toModel($original);
    $reconstructed = $mapper->toDomain($model);
    $this->assertTrue($original->equals($reconstructed));
}
```
---
## Exceptions
No exceptions. Round-trip tests are the primary validation mechanism for mapping correctness.
---
## Consequences Of Violation
Mapping errors undetected until production; data loss or corruption; debugging in production environments.
