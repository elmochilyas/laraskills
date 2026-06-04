# Anti-Patterns — DTO Construction Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | DTO Construction Patterns |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Silent Null Assignment | High | Medium | Code review: `fromArray` uses `$data['key']` without null coalescing |
| God Factory | Medium | Low | Code review: a single factory class constructs all DTOs |
| Factory in Controller | Medium | High | Code review: DTO construction logic inline in controller |
| Factory Method Explosion | Medium | Medium | Code review: DTO has 6+ named constructors |
| Mixing Source Logic in fromArray | Medium | Medium | Code review: `fromArray` contains request-specific mapping |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Missing Named Constructors | DTO has no factory methods — callers must use the constructor directly | Every caller duplicates key-to-property mapping, leading to inconsistency |
| Inconsistent Factory Naming | Some DTOs use `fromArray`, others use `createFromArray`, others use `make` | Developers can't predict factory method names across the codebase |
| Constructor from Raw Data | DTO constructed from `$request->all()` or unvalidated input | Bypasses FormRequest validation, potential type confusion |

---

## Anti-Pattern Details

### AP-DCP-01: Silent Null Assignment

**Description**: A `fromArray` factory method accesses array keys using `$data['key']` without a null coalescing operator or explicit check. When the key is missing, PHP emits a warning and returns `null`. If the DTO property is nullable, `null` is silently accepted — the missing data is never noticed. Critical fields can be omitted without error.

**Root Cause**: The developer assumes input data is always complete and doesn't guard against missing keys. This is especially dangerous after refactoring callers to omit previously required fields.

**Impact**:
- Null values propagate silently through the system, causing bugs at the point of use, not construction
- Debugging is difficult: the value is null, but it's unclear where the null originated
- Refactoring to remove a field from one caller silently passes null to all others
- Non-nullable properties still trigger a confusing warning instead of a clear error

**Detection**:
- Code review: `fromArray` uses array access `$data['key']` without `??`
- Static analysis: PHPStan warns about possible array key absence
- Bug reports: "field is null" errors happening intermittently

**Solution**:
- Use `$data['key'] ?? throw new InvalidArgumentException('key is required')` for required fields
- Use `$data['key'] ?? default` for optional fields with defaults
- Never rely on PHP's silent null-on-missing behavior
- Consider using PHPStan's `@param array{key: string, ...} $data` for type-safe array shapes

**Example**:
```php
// BEFORE: Silent null assignment
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'],  // ❌ missing key → null, PHP warning
        email: $data['email'], // ❌ missing key → null, PHP warning
    );
}

// AFTER: Explicit handling
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'] ?? throw new InvalidArgumentException('name is required'),
        email: $data['email'] ?? throw new InvalidArgumentException('email is required'),
    );
}
```

---

### AP-DCP-02: God Factory

**Description**: A single factory class that constructs every DTO in the application. `DtoFactory::makeUserDto(...)`, `DtoFactory::makeOrderDto(...)`, `DtoFactory::makeProductDto(...)` — all DTO construction logic is centralized in one file. This creates coupling between unrelated DTOs, violates the single-responsibility principle, and creates a single point of failure for all DTO construction.

**Root Cause**: A misguided attempt at centralization. The developer believes that all factories should be in one place for consistency, not realizing that each DTO's construction logic is specific to that DTO and should live with it.

**Impact**:
- Factory class grows to 500+ lines with methods for every DTO
- Changing one DTO's construction requires modifying the shared factory
- New DTOs require remembering to add a factory method in the centralized file
- Tests for one DTO's factory method must instantiate the entire factory

**Detection**:
- Code review: a single `DtoFactory` or `DataFactory` class
- Code review: DTO classes have no named constructors — all construction goes through the factory
- Metrics: factory file exceeds 300 lines with methods across multiple domains

**Solution**:
- Move named constructors to the DTO class itself (`CreateUserDto::fromArray(...)`)
- Use static factory methods on the DTO as the default pattern
- Only create a separate factory class when construction requires injected dependencies
- If a separate factory is needed, create one per DTO or per domain

**Example**:
```php
// BEFORE: God factory
class DtoFactory
{
    public static function userFromArray(array $data): CreateUserDto { /* ... */ }
    public static function orderFromRequest(CreateOrderRequest $r): CreateOrderDto { /* ... */ }
    public static function productFromModel(Product $p): ProductResponseDto { /* ... */ }
    // ... 30 more methods
}

// AFTER: Named constructors on each DTO
class CreateUserDto
{
    public static function fromArray(array $data): self { /* ... */ }
}
class CreateOrderDto
{
    public static function fromRequest(CreateOrderRequest $request): self { /* ... */ }
}
class ProductResponseDto
{
    public static function fromModel(Product $product): self { /* ... */ }
}
```

---

### AP-DCP-03: Factory in Controller

**Description**: DTO construction logic is written inline in the controller method instead of being encapsulated in a named constructor on the DTO. The controller manually maps validated fields to DTO constructor arguments, duplicating mapping logic if the DTO is constructed in more than one place.

**Root Cause**: The developer skips creating the named constructor because "it's only constructed here." However, this breaks the DTO's encapsulation — the knowledge of how to build the DTO from its sources should live on the DTO itself.

**Impact**:
- DTO construction logic is scattered across controllers
- Adding a new field requires updating every controller that constructs the DTO
- The DTO cannot be constructed in tests without duplicating the controller's mapping
- Violates the information expert principle (the DTO knows its own data best)

**Detection**:
- Code review: controller code constructs a DTO directly using `new Dto($a, $b, $c)` or `new Dto(...$request->validated())`
- Code review: DTO has no `fromArray`, `fromRequest`, or `fromModel` methods
- Duplication: searching for `new CreateUserDto` reveals multiple construction sites

**Solution**:
- Add at least one named constructor to the DTO (`fromArray` is the minimum)
- Use the named constructor in the controller
- If the DTO is only constructed from one source, add that source as a named constructor

**Example**:
```php
// BEFORE: Factory logic in controller
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = new CreateUserDto(
            name: $request->validated('name'),    // ❌ mapping in controller
            email: $request->validated('email'),   // ❌ mapping in controller
            password: $request->validated('password'), // ❌ mapping in controller
        );
        return response()->json($this->createUser->execute($dto), 201);
    }
}

// AFTER: Encapsulated in DTO
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $dto = CreateUserDto::fromRequest($request);
        return response()->json($this->createUser->execute($dto), 201);
    }
}
```
