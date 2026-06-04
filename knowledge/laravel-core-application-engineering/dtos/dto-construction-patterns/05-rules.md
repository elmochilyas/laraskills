## Rule 1: Use Named Static Factories for Each Source Type

---

## Category

Architecture

---

## Rule

Provide one dedicated named static factory method per source type (`fromRequest()`, `fromModel()`, `fromArray()`, `fromCommand()`). Name each method to document the source. Do not use a single generic `from()` method that dispatches internally.

---

## Reason

Each source type has different risks and mapping requirements. A `fromModel()` factory must prevent lazy loading. A `fromRequest()` factory must use validated data. A `fromArray()` factory must handle missing keys. Named factories make these contracts explicit and give each factory a single responsibility.

---

## Bad Example

```php
public static function from(mixed $source): self
{
    if ($source instanceof Request) {
        return new self(...$source->all()); // Unvalidated, security risk
    }
    if ($source instanceof User) {
        return new self(name: $source->name, email: $source->email);
    }
    if (is_array($source)) {
        return new self(...$source); // No null handling, no key validation
    }
    throw new InvalidArgumentException('Unknown source');
}
// Generic factory obscures source-specific risks and security implications.
```

---

## Good Example

```php
public static function fromRequest(CreateUserRequest $request): self
{
    return new self(...$request->validated());
}

public static function fromModel(User $user): self
{
    return new self(name: $user->name, email: $user->email, bio: $user->bio);
}

public static function fromArray(array $data): self
{
    return new self(name: $data['name'], email: $data['email'], bio: $data['bio'] ?? null);
}
// Each factory is explicit about its source. Security guarantees are per-factory.
```

---

## Exceptions

For spatie/laravel-data, the package provides `Data::from()` and `Data::fromRequest()` automatically. Use these instead of manual named factories. For plain DTOs, always use named factories.

---

## Consequences Of Violation

Security: generic factories may construct DTOs from unvalidated input. Maintenance: adding a new source type requires modifying the generic dispatcher, risking breakage of existing sources.

---

## Rule 2: Always Construct DTOs from Validated Data — Never from `$request->all()`

---

## Category

Security

---

## Rule

Never pass `$request->all()`, `$request->input()`, or `$_POST` directly into a DTO constructor or factory. Always use `$request->validated()` from a FormRequest or an explicitly validated array.

---

## Reason

Raw request data may contain fields the user should not control (is_admin, role_id, permissions). A DTO constructed from raw input passes these unvalidated fields into the service layer, bypassing validation and authorization. The feature can write fields that were never intended for user control.

---

## Bad Example

```php
public function store(Request $request): JsonResponse
{
    $dto = UserDto::fromArray($request->all()); // User sends {name, email, is_admin: true}
    // $dto->isAdmin = true — mass-assignment vulnerability
}
```

---

## Good Example

```php
public function store(StoreUserRequest $request): JsonResponse
{
    $dto = UserDto::fromArray($request->validated());
    // validated() strips unvalidated fields — is_admin is never in $dto
}
```

---

## Exceptions

No common exceptions. Always use `validated()`. If there is no FormRequest (CLI, queue), validate the input array explicitly before constructing the DTO.

---

## Consequences Of Violation

Security: mass-assignment vulnerabilities, privilege escalation, unvalidated data reaching the service layer. Reliability: type errors from unexpected data shapes.

---

## Rule 3: Use Manual Mapping Over Spread Operator in Production Factories

---

## Category

Reliability

---

## Rule

Use explicit key-to-parameter mapping in factory methods rather than the spread operator (`...$data`). Reserve the spread operator only for cases where keys are guaranteed to match parameter names exactly (e.g., `$request->validated()` after FormRequest validation).

---

## Reason

The spread operator silently ignores extra keys and fatally errors on missing keys. It provides no protection against source data shape changes. Manual mapping catches key renames at compile time, documents which source keys map to which DTO properties, and handles null defaults explicitly.

---

## Bad Example

```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'],
        email: $data['email'],
        // bio missing — runtime error because spread was used before and relied on exact match
    );
}

// Elsewhere, a consumer calls:
$dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com']);
// If fromArray used spread: $dto->bio is uninitialized — runtime Error.
```

---

## Good Example

```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'],
        email: $data['email'],
        bio: $data['bio'] ?? null, // Explicit null handling
    );
}
// Every property is explicitly mapped. Extra keys are ignored. Missing keys have explicit defaults.
```

---

## Exceptions

The spread operator is safe with `$request->validated()` because FormRequest guarantees the return shape. Even then, prefer explicit mapping for production codebases with multiple consumers.

---

## Consequences Of Violation

Reliability: source data renames (API response, database column) silently break DTO construction. Maintenance: extra keys in source data silently pass through without consumer awareness.

---

## Rule 4: Eager-Load Relations Before Passing Models to `fromModel()` Factories

---

## Category

Performance

---

## Rule

Always eager-load Eloquent relations before passing a model to a `fromModel()` factory that accesses relation properties. Never rely on lazy loading inside the factory.

---

## Reason

Lazy loading inside a `fromModel()` factory triggers N+1 queries — each factory call individually queries the database for each relation. When called in a loop (collection factory), this multiplies query count by the number of items and relations. Eager-loading before the factory call guarantees a fixed, known query count.

---

## Bad Example

```php
public static function fromModel(User $user): self
{
    return new self(
        name: $user->name,
        email: $user->email,
        roles: RoleDto::collection($user->roles), // Triggers lazy load if not eager-loaded
    );
}

// Controller
$users = User::all(); // No eager load
$dtos = UserDto::collection($users); // N+1: 1 query for users + N queries for roles
```

---

## Good Example

```php
public static function fromModel(User $user): self
{
    return new self(
        name: $user->name,
        email: $user->email,
        roles: RoleDto::collection($user->roles), // Safe — eager-loaded before call
    );
}

// Controller
$users = User::with('roles')->get(); // Eager-loaded: 2 queries total
$dtos = UserDto::collection($users); // Zero additional queries
```

---

## Exceptions

When the relation is always loaded by a global scope or when constructing a single DTO (not in a loop), lazy loading cost is negligible. Even then, eager-load for consistency.

---

## Consequences Of Violation

Performance: N+1 queries degrade endpoint response time proportionally to collection size. Scalability: batch operations (exports, reports) generate thousands of queries.

---

## Rule 5: Keep Factory Methods Free of Service Dependencies

---

## Category

Architecture

---

## Rule

Do not inject services (database, cache, HTTP client, external API) into DTO factory methods. DTO construction must be deterministic and dependency-free. If construction requires external data, resolve it before calling the factory.

---

## Reason

DTO factories with service dependencies couple data transport to infrastructure. Testing requires container setup. Batch construction triggers repeated external calls. The DTO becomes dependent on infrastructure availability, violating the principle that DTOs are pure data carriers.

---

## Bad Example

```php
public static function fromRequest(CreateUserRequest $request): self
{
    $defaultRole = Role::where('name', 'user')->first(); // Database query in factory
    return new self(
        name: $request->validated('name'),
        email: $request->validated('email'),
        roleId: $defaultRole->id,
    );
}
// Factory depends on database. Cannot construct DTO without database connectivity.
```

---

## Good Example

```php
public static function fromRequest(CreateUserRequest $request, ?int $defaultRoleId = null): self
{
    return new self(
        name: $request->validated('name'),
        email: $request->validated('email'),
        roleId: $defaultRoleId ?? 1,
    );
}

// Controller resolves external data before factory call
public function store(CreateUserRequest $request): JsonResponse
{
    $defaultRoleId = Role::where('name', 'user')->value('id');
    $dto = UserDto::fromRequest($request, $defaultRoleId);
}
```

---

## Exceptions

No common exceptions. DTO factories must never depend on services or infrastructure. If external data is needed, resolve it before calling the factory.

---

## Consequences Of Violation

Testing: every DTO construction test requires database setup. Performance: repeated external calls in batch factory loops. Reliability: DTO construction fails when external services are unavailable.

---

## Rule 6: Provide a Collection Factory for Batch Construction

---

## Category

Code Organization

---

## Rule

When a DTO has a `fromModel()` or `fromArray()` factory, include a `collection()` static method that maps an array of source items to an array of DTOs. Type the parameter with a docblock annotation.

---

## Reason

Without a collection factory, callers write their own `array_map()` with inline closures, duplicating mapping logic across multiple call sites. A `collection()` method centralizes the mapping, documents the expected input type, and ensures consistent construction behavior across all consumers.

---

## Bad Example

```php
// Controller A
$dtos = array_map(fn(User $u) => UserDto::fromModel($u), $users);

// Controller B
$dtos = array_map(fn(array $d) => UserDto::fromArray($d), $userData);

// Queue job
$dtos = $users->map(fn(User $u) => UserDto::fromModel($u))->toArray();
// Three callers, three implementations. One uses wrong mapping.
```

---

## Good Example

```php
/** @param User[] $users */
public static function collectionFromModels(array $users): array
{
    return array_map(fn(User $user) => self::fromModel($user), $users);
}

/** @param array[] $data */
public static function collectionFromArrays(array $data): array
{
    return array_map(fn(array $item) => self::fromArray($item), $data);
}

// All callers use the same factory method
$dtos = UserDto::collectionFromModels($users);
$dtos = UserDto::collectionFromArrays($userData);
```

---

## Exceptions

For DTOs with a single call site or fewer than 5 total constructions, an inline `array_map` is acceptable.

---

## Consequences Of Violation

Maintenance: duplicate mapping logic across call sites. Reliability: one caller uses inconsistent mapping (wrong defaults, missing null handling). Testing: collection construction behavior is untested because no central factory exists.
