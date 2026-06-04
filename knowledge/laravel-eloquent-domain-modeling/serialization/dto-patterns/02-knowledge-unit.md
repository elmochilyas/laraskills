# dto-patterns

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Data Transfer Object (DTO) patterns in Laravel provide a structured, typed, and immutable alternative to arrays and Eloquent models for passing data between application layers. DTOs serve as a serialization boundary — they define the exact shape of data entering or leaving the application, decoupling internal domain models from external contracts. In the context of serialization, DTOs are used as both input validation/output formatting layers and as a bridge between domain logic and API responses. They enforce type safety, document data contracts explicitly, and prevent the leakage of Eloquent internals into public interfaces.

## Core Concepts

- **DTO (Data Transfer Object)** — An object that carries data between processes without exposing behavior. Typically immutable, with typed properties and a constructor.
- **Immutable** — DTOs are read-only after creation. Properties are set once (via constructor or named constructors) and never mutated.
- **Typed properties** — PHP 7.4+ typed properties enforce types at the language level (int, string, Carbon, etc.).
- **Named constructors** — Static factory methods (`fromArray`, `fromModel`, `fromRequest`) for creating DTOs from various sources.
- **Serialization direction** — DTOs can be created FROM raw input (request → DTO → domain) and serialized TO output (domain → DTO → JSON).
- **Mapping layer** — DTOs map between external contracts and internal domain representations, absorbing structural differences.
- **Data validation** — DTOs can validate themselves or be paired with form request validation for input integrity.

## Mental Models

1. **Contract document** — A DTO class is a machine-readable contract: "this is exactly what data looks like at this boundary."
2. **Anti-corruption layer** — DTOs prevent Eloquent model internals (lazy loading, attribute accessors, hidden state) from leaking into the API response.
3. **Snapshot, not reference** — A DTO captures a snapshot of data at a point in time. Unlike an Eloquent model, it does not track changes or reflect database updates.
4. **Data-only parcel** — DTOs are packages of data with no ORM baggage — no lazy loading, no dirty tracking, no event dispatching.

## Internal Mechanics

```php
class UserDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
        public readonly Carbon $createdAt,
        public readonly ?Carbon $emailVerifiedAt,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            createdAt: $user->created_at,
            emailVerifiedAt: $user->email_verified_at,
        );
    }

    public static function fromRequest(array $data): self
    {
        return new self(
            id: (int) $data['id'],
            name: (string) $data['name'],
            email: (string) $data['email'],
            createdAt: Carbon::parse($data['created_at']),
            emailVerifiedAt: isset($data['email_verified_at'])
                ? Carbon::parse($data['email_verified_at'])
                : null,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->createdAt->toIso8601String(),
            'email_verified_at' => $this->emailVerifiedAt?->toIso8601String(),
        ];
    }
}
```

The DTO uses promoted constructor properties with `readonly` for immutability. Named constructors centralize creation logic. `toArray()` handles serialization formatting, decoupled from Eloquent's serialization pipeline.

## Patterns

- **`fromModel()` + `toArray()`** — The standard round-trip: create DTO from Eloquent model, serialize to array/JSON.
- **DTO as resource replacement** — Use DTOs instead of API Resources when you need the same output for multiple channels (API, queue, broadcast).
- **DTO collection** — `UserDTOCollection` wrapping multiple DTOs with aggregate methods (`toArray()`, `sum()`, `avg()`).
- **Nested DTOs** — `OrderDTO` containing an array of `LineItemDTO` objects.
- **Input DTO** — Create DTO from validated request data; pass to action/service classes instead of `$request` or arrays.
- **DTO with enums** — Use PHP enums as DTO property types for constrained values ('pending', 'active', 'archived').
- **Data mapper** — A dedicated mapper class translates between Eloquent models and DTOs, keeping DTOs free of Eloquent dependencies.

## Architectural Decisions

- DTOs are a pure PHP pattern, not provided by Laravel core. The community has converged on promoted constructors, readonly properties, and named constructors.
- DTOs deliberately avoid extending Eloquent Model or using Eloquent traits — they are plain PHP objects.
- The choice between DTOs and API Resources depends on whether the serialization is HTTP-specific (Resources) or channel-agnostic (DTOs).
- Immutability prevents accidental mutation after creation, which is especially important in queue/job pipelines.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Explicit typed contracts — clear data shape | Boilerplate: one DTO class per data shape | Use packages like `spatie/laravel-data` to reduce boilerplate |
| Decoupled from Eloquent internals | Mapping layer required — `fromModel()` must be maintained | Tests catch mapping drift when model columns change |
| Immutable — safe to pass anywhere | Cannot modify for convenience; must create new instance | Acceptable tradeoff for data integrity |
| Works across channels (API, queue, events) | No built-in request awareness like Resources | Pass context explicitly; DTOs don't know about HTTP |
| Type-safe — IDEs and static analysis benefit | PHP's type system limitations (generics, unions) | Use PHPStan/Psalm with generics annotations for collections |

## Performance Considerations

- DTO creation is lightweight — constructor call + property assignment. Negligible compared to Eloquent hydration.
- Serializing 10,000 DTOs to array is faster than 10,000 Eloquent `toArray()` calls (no accessor resolution, no lazy loading checks).
- Readonly properties have no performance cost (compile-time feature).
- Mapping large collections with `array_map` + DTO constructor is highly efficient.

## Production Considerations

- Use DTOs at application boundaries (controllers, queue listeners, event subscribers) — not deep inside domain logic where Eloquent models are appropriate.
- Keep DTOs anemic (data only) — no business logic, no validation rules (beyond type enforcement).
- Establish a convention: namespace DTOs as `App\DataTransferObjects\{Entity}DTO`.
- Test DTO creation from models to catch serialization drift when models change.
- Use DTOs for public API contracts — changing a DTO is a conscious, visible change.

## Common Mistakes

- Adding business logic methods to DTOs — they become anemic domain models rather than data transfer objects.
- Making DTOs mutable — defeats the purpose of a snapshot contract.
- Using DTOs internally everywhere — adds unnecessary indirection within domain layers.
- Forgetting to update `fromModel()` when model columns change — leads to runtime errors or missing data.
- Returning Eloquent models directly from actions/services — defeats the benefit of the DTO boundary.

## Failure Modes

- **Serialization drift** — Model column renamed, DTO `fromModel()` not updated — silent data omission or type error.
- **N+1 in DTO mapping** — `fromModel()` accesses `$user->posts->count()` without eager loading — triggers N+1.
- **DTO mutation through references** — DTO contains an object (e.g., Carbon) that is mutated externally. Use `readonly` and immutable objects.
- **Circular DTO references** — DTO A contains DTO B, DTO B contains DTO A — memory exhaustion on serialization.

## Ecosystem Usage

- **spatie/laravel-data** — The most popular DTO package for Laravel, adding automatic casting, validation, and serialization.
- **Laravel actions (lorisleiva/laravel-actions)** — Often paired with DTOs for structured command/query objects.
- **Domain-Driven Design in Laravel** — DTOs are the anti-corruption layer between domain and infrastructure.
- **Hexagonal architecture** — DTOs cross the boundary between application core and adapters (API, CLI, queue).
- **Event sourcing** — DTOs represent event payloads with strict versioned schemas.

## Related Knowledge Units

### Prerequisites

No formal prerequisites — this is the foundational DTO unit.

### Related Topics

- **json-resource** — The alternative Laravel-native serialization layer.

### Advanced Follow-up Topics

- **spatie-laravel-data** — Package that formalizes and automates DTO patterns.
- **resources-vs-dtos** — Decision framework for DTOs vs API Resources.

## Research Notes

- The DTO pattern originates from the EAA catalog by Martin Fowler and is widely adopted in enterprise Laravel applications.
- PHP 8.1+ promoted constructor properties and readonly properties made DTOs significantly less verbose.
- Laravel itself does not ship a DTO base class, intentionally — the pattern is simple enough to implement manually.
- The community is divided between "always use DTOs at boundaries" and "just use API Resources/Form Requests." The right choice depends on application complexity.
