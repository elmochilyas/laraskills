# Copy-on-Write Mechanics - Sharing Until Mutation, Separation Trigger Points

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Copy-on-Write Mechanics - Sharing Until Mutation, Separation Trigger Points |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP uses copy-on-write (CoW) to share memory between variables until one is modified. When $b = $a, both point to the same zval (refcount=2). When $b is modified, the zval is separated (duplicated) and refcount decremented. This avoids copying large arrays and strings unless necessary - saving significant memory and CPU for read-heavy code paths.

## Core Concepts

- Sharing: $b = $a creates a new zval pointing to the same zend_string or zend_array as $a. Refcount incremented. No data copied.
- Separation: Modification triggers copy. New zend_string allocated for modified variable. Refcount decremented on original.
- Separation trigger points: Any write operation - assignment ($b[0] = 'x'), string concatenation, array push, object property set.
- by-reference bypass: $b = &$a creates zend_reference wrapper. CoW never triggers.

## When To Use

- Understanding PHP's memory sharing for performance optimization.
- Designing APIs that avoid unnecessary copies.

## When NOT To Use

- When you need true aliasing (use references instead).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Pass large arrays by value to read-only functions | CoW ensures zero copy overhead. No need for & for performance. |
| Avoid references thinking they save memory | CoW already handles read sharing. References add overhead and complexity. |

## Architecture Guidelines

- Large array copy: CoW avoids copy until modification. Reading 10MB array as argument costs ~0ns.
- Modification triggers full copy: $arr[] = 'new' on shared 10MB array copies entire array (~1ms).
- PHP 8.1 array unpacking: [...$arr1, ...$arr2] uses CoW sharing where possible.

## Performance Considerations

- CoW avoids copying until write. Read sharing is free.
- Modification of shared arrays is expensive (full copy).
- PHP 8.1+ improves CoW efficiency for array operations.

## Security Considerations

- No direct security implications.
- CoW is a memory management optimization, transparent to application code.

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|----------------|
| Using &$var to "avoid copying" | Eliminates CoW benefits entirely. | Overhead from zend_reference wrapper, no benefit. | Pass by value. |

## Anti-Patterns

- Adding & to function parameters for performance: CoW already provides zero-copy read sharing.
- Assuming assignment copies data: It doesn't until modification.

## Examples

```php
$a = range(1, 1000000);
$b = $a;  // No copy! refcount=2
echo memory_get_usage();  // Low - same array shared
$b[] = 1;  // Now copy triggered. Memory doubles
```

## Related Topics

- By-Reference Implications
- Zval Structure and Reference Counting
- Zval Type/Value Representation

## AI Agent Notes

- CoW is transparent but understanding it prevents incorrect optimization.
- Most common misconception: thinking & saves memory for function arguments.
- In hot loops, avoid modifying values that were assigned from shared sources.
- PHP 8.1's array unpacking improvements make [...$arr] much more efficient.

## Verification

- [ ] Verify no unnecessary & in function signatures for performance reasons.
- [ ] Check hot loops for unnecessary array modifications.
- [ ] Profile memory usage patterns with CoW-heavy operations.