# Data Object Transformation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Data Object Transformation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTO transformation is the process of converting a DTO into other representations — arrays, JSON, API resource responses, or database persistence shapes. While DTOs are primarily input carriers at the HTTP boundary, they are frequently used as output carriers too, serving as the source data for API resources, Blade views, and Inertia responses.

The engineering challenge is that output transformation often needs different data shapes than input. An input DTO may contain nested objects that should be flattened for JSON output, or include computed values that have no input equivalent. The spatie/laravel-data package handles this via a reverse pipeline that casts typed properties back into primitives, while plain DTOs use explicit `toArray()` or `jsonSerialize()` methods.

---

## Core Concepts

### Bidirectional Mapping

Input DTOs receive raw data and produce typed objects. Output DTOs do the reverse — typed objects produce raw data:

```
Input:  Array (raw) → Cast → DTO (typed)
Output: DTO (typed) → Cast → Array (raw) → JSON/View
```

When a DTO is used bidirectionally, each property's caster must work in both directions (cast → typed on input, transform → primitive on output).

### The toArray Contract

`toArray()` is the canonical output method. Every output representation ultimately derives from it:

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public CarbonImmutable $createdAt,
    ) {}

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->createdAt->toIso8601String(),
        ];
    }
}
```

### JsonSerializable

Implementing `JsonSerializable` allows `json_encode($dto)` to work directly:

```php
readonly class UserDto implements \JsonSerializable
{
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
```

---

## Mental Models

### The Lens

A DTO is a lens for a data set. The lens focuses on one shape (the DTO properties). `toArray()` adjusts the lens to show the same data in a different shape (flattened, renamed, transformed). Multiple output shapes require multiple lenses — separate DTO views or separate `toArray` implementations.

### The Two-Way Transformer

A bidirectional DTO is like a transformer that converts AC to DC and back. Input transformation (raw → typed) must be the inverse of output transformation (typed → raw). If a date string becomes a Carbon object on input, the Carbon object must become a date string on output. Breaking the inverse produces data that cannot round-trip.

---

## Internal Mechanics

### Array Key Mapping

Output keys can differ from property names:

```php
public function toArray(): array
{
    return [
        'full_name' => $this->name,         // renamed
        'email_address' => $this->email,     // renamed
        'registered_since' => $this->createdAt->diffForHumans(),  // computed
    ];
}
```

This decouples the internal DTO shape from the external representation. The database/domain field is `name`, but the API response uses `full_name`.

### Recursive toArray

For nested DTOs, `toArray` must recurse:

```php
readonly class OrderDto
{
    public function __construct(
        public CustomerDto $customer,
        /** @var LineItemDto[] */
        public array $items,
    ) {}

    public function toArray(): array
    {
        return [
            'customer' => $this->customer->toArray(),
            'items' => array_map(fn(LineItemDto $item) => $item->toArray(), $this->items),
        ];
    }
}
```

Spatie/laravel-data handles this recursion automatically via `CastPropertiesDataPipe` running in reverse.

### Computed Properties

Properties that exist only in output, derived from input properties:

```php
readonly class UserDto
{
    public function __construct(
        public string $firstName,
        public string $lastName,
    ) {}

    public function toArray(): array
    {
        return [
            'full_name' => "{$this->firstName} {$this->lastName}",
            'initial' => strtoupper($this->firstName[0]),
        ];
    }
}
```

Computed properties have no input equivalent — they cannot be set during DTO construction (or they must be nullable and optional).

---

## Patterns

### The Separate Output DTO Pattern

For complex output shapes, create a dedicated output DTO:

```php
readonly class UserListDto  // for listing — minimal fields
{
    public function toArray(): array { /* ... */ }
}

readonly class UserDetailDto  // for detail — full fields
{
    public function toArray(): array { /* ... */ }
}
```

This avoids burdening a single DTO with multiple output shapes and conditional logic.

### Transformation with Closure Mapping

For dynamic transformations (e.g., field exclusion based on permissions), pass a mapping closure:

```php
public function toArray(?array $only = null, ?array $except = null): array
{
    $data = $this->toArray();

    if ($only !== null) {
        return array_intersect_key($data, array_flip($only));
    }

    if ($except !== null) {
        return array_diff_key($data, array_flip($except));
    }

    return $data;
}
```

### Transformer Class

For complex transformations, extract a dedicated transformer:

```php
class UserDtoTransformer
{
    public function toApiResponse(UserDto $dto): array
    {
        return [
            'id' => $dto->id,
            'fullName' => "{$dto->firstName} {$dto->lastName}",
            'email' => $dto->email,
            'links' => [
                'self' => route('api.users.show', $dto->id),
            ],
        ];
    }

    public function toCsvRow(UserDto $dto): array
    {
        return [
            $dto->id,
            $dto->email,
            $dto->createdAt->toDateString(),
        ];
    }
}
```

Transformers are useful when a DTO has many output shapes (API, export, report, email).

---

## Architectural Decisions

### Bidirectional DTO vs Input-Only DTO

| Approach | Pros | Cons |
|---|---|---|
| Bidirectional | Single class, toArray reverses fromArray | Casters must be invertible, property names shared |
| Input-only | Pure input DTO, output via resources/transformers | More classes, duplication of field mapping |

Many production codebases prefer input-only DTOs for input and API Resources for output. The DTO handles typed data flow; the Resource handles response shaping.

### toArray vs Explicit Output Types

| Approach | Use Case |
|---|---|
| `toArray()` | Simple output, no conditional logic |
| `JsonSerializable` | JSON-only output, `json_encode` compatibility |
| Dedicated Transformer | Multiple output shapes per DTO |
| API Resource (separate subdomain) | HTTP response with conditional, pagination, metadata |
| Blade View Model | View-specific data preparation |

---

## Tradeoffs

| Concern | DTO toArray | API Resource | Transformer Class |
|---|---|---|---|
| Coupling to HTTP | None | High (Resource base class) | None |
| Conditional attributes | Manual | Built-in (when, whenLoaded) | Manual |
| Pagination metadata | Not provided | Built-in | Manual implementation |
| Reusability | Per-DTO | Per-resource | Across DTO types |
| Test complexity | Low (pure function) | Medium (HTTP context) | Low (pure function) |

---

## Performance Considerations

### toArray Overhead

`toArray()` is a simple array construction — O(n) in property count, microsecond-level cost. Recursive `toArray` on nested DTOs is O(total properties in the tree).

### Spatie Reverse Pipeline

Spatie's output pipeline runs `CastPropertiesDataPipe` in reverse. Each caster's `serialize()` method is called. The overhead equals the input pipeline — ~0.01-0.1ms per property.

### Lazy Property Serialization

Lazy properties are resolved (database query, computation) when serialized to output. If a lazy property is expensive, the serialization step can dominate response time. Profile lazy property resolution as part of endpoint performance.

---

## Production Considerations

### Output Consistency

All DTOs in a project should produce consistent output formats. Establish conventions:
- Date format: ISO 8601 (`2026-06-02T00:00:00Z`) or Atom (`2026-06-02T00:00:00+00:00`)
- Numeric precision: integers for cents, floats for decimals
- Null handling: omit null fields or include with `null` value

### Avoid Business Logic in toArray

`toArray` should transform data format, not compute business values. A `totalFormatted` field should be computed in the service layer and stored as a property, not computed in `toArray`:

```php
// Bad: business logic in transformation
public function toArray(): array
{
    return [
        'total' => $this->formatCurrency($this->subtotal + $this->tax - $this->discount),
    ];
}

// Good: pre-computed in service, stored as DTO property
public function toArray(): array
{
    return [
        'total' => $this->totalFormatted,
    ];
}
```

### Test Each Output Shape

Each output method should have a dedicated test that verifies:
- All expected keys are present
- Values have correct types
- Null/empty handling is correct
- Date/time formatting matches API contract

---

## Common Mistakes

### Inconsistent Naming Between Input and Output

Using different naming conventions for input keys (`snake_case`) and output keys (`camelCase`) creates confusion. Choose one naming convention and apply it consistently across input and output, or use explicit mapping in both directions.

### Round-Trip Breaking

A DTO that cannot be reconstructed from its own `toArray` output breaks serialization/deserialization patterns:

```php
// If toArray produces 'full_name', but fromArray expects 'firstName'/'lastName'
$original = new UserDto(firstName: 'John', lastName: 'Doe');
$array = $original->toArray();        // ['full_name' => 'John Doe']
$restored = UserDto::fromArray($array); // Missing 'firstName', 'lastName'
```

Ensure `fromArray` can consume `toArray` output, or document that they are not inverses.

### Over-Computation in toArray

Expensive computations (database queries, external API calls) in `toArray` are invisible to profiling — they appear as "JSON encoding time." Keep `toArray` as a pure transformation of already-computed data.

---

## Failure Modes

### Recursive Serialization Overflow

A DTO that references itself (directly or through children) causes infinite recursion in `toArray`:

```php
readonly class TreeNodeDto
{
    public function __construct(
        public string $name,
        public ?TreeNodeDto $parent,   // circular reference!
        /** @var TreeNodeDto[] */
        public array $children,
    ) {}
}
```

Replace parent references with scalar IDs:

```php
readonly class TreeNodeDto
{
    public function __construct(
        public string $name,
        public ?int $parentId,         // scalar, no circular ref
        /** @var TreeNodeDto[] */
        public array $children,
    ) {}
}
```

### Resource Exhaustion on Large Collections

Calling `toArray()` on a DTO collection of 10,000+ items allocates a large array and may hit memory limits. Use streaming serialization (JSON lines, iterable responses) for bulk output.

---

## Ecosystem Usage

### Spatie/laravel-data Output Pipeline

`Data::toArray()` runs the output pipeline: `CastPropertiesDataPipe` in reverse, calling `Caster::serialize()` on each property. Nested Data objects and DataCollection are handled recursively. The output is a plain array suitable for `json_encode`.

### Laravel API Resource Transformation

Laravel API Resources provide `->toArray($request)` which receives the HTTP request for context. Resources have built-in conditional loading (`when`, `whenLoaded`, `whenHas`) that DTOs lack. The decision between DTO output and API Resource output depends on whether HTTP-specific conditionals are needed.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — baseline DTO definition
- **DTO Construction Patterns** (this workspace) — input-side factories
- **Nested DTOs** (this workspace) — recursive toArray for DTO trees
- **API Resources** (this workspace) — HTTP-specific output transformation
- **DTO vs Form Request** (this workspace) — input boundary decisions

---

## Research Notes

- The spatie/laravel-data reverse pipeline is invoked by `Data::toArray()` and `Data::all()`
- `Data::toArray()` preserves type transformations (Carbon → ISO string, int → decimal, etc.)
- Production codebases with both DTOs and API Resources use DTOs for internal data flow and Resources for HTTP response shaping — these are complementary, not competing
- `jsonSerialize()` is preferred over `toArray()` when the DTO is used exclusively with `json_encode`
