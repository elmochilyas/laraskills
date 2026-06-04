# Readonly Data Objects

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Readonly Data Objects
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

PHP 8.1's `readonly` properties and PHP 8.2's `readonly` classes provide language-level immutability enforcement for DTOs. A `readonly` property can be set once — in the constructor — and never modified thereafter. A `readonly` class makes every property readonly implicitly. This eliminates entire categories of bugs (accidental mutation, unintended side effects) and communicates intent at the type system level rather than through convention.

The engineering tradeoff is that readonly objects cannot use lazy initialization, cannot be modified after construction, and require all constructor parameters to be promoted or explicitly typed. For DTOs, these constraints are exactly correct — they enforce immutability by default and surface mutation attempts at compile time rather than runtime.

---

## Core Concepts

### Readonly Property Semantics

A `readonly` property in PHP 8.1+ can be assigned exactly once, in the constructor. After construction, any attempt to write to it produces a `\Error`:

```php
class UserDto
{
    public readonly string $name;

    public function __construct(string $name)
    {
        $this->name = $name; // First assignment — OK
    }
}

$dto = new UserDto(name: 'John');
$dto->name = 'Jane'; // Error: Cannot modify readonly property
```

### Readonly Class (PHP 8.2+)

PHP 8.2 introduced `readonly` classes, which declare every property as readonly:

```php
readonly class UserDto
{
    public string $name;      // Implicitly readonly
    public string $email;     // Implicitly readonly
    public ?string $bio;      // Implicitly readonly

    public function __construct(string $name, string $email, ?string $bio = null)
    {
        $this->name = $name;
        $this->email = $email;
        $this->bio = $bio;
    }
}
```

`readonly` classes cannot have untyped properties, cannot use `static` properties, and cannot use `__set` or `__get` overloading.

### Constructor Promotion with Readonly

The most compact DTO form combines promoted constructor parameters with `readonly`:

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public ?string $bio = null,
    ) {}
}
```

This declares four properties (three explicit, one optional) and a constructor — in one line of signature.

---

## Mental Models

### The Sealed Letter

A readonly DTO is like a sealed envelope. The data is placed inside at construction time, and anyone can read it, but no one can change its contents. The seal is the readonly modifier — a language-level promise that the data is final.

### The Once-Set, Many-Read Signal

Readonly says "this value matters." It communicates to every developer reading the code that the property is set during initialization and never modified. This is stronger documentation than a docblock comment — it's enforced by the runtime.

---

## Internal Mechanics

### Readonly Property Implementation

PHP implements readonly properties by tracking whether each property has been assigned. The assignment flag is reset per-object during `__construct`. Once the constructor returns, the flag is locked:

1. During constructor execution: PHP allows assignment if the property's uninitialized flag is set.
2. After constructor: PHP raises `\Error` on any write attempt.
3. `unset($dto->prop)` on a readonly property produces `\Error`.

### Clone Semantics

Cloning a readonly object creates a shallow copy, but the clone's properties remain readonly. You cannot modify the clone's properties after cloning:

```php
$clone = clone $dto;
$clone->name = 'New'; // Error — clone is still readonly
```

To create a modified copy, use the "with" pattern (see Patterns).

### Inheritance Constraints

- `readonly` classes cannot be extended by non-readonly classes.
- Non-readonly classes can declare individual readonly properties.
- Interface and abstract method readonly conflicts: if an interface declares a readonly property in a constructor, implementations must match.

### Uninitialized Readonly Properties

A readonly property that is never assigned during construction remains in an uninitialized state. Accessing it produces `\Error`. This is different from `null` — an uninitialized property has no value at all:

```php
readonly class UserDto
{
    public string $name; // Could be left uninitialized
}

$dto = new UserDto(); // No name assigned
echo $dto->name; // Error: Typed property uninitialized
```

---

## Patterns

### The "with" Pattern

To create a modified copy of a readonly DTO, implement a `with` method that returns a new instance with one property changed:

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
```

For DTOs with many properties, use a spread constructor or a `with` method accepting an array of changes:

```php
public function with(array $overrides): self
{
    return new self(...[...$this->toArray(), ...$overrides]);
}
```

### Fluent Constructor with Named Arguments

PHP 8.0+ named arguments make DTO construction readable without builder methods:

```php
$dto = new UserDto(
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Developer',
);
```

Named arguments prevent positional confusion and allow skipping optional parameters. They are the primary construction pattern for readonly DTOs.

### Factory Method with Readonly

Named constructors remain useful even with constructor promotion:

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
        );
    }
}
```

---

## Architectural Decisions

### Readonly Class vs Individual Readonly Properties

| Approach | Pros | Cons |
|---|---|---|
| `readonly class` | Enforces consistency — no readonly oversight | Prevents any non-readonly property anywhere in the class |
| Individual `readonly` | Mixing allowed (some properties mutable, some not) | Requires discipline per property |

For DTOs, `readonly class` is almost always correct — there is no legitimate reason for a DTO to have mutable properties.

### Readonly DTOs vs Immutable Objects via Convention

Before readonly, teams relied on:
- Documenting "do not modify" in docblocks
- Private setters with getters only
- `@immutable` annotations (PhpStorm)

Readonly enforcement at the language level is strictly superior — no convention can prevent `$dto->property = value` at runtime.

### Lazy Initialization Tradeoff

Readonly properties cannot use lazy initialization (computed on first access). If lazy loading is needed, use a private getter with memoization backed by a non-readonly property:

```php
readonly class ExpensiveDto
{
    private ?int $cachedTotal = null;

    public function computeTotal(): int
    {
        return $this->cachedTotal ??= $this->calculate();
    }

    private function calculate(): int
    {
        // Expensive calculation
    }
}
```

This is an advanced escape hatch — most DTOs should not require lazy computation.

---

## Tradeoffs

| Concern | Readonly DTO | Mutable Parameter Bag |
|---|---|---|
| Mutation safety | Compile-time enforcement | Convention only |
| Construction flexibility | Must set all at once | Can build incrementally |
| Modifiability | Requires "with" pattern | Direct property assignment |
| Serialization | Direct (properties mapped) | Direct |
| Lazy initialization | Workaround needed | Built-in |
| Clone behavior | Same object, same values | Can modify clone |
| Inheritance complexity | Readonly prevents some patterns | Full flexibility |

---

## Performance Considerations

Readonly properties add no runtime overhead in PHP 8.1+. The readonly check is a single opcode in the Zend engine — faster than a setter method call, effectively identical to direct property access.

### Bytecode Comparison

```
// Public property set: ASSIGN_OBJ (1 opcode)
$this->name = $value;

// Readonly property set in constructor: ASSIGN_OBJ (same 1 opcode)
// Readonly property set after constructor: RAISE_ERROR + no assignment

// Getter method call: INIT_METHOD_CALL + DO_FCALL (2 opcodes + call overhead)
// Direct readonly access: FETCH_OBJ (1 opcode)
```

Readonly is not just safer — it's faster than abstraction layers that hide mutability behind methods.

---

## Production Considerations

### Always Use Constructor Promotion

Constructor promotion eliminates the possibility of forgetting to declare a property as readonly. Every constructor parameter with `public readonly` is automatically a declared readonly property:

```php
// Correct — zero duplication
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}

// Unnecessary duplication — never use this pattern
readonly class UserDto
{
    public string $name;
    public string $email;

    public function __construct(string $name, string $email)
    {
        $this->name = $name;
        $this->email = $email;
    }
}
```

### Avoid Dynamic Construction

Do not use reflection or `array_combine` with constructor parameter names to construct readonly DTOs. This bypasses PHP's type checking and can produce uninitialized properties:

```php
// Bad
$dto = new UserDto(...$data); // $data keys must match parameter names exactly

// Good
$dto = UserDto::fromArray($data); // Named constructor with explicit mapping
```

### Serialization Consideration

Readonly DTOs serialize and deserialize normally via `serialize()`/`unserialize()`. For JSON, implement `JsonSerializable` or use a `toArray()` method. `unserialize` on a readonly object creates a new instance — the readonly constraint is satisfied because the constructor is bypassed by the deserialization engine.

---

## Common Mistakes

### Trying to Modify After Construction

The most common readonly mistake — treating the DTO as mutable after creation. Developers accustomed to mutable objects will naturally write:

```php
$dto = UserDto::fromRequest($request);
$dto->name = strtoupper($dto->name); // Error at runtime
```

Always use factories or the "with" pattern for transformations.

### Non-Readonly by Default

Teams adopt DTOs but forget the `readonly` keyword. Months later, a bug is traced to an unexpected mutation. Apply `readonly` at the class level from the first commit — you cannot add it later without checking every usage.

### Uninitialized Properties in Factories

A factory method that fails to assign all promoted readonly properties produces an uninitialized property. Ensure static analysis (PHPStan level 6+, Psalm) catches these:

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            // email is missing — UserDto->email is uninitialized
        );
    }
}
```

---

## Failure Modes

### Constructor Reflection Incompatibility

Some IoC containers and DTO factories rely on creating objects without calling the constructor (via `ReflectionClass::newInstanceWithoutConstructor`). Readonly properties remain uninitialized in this case, causing errors on access. Any DTO construction bypassing the constructor is incompatible with readonly.

### Lazy Loading Service Containers

If the Laravel service container resolves a DTO (unlikely but possible when using automatic resolution), the container does not call the DTO constructor with parameters. DTOs should never be bound in the container — they are value objects, not services.

### Serialization Bypass

`unserialize()` creates objects without calling `__construct`, bypassing the readonly assignment. Properties are set directly during unserialization. This is valid but means a deserialized DTO may have different properties than one constructed normally. Use `__serialize()`/`__unserialize()` to control the process.

---

## Ecosystem Usage

### Laravel 11+ Context

Laravel 11 uses `readonly` classes in its own codebase (e.g., `Context` data carriers). The framework itself models the convention.

### PHP 8.2 Readonly Class Adoption

As of 2026, most Laravel packages targeting PHP 8.2+ use `readonly class` for their DTO-like objects. Packages still supporting PHP 8.1 use individual `readonly` properties.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — baseline DTO definition and purpose
- **DTO Construction Patterns** (this workspace) — factory methods, hydration, named constructors
- **spatie/laravel-data** (this workspace) — package that manages readonly DTO creation automatically

---

## Research Notes

- PHP 8.2 readonly classes RFC: https://wiki.php.net/rfc/readonly_classes
- Readonly property restrictions inherit from constructor parameter typing — all readonly constructor-promoted properties must be typed
- The `with` pattern is used in Laravel's own `Context` implementation (`src/Illuminate/Log/Context/Repository.php`) for immutable context modification
