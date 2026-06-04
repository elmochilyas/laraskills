# Standardized Knowledge: Zval Type/Value Representation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Zval Type/Value Representation — Scalar vs Compound Type Differences |
| Difficulty | Intermediate |
| Lifecycle | Understand, Debug |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP 8.x zvals represent scalar types (null, bool, int, float) **inline** within the 16-byte zval structure — no additional memory allocation needed. Compound types (string, array, object, resource) store a pointer to an external heap-allocated structure. Understanding this distinction explains why scalar operations are faster and why compound types have CoW semantics.

## Core Concepts

- **Inline scalars (no refcount)**: `IS_UNDEF`, `IS_NULL`, `IS_TRUE`, `IS_FALSE`, `IS_LONG`, `IS_DOUBLE` — values stored directly in the zval union. No heap allocation. No refcount needed. Assignment copies the value.
- **Pointer-based types (refcounted)**: `IS_STRING`, `IS_ARRAY`, `IS_OBJECT`, `IS_RESOURCE`, `IS_REFERENCE` — zval stores a pointer to a heap-allocated `zend_string`, `zend_array`, or `zend_object`. These have refcount semantics.
- **zend_string structure**: 32 bytes header (refcount, hash, length) + variable-length character data. Hash pre-computed for faster string lookups.
- **zend_array (HashTable)**: Buckets array with `uint32_t nTableSize`, `nNumOfElements`, `nNextFreeElement`, `pListHead` pointer, and `arBuckets` pointer to packed or hash-ordered bucket slots.

## When To Use

- Understanding why scalar operations are cheaper than compound operations
- Debugging memory allocation patterns in hot code paths
- Optimizing data structure choices for performance-critical code
- Learning Zend engine internals for advanced PHP development

## When NOT To Use

- For day-to-day application development (implementation detail)
- When troubleshooting application-level performance (profile first)
- As a prerequisite for basic PHP configuration

## Best Practices

- **Prefer scalar types where possible**: Scalar operations are CPU-register-speed (~5-15ns). Compound operations require heap allocation and refcounting.
- **Use SplFixedArray for large fixed-size arrays**: Avoids HashTable overhead for integer-indexed sequential data. ~30% less memory, faster iteration.
- **Leverage typed properties**: `public int $x` tells the engine the value is a scalar, enabling inline storage and eliminating refcount overhead.
- **Be aware of string representation**: Short strings may be interned (shared). Long strings always allocate new memory. Concatenation creates a new string.

## Architecture Guidelines

- **Type encoding in zval**: The `type_info` field encodes type (low byte), type_flags (next byte), const_flags, and reserved bytes. This packing allows fast type checking via bitmask operations.
- **zend_string precomputed hash**: The `h` field stores the hash value after first computation. Subsequent hash lookups (array keys, switch statements) skip re-hashing — a significant optimization for string-heavy code.
- **zend_array packed vs hash mode**: Sequential integer keys use packed mode (C array of zvals). Non-sequential/mixed keys use hash mode (buckets with hash collision chains). Packed is ~2x faster for iteration.

## Performance Considerations

- Scalar operations: 5-15ns per assignment/copy (CPU register speed)
- String copy (refcount): refcount increment only — ~5ns. String modification (separation): allocate new string + copy characters — proportional to string length.
- Array copy: refcount increment only until modification. Full copy is O(n) where n is number of elements.
- zend_string header overhead: 32 bytes per string regardless of content length. Short strings have proportionally higher overhead.

## Security Considerations

- Type confusion bugs (exploiting incorrect type_info flags) have been patched in PHP — always keep PHP updated
- zend_string precomputed hash is read-only after first computation — safe from tampering

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Modifying array in foreach by value | Not understanding CoW | Full array copy on each iteration | Use reference or iterate by key |
| Assuming all types have refcount overhead | Unawareness of inline scalars | Unnecessary optimization effort | Scalar ops are nearly free |
| Using array for fixed-size integer-indexed data | Convenience | 2x memory overhead vs SplFixedArray | Use SplFixedArray for large datasets |
| String concatenation in loops | Habit | O(n²) memory allocation | Use implode() or sprintf() |

## Anti-Patterns

- **Deep copying large arrays unnecessarily**: `$copy = unserialize(serialize($big))` — creates full O(n) copy. Use `array_slice` or array spread `[...$big]` for shallow copy.
- **Modifying strings in hot loops**: Each modification creates a new zend_string. Build strings with arrays and implode() instead of repeated concatenation.
- **Type-juggling in hot paths**: `$a + $b` where $a is string and $b is int triggers type conversion overhead. Keep types consistent.

## Examples

```php
<?php
// Scalar: inline, no refcount
$a = 42;           // IS_LONG — stored in zval directly
$b = $a;           // value copy, no refcount operation
$c = 3.14;         // IS_DOUBLE — inline in zval

// Compound: pointer to heap-allocated structure
$str = 'hello';    // zval stores pointer to zend_string
$arr = [1, 2, 3];  // zval stores pointer to zend_array
$obj = new stdClass; // zval stores pointer to zend_object

// zend_array: packed vs hash
$packed = [1, 2, 3];            // Packed mode — sequential int keys
$hash = ['a' => 1, 'b' => 2];   // Hash mode — non-sequential keys

// SplFixedArray for large sequential data
$fixed = SplFixedArray::fromArray([1, 2, 3, 4, 5]);
```

## Related Topics

- Zval Structure and Reference Counting
- Copy-on-Write Mechanics
- Persistent vs Per-Request Allocators
- Zend Memory Manager Chunked Allocator

## AI Agent Notes

- Scalar types (null, bool, int, float): stored inline in zval, no refcount, no heap allocation.
- Compound types (string, array, object): pointer to heap-allocated structure with refcount.
- zend_string: 32-byte header (refcount, hash, length) + data. Hash pre-computed.
- zend_array: packed mode (sequential int keys, ~2x faster) vs hash mode (non-sequential).
- Typed properties enable inline scalar storage — eliminates refcount overhead.
- SplFixedArray avoids HashTable overhead — ~30% less memory for sequential data.

## Verification

- [ ] Inline scalar vs pointer-based compound type distinction understood
- [ ] zend_string structure and precomputed hash feature understood
- [ ] Packed vs hash mode array differences understood
- [ ] SplFixedArray evaluated for large sequential datasets
- [ ] Typed properties used to enable inline scalar storage
- [ ] String concatenation patterns optimized (avoid O(n²) in loops)
