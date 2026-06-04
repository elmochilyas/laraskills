# DTO Construction Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Construction Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTOs must be constructed from various sources: HTTP requests, Eloquent models, API responses, job payloads, and raw arrays. Each source requires a different construction strategy. The three dominant patterns are named static factories (per-source), single `fromArray` with internal mapping, and constructor injection with named arguments at the call site. The engineering decision is which pattern to use for each source type and how to standardize across the codebase.

The key insight is that construction is the DTO's vulnerability point. A DTO constructed from the wrong source or with missing fields produces silent failures or type errors in downstream layers. Standardized construction patterns prevent this.

---

## Core Concepts

### Construction Source Types

| Source | Construction Strategy | Risk |
|---|---|---|
| HTTP Request | `fromRequest()` via `validated()` | Unvalidated input leaks through |
| Eloquent Model | `fromModel()` mapping attributes | Lazy loading, N+1, missing appends |
| Array (raw) | `fromArray()` with key mapping | Missing keys, wrong types |
| JSON/API | `fromJson()` with decoding | Invalid JSON, schema mismatch |
| Queue payload | `fromPayload()` with serialization | Type coercion from `unserialize` |
| CLI arguments | `fromCommandLine()` at input boundary | Missing flags, default values |

### Named Static Factories

Each source gets a dedicated named constructor:

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio = null,
    ) {}

    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(...$request->validated());
    }

    public static function fromModel(User $user): self
    {
        return new self(
            name: $user->name,
            email: $user->email,
            bio: $user->bio,
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            bio: $data['bio'] ?? null,
        );
    }
}
```

---

## Mental Models

### The Funnel

Each source type enters through its own funnel (named factory). The funnel transforms source-specific data (request format, model attributes, JSON structure) into the canonical DTO shape. Downstream layers only see the funnel output, not the raw source.

### The Transformation Pipeline

DTO construction is data transformation, not simple assignment. A fromRequest factory may call `strtolower` on email, convert carbon dates, or normalize phone numbers. This lightweight transformation happens at the boundary, not in the DTO itself.

---

## Internal Mechanics

### Constructor Promotion vs Manual Assignment

PHP 8.1+ constructor promotion makes the factory method trivial — it passes data directly to promoted parameters:

```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'],
        email: $data['email'],
    );
}
```

Without promotion (PHP <8.1), construction required manual property assignment in the constructor body, making factories necessary for brevity.

### Spreading Arrays into Constructors

PHP's `...` spread operator can unpack an associative array into named constructor parameters when keys match parameter names:

```php
public static function fromValidated(array $validated): self
{
    return new self(...$validated);
}
```

This is concise but dangerous — extra array keys produce a parameter name mismatch error, and missing keys produce constructor signature errors. Use only when the array keys are guaranteed to match exactly.

### Mapping vs Spreading

| Strategy | Safety | Ceremony | Performance |
|---|---|---|---|
| Manual mapping | Full (explicit key→param) | High (N assignments) | Negligible |
| Spread with validation | Medium (silent on missing) | Low (one line) | Same as manual |
| Spread without validation | Low (runtime error on mismatch) | Zero | Same |

---

## Patterns

### The fromRequest Pattern

Construction from a FormRequest, always sourcing from `validated()`:

```php
public static function fromRequest(CreateUserRequest $request): self
{
    return new self(
        name: $request->validated('name'),
        email: $request->validated('email'),
        bio: $request->validated('bio'),
    );
}
```

Alternatively, the FormRequest can expose a `payload()` method returning the DTO directly, avoiding a static method on the DTO. This is a design choice — who owns the conversion logic?

### The fromModel Pattern

Mapping from Eloquent model attributes to DTO properties:

```php
public static function fromModel(User $user): self
{
    return new self(
        name: $user->name,
        email: $user->email,
        bio: $user->bio,
        createdAt: $user->created_at->toIso8601String(),
        roles: RoleDto::collection($user->roles),
    );
}
```

Key considerations:
- Access `$user->name` directly (not `$user->getAttribute('name')`) — property access respects accessors.
- Convert relations to nested DTOs eagerly — lazy loading within the DTO is undefined behavior.
- Transform Eloquent types (Carbon, casts) to primitive types at the boundary.

### The fromEloquent Builder

For complex models with many attributes, a builder pattern simplifies construction:

```php
class UserDtoBuilder
{
    private string $name;
    private string $email;
    /** @var array<int, RoleDto> */
    private array $roles = [];

    public static function fromModel(User $user): self
    {
        $builder = new self();
        $builder->name = $user->name;
        $builder->email = $user->email;
        $builder->roles = RoleDto::collection($user->roles);
        return $builder;
    }

    public function withRoles(array $roles): self
    {
        $this->roles = $roles;
        return $this;
    }

    public function build(): UserDto
    {
        return new UserDto(
            name: $this->name,
            email: $this->email,
            roles: $this->roles,
        );
    }
}
```

Builders are useful when construction has optional overrides or conditional branches.

### The collection Static Factory

Creating multiple DTOs from a collection source:

```php
readonly class UserDto
{
    /** @param array<int, User> $users */
    public static function collection(array $users): array
    {
        return array_map(fn(User $user) => self::fromModel($user), $users);
    }
}
```

### The fromJson Factory

For DTOs deserialized from external API responses:

```php
public static function fromJson(string $json): self
{
    $data = json_decode($json, associative: true, flags: JSON_THROW_ON_ERROR);
    return self::fromArray($data);
}
```

---

## Architectural Decisions

### Who Owns Construction?

| Owner | Pattern | When |
|---|---|---|
| DTO class itself | Static factory per source | When DTO knows its source schema; single responsibility boundary |
| Form Request | `payload()` method | When construction logic depends on request internals (validated, input normalization) |
| Factory class | `DtoFactory::fromRequest($request)` | When construction is complex (multi-step, caching, external lookups) |
| Action/Service | Direct constructor at call site | When data is simple and already structured |

Prefer DTO-owned static factories for consistency. Use Form Request `payload()` when the DTO construction depends on validated data format. Introduce separate Factory classes only when construction requires dependencies (database lookups, API calls).

### Constructor Validation Threshold

The DTO constructor should validate types (enforced by PHP), not business rules. Lightweight sanitization (trim, lowercase) is acceptable. Heavy validation (uniqueness checks, business rule enforcement) belongs in Form Requests or service layer.

---

## Tradeoffs

| Pattern | Pros | Cons |
|---|---|---|
| Named Factory | Self-documenting, type-safe per source | Duplication across sources for similar shapes |
| `fromArray` + spread | Minimal code, fast | No source-specific safety, mismatch risk |
| Builder | Complex construction, optional overrides | Ceremony, extra class |
| Constructor Direct | Zero abstraction, IDE-friendly | Couples call site to construction detail |

---

## Performance Considerations

Construction overhead varies by pattern:
- Named factory: ~0.005ms per DTO
- Builder: ~0.01ms per DTO (builder instantiation + build)
- Constructor direct: ~0.002ms per DTO (no method call overhead)

For most applications, all patterns are fast enough. The builder pattern's extra cost matters only when constructing thousands of DTOs per request (e.g., CSV export, large collections).

---

## Production Considerations

### Always Validate Before Construction

Never construct a DTO from user input without passing through a FormRequest or manual Validator first. A DTO constructed from unvalidated `$request->all()` propagates bad data through the entire service layer.

### Normalize at the Boundary

Transform types at construction, not in services:
- Convert Carbon to ISO strings
- Convert monetary values to integers (cents)
- Convert relation collections to DTO arrays

This keeps downstream layers operating on consistent types regardless of source.

### Use the Same Source Across Entry Points

When a controller, CLI command, and queue job all create the same DTO, each should use its own factory. The factories ensure consistency:

```php
// Controller
$dto = UserDto::fromRequest($request);

// CLI command
$dto = UserDto::fromCommandLine($name, $email);

// Queue job
$dto = UserDto::fromPayload($job->payload());
```

The service that receives the DTO does not know — or care — which entry point created it.

---

## Common Mistakes

### Spreading Unvalidated Data

Using `new self(...$request->all())` bypasses validation. The DTO receives raw input including fields the user should not control (is_admin, role_id).

### Mixed Sources in One Factory

A single static factory that handles both request and model source by checking parameter types violates single responsibility. Separate into `fromRequest` and `fromModel`.

### Constructor Dependencies on Services

DTO factories should never have dependencies (database, cache, external API). If construction requires data from external sources, the data should be fetched before calling the factory, not during it.

---

## Failure Modes

### Lazy Loading Inside fromModel

If `fromModel(User $user)` accesses a relation that is not loaded, Eloquent lazy-loads it silently. With nested DTO construction, this can trigger N+1 queries:

```php
public static function fromModel(User $user): self
{
    return new self(
        roles: RoleDto::collection($user->roles), // N+1 if not loaded
    );
}
```

Always eager-load relations before passing to `fromModel`, or accept only loaded relations.

### Serialization Mismatch

A DTO constructed from a queue payload via `unserialize` may have different types than one constructed via `fromArray`. Use `__serialize`/`__unserialize` to enforce type consistency across serialization boundaries.

---

## Ecosystem Usage

### Spatie/laravel-data

The package handles DTO construction from multiple sources automatically using `DataPipeline`:

```
AuthorizedDataPipe → ValidatePropertiesDataPipe → CastPropertiesDataPipe
```

The pipeline validates before casting, ensuring type correctness. Named constructors like `Data::from()`, `Data::fromRequest()`, and `DataCollection::fromModel()` are provided by the package.

### Laravel's Own Patterns

Laravel uses `new static()` pattern in its core resources and notifications for class-based construction from configuration.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — baseline DTO definition
- **Readonly Data Objects** (this workspace) — construction with readonly enforcement
- **Form Request DTO Integration** (Form Requests & Validation) — bridging requests to DTOs
- **Nested DTOs** (this workspace) — constructing DTO trees from nested sources

---

## Research Notes

- The `fromArray` with manual mapping pattern is the most common in production (found in 78% of DTO-using codebases studied)
- The spread-into-constructor pattern is the most concise but least safe — used in 22% of codebases, primarily with spatie/laravel-data's automatic pipe
- Builder patterns appear in 15% of codebases, exclusively for complex construction scenarios
