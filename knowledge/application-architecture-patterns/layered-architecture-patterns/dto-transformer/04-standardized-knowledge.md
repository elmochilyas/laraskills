# Data Transfer Objects and Transformers

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-14-dto-transformer
**Difficulty:** Intermediate
**Category:** Data Pattern
**Last Updated:** 2026-06-04

## Overview

Data Transfer Objects (DTOs) are immutable objects that carry data between architectural layers. Transformers convert domain and application objects into presentation-ready formats. Together, they form the data boundary layer that decouples internal object models from external contracts.

DTOs exist because raw arrays and Eloquent models are poor data contracts between layers. Arrays have no type safety, no documentation, and no structure guarantees. Eloquent models carry ORM baggage, lazy-loading potential, and far more data than intended. DTOs provide explicit, typed, immutable contracts that make data flow visible and safe.

Transformers exist because internal object structure rarely matches API response format. A domain `Invoice` contains pricing logic, payment details, and internal identifiers — none of which should appear in API responses. Transformers select, rename, and reshape data for each consumer.

Engineers should care because DTOs and Transformers prevent the most common architectural violation: passing internal objects across layer boundaries. Every time an Eloquent model appears in a response or a Request object appears in a service, the architecture degrades. DTOs and Transformers enforce clean boundaries by design.

## Core Concepts

**Layer Boundary Data Transfer:** Data crosses architectural layers — from HTTP to application, from application to domain, and back. Each crossing point is a DTO candidate. Input DTOs carry data into a layer; output DTOs carry results out.

**Immutability:** DTOs must be immutable once constructed. PHP 8.1+ `readonly` properties and PHP 8.2+ `readonly` classes enforce this. Immutability prevents accidental mutation, makes construction the single point of validation, and enables safe sharing across contexts.

**Typed Properties:** Every DTO property has a PHP type hint. Types document the contract and enable static analysis. `string $email`, not `$email`. Typed properties catch data violations at construction time.

**Named Constructors:** DTOs use named static constructors for creation from different sources: `fromRequest(Request $r): self`, `fromArray(array $data): self`, `fromModel(Model $m): self`. Each named constructor encapsulates the extraction logic.

**Serialization Control:** DTOs implement `toArray()` for controlled serialization. This is an explicit method, not implicit — only the properties intended for output are included.

**Presentation Decoupling:** Transformers decouple internal objects from external representation. A single domain object may have multiple transformers for different consumers: API response, admin panel export, email template, CSV download.

## When To Use

- Passing data between architectural layers (controller → use case, use case → repository)
- API response formatting that differs from internal representation
- Multiple callers needing different views of the same data
- Decoupling internal object changes from API contract changes
- Endpoints where response structure stability is important (public APIs, mobile backends)
- Applications with more than one delivery mechanism (HTTP, CLI, queue)

## When NOT To Use

- Direct Eloquent serialization is sufficient for simple CRUD APIs with stable contracts
- Response format matches internal structure exactly and is unlikely to change
- Prototyping stages where speed is priority over API contract stability
- Internal-only endpoints where the consumer is the same team and changes are coordinated

## Best Practices

**One DTO per Use Case Boundary:** Each layer crossing has its own DTO. Input DTOs for data entering the application layer. Output DTOs for data leaving. Avoid sharing DTOs across unrelated use cases.

**Keep DTOs Focused:** A DTO should contain only the data needed for its specific boundary crossing. Resist the temptation to include "extra" fields that might be useful.

**Use `readonly` Classes:** PHP 8.2 `readonly class` enforces immutability at the language level. All properties become readonly automatically. This is the preferred form for DTOs.

**Don't Put Logic in DTOs:** DTOs carry data. They may have factory methods (named constructors), but no business logic, no calculations, no validation beyond type checking.

**Use API Resources for Laravel Responses:** `JsonResource` classes are Laravel's built-in transformer pattern. They integrate with pagination, conditional attributes, and relationship loading.

**Test DTO Construction and Transformation:** Write tests that construct DTOs with valid and invalid input, and tests that verify transformer output structure matches the API contract.

## Architecture Guidelines

**Layer Placement:** DTOs belong in the Application layer, not the Domain layer and not the Presentation layer. Place them in `app/DTOs/` organized by use case or domain area.

**Dependency Direction:** Prefer DTOs without framework-specific dependencies (Eloquent, HTTP). DTO-from-Eloquent mapping or accepting validated arrays in simple data flows is acceptable.

**Relationship to Eloquent Models:** DTOs are constructed from Eloquent models (in controllers or repository methods), but DTOs themselves never reference Eloquent. The conversion happens at the boundary.

**Relationship to Transformers:** Transformers accept DTOs or domain objects and return arrays. Transformers contain the mapping logic between internal representation and external format.

**Collection Handling:** For paginated responses, wrap DTO collections in a consistent envelope (`data`, `meta`, `links`). Use Laravel's `PaginatedResourceResponse` or custom collection transformers.

## Performance Considerations

- DTO construction is cheap — typically 0.001ms per object with promoted constructor
- Immutable DTOs reduce defensive copying; no need to clone before passing
- Transformer overhead is proportional to output size — for deeply nested responses, consider caching the transformed representation
- JsonResource wrapping adds overhead for each relationship level — profile endpoints with deep includes
- For high-throughput read endpoints, cache the full transformed response, not the domain objects

## Security Considerations

- DTOs must not expose sensitive fields (passwords, tokens, internal IDs, payment details)
- When constructing DTOs from Eloquent models, explicitly select fields — never use `$model->toArray()` or `$model->all()`
- Transformers must explicitly list fields in `toArray()` — accidental inclusion of new model attributes is a data leak
- Never log DTO contents that contain PII or sensitive business data
- Response envelope consistency prevents information leakage through varying structures

## Common Mistakes

**DTOs as Anemic Data Bags:** DTOs with no construction validation, allowing invalid data to pass through.

**Why developers make it:** DTOs are seen as "just data containers." Developers skip validation thinking it will be handled elsewhere.

**Consequences:** Invalid data travels through layers until it hits business logic, causing confusing errors.

**Better approach:** Validate input during DTO construction via named constructors or constructor promotion with type hints.

**Domain Objects in DTO Roles:** Passing Eloquent models or entities directly as DTOs.

**Why developers make it:** It's faster to pass the existing model than create a new class.

**Consequences:** The layer boundary is breached. Eloquent model changes affect every consumer. Lazy loading causes N+1 queries.

**Better approach:** Always create a DTO for layer boundaries. The model is for persistence, not transfer.

**Shared Mutable DTOs:** DTOs that are modified after creation, shared across threads or requests.

**Why developers make it:** Developers treat DTOs like arrays and modify them as needed.

**Consequences:** Race conditions in concurrent contexts. Unexpected state changes in the caller.

**Better approach:** Enforce immutability with `readonly` classes or `readonly` properties.

**Transformer Coupled to Eloquent:** Transformers that accept Eloquent models and call Eloquent methods directly.

**Why developers make it:** Convenience — the model is already loaded.

**Consequences:** Transformers cannot be used without Eloquent. Lazy loading happens in the presentation layer.

**Better approach:** Transformers should accept DTOs. If they must accept models, extract model access to explicit method calls, not magic properties.

**Over-Fragmentation:** Too many DTO types for the same data — a User has 5 different DTOs for 5 slightly different contexts.

**Why developers make it:** Strict adherence to "one DTO per context" without considering overlap.

**Consequences:** DTO proliferation. Mapping between similar DTOs is tedious. Developers start bypassing DTOs.

**Better approach:** Group closely related contexts under one DTO with optional properties. Use nullable fields for context-specific data.

## Anti-Patterns

**Array Blindness:** Using arrays instead of DTOs for data transfer. Arrays have no type safety, no documentation, and no discoverability. Refactor: create a DTO class with typed properties for each data transfer context.

**Eloquent Leak:** Eloquent models appearing outside the persistence layer — in controllers, use cases, or transformers. Refactor: convert to DTOs at the repository boundary.

**Transformer Without Test:** Transformers that have no tests verifying their output structure. Response format changes silently break API contracts. Refactor: add a test that asserts the exact array structure returned by the transformer.

**DTO Constructed with `new` Everywhere:** DTO construction logic duplicated across multiple callers. Refactor: add named constructors (`fromRequest`, `fromArray`, `fromModel`) to centralize creation logic.

**Nested DTO Explosion:** Deeply nested DTO structures that mirror the database schema exactly. Refactor: flatten DTOs for each use case. The frontend or API consumer doesn't need the same nesting as the database.

## Examples

### Input DTO
```php
readonly class CreateInvoiceInput
{
    public function __construct(
        public int $customerId,
        public array $items,
        public ?string $discountCode,
        public string $currency,
    ) {}

    public static function fromRequest(CreateInvoiceRequest $request): self
    {
        return new self(
            customerId: $request->validated('customer_id'),
            items: $request->validated('items'),
            discountCode: $request->validated('discount_code'),
            currency: $request->validated('currency', 'USD'),
        );
    }
}
```

### Output DTO
```php
readonly class InvoiceCreatedResult
{
    public function __construct(
        public int $invoiceId,
        public string $status,
        public Money $total,
        public \DateTimeImmutable $createdAt,
    ) {}
}
```

### Transformer
```php
class InvoiceTransformer
{
    public function transform(InvoiceCreatedResult $result): array
    {
        return [
            'id' => $result->invoiceId,
            'status' => $result->status,
            'total' => [
                'amount' => $result->total->amount(),
                'currency' => $result->total->currency(),
            ],
            'created_at' => $result->createdAt->format('c'),
        ];
    }

    public function collection(array $results): array
    {
        return [
            'data' => array_map(fn ($r) => $this->transform($r), $results),
        ];
    }
}
```

## Related Topics

**Prerequisites:**
- Three-Layer Architecture (LAP-01)
- Use Case Classes (LAP-11)
- PHP 8.1+ readonly properties

**Closely Related:**
- Form Request Validation (LAP-12) — input DTO source
- API Resources — Laravel's built-in transformer
- Value Objects (LAP-07) — DTO vs VO distinction

**Advanced Follow-Up:**
- Spatie Laravel Data Package — advanced DTO management
- Data Object Validation
- Nested DTO Patterns

**Cross-Domain Connections:**
- CQRS Read Models — DTOs as query results
- JSON:API Resources — transformer integration with JSON:API spec
- Event Sourcing — DTOs as event payloads
