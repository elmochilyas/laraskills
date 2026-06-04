## Use PHP 8.0+ typed properties — never rely on PHPDoc for JIT optimization
---
Category: Performance
---
Always declare property types using PHP 8.0+ syntax (public int $count). PHPDoc annotations are invisible to the JIT compiler.
---
Reason: JIT guard elimination requires runtime-declared types. Typed properties allow the JIT to eliminate type guards, reducing opcode count by 15-25% for property-heavy code. PHPDoc-only types force JIT to insert guards.
---
Bad Example:
```php
class Product {
    /** @var int */
    public $count; // PHPDoc only — JIT inserts is_long() guard
}
```

Good Example:
```php
class Product {
    public int $count; // Typed property — JIT eliminates guard
}
```
---
Exceptions: Code that doesn't appear in CPU-bound hot paths where JIT benefit is already minimal.
---
Consequences Of Violation: 15-25% more opcodes for property access, 40-60% of JIT's potential speedup unrealized.

## Add return types to all methods for maximum JIT compilation quality
---
Category: Performance
---
Always declare return types on all methods. Return types enable JIT to eliminate guards at call sites.
---
Reason: Without return types, JIT must handle mixed return values and insert guards at every call site. Return types enable type inference propagation through the call graph, multiplying guard elimination benefits.
---
Bad Example:
```php
function getPrice() { // No return type — JIT must guard
    return $this->price;
}
```

Good Example:
```php
function getPrice(): float { // Return type — JIT eliminates guard
    return $this->price;
}
```
---
Exceptions: Methods returning truly mixed types where union types cannot express the variance.
---
Consequences Of Violation: JIT must insert guards at every call site, limiting optimization to the containing function only.

## Minimize mixed type hints — prefer Union types
---
Category: Maintainability
---
Avoid mixed type hints wherever possible. Use Union types (string|int) instead of mixed.
---
Reason: mixed forces JIT to insert full guards because the type could be anything. Union types narrow the type space, allowing the JIT to generate targeted guards or eliminate them entirely.
---
Bad Example:
```php
function process(mixed $data): mixed { // Full guards required
    return $data;
}
```

Good Example:
```php
function process(string|int $data): string|int { // Targeted guards
    return $data;
}
```
---
Exceptions: Generic utility functions that genuinely accept and return any type.
---
Consequences Of Violation: Full guards required, JIT optimization limited, 1-5µs penalty per guard failure.

## Enable strict_types=1 for improved JIT type inference
---
Category: Configuration
---
Add declare(strict_types=1) to all PHP files to improve JIT type inference quality.
---
Reason: Strict types mode prevents implicit type coercion that confuses the JIT analyzer. With strict types, the JIT can rely on declared types without worrying about coercion edge cases, producing tighter native code.
---
Bad Example:
```php
// Weak types — implicit coercion confuses JIT
function add(int $a, int $b): int {
    return $a + $b; // JIT must handle string-to-int coercion
}
```

Good Example:
```php
declare(strict_types=1);
// Strict types — no coercion, JIT trusts declared types
function add(int $a, int $b): int {
    return $a + $b; // JIT generates pure integer addition
}
```
---
Exceptions: Legacy codebases where adding strict_types breaks existing behavior.
---
Consequences Of Violation: JIT must handle coercion cases, reducing optimization density.
