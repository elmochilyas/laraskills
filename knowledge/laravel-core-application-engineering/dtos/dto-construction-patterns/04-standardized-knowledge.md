# DTO Construction Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Construction Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

DTOs must be constructed from various sources: HTTP requests, Eloquent models, API responses, job payloads, and raw arrays. Each source requires a different construction strategy. The three dominant patterns are named static factories (per-source), single `fromArray` with internal mapping, and constructor injection with named arguments at the call site. The engineering decision is which pattern to use for each source type and how to standardize across the codebase.

The key insight is that construction is the DTO's vulnerability point. A DTO constructed from the wrong source or with missing fields produces silent failures or type errors in downstream layers. Standardized construction patterns prevent this.

## Core Concepts

- **Named Static Factories:** Each source gets a dedicated named constructor (`fromRequest()`, `fromModel()`, `fromArray()`). Per-source named constructors encapsulate mapping logic and provide type safety per source.
- **Constructor Injection with Named Arguments:** Direct `new DTO(...)` with PHP 8 named arguments, no factory. Appropriate for simple DTOs and internal callers where the data is already structured.
- **Mapping vs Spreading:** Manual mapping provides full safety with explicit key→param mapping. Array spread (`...$validated`) is concise but dangerous with extra or missing keys.
- **Ownership of Construction:** The DTO class (static factory), FormRequest (`payload()` method), a dedicated Factory class, or the Action/Service (direct constructor) — each decision optimizes for different concerns.

## When To Use

- Named factories when DTO is constructed from multiple source types (request, model, array)
- Spread constructors when array keys are guaranteed to match parameter names exactly (validated data)
- Builder pattern when construction has optional overrides or conditional branches
- Direct constructor when data is already structured and no transformation is needed

## When NOT To Use

- Do NOT spread `$request->all()` into a DTO — unvalidated input bypasses validation
- Do NOT mix sources in a single factory method — separate into `fromRequest` and `fromModel`
- Do NOT use constructor dependencies on services (database, cache, API) in DTO factories
- Do NOT use the builder pattern for DTOs with fewer than 5 properties — ceremony exceeds benefit

## Best Practices (WHY)

- **Why validate before construction:** Never construct from `$request->all()` — DTOs assume valid data. Always route through FormRequest's `validated()` first.
- **Why normalize at the boundary:** Transform types at construction (Carbon → ISO string, cents → integer), not in services. Downstream layers operate on consistent types regardless of source.
- **Why per-source factories:** Each source has different risks (lazy loading from models, unvalidated keys from arrays). Dedicated factories handle each risk explicitly.
- **Why use the same source pattern across entry points:** Controller, CLI command, and queue job each use their own factory, ensuring consistency. The service receiving the DTO doesn't know — or care — which entry point created it.

## Architecture Guidelines

- Prefer DTO-owned static factories for consistency across the codebase
- Use FormRequest `payload()` when DTO construction depends on validated data format
- Introduce separate Factory classes only when construction requires dependencies (database lookups, API calls)
- Always eager-load relations before passing models to `fromModel()` to prevent N+1
- Use manual mapping over spread for production codebases — the safety is worth the verbosity

## Performance

Construction overhead varies by pattern:
- Named factory: ~0.005ms per DTO
- Builder: ~0.01ms per DTO
- Constructor direct: ~0.002ms per DTO

All patterns are fast enough for typical applications. The builder pattern's extra cost matters only when constructing thousands of DTOs per request (batch processing, CSV export).

## Security

- Never construct DTOs from `$request->all()` — raw input may contain fields the user should not control (is_admin, role_id)
- Always use `$request->validated()` as the source for HTTP-originated DTOs
- DTO factories should never have dependencies that introduce side effects during construction

## Common Mistakes

1. **Spreading Unvalidated Data:** `new self(...$request->all())` bypasses validation. The DTO receives raw input including fields the user should not control.

2. **Mixed Sources in One Factory:** A single factory that handles both request and model source by checking parameter types violates single responsibility.

3. **Constructor Dependencies on Services:** DTO factories needing database, cache, or external API calls couples construction to infrastructure.

4. **Lazy Loading Inside fromModel:** `fromModel(User $user)` accessing relations not yet loaded triggers N+1 queries. Always eager-load before passing to `fromModel`.

## Anti-Patterns

- **The Kitchen Sink Factory:** A single `from()` method that accepts multiple source types and dispatches internally. Obscures what sources are supported and makes testing harder.
- **The Magic Spread:** Using `new self(...$data)` everywhere with no mapping. A single key rename in the source breaks every construction site.
- **The Factory in the Service:** A service method that constructs its own DTO from raw input. Service should receive a ready-made DTO, not construct one.

## Examples

### Named Static Factories
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

    /** @param array<int, User> $users */
    public static function collection(array $users): array
    {
        return array_map(fn(User $user) => self::fromModel($user), $users);
    }
}
```

### Builder for Complex Construction
```php
class UserDtoBuilder
{
    private string $name;
    private string $email;
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
        return new UserDto(name: $this->name, email: $this->email, roles: $this->roles);
    }
}
```

## Related Topics

- **DTO Fundamentals** — baseline DTO definition
- **Readonly Data Objects** — construction with readonly enforcement
- **Form Request DTO Integration** — bridging requests to DTOs
- **Nested DTOs** — constructing DTO trees from nested sources

## AI Agent Notes

- Default to named static factories (`fromArray`, `fromRequest`, `fromModel`) as the construction pattern
- Use manual mapping over spread operator for production code
- Always prefix sources: `fromRequest`, `fromModel`, `fromArray`, `fromJson`, `fromCommandLine`
- Never construct DTOs from unvalidated request data
- Type all factory parameters and return types with PHP native types

## Verification

- [ ] Each source type has a dedicated named factory method
- [ ] `fromRequest()` uses `$request->validated()` (not `$request->all()`)
- [ ] Factory methods use explicit key mapping (not spread) for production code
- [ ] `fromModel()` eager-loads relations before access
- [ ] No service dependencies (DB, cache, API) in DTO factories
- [ ] Collection factory creates typed arrays of DTOs
- [ ] All factory parameters and return values are typed
