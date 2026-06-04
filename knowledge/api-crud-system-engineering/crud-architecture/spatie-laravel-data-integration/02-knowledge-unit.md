# Spatie Laravel Data Integration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Spatie Laravel Data Integration
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Spatie's `laravel-data` package is a comprehensive DTO framework for Laravel that provides automatic type casting, validation integration, serialization, and TypeScript generation. It replaces the manual DTO infrastructure (named constructors, `toArray`, `JsonSerializable`) with a declarative approach — define the DTO class structure, and the package handles construction, casting, and transformation automatically.

The engineering significance is that `laravel-data` eliminates the boilerplate of manual DTO patterns while preserving — and in some cases enhancing — type safety. A `Data` class with `string $name` and `Carbon $birthDate` automatically casts strings to Carbon, validates via Laravel rules, serializes to arrays/JSON, and generates TypeScript interfaces for frontend consumption. The cost is a package dependency and the need to learn the package's conventions instead of plain PHP patterns.

---

## Core Concepts

### Data Class Definition

```php
use Spatie\LaravelData\Data;

class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public Carbon $birthDate,
        public readonly NotificationPreferencesData $preferences,
    ) {}
}
```

The package reads the constructor parameter types and handles construction automatically.

### Automatic Construction

```php
// From validated request
$data = CreateUserData::from($request->validated());

// From array
$data = CreateUserData::from([
    'name' => 'John',
    'email' => 'john@test.com',
    'birth_date' => '2000-01-01',
]);

// From JSON
$data = CreateUserData::from(json_decode($json, true));
```

The package matches array keys to constructor parameters, applies casts, and recursively constructs nested `Data` objects.

### Type Casting

The package provides automatic casts for common types:

```php
class UserData extends Data
{
    public function __construct(
        public Carbon $birthDate,      // string → Carbon
        public Collection $tags,        // array → Collection
        public int $age,                // string → int
    ) {}
}
```

Custom casts can be registered for application-specific types (Money, Email, PhoneNumber).

---

## Mental Models

### The DTO Factory

The package acts as a universal DTO factory — you define the output structure, and it handles construction from any input source. It's like having a dedicated factory for every DTO in your codebase, all following the same rules.

### The Declarative Approach

Instead of writing "how to build this DTO from an array" (imperative), you declare "what this DTO looks like" (declarative). The package infers the construction logic from the declaration.

---

## Internal Mechanics

### Construction Pipeline

```
Input (array/json/request)
  → Property mapping (snake_case to camelCase by default)
  → Type casting (string → Carbon, int → Enum)
  → Nested Data construction (recursive)
  → Validation (Laravel rules)
  → Data object instance
```

### Validation Integration

```php
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }
}
```

Validation runs automatically during construction. Invalid data throws `Spatie\LaravelData\Exceptions\DataValidationException`.

### Nested Validation

Validation rules for nested `Data` classes are resolved recursively — each `Data` class defines its own `rules()`.

---

## Patterns

### Basic Data Class with Validation

```php
class UpdateProfileData extends Data
{
    public function __construct(
        public string $name,
        public ?string $bio,
        public readonly Carbon $birthDate,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:500'],
            'birth_date' => ['required', 'date', 'before:today'],
        ];
    }
}
```

### Data Collection

```php
/** @var DataCollection<int, LineItemData> */
public DataCollection $items;

// Construction
$data = OrderData::from([
    'items' => [
        ['product_id' => 1, 'quantity' => 2],
        ['product_id' => 5, 'quantity' => 1],
    ],
]);
```

The package autocasts nested arrays to `DataCollection`.

### Custom Casts

```php
class MoneyCast implements Cast
{
    public function cast(DataProperty $property, mixed $value, array $context): Money
    {
        return Money::fromDecimal($value);
    }
}

class PriceData extends Data
{
    public function __construct(
        #[WithCast(MoneyCast::class)]
        public Money $amount,
        public Currency $currency,
    ) {}
}
```

---

## Architectural Decisions

### When to Use Spatie vs Manual DTOs

Use Spatie when: the codebase has 20+ DTOs, validation is tightly coupled to data structure, TypeScript generation is needed for frontend integration, or nested DTOs are common (the package handles recursion automatically).

Use manual DTOs when: the codebase is small (<20 DTOs), the team prefers minimal dependencies, or the DTOs are extremely simple (2-3 fields, no nesting).

### Data Class vs Plain DTO for API Responses

Spatie Data classes can serve as both input DTOs and output resources via transformers:

```php
class UserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
        #[Transform(DateTimeTransformer::class, format: 'Y-m-d')]
        public Carbon $createdAt,
    ) {}
}

// As resource
return UserData::from($user)->toJson();
```

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero boilerplate — no fromArray/toArray | Package dependency with version constraints | Update dependency carefully |
| Automatic nesting and casting | Learning curve for package conventions | Team must learn Spatie conventions |
| Validation integration — rules on the DTO itself | Duplicates FormRequest validation | Use Data for both validation and DTO |
| TypeScript generation from PHP types | Package may not support all edge cases | Review package compatibility before adopting |

---

## Performance Considerations

Spatie Data objects are slightly slower than manual DTOs due to reflection-based construction and type casting. For typical usage (10-50 DTO constructions per request), the overhead is ~0.1-0.5ms — still negligible.

---

## Production Considerations

### Validation Strategy

Choose whether validation lives in FormRequest or Data:
- **FormRequest + Data:** FormRequest handles HTTP validation; Data handles structural validation (types, nested structures)
- **Data-only:** Data handles all validation; controller receives non-validated array and passes to Data

Data-only validation is simpler but loses the clear HTTP validation layer.

### TypeScript Generation

```bash
php artisan data:typescript
```

Generates TypeScript interfaces from PHP Data classes. Keeps frontend types in sync with backend DTOs — the single source of truth for API contracts.

### Upgrading

Spatie/laravel-data has breaking changes between major versions. Pin the version and review upgrade guides before updating.

---

## Common Mistakes

### Mixing Package and Manual Patterns
Why it happens: Some DTOs use Spatie conventions while others use manual `fromArray`/`toArray`. Why it's harmful: Inconsistent construction patterns confuse developers and prevent using the package's TypeScript generation for all types. Better approach: Choose one approach and apply it consistently across the codebase.

### Over-Reliance on Automatic Construction
Why it happens: Assuming the package always maps keys correctly without testing. Why it's harmful: Snake_case to camelCase mapping has edge cases (acronyms, compound words). Better approach: Test DTO construction for each Data class.

### Ignoring the Learning Curve
Why it happens: Expecting the package to work exactly like manual DTOs. Why it's harmful: Team wastes time debugging package-specific behavior. Better approach: Allocate time for the team to learn package conventions before production use.

---

## Failure Modes

### Validation Exception in Controllers
When `Data::from()` throws a validation exception, it may produce a 500 error if not caught. Wrap Data construction in a try-catch or use the package's automatic exception handling for HTTP requests.

### Package Version Lock
A critical bug in laravel-data may block application upgrades. Pin the exact version and test upgrades in CI before deploying.

---

## Ecosystem Usage

### Spatie's Own Products
Spatie uses laravel-data across its SaaS products. The package is battle-tested in production.

### Major Laravel Projects
Projects like Laravel CMS, Filament (partially), and various enterprise applications use laravel-data for structured data handling.

---

## Related Knowledge Units

### Prerequisites
- Data Transfer Object Design — Core DTO concepts that Spatie formalizes
- DTO Construction Patterns — Manual patterns that Spatie automates

### Related Topics
- DTO Nesting Composition — Nesting patterns (Spatie automates these)
- Validation Patterns — FormRequest vs Data validation strategy

### Advanced Follow-up Topics
- Custom Casts and Transformers — Extending Spatie Data
- TypeScript Generation from DTOs — Frontend integration

---

## Research Notes

### Source Analysis
- Spatie/laravel-data v4 documentation: https://spatie.be/docs/laravel-data/v4/introduction
- GitHub: https://github.com/spatie/laravel-data
- Key features: Automatic casting, validation, nesting, TypeScript generation

### Key Insight
Spatie/laravel-data is the dominant DTO package in the Laravel ecosystem because it solves the biggest DTO pain points: boilerplate (automatic construction) and consistency (declarative approach). It's particularly valuable for teams with 20+ DTOs where manual maintenance becomes burdensome.

### Version-Specific Notes
- v4: Latest major version (2024-2026), includes TypeScript generation
- v3: Previous version, different API for casts and transformers
- Laravel 10+ compatible, PHP 8.1+
