# DTO Patterns — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** DTO Patterns
- **ECC Version:** 1.0

## Overview
Data Transfer Object (DTO) patterns provide structured, typed, and immutable alternatives to arrays and Eloquent models for passing data between application layers. DTOs serve as a serialization boundary — they define the exact shape of data entering or leaving the application, decoupling internal domain models from external contracts. They are plain PHP objects (typically with typed readonly promoted constructor properties, named constructors, and `toArray()` serialization) that enforce type safety and document data contracts explicitly.

## Core Concepts
- DTO — an object carrying data between processes without exposing behavior; typically immutable with typed properties
- Immutability — properties set once via constructor, never mutated; `readonly` properties enforce this at the language level
- Named constructors — static factory methods (`fromModel`, `fromArray`, `fromRequest`) centralize creation logic
- Typed properties — PHP 7.4+ typed properties enforce types at the language level
- Mapping layer — DTOs map between external contracts and internal domain representations
- DTO Collection — a collection class wrapping multiple DTOs with aggregate methods
- `toArray()` / `toJson()` — serialization methods on the DTO for output formatting

## When To Use
- Application boundaries where data enters or leaves (controllers, queue listeners, event subscribers)
- Multi-channel serialization where the same data goes to API, queue, broadcast, and CLI
- Strict type enforcement at domain boundaries — DTOs catch type errors at compile/analysis time
- Anti-corruption layer between Eloquent models and the rest of the application
- Contract documentation — the DTO class IS the contract for what data looks like

## When NOT To Use
- Do NOT use DTOs deep inside domain logic where Eloquent models are appropriate
- Do NOT use DTOs for every internal method call — it adds indirection without benefit in simple CRUD operations
- Do NOT use DTOs when API Resources alone suffice (HTTP-only serialization)
- Do NOT use DTOs as anemic domain models — don't add business logic to them
- Do NOT use DTOs for prototype/exploratory phases where speed matters more than structure

## Best Practices (WHY)
- Keep DTOs anemic — data transfer only, no business logic or validation rules beyond type enforcement
- Use PHP 8.1+ promoted constructor properties with `readonly` for clean immutable DTOs
- Define `fromModel()` named constructors to centralize Eloquent→DTO mapping
- Test DTO creation from models to catch serialization drift when model columns change
- Use DTOs at all application boundaries for consistency and type safety
- Use `fromArray()` for creating DTOs from request data (after validation)

## Architecture Guidelines
- Place DTOs in `App\DataTransferObjects\{Entity}DTO` namespace
- One DTO class per major data shape — not per model (some models may not need DTOs)
- DTOs should NOT extend Eloquent Model or use Eloquent traits — they are plain PHP objects
- Use DTOs for public API contracts — changing a DTO is a conscious, visible change
- Consider `spatie/laravel-data` for projects with many DTOs to reduce boilerplate
- Keep DTO serialization format customizable via `toArray()` — don't couple to Eloquent's format

## Performance
- DTO creation is lightweight — constructor call + property assignment; negligible vs Eloquent hydration
- Serializing DTOs to array is faster than Eloquent `toArray()` — no accessor resolution or lazy loading checks
- Readonly properties have no performance cost (compile-time feature)
- Mapping large collections with `array_map` + DTO constructor is highly efficient
- DTOs can be cached/serialized for reuse across processes (unlike Eloquent models)

## Security
- DTOs prevent Eloquent lazy loading from leaking into serialization — only explicitly mapped data is exposed
- DTOs cannot accidentally expose hidden attributes — only data that is explicitly mapped appears
- DTOs are immutable after creation — no risk of mutation-based data leaks across shared contexts
- Input DTOs ensure type safety — prevents type-juggling attacks at application boundaries

## Common Mistakes
- Adding business logic methods to DTOs — they become anemic domain models instead of data transfer objects
- Making DTOs mutable — defeats the purpose of a snapshot contract
- Using DTOs internally everywhere — adds unnecessary indirection within domain layers
- Forgetting to update `fromModel()` when model columns change — leads to runtime errors or missing data
- Returning Eloquent models directly from services instead of DTOs — defeats the boundary purpose
- Using DTOs as query objects — DTOs carry data, not query logic

## Anti-Patterns
- **DTO as domain object**: adding business logic, validation rules, or persistence concerns to a DTO
- **No DTO at boundaries**: returning Eloquent models from controllers or services, coupling internal to external
- **Mutable DTO**: allowing property changes after creation, defeating immutability guarantees
- **DTO explosion**: creating a DTO for every internal method call instead of at true application boundaries
- **DTO serialization coupling**: hardcoding Eloquent date format or key casing in DTO `toArray()`

## Examples
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

    public static function fromArray(array $data): self
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

// Usage in controller
$userDTO = UserDTO::fromModel($user);
return response()->json($userDTO->toArray());
```

## Related Topics
- json-resource — the alternative Laravel-native serialization layer
- spatie-laravel-data — package that formalizes and automates DTO patterns
- resources-vs-dtos — decision framework for DTOs vs API Resources
- to-array-to-json — underlying serialization mechanics

## AI Agent Notes
- DTOs should be plain PHP with readonly promoted constructor properties — no framework base class needed
- Always define both `fromModel()` and `toArray()` for the round-trip
- Do NOT extend Eloquent Model or use Eloquent traits in DTOs
- Use DTOs at application boundaries (controllers, queue, events) — not inside domain logic
- For projects with many DTOs, recommend `spatie/laravel-data` to reduce boilerplate
- Test `fromModel()` to catch drift when the underlying model changes columns

## Verification
- [ ] DTOs are used at all application boundaries (controllers, queue, events)
- [ ] DTOs have no business logic — strictly data transfer
- [ ] `fromModel()` is tested and updated when model columns change
- [ ] DTO properties use `readonly` for immutability
- [ ] DTO constructor uses promoted properties (PHP 8.1+)
- [ ] Relationships used in DTO mapping are eager-loaded
- [ ] DTO serialization is tested (round-trip: model → DTO → array)
- [ ] DTOs do NOT extend Eloquent Model or use Eloquent traits
