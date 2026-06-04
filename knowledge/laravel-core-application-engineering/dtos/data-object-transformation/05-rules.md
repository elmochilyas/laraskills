## Rule 1: Use `toArray()` as the Canonical Output Method

---

## Category

Code Organization

---

## Rule

Always implement `toArray()` as the single canonical output method on every DTO. Implement `JsonSerializable` by delegating to `toArray()` when `json_encode()` compatibility is required.

---

## Reason

A single output contract prevents consumers from relying on different serialization paths that may diverge over time. Delegating `JsonSerializable` to `toArray()` ensures consistent output regardless of how the DTO is serialized.

---

## Bad Example

```php
readonly class UserDto
{
    public function jsonSerialize(): array
    {
        return ['name' => $this->name];
    }

    public function toApiArray(): array
    {
        return ['full_name' => $this->name];
    }

    public function toExportArray(): array
    {
        return ['name' => strtoupper($this->name)];
    }
}
// Three methods, three different output contracts — consumers have no single source of truth.
```

---

## Good Example

```php
readonly class UserDto implements JsonSerializable
{
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->createdAt->toIso8601String(),
        ];
    }

    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
// Single output contract; JsonSerializable is a thin delegate.
```

---

## Exceptions

When a DTO has dramatically different output shapes (API list vs CSV export vs email), use a dedicated Transformer class instead of multiple `toArray()` variants.

---

## Consequences Of Violation

Maintenance: output contracts diverge, requiring changes in multiple places when a field changes. Reliability: consumers of `json_encode` get different data than consumers of `toArray()`.

---

## Rule 2: Never Include Business Logic in `toArray()`

---

## Category

Architecture

---

## Rule

Do not perform business logic, expensive computations, or service calls inside `toArray()`. Pre-compute all business values in the service layer and store them as DTO properties before serialization.

---

## Reason

`toArray()` appears as "JSON encoding time" in profiling. When it contains business logic, profiling becomes misleading and endpoint latency increases unpredictably. Business logic belongs in the service layer; `toArray()` should be a pure format transformation.

---

## Bad Example

```php
public function toArray(): array
{
    $total = 0;
    foreach ($this->items as $item) {
        $total += $item->price * $item->quantity;
    }
    $discount = $this->applyDiscount($total);
    return ['total' => $discount, 'items' => $this->items];
}
// Business computation and discount application inside serialization — performance cost is invisible in profiling.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(
        public int $total,
        public int $discountedTotal,
        /** @var LineItemDto[] */
        public array $items,
    ) {}

    public function toArray(): array
    {
        return [
            'total' => $this->total,
            'discounted_total' => $this->discountedTotal,
            'items' => array_map(fn(LineItemDto $i) => $i->toArray(), $this->items),
        ];
    }
}
// Business values pre-computed in the service layer; toArray is purely formatting.
```

---

## Exceptions

Lightweight formatting that is inherently tied to output format (e.g., `Carbon::toIso8601String()`, number formatting for locale) is acceptable. Expensive computation is never acceptable.

---

## Consequences Of Violation

Performance: serialization latency becomes unpredictable. Maintenance: business logic hidden in output code is hard to find and test. Scalability: CPU time during serialization is not attributable to the business operation.

---

## Rule 3: Separate Output Shapes with Dedicated Transformers or Output DTOs

---

## Category

Architecture

---

## Rule

When a DTO requires multiple significantly different output shapes (API list, detail view, CSV export, email), use a dedicated Transformer class or separate Output DTOs. Do not add conditional logic inside a single `toArray()`.

---

## Reason

A single `toArray()` with conditional branches depending on context produces an unpredictable output contract. Consumers cannot rely on a stable shape. Separate transformers or output DTOs make each output contract explicit and testable.

---

## Bad Example

```php
public function toArray(string $context = 'default'): array
{
    $base = ['id' => $this->id, 'name' => $this->name];
    if ($context === 'detail') {
        $base['email'] = $this->email;
        $base['roles'] = array_map(fn($r) => $r->toArray(), $this->roles);
    }
    if ($context === 'export') {
        $base['created_at'] = $this->createdAt->toDateString();
    }
    return $base;
}
// Conditional toArray — consumers cannot predict output shape without reading implementation.
```

---

## Good Example

```php
class UserDtoTransformer
{
    public function toListResponse(UserDto $dto): array
    {
        return ['id' => $dto->id, 'name' => $dto->name];
    }

    public function toDetailResponse(UserDto $dto): array
    {
        return [
            'id' => $dto->id,
            'name' => $dto->name,
            'email' => $dto->email,
            'roles' => array_map(fn(RoleDto $r) => $r->toArray(), $dto->roles),
        ];
    }

    public function toCsvRow(UserDto $dto): array
    {
        return [$dto->id, $dto->email, $dto->createdAt->toDateString()];
    }
}
// Each shape is explicit, testable, and independently maintainable.
```

---

## Exceptions

Minor conditional formatting (e.g., null handling, locale-aware date format) in `toArray()` is acceptable. Structural conditionals that add or remove entire keys require a transformer.

---

## Consequences Of Violation

Maintenance: changing one output shape risks breaking others. Reliability: consumers receive unexpected keys or missing fields. Testing: each conditional branch must be tested, increasing test surface.

---

## Rule 4: Ensure Round-Trip Consistency for Bidirectional DTOs

---

## Category

Design

---

## Rule

For DTOs used in both input and output directions, ensure that `fromArray()` can consume the output of `toArray()` to reconstruct the same DTO. If round-trip is impossible by design, document the asymmetry explicitly.

---

## Reason

Bidirectional DTOs that cannot round-trip create subtle bugs when data is serialized and later deserialized (caching, queues, API responses consumed by internal services). Inconsistent key naming or missing computed fields cause silent data loss.

---

## Bad Example

```php
// toArray produces 'full_name', but fromArray expects 'first_name' and 'last_name'
public function toArray(): array
{
    return ['full_name' => "{$this->firstName} {$this->lastName}", 'email' => $this->email];
}

public static function fromArray(array $data): self
{
    return new self(firstName: $data['first_name'], lastName: $data['last_name'], email: $data['email']);
}
// Round-trip: fromArray(toArray(input)) fails because full_name cannot be split back into first/last.
```

---

## Good Example

```php
public function toArray(): array
{
    return [
        'first_name' => $this->firstName,
        'last_name' => $this->lastName,
        'email' => $this->email,
    ];
}

public static function fromArray(array $data): self
{
    return new self(
        firstName: $data['first_name'],
        lastName: $data['last_name'],
        email: $data['email'],
    );
}
// Round-trip: fromArray(toArray(input)) produces identical DTO.
```

---

## Exceptions

Output-only DTOs (never deserialized back) do not require round-trip consistency. Input-only DTOs (never serialized for output) do not require it. Document when a DTO is intentionally one-directional.

---

## Consequences Of Violation

Reliability: cache serialization/deserialization loses data. Maintenance: debugging round-trip failures consumes disproportionate time. Scalability: queued jobs that serialize and deserialize DTOs silently corrupt data.

---

## Rule 5: Use Key Mapping to Decouple Internal Property Names from External Representations

---

## Category

Code Organization

---

## Rule

Map internal DTO property names to external key names in `toArray()`. Do not expose internal naming conventions (PascalCase, abbreviated names) directly in API responses, exports, or external output.

---

## Reason

Internal property names optimize for code readability and PHP conventions. External consumers (frontend, third-party APIs, CSV parsers) have different conventions. Explicit key mapping in `toArray()` decouples internal naming from external contracts, allowing internal renames without breaking consumers.

---

## Bad Example

```php
public function toArray(): array
{
    return [
        'createdAt' => $this->createdAt->toIso8601String(),
        'userEmail' => $this->email,
    ];
}
// Directly exposes PHP property naming convention to external consumers.
```

---

## Good Example

```php
public function toArray(): array
{
    return [
        'created_at' => $this->createdAt->toIso8601String(),
        'email' => $this->email,
    ];
}
// Mapping layer translates PHP names to API contract names. Internal rename does not break consumers.
```

---

## Exceptions

When internal property names already match the desired external contract, no explicit mapping is needed beyond type formatting.

---

## Consequences Of Violation

Maintenance: renaming a PHP property becomes a breaking API change. Scalability: frontend and backend naming conventions cannot evolve independently.

---

## Rule 6: Control the Serialization Surface — Never Leak Internal Fields

---

## Category

Security

---

## Rule

Always explicitly select which properties appear in `toArray()` output. Do not iterate over all DTO properties dynamically. Do not return the complete internal DTO structure including sensitive or internal-only fields.

---

## Reason

Dynamic serialization (e.g., `get_object_vars()`, `(array)$this`) exposes every property including internal flags, database IDs, computed intermediates, and sensitive data. Explicit key selection in `toArray()` ensures only intended data reaches consumers.

---

## Bad Example

```php
public function toArray(): array
{
    return get_object_vars($this);
}
// Exposes every property including $internalFlag, $secretKey, $passwordHash, $adminOverride.
```

---

## Good Example

```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
    ];
}
// Only intended fields are exposed. Internal properties remain private to the DTO.
```

---

## Exceptions

When using spatie/laravel-data, the package's `toArray()` respects `#[DataCollectionOf]` and type exclusion. Customize via `only()` or `except()` methods rather than falling back to dynamic reflection.

---

## Consequences Of Violation

Security: sensitive data (internal IDs, flags, secret fields) leaked to external consumers. Maintenance: adding a new property to the DTO automatically exposes it in output, requiring a security review for every property addition.

---

## Rule 7: Use Dedicated Output DTOs When Input and Output Shapes Diverge Significantly

---

## Category

Architecture

---

## Rule

When a DTO's input shape and output shape share fewer than 50% of fields or require fundamentally different types, use separate input-only DTOs and output-only DTOs instead of a single bidirectional DTO.

---

## Reason

A single DTO with conditional logic for input vs output becomes a maintenance burden. Separate DTOs for each direction keep contracts explicit, reduce nullable fields, and prevent input concerns from leaking into output contracts.

---

## Bad Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $password,    // Only needed for input (create)
        public ?string $bio,          // Used in both
        public ?string $computedRole, // Only needed for output (computed in service)
        public ?CarbonImmutable $createdAt,  // Only needed for output
    ) {}
}
// Four nullable fields because the DTO serves both input and output purposes.
```

---

## Good Example

```php
// Input-only DTO
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}
}

// Output-only DTO
readonly class UserListDto
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public string $role,
        public string $createdAt,
    ) {}
}
// Each DTO has exactly the fields it needs. No nullable values. No conditional logic.
```

---

## Exceptions

For simple CRUD operations where input and output fields overlap >80%, a single bidirectional DTO is acceptable. Introduce separate DTOs when either direction adds specialized fields.

---

## Consequences Of Violation

Maintenance: adding a field for one direction creates nullable noise for the other direction. Reliability: consumers cannot tell which fields are guaranteed. Testing: every combination of input/output must be tested.

---

## Rule 8: Prevent Circular References in Recursive Serialization

---

## Category

Reliability

---

## Rule

Never allow a DTO to reference itself directly or indirectly through child DTOs. Replace parent object references with scalar parent identifiers. Ensure the DTO tree is always a directed acyclic graph.

---

## Reason

Circular references cause `json_encode()` to fail with a fatal error and recursively calls `toArray()` until stack overflow. In the spatie/laravel-data pipeline, circular references cause silent infinite loops. The DTO tree must always be acyclic.

---

## Bad Example

```php
readonly class OrderDto
{
    /** @var LineItemDto[] */
    public function __construct(public int $id, public array $items) {}
}

readonly class LineItemDto
{
    public function __construct(
        public int $id,
        public OrderDto $order,  // Parent reference creates cycle
    ) {}
}
// OrderDto → LineItemDto → OrderDto → ... infinite loop.
```

---

## Good Example

```php
readonly class OrderDto
{
    /** @var LineItemDto[] */
    public function __construct(public int $id, public array $items) {}
}

readonly class LineItemDto
{
    public function __construct(
        public int $id,
        public int $orderId,  // Scalar parent ID, not parent object
    ) {}
}
// DTO tree is acyclic. OrderDto has children; LineItemDto has a scalar reference back.
```

---

## Exceptions

No common exceptions. Circular references in DTO trees are always a design error.

---

## Consequences Of Violation

Reliability: `json_encode()` fails with fatal error at runtime. Scalability: stack overflow in recursive serialization crashes the request. Maintenance: debugging circular references in deeply nested DTOs is time-consuming.
