# Standardized Knowledge: Zval Structure and Reference Counting

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Zval Structure and Reference Counting — refcount Increment/Decrement Lifecycle |
| Difficulty | Intermediate |
| Lifecycle | Understand, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Every PHP variable is stored as a **zval** (Zend Value) — a 16-byte structure containing type, value, reference count, and flags. Reference counting tracks how many variables point to the same zval. When refcount reaches zero, the memory is freed immediately. This is PHP's primary memory management mechanism — the garbage collector only handles the special case of circular references.

## Core Concepts

- **zval struct (16 bytes)**: `zend_value` (8 bytes union) + `union { uint32_t type_info; struct { zend_uchar type; zend_uchar type_flags; zend_uchar const_flags; zend_uchar reserved; } }` (4 bytes) + `uint32_t extra` (4 bytes).
- **refcount store**: For reference-counted types (strings, arrays, objects), a `zend_refcounted_h` header is prepended, containing refcount (uint32_t), type info, and GC flags.
- **refcount lifecycle**: Assignment → refcount++ (for copy), unset/scope exit → refcount--. When refcount=0 → immediate free.
- **Immutable values**: Interned strings have a special flag. They are never freed during a request. Common strings (class names, function names) are interned by default.

## When To Use

- Understanding PHP memory allocation fundamentals
- Debugging unexpected memory usage or reference counting issues
- Optimizing hot code paths with excessive variable copying
- Learning zval internals for advanced PHP development

## When NOT To Use

- For day-to-day PHP development (Zend internals knowledge not required)
- When troubleshooting application-level performance (profile with Xdebug/Blackfire first)
- As a prerequisite for basic OpCache or PHP-FPM configuration

## Best Practices

- **Minimize variable copying in hot loops**: Each assignment of a compound type increments refcount. Unnecessary copies waste CPU cycles.
- **Use references for large arrays**: `foreach ($array as &$value)` avoids copying each element. Be aware of the side effects on the original array.
- **Prefer typed properties**: `public int $x` uses fewer opcodes than untyped properties, reducing execution time in property-heavy code.
- **Be aware of refcount overhead**: In tight loops, refcount operations (~5-15ns each) can become a measurable bottleneck.

## Architecture Guidelines

- **zend_refcounted_h TRY semantics (PHP 8.1+)**: Avoids atomic operations on known-immutable values, reducing refcount manipulation overhead by ~5-10% in hot code paths.
- **Copy-on-Write**: Compound types share memory until one reference modifies the value. At modification point, the value is separated (duplicated). This optimizes for read-heavy workloads.
- **Immutable value optimization**: Interned strings and some scalar arrays use special flags that bypass refcounting entirely.

## Performance Considerations

- refcount operations are cache-line atomic: ~5-15ns per increment/decrement
- Excessive refcount manipulation (deep array copies, repeated assignments) can be a bottleneck in hot loops
- PHP 8.1's `zend_refcounted_h` uses TRY semantics for immutable values — avoids atomic operations on known-immutable values
- zval assignment is not free: even simple `$b = $a` triggers refcount manipulation for compound types

## Security Considerations

- Refcount overflow (wrapping on >4 billion references) causes memory corruption — rare but possible in extreme sharing scenarios
- Immutable value flags can be manipulated by extensions — ensure extensions respect PHP's memory model

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming unset() immediately frees memory | Ignoring circular references | Objects remain until GC runs | Use WeakReference for cache patterns |
| Not calling gc_collect_cycles() in long-running processes | FPM habit | Octane/Swoole workers accumulate cycles | Call strategically at boundaries |
| Using static properties for request-scoped data | Convenience | State leaks between requests | Use scoped() bindings in Octane |
| Ignoring copy-on-write in loops | Unawareness | Massive memory duplication | Use references or SplFixedArray |
| Not monitoring worker RSS | No observability | Gradual RSS growth undetected | Alert on >10% over 1000 requests |

## Anti-Patterns

- **Excessive variable copying**: `$a = $b; $c = $a; $d = $c;` — each assignment is cheap (refcount++) but unnecessary chains waste CPU.
- **Modifying arrays in foreach by value**: `foreach ($array as $value) { $value = modify($value); }` — modifies a copy, not the original. Use reference or assign back.
- **Deep array duplication**: `$copy = unserialize(serialize($array))` — creates full deep copy with O(n) refcount operations. Use array_slice or SplFixedArray for partial copies.

## Examples

```php
<?php
// Refcount behavior
$a = [1, 2, 3];        // refcount=1 (new array)
$b = $a;               // refcount=2 (shared)
$c = $b;               // refcount=3 (shared)
$b[] = 4;              // separation: $b gets a copy, $a refcount-- to 2
unset($c);             // refcount-- to 1
unset($a);             // refcount-- to 0, array freed

// Typed properties reduce opcodes
class Optimized {
    public int $id;           // Typed: fewer opcodes, faster access
    public string $name;      // Typed: type check at compile time
}

// PHP 8.1+ TRY semantics on immutable values
$str = 'hello';              // interned string — GC_IMMUTABLE
$copy = $str;                // no refcount manipulation needed
```

## Related Topics

- Copy-on-Write Mechanics
- Zval Type/Value Representation
- Cyclic GC Algorithm
- Reference Counting Internals

## AI Agent Notes

- zval is 16 bytes. Compound types have an additional zend_refcounted_h header.
- Reference counting handles 99%+ of memory reclamation. GC only handles circular references.
- Refcount operations are ~5-15ns — measurable in hot loops.
- PHP 8.1+ TRY semantics avoid atomic ops on immutable values (~5-10% improvement).
- zend_refcounted_h header: refcount (uint32_t), type info, GC flags.
- Immutable values (interned strings) use GC_IMMUTABLE — never freed during request.
- Copy-on-Write: sharing until modification, then separation.

## Verification

- [ ] zval structure understood (16 bytes, type_info, value union)
- [ ] refcount lifecycle understood (assignment++, unset--, free at 0)
- [ ] Difference between scalar (inline) and compound (pointer-based) types understood
- [ ] Immutable values and interned string behavior understood
- [ ] Copy-on-Write separation triggers understood
- [ ] PHP 8.1+ TRY semantics evaluated for hot code paths
