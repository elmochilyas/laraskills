# DTO Integration: payload() Method

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** dto, payload, data-transfer-object, typed-request, laravel

## Executive Summary
Phase 2 covers the `payload()` method pattern — adding a method to FormRequest that returns a typed DTO, bridging validation and domain layers. This pattern eliminates manual `validated()` array access in controllers and provides compile-time safety for request data consumption.

## Mental Models

- **payload() as a Transformation Function** — `payload()` transforms validated array data into a typed DTO, completing the validation-to-domain pipeline within the request.
- **DTO as a Contract Seal** — The DTO return type seals the contract: consumers know exactly what data shape to expect without inspecting validated keys.
- **Request as a Factory** — The FormRequest acts as a factory for DTOs, owning both validation rules and object construction in a single cohesive unit.
- **payload() as Anti-Corruption Layer** — Bridges the HTTP request format (arrays, strings) and the domain layer (typed objects, Value Objects, enums).

## Core Concepts

### payload() as Typed Accessor
The `payload()` method returns a typed DTO constructed from validated request data:
```php
class StorePostRequest extends FormRequest
{
    public function rules(): array { ... }

    public function payload(): PostData
    {
        return PostData::from($this->validated());
    }
}

// In controller:
$post = $this->posts->create($request->payload());
```

### DTO as Contract
The return type of `payload()` IS the contract. Any consumer of the request knows exactly what data shape to expect.

## Internal Mechanics

### payload() Implementation Variants
```php
// Constructor-based
public function payload(): PostData
{
    return new PostData(
        title: $this->validated('title'),
        body: $this->validated('body'),
        authorId: $this->user()->id,
        status: PostStatus::from($this->validated('status')),
    );
}

// Using Spatie Laravel Data from() factory
public function payload(): PostData
{
    return PostData::from($this->validated());
}

// Using array spread for partial mapping
public function payload(): PostData
{
    return PostData::from([
        ...$this->validated(),
        'author_id' => $this->user()->id,
    ]);
}
```

### Nested DTO Construction
```php
public function payload(): OrderData
{
    return new OrderData(
        customer: new CustomerData(
            name: $this->validated('customer.name'),
            email: $this->validated('customer.email'),
        ),
        items: array_map(
            fn (array $item) => LineItemData::from($item),
            $this->validated('items', []),
        ),
        payment: PaymentData::from($this->validated('payment')),
    );
}
```

## Patterns

### Independent payload() with Audit Merging
```php
public function payload(): PostData
{
    return PostData::from([
        ...$this->validated(),
        'author_id' => $this->user()->id,
        'author_ip' => $this->ip(),
        'created_at' => now(),
    ]);
}
```

### payload() with Conditional Composition
```php
public function payload(): OrderData
{
    $data = $this->validated();

    if ($data['type'] === 'business') {
        return BusinessOrderData::from($data);
    }

    return PersonalOrderData::from($data);
}
```

### Interface Contract for payload()
```php
interface HasPayload
{
    public function payload(): object;
}

class StorePostRequest extends FormRequest implements HasPayload
{
    public function payload(): PostData
    {
        return PostData::from($this->validated());
    }
}
```

## Architectural Decisions

| Decision | Rationale | Alternative |
|---|---|---|
| payload() returns DTO directly | Type-safe, IDE-compatible, compile-time checked | validated() array — no type safety, magic keys |
| DTO construction in request | Keeps mapping close to validation | DTO factory service — adds indirection |
| validated() + merge() in payload() | Contamination-free; extra data added at construction | Merge into request — pollutes validated set |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Typed payload() | No magic strings in controllers | Request depends on DTO class |
| Multiple DTO variants per request | Handles polymorphism cleanly | Conditional payload() is more complex |
| validated() spread with extras | Clean data merging | Extra fields not validated; must trust source |

## Performance Considerations
- DTO construction in `payload()` is a one-time cost per request.
- Spatie's `from()` uses reflection — cache DTO class metadata if constructing many DTOs.
- Constructor-based DTO creation (no reflection) is faster than `from()`.
- `array_map` over validated items is O(n) — fine for typical batch sizes.

## Production Considerations
- Test `payload()` to ensure DTO construction matches validated data.
- DTOs returned from `payload()` should be immutable (readonly properties).
- Document the payload return type in the FormRequest docblock.
- Use `@return` PHPDoc on `payload()` for IDE autocompletion.

## Common Mistakes
- Mixing validated and unvalidated data in payload — use only `$this->validated()`.
- Returning a mutable DTO — should be readonly after construction.
- Calling multiple `validated()` calls — each rebuilds the filtered array; call once.
- Forgetting to handle nested validation in payload — mirrors the wildcard validation structure.
- Making payload() do I/O — it should only map data.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| DTO constructor expects key not in validated | TypeError on payload() call | Ensure validated keys match DTO properties |
| Nested DTO receives raw array | TypeError on nested from() | Map manually with array_map + from() |
| payload() returns mixed | No type safety downstream | Always declare explicit return type |
| payload() called before validation | Missing data or exception | Controller ensures validation ran via type-hint |

## Ecosystem Usage

### Spatie Laravel Data + payload()
```php
class StorePostRequest extends FormRequest
{
    protected string $dataClass = PostData::class;

    public function payload(): PostData
    {
        return $this->dataClass::from($this->validated());
    }
}
```

### Laravel Data (Spatie) Auto payload via DataRequest
```php
class StorePostRequest extends \Spatie\LaravelData\DataRequest
{
    protected string $dataClass = PostData::class;
    // payload() is auto-generated by DataRequest
}
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — base request that hosts payload().
- **data-transfer-object-design** — DTO design fundamentals.

### Related Topics
- **dto-integration-todto-method** — alternative toDto() pattern.
- **input-preparation** — preparing input before payload() mapping.

### Advanced Follow-up Topics
- **dto-construction-patterns** — DTO construction strategies used in payload().
- **spatie-laravel-data-integration** — Spatie-specific payload integration.

## Research Notes

### Source Analysis
The `payload()` method is a convention, not a framework feature. It leverages the fact that FormRequests are resolved before controllers, so `$request->payload()` is called with fully validated data. The method typically calls `$this->validated()` which returns only data that passed all rules.

### Key Insight
The `payload()` method completes the **validation → DTO → domain** pipeline within the request class. This eliminates the need for controller-level data mapping and ensures that every consumer receives data in a consistent, typed format. The request class becomes a single source of truth for input shape, validation rules, and domain object construction.

### Version-Specific Notes
- Laravel 10: `validated()` accepts optional key parameter for single-field access.
- Laravel 11: No changes.
- Spatie Laravel Data 3.x: `DataRequest` auto-generates payload() from `$dataClass`.
