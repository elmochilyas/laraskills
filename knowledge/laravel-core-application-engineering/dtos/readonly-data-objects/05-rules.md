## Rule 1: Declare Every DTO as a `readonly class` (PHP 8.2+) or Use `public readonly` on All Properties (PHP 8.1)

---

## Category

Design

---

## Rule

Use `readonly class` for all DTOs when targeting PHP 8.2+. For PHP 8.1 compatibility, apply `public readonly` to every promoted constructor property. Never create DTOs without language-level immutability enforcement.

---

## Reason

The `readonly` keyword enforces immutability at the language level — any mutation attempt produces a compile-time error rather than a silent runtime bug. A DTO without `readonly` is a parameter bag, not a DTO. Applying `readonly class` from the first commit prevents the entire category of accidental mutation bugs.

---

## Bad Example

```php
class UserDto
{
    public function __construct(
        public string $name,   // Mutable — any layer can change this
        public string $email,  // Mutable — any layer can change this
    ) {}
}
// No readonly enforcement. $dto->name = 'hacked' compiles and runs.
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
// Language-level immutability. $dto->name = 'hacked' produces a compile-time Error.
```

---

## Exceptions

When the DTO class must extend a non-readonly class (PHP 8.2 restriction), use `public readonly` on individual properties. This is rare — DTOs should not extend non-DTO classes.

---

## Consequences Of Violation

Reliability: accidental mutation by intermediate layers corrupts data silently. Maintenance: "who changed this value" bugs require time-consuming debugging across layers.

---

## Rule 2: Always Use Constructor Promotion — Never Manually Assign Properties

---

## Category

Code Organization

---

## Rule

Use PHP constructor promotion exclusively for all DTO properties. Never declare properties separately and assign them in the constructor body.

---

## Reason

Constructor promotion eliminates the duplication between property declaration and constructor assignment. Every line of manual assignment is a potential mismatch — the property is declared but not assigned, assigned but not declared, or assigned with a different type. Promotion guarantees that declaration and assignment are a single operation.

---

## Bad Example

```php
readonly class UserDto
{
    private string $name;     // Declaration
    private string $email;    // Declaration

    public function __construct(string $name, string $email)
    {
        $this->name = $name;  // Assignment — risk of mismatch
        $this->email = $email; // Assignment — risk of mismatch
    }
}
// 6 lines for 2 properties. Adding a property: 2 edits (declaration + assignment).
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,   // Declaration and assignment in one line
        public string $email,  // Declaration and assignment in one line
    ) {}
}
// 5 lines for 2 properties with fewer characters. Adding a property: 1 edit.
```

---

## Exceptions

When computed properties are needed (values derived from constructor parameters without being constructor parameters themselves), use a private non-readonly property with a public accessor method. This is rare for DTOs.

---

## Consequences Of Violation

Maintenance: adding or renaming a property requires editing two locations (declaration + assignment), increasing the risk of mismatch. Readability: more boilerplate obscures the DTO's structure.

---

## Rule 3: Use the "with" Pattern for Modified Copies Instead of Mutation

---

## Category

Design

---

## Rule

When a modified copy of a readonly DTO is needed, implement `with*()` methods that return a new instance with the specified property changed. Never attempt to modify a readonly DTO or its clone.

---

## Reason

Readonly DTOs cannot be modified after construction. Attempting to modify a property or a cloned instance produces a runtime `\Error`. The "with" pattern provides a controlled, explicit mechanism for producing modified copies while maintaining immutability. Each `with*()` method is a factory that documents which properties can be changed and how.

---

## Bad Example

```php
$dto = new UserDto(name: 'John', email: 'john@test.com');
$dto->name = 'Jane'; // Fatal error: cannot modify readonly property

// Or attempting clone-and-modify:
$clone = clone $dto;
$clone->name = 'Jane'; // Still a fatal error — clone is still readonly
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public function withName(string $name): self
    {
        return new self($name, $this->email);
    }

    public function withEmail(string $email): self
    {
        return new self($this->name, $email);
    }
}

// Usage
$dto = new UserDto(name: 'John', email: 'john@test.com');
$updated = $dto->withName('Jane'); // New instance, original unchanged
```

---

## Exceptions

For DTOs with many properties (10+), consider a `with()` method that accepts a callable or array of changes rather than implementing 10+ individual `with*()` methods. Use sparingly.

---

## Consequences Of Violation

Reliability: attempting to modify a readonly property or clone causes a runtime `\Error`. Maintenance: developers work around readonly constraints with reflection or other hacks, breaking immutability guarantees.

---

## Rule 4: Control Serialization via `__serialize()`/`__unserialize()` to Prevent Unserialize Bypass

---

## Category

Security

---

## Rule

When a DTO is used in serialization contexts (caching, queues, sessions), implement `__serialize()` and `__unserialize()` to control the serialization surface. Do not rely on the default PHP serialization behavior.

---

## Reason

PHP's `unserialize()` creates objects without calling the constructor, bypassing readonly assignment guarantees and validation logic. A constructed-from-unserialize DTO may have uninitialized readonly properties or invalid state. Explicit `__serialize()`/`__unserialize()` gives full control over the serialization process and ensures the DTO is always in a valid state after unserialization.

---

## Bad Example

```php
readonly class UserDto
{
    public function __construct(public string $name, public string $email) {}
}

// Default serialization:
$serialized = serialize($dto);
$restored = unserialize($serialized);
// $restored->name and $restored->email are set, but constructor never ran.
// If constructor had validation, it was bypassed.
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(public string $name, public string $email) {}

    public function __serialize(): array
    {
        return ['name' => $this->name, 'email' => $this->email];
    }

    public function __unserialize(array $data): void
    {
        // Re-run constructor logic (or validation)
        // readonly properties must be set via a different mechanism
        // Use reflection to set for readonly, or redesign as non-readonly for serialization
        // Better: use JsonSerializable + manual deserialization via fromArray
    }
}

// More robust approach: use JsonSerializable instead of PHP serialization
public function jsonSerialize(): array { return $this->toArray(); }
public static function fromArray(array $data): self { /* validation + construction */ }
```

---

## Exceptions

When using Laravel's queue system with serialization, the framework handles `__serialize`/`__unserialize` internally. Test that queued DTOs unserialize correctly.

---

## Consequences Of Violation

Security: `unserialize()` bypasses constructor validation and readonly assignment. Reliability: unserialized DTOs may have uninitialized properties or invalid state.

---

## Rule 5: Never Add `__set` or `__get` Magic Methods to Readonly DTOs

---

## Category

Design

---

## Rule

Do not define `__set()`, `__get()`, `__wakeup()`, or property overloading magic methods on readonly DTOs. PHP 8.2 readonly classes already prohibit `__set()` and `__get()`.

---

## Reason

Magic methods subvert the readonly contract. `__set()` allows property mutation through a backdoor, defeating the immutability guarantee. `__get()` creates the illusion of properties that don't exist. PHP 8.2 readonly classes enforce this prohibition at the language level, but PHP 8.1 code with individual `readonly` properties may attempt to add these methods.

---

## Bad Example

```php
class UserDto
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
    ) {}

    public function __set(string $name, mixed $value): void
    {
        $this->$name = $value; // Backdoor mutation — defeats readonly
    }
}
// __set allows $dto->name = 'hacked' to work at runtime, bypassing readonly.
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
    // No magic methods. Readonly is enforced by the language.
}
// Clean, predictable, immutable.
```

---

## Exceptions

No common exceptions. Readonly DTOs must never have `__set` or `__get` methods. If dynamic property access is needed, use an array or a Data object instead.

---

## Consequences Of Violation

Reliability: magic methods create unexpected behavior and subvert readonly guarantees. Maintenance: debugging issues caused by magic methods is significantly harder than explicit property access.

---

## Rule 6: Run Static Analysis at PHPStan Level 6+ to Catch Uninitialized Readonly Properties

---

## Category

Testing

---

## Rule

Configure static analysis (PHPStan level 6 or equivalent) in CI to detect uninitialized readonly properties in factory methods. Treat uninitialized property errors as CI failures.

---

## Reason

A readonly property that is not assigned during construction leaves the property in an "uninitialized" state. Accessing an uninitialized readonly property produces a runtime `\Error`. PHPStan level 6+ detects these at analysis time — before the code is deployed. CI enforcement prevents these errors from reaching production.

---

## Bad Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public string $bio,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            // $data['bio'] is accessed but may not be set — $bio remains uninitialized
        );
    }
}
// PHPStan detects: "Readonly property UserDto::$bio is uninitialized."
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            bio: $data['bio'] ?? null, // Explicit default — never uninitialized
        );
    }
}
// PHPStan passes. Every property is always assigned.
```

---

## Exceptions

When using spatie/laravel-data, the package handles property assignment internally. Ensure the package version supports readonly classes and use PHPStan's spatie/laravel-data extension for accurate analysis.

---

## Consequences Of Violation

Reliability: accessing an uninitialized readonly property causes a runtime `\Error` that crashes the request. Production impact: a single uninitialized property error can take down an entire endpoint until the deployment is rolled back.
