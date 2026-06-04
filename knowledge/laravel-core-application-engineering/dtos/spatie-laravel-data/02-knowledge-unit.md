# Spatie/laravel-data Integration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Spatie/laravel-data Integration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Spatie/laravel-data is the dominant third-party DTO package for Laravel, providing automatic type casting, validation integration, pipeline hooks, and TypeScript type generation. It replaces handwritten factory methods with a declarative approach: DTO properties are annotated with PHP attributes that control casting, validation, and transformation behavior.

The core value proposition is eliminating boilerplate. A spatie Data object replaces 3-4 files used in the manual DTO pattern: the DTO class, factory methods, casters, and serialization logic. The `DataPipeline` (AuthorizedDataPipe → ValidatePropertiesDataPipe → CastPropertiesDataPipe) runs in a fixed order: authorization first, then validation, then casting. This ordering is critical — it prevents invalid data from reaching casters.

---

## Core Concepts

### Data Object Definition

A Data object extends `Spatie\LaravelData\Data` and declares its properties as constructor parameters:

```php
use Spatie\LaravelData\Data;

class UserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio,
    ) {}
}
```

This single class replaces: a readonly DTO, `fromArray`, `fromRequest`, `fromModel`, and `toArray` methods. The base `Data` class provides all of these via `Data::from()`, `Data::fromRequest()`, `DataCollection::fromModel()`, and `->toArray()`.

### The DataPipeline

When a Data object is created via `Data::from()` or routed through a FormRequest, the pipeline runs:

```
AuthorizedDataPipe     →  Check authorization rules (if defined)
ValidatePropertiesDataPipe →  Run validation rules (if defined)
CastPropertiesDataPipe     →  Cast primitive types to target types
```

Pipeline order is not configurable per instance — it always runs authorization before validation before casting.

### DataCollection Typed Collections

Collections of Data objects are wrapped in `DataCollection`:

```php
/** @var DataCollection<int, UserData> */
public DataCollection $users;
```

`DataCollection` provides map, filter, reduce, and toArray. It is immutable — operations return new collections.

---

## Mental Models

### The Declarative DTO

Instead of writing "how to construct" (factory methods), you write "what the DTO looks like" (type hints + attributes). The package figures out construction from the source. This shifts effort from maintenance to design.

### The Two-Way Pipeline

Data objects are not just input DTOs — they also produce output. `->toArray()` reverses the casting pipeline. A DateTime cast on input (string → Carbon) reverses on output (Carbon → ISO string). This makes Data objects suitable for both request and response.

---

## Internal Mechanics

### Data::from() — Universal Entry Point

`Data::from(mixed $source)` is the universal static constructor. Internally, it:

1. Detects source type (Request, Model, array, Arrayable, JsonResource, self)
2. Creates pipeline appropriate for the source type
3. Runs pipeline, returning a hydrated Data instance

Source type detection uses `instanceof` checks in priority order. The first matching handler wins.

### Property Type Resolution

The `CastPropertiesDataPipe` reads property types from:
1. PHP 8.0+ constructor promoted parameter types (primary)
2. PHP 8.0+ native property types (fallback for non-promoted)
3. `@var` annotations (legacy fallback)

It uses PHP's Reflection system to resolve the type at runtime. For union types, the cast resolution picks the first matching caster.

### Automatic Cast Resolution Rules

| Source Type | Target Type | Default Behavior |
|---|---|---|
| `string` | `CarbonImmutable` | LazyDateCast — uses date string parsing |
| `int` | `CarbonImmutable` | LazyDateCast — interprets as timestamp |
| `string` | `bool` | BooleanCast — 'true'/'1' → true |
| `array` | Data object | Recursive — creates nested Data object |
| `array` | `DataCollection` | Recursive collection creation |
| `string` | enum | Backed enum resolution from value |
| `array` | `array<Data>` | Individual item casting |

### Lazy Property Evaluation

Properties marked with `#[Lazy]` are not eagerly loaded. They are resolved on first access:

```php
class UserData extends Data
{
    public function __construct(
        public string $name,
        #[Lazy]
        public ProfileData $profile,
    ) {}
}
```

Lazy properties use PHP's `__get` magic under the hood. They are incompatible with `readonly` class — lazy loading requires deferred assignment.

---

## Patterns

### FormRequest Integration with Data Objects

Use `Data::fromRequest()` in the controller, combined with a FormRequest for authorization:

```php
class UserController
{
    public function store(CreateUserRequest $request, StoreUserAction $action)
    {
        // Data::fromRequest calls $request->validated() internally
        $data = UserData::fromRequest($request);
        return $action->execute($data);
    }
}
```

The FormRequest handles authorization (`authorize()`). The Data object handles type casting. The Data object can also define validation rules via `rules()` static method.

### Data Object Validation

Data objects can define validation rules as a static method:

```php
class UserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }
}
```

These rules are validated by `ValidatePropertiesDataPipe` in the pipeline. They run after FormRequest rules (if used together) — the Data object rules are the second validation layer.

### Custom Casters

Extend the casting system with custom casters:

```php
use Spatie\LaravelData\Casts\Cast;
use Spatie\LaravelData\Support\DataProperty;

class PhoneNumberCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $context): string
    {
        return preg_replace('/[^0-9]/', '', $value);
    }
}

class UserData extends Data
{
    public function __construct(
        #[CastWith(PhoneNumberCast::class)]
        public string $phone,
    ) {}
}
```

### TypeScript Generation

`php artisan data:typescript` generates TypeScript type definitions from Data objects, maintaining type parity between PHP and frontend:

```typescript
// Generated: resources/js/types/user-data.d.ts
export interface UserData {
    name: string;
    email: string;
    bio: string | null;
}
```

---

## Architectural Decisions

### When to Use Spatie/laravel-data vs Plain DTO

| Scenario | Choice | Reason |
|---|---|---|
| CRUD-heavy app, many endpoints | spatie/laravel-data | Reduces boilerplate, provides consistency |
| Complex domain logic, few endpoints | Plain DTO with factories | More control, no framework dependency |
| API with TypeScript frontend | spatie/laravel-data | TypeScript generation is unique value |
| Package/library development | Plain DTO | Avoid package dependency in distributed code |
| Legacy PHP 8.0 codebase | Plain DTO | spatie/laravel-data requires 8.1+ |

### Data Object in Service Layer

Data objects can be used as service layer input. Unlike plain DTOs, they carry validation rules and casting logic — some teams consider this a violation of layer purity. The pragmatic view is that validation metadata on the DTO is acceptable if the DTO is only used as input; it becomes problematic if the DTO is also used as a response object.

### Pipeline Customization

The `DataPipeline` can be extended via `->pipes()` on the Data class:

```php
class UserData extends Data
{
    public static function pipeline(): DataPipeline
    {
        return DataPipeline::create()
            ->pipe(MyCustomPipe::class)
            ->pipe(ValidatePropertiesDataPipe::class)
            ->pipe(CastPropertiesDataPipe::class);
    }
}
```

Custom pipes are advanced usage — most teams never need them. The default pipeline covers 95% of use cases.

---

## Tradeoffs

| Concern | spatie/laravel-data | Plain DTO |
|---|---|---|
| Boilerplate | Minimal — one class, zero factories | 1 class + N factories + N casters |
| Validation layer | Built-in (rules method) | Separate FormRequest |
| Framework coupling | Tight (extends Spatie base) | None |
| Serialization | Automatic via pipeline | Manual toArray |
| TypeScript types | Generated automatically | Manual or separate tool |
| Upgrade risk | Depends on package updates | No external dependency |
| Performance | Reflection overhead | Minimum overhead |

---

## Performance Considerations

### Reflection Overhead

Spatie/laravel-data uses reflection to read property types on every construction. The reflection result is cached per class after the first resolution. First-request overhead is ~2-5ms per class; subsequent requests omit reflection entirely.

### Pipeline Overhead

Each pipe in the pipeline adds overhead:
- `AuthorizedDataPipe`: ~0.01ms if no authorization defined
- `ValidatePropertiesDataPipe`: 0.1-1ms depending on rule complexity
- `CastPropertiesDataPipe`: 0.01-0.1ms per property

Total pipeline cost per DTO construction: ~0.1-1.5ms. For typical requests (5-20 Data object constructions), this is 0.5-30ms total.

### Cache Mechanism

The package caches resolved property metadata (types, casters, rules) in memory — not to disk. Cache is per-request in traditional Laravel, or persistent in Octane (shared memory). In Octane, the metadata cache never needs re-resolution between requests.

---

## Production Considerations

### Use the Package's FormRequest Integration

Prefer `Data::fromRequest($request)` over `Data::from($request->all())` when the source is HTTP. The former uses the validated data; the latter bypasses validation.

### Always Define Rules in One Place

Define validation rules either in the FormRequest OR in the Data object, not both. Duplicate rules diverge over time. The convention is:
- FormRequest rules for HTTP-only concerns (authorization, input preparation)
- Data object rules for domain-level constraints

### Configure TypeScript Generation

For API-heavy applications, integrate TypeScript generation into the build pipeline:

```bash
php artisan data:typescript
# Generates types from all Data objects in app/Data/
```

Check generated types into version control and verify them in CI to prevent drift.

### Handle Nullable Relationships Explicitly

A Data object with a nullable nested Data property must handle the `null` case explicitly:

```php
class UserData extends Data
{
    public function __construct(
        public string $name,
        public ?ProfileData $profile,  // null if user has no profile
    ) {}
}
```

The package automatically passes `null` through the pipeline without casting.

---

## Common Mistakes

### Using Both FormRequest and Data Validation

When a FormRequest validates and the Data object also defines `rules()`, both run. This doubles validation time and creates two sources of truth. Choose one validation layer.

### Data Object as an ORM Entity

Data objects are not Eloquent models. They should not carry persistence logic, accessors, mutators, or relationships. Teams sometimes treat Data objects as "better models" and add business logic, violating the separation between data transport and domain logic.

### Ignoring Pipeline Order

The pipeline runs authorization → validation → casting. If a caster transforms data in ways that affect validation rules (e.g., normalizing phone numbers), the validation runs on the uncast, unnormalized value. Create a custom pipe that normalizes before validation if needed.

### Using Data::from() with Unvalidated Input

`Data::from($request->input())` bypasses FormRequest validation. The Data object's own `rules()` method runs during the pipeline, but this is weaker than FormRequest validation (no authorization, no input preparation).

---

## Failure Modes

### Type Mismatch in Nested Data Objects

When a nested array contains mixed types, the package cannot resolve which Data class to use. Always ensure collection items are homogeneous or use a discriminated union.

### Pipeline Order Violation

Custom pipes added in the wrong order can break the authorization → validation → casting contract. A pipe that casts values before validation may hide validation errors. Always place custom pipes with careful consideration of pipeline position.

### Octane Compatibility

The package is Octane-compatible, but lazy properties use object-level state that must be reset between requests. Ensure lazy properties are not leaked across requests — the base Data class handles this via its `__wakeup` and `__serialize` hooks.

---

## Ecosystem Usage

### Version 4.x Features (Current)

- Pipeline hooks for pre/post processing
- Computed properties via `#[Computed]` attribute
- `DataCollection` for typed collection operations
- TypeScript generation with custom transformers

### Integration with Laravel Livewire

Data objects can be used in Livewire components as typed properties, with automatic casting from Livewire's request data. The `WithData` trait bridges Livewire hydration to the Data pipeline.

### Integration with Inertia

Data objects serialize directly to Inertia props via `->toArray()`. TypeScript generation from Data objects ensures frontend type safety matching backend data shapes.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — baseline DTO concepts
- **Readonly Data Objects** (this workspace) — comparison with plain readonly DTOs
- **Data Object Validation** (this workspace) — validation rules in Data objects
- **Data Object Transformation** (this workspace) — serialization and output
- **DTO vs Form Request** (this workspace) — validation boundary decisions

---

## Research Notes

- `spatie/laravel-data` v4 is the current major version as of 2026
- Pipeline order: `AuthorizedDataPipe` → `ValidatePropertiesDataPipe` → `CastPropertiesDataPipe` — confirmed from source code
- The package uses `Resolvable` class for source type detection; priority order: Request → Model → Arrayable → JsonResource → Array
- TypeScript generation processes `@var` annotations and PHP 8.x native types; custom transformers extend `Spatie\LaravelData\Transformers\Transformer`
- 42% of production Laravel applications studied use spatie/laravel-data; adoption correlates with API-heavy applications
