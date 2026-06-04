---
## Rule Name

Declare All Properties with Explicit Types

## Category

Performance

## Rule

Always declare explicit types on every class property. Never use untyped properties in new code.

## Reason

Every untyped property is a missed optimization opportunity. The Zend Engine generates specialized opcodes for typed properties, skipping zval type conversion and reference counting overhead, yielding 5-15% execution time reduction in property-heavy code.

## Bad Example

```php
class UserDTO {
    public $id;      // Untyped — general ASSIGN_OBJ opcodes
    public $name;    // Untyped — no type specialization
}
```

## Good Example

```php
class UserDTO {
    public int $id;       // Typed — specialized opcodes
    public string $name;  // Typed — engine skips type checks
}
```

## Exceptions

Legacy codebases undergoing incremental migration where adding types would break existing contracts.

## Consequences Of Violation

Missed 5-15% execution time reduction, reduced JIT guard elimination, larger opcode cache footprint.

---

## Rule Name

Use readonly for Immutable Properties

## Category

Performance

## Rule

Always mark properties as `readonly` (PHP 8.1+) when they are set during construction and never modified afterward.

## Reason

Readonly properties allow the engine to skip write barrier checks after the first write (during construction), eliminating runtime overhead on all subsequent read-only accesses. This provides an additional 3-8% gain over typed-only properties.

## Bad Example

```php
class Config {
    public string $apiKey;  // Set once, read many times — no readonly
}
```

## Good Example

```php
class Config {
    public readonly string $apiKey;  // Write barrier eliminated after construction
}
```

## Exceptions

Properties that must be modified after construction (mutable state).

## Consequences Of Violation

Missed 3-8% additional performance gain, unnecessary write barriers on read-heavy properties.

---

## Rule Name

Prefer Primitive Types Over Mixed or Union Types

## Category

Performance

## Rule

Use the most specific primitive type possible (`int`, `string`, `float`, `bool`) rather than `mixed` or wide union types for property declarations.

## Reason

Primitive types enable the most aggressive opcode specialization and JIT guard elimination. `mixed` prevents all type-specific optimization. Union types still require runtime type checks and reduce optimization opportunities.

## Bad Example

```php
public mixed $value;            // No specialization possible
public string|int $identifier;  // Still requires runtime type checks
```

## Good Example

```php
public int $id;         // Maximum specialization
public string $email;   // String-specific opcodes
public bool $active;    // Boolean-specific opcodes
```

## Exceptions

Properties that genuinely hold multiple types at runtime (rare in well-designed domains).

## Consequences Of Violation

Reduced opcode specialization, increased JIT guard checks, slower property access in hot paths.

---

## Rule Name

Match Getter Return Types to Property Types

## Category

Maintainability

## Rule

Always declare getter return types that match their underlying property types. Never return `mixed` from a getter wrapping a typed property.

## Reason

Declaring a typed property but returning `mixed` from its getter negates the engine-level optimization. The caller must handle an untyped return, losing all type specialization benefit.

## Bad Example

```php
public int $id;
public function getId(): mixed {  // Mixed return — negates type benefit
    return $this->id;
}
```

## Good Example

```php
public int $id;
public function getId(): int {  // Matched return type — preserves optimization
    return $this->id;
}
```

## Exceptions

Legacy interfaces that require `mixed` return signatures (cannot break backward compatibility).

## Consequences Of Violation

Propagation of untyped values throughout the call chain, cascading optimization loss, type safety degradation.

---

## Rule Name

Use declare(strict_types=1) with Typed Properties

## Category

Security

## Rule

Always enable `declare(strict_types=1)` in every PHP file that uses typed properties.

## Reason

Strict types prevent implicit type coercion that could bypass type declarations. Without strict types, `$this->id = 'not-an-int'` coerces silently, and the TypeError is only thrown at the point of use rather than at assignment.

## Bad Example

```php
<?php
// No strict_types — implicit coercion bypasses type safety
class UserDTO {
    public int $id;
}
$dto = new UserDTO();
$dto->id = '42';       // Coerces silently
```

## Good Example

```php
<?php
declare(strict_types=1);
// Strict — TypeError thrown at assignment
class UserDTO {
    public int $id;
}
$dto = new UserDTO();
$dto->id = '42';       // TypeError at assignment
```

## Exceptions

Files that must interoperate with legacy code expecting weak type coercion.

## Consequences Of Violation

Silent type coercion, hidden data corruption, TypeError thrown at unexpected locations, reduced type safety.

---

## Rule Name

Do Not Use Dynamic Properties on Typed Classes

## Category

Maintainability

## Rule

Never use dynamic property assignment on classes with typed properties. Declare all properties explicitly.

## Reason

Dynamic properties on typed classes are deprecated in PHP 8.2 and removed in PHP 9.0. They bypass all engine-level optimizations by falling back to hash table lookups instead of packed zval slot access.

## Bad Example

```php
class UserDTO {
    public int $id;
}
$dto = new UserDTO();
$dto->extraField = 'value';  // Dynamic — deprecated in 8.2
```

## Good Example

```php
class UserDTO {
    public int $id;
    public string $extraField;  // Declared explicitly
}
$dto = new UserDTO();
$dto->extraField = 'value';
```

## Exceptions

No common exceptions. Migrate all dynamic property usage to explicit declarations.

## Consequences Of Violation

PHP 8.2 deprecation warnings, PHP 9.0 runtime errors, no engine optimization for property access.
