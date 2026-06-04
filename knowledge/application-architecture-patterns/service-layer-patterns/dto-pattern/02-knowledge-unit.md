# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: DTO pattern: structured data transfer between layers
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Data Transfer Objects (DTOs) are immutable objects that carry data between architectural layers. They ensure type safety, provide explicit contracts, and decouple layers by preventing raw arrays or framework-specific objects from passing through boundaries. In the Service Layer pattern, DTOs are used as input (request → DTO → use case) and output (use case → DTO → response). They replace associative arrays and `$request->all()` with typed, documented, and validated value containers.

---

# Core Concepts

DTOs are simple immutable objects with typed properties:
```php
class CreateInvoiceDto {
    public function __construct(
        public readonly string $customerId,
        public readonly array $lineItems,
        public readonly ?string $discountCode = null,
        public readonly ?Money $deposit = null,
    ) {}
}
```

DTOs are not entities. They have no behavior, no business logic, and no identity. They exist solely to transfer data between layers. This makes them safe to create, serialize, and discard.

---

# Mental Models

**The "Message Envelope" model:** A DTO is a sealed envelope containing data. The sender puts data in, the receiver takes data out. Neither side needs to know about the other's internal structure.

**The "Contract Document" model:** DTOs define the contract between layers. If the input DTO for a use case changes, all callers must update. This makes dependencies explicit.

**The "Array Replacement" model:** DTOs exist because `['name' => 'John', 'email' => 'john@example.com']` has no documentation, no type checking, and no validation. DTOs replace these with immutable typed objects.

---

# Internal Mechanics

DTOs are typically constructed from request data:
```php
// From Form Request
class CreateInvoiceDto {
    public static function fromRequest(StoreInvoiceRequest $request): self {
        return new self(
            customerId: $request->input('customer_id'),
            lineItems: $request->input('items'),
            discountCode: $request->input('discount_code'),
        );
    }
}
```

Or from other data sources:
```php
// From array
$dto = new CreateInvoiceDto(
    customerId: $data['customer_id'],
    lineItems: $data['items'],
);
```

---

# Patterns

**Input DTO + Output DTO:** Each use case has a specific input DTO and output DTO. They are type-specific to the operation.

**DTO factory (fromRequest):** A static method on the DTO that creates it from a Form Request, keeping construction logic colocated.

**DTO collection:** For list responses, use DTO arrays or typed DTO collections.

**Nested DTOs:** DTOs can contain other DTOs:
```php
class LineItemDto {
    public function __construct(
        public readonly string $productId,
        public readonly int $quantity,
        public readonly Money $unitPrice,
    ) {}
}

class CreateInvoiceDto {
    /** @param LineItemDto[] $items */
    public function __construct(
        public readonly string $customerId,
        public readonly array $items,
    ) {}
}
```

---

# Architectural Decisions

**Use DTOs when:** Passing arrays between layers causes errors from missing keys or wrong types, the application has multiple delivery mechanisms (HTTP + CLI + queue sharing the same use cases), or the team values type safety at layer boundaries.

**Skip DTOs when:** The application is simple and using `$request->validated()` directly in the service is acceptable. Arrays may suffice for small, simple operations.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Type-safe layer boundaries | DTO construction boilerplate | Mapping from request → DTO for each endpoint |
| Explicit contracts (documented in code) | Class explosion | Each use case needs at least 1 DTO |
| Decoupled from HTTP request objects | DTOs can become bloated | A DTO that carries 20 fields is hard to construct and read |
| Immutable (safe across layers) | Learning curve for team | Must understand readonly properties and promoted constructors |

---

# Performance Considerations

DTO creation allocates objects. For high-throughput endpoints returning large collections, DTO allocation can be significant. Consider using arrays for read-heavy list responses and DTOs for write operations.

---

# Production Considerations

Use PHP 8.1+ promoted constructors with `readonly` properties for concise DTO definitions. Consider `spatie/data-transfer-object` or `dive-be/simple-dto` for advanced DTO features.

---

# Common Mistakes

**DTO with behavior:** Adding methods with business logic to DTOs. DTOs should be pure data containers. Behavior belongs in entities or domain services.

**DTO as God object:** A `UserDto` that contains ALL possible user fields for ALL use cases. Each use case should have its own specific DTO.

**HTTP coupling in DTO:** DTOs that import `Illuminate\Http\Request` or `UploadedFile`. DTOs should contain only plain PHP types.

---

# Failure Modes

**DTO bloat:** 50+ DTOs for a medium-sized application. Many are nearly identical. Consider sharing DTOs across similar use cases.

**DTO serialization:** DTOs with `DateTimeImmutable` or nested objects may not serialize to JSON correctly. Implement `JsonSerializable` or use `array` methods.

---

# Ecosystem Usage

Spatie's `data-transfer-object` package is the most popular (5M+ downloads). The `laravel-data` package by Spatie provides advanced DTO features with validation. PHP 8.1+ `readonly` classes make framework DTO packages less necessary than before.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| SLP-04 Pyramid architecture | SLP-06 Use Case classes | CPC-01 Interface contracts |
| COS-08 Naming conventions | SLP-09 Dependency injection | LAP-10 Domain entity mapping |

---

## Research Notes

Research into service layer patterns in 2025-2026 shows strong community consensus around thin controllers with extracted business logic. Laravel documentation and community leaders (Spatie, Laravel Daily, Benjamin Crozat) unanimously recommend service classes as the first architectural pattern to adopt. The service vs action vs use case debate has converged on a pragmatic position: services for orchestration, actions for single operations, and use cases for Clean Architecture contexts. Transaction management remains a key concern, with DB::transaction() wrapping being the standard approach for operations spanning multiple models.
