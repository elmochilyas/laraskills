# Reference Counting — zval refcount Lifecycle, GC_ADDREF/GC_DELREF, TRY Semantics

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Reference Counting — zval refcount Lifecycle, GC_ADDREF/GC_DELREF, TRY Semantics |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Reference counting is PHP's primary memory management mechanism. Every reference-counted zval (string, array, object, resource) has a `refcount` (uint32_t) in its `zend_refcounted_h` header. When a variable is assigned or passed, the refcount increments. When a variable goes out of scope or is unset, the refcount decrements. When refcount reaches zero, the memory is freed immediately. This provides deterministic, low-overhead memory reclamation for the vast majority of PHP values — the garbage collector only handles the special case of circular references.

## Core Concepts

- **zend_refcounted_h header**: Common header for all reference-counted types. Contains `refcount` (uint32_t), type info, and GC flags.
- **refcount lifecycle**: Assignment/copy → refcount++. Unset/scope exit → refcount--. refcount=0 → immediate free.
- **GC_ADDREF / GC_DELREF**: Internal macros for refcount manipulation. GC_ADDREF increments, GC_DELREF decrements. Returns the new refcount value.
- **TRY semantics (PHP 8.1+)**: For known-immutable values (interned strings, enum singletons), the TRY version avoids atomic operations. Reduces refcount overhead by ~5–10% in hot paths.
- **Immutable values**: Interned strings have a special flag. They are never freed during a request. GC_ADDREF/GC_DELREF are skipped for these.
- **Reference counting is not garbage collection**: RC handles non-cyclic structures immediately and deterministically. GC only handles cycles that RC cannot resolve.
- **is_ref flag**: Marks zvals that are referenced by a `&` reference. When is_ref is set, CoW separation behaves differently — the value must be duplicated on write.

## When To Use

- You are optimizing hot code paths where many variable assignments occur.
- You need to understand why memory is not freed when expected (circular references).
- You are debugging memory-related issues in long-running processes.
- You want to understand the performance cost of different PHP coding patterns.
- You are writing PHP extensions that directly manipulate zvals.

## When NOT To Use

- You are building a typical web application. PHP's reference counting is transparent — you don't need to think about it.
- You are using PHP-FPM with short-lived requests. The per-request heap reset handles any RC inefficiencies.
- You are a beginner PHP developer. Focus on application logic first.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Avoid unnecessary variable copying in hot loops | Each copy increments and decrements refcount. Hot loops (~1M+ iterations) see measurable CPU cost from RC manipulation. |
| Use references (`&`) carefully | References set `is_ref`, preventing CoW sharing of the target zval. Subsequent copies trigger full duplication. |
| Unset large variables when done | `unset()` decrements the refcount immediately. Large arrays or objects can be freed before the end of the scope. |
| Understand that `foreach` creates a copy | `foreach ($array as $value)` increments the array's refcount. The array is not duplicated, but the refcount manipulation adds overhead. |
| Prefer immutable patterns | Immutable values (interned strings, enum singletons) skip RC entirely via TRY semantics. Use enums and constants where possible. |
| Avoid deep reference chains | Each `&` creates a `zend_reference` container with its own refcount. Deep chains increase overhead and complicate debugging. |

## Architecture Guidelines

- **RC check points**: Every zval write operation checks refcount > 1 (is this zval shared?). If shared, the zval must be separated (duplicated) before modification. This is copy-on-write.
- **Zend_reference container**: When `$b = &$a` is executed, PHP creates a `zend_reference` wrapper with `refcount = 2` (both `$a` and `$b` point to it). The actual value is stored inside the reference container.
- **GC_IMMUTABLE flag**: Set on interned strings, some enum instances, and preloaded class metadata. These zvals skip RC entirely — they are never freed.
- **GC_PERSISTENT flag**: Set on allocations that survive request boundaries. These zvals are managed by the persistent allocator, not the per-request heap.
- **RC overflow protection**: refcount is a uint32_t. Overflow is virtually impossible (>4 billion references) and would indicate a bug.

## Performance Considerations

- RC operations: ~5–15ns per increment/decrement. Cache-line atomic on modern CPUs.
- RC is the dominant memory management cost in PHP. ~30–50% of CPU time in framework-heavy apps is spent on RC operations.
- PHP 8.1 TRY semantics reduce RC overhead by ~5–10% in hot paths by skipping atomic ops on known-immutable values.
- zend_reference container overhead: creates an additional heap allocation and indirection. Avoid excessive reference usage in performance-sensitive code.
- The `zend_refcounted_h` header adds 16 bytes overheard per reference-counted allocation. This is in addition to the zval itself.

## Security Considerations

- Type confusion vulnerabilities: Manipulating refcount via extension bugs can cause use-after-free. PHP's type system prevents this in userland.
- Reference leaks: A reference chain that prevents cleanup can cause memory exhaustion. This is a stability risk, not a direct security issue.
- Debugging RC issues: Tools like `xdebug_debug_zval()` can inspect refcount for debugging never shared in production.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming `unset()` always frees memory | `unset()` decrements refcount but doesn't free if refcount > 0 (e.g., circular references). | Not understanding the RC + GC relationship. | Memory holds until GC runs, potentially never in short-lived scripts. | Use `gc_collect_cycles()` after unset if you need immediate cleanup. |
| Excessive copying in loops | `$temp = $array; ...` increments refcount unnecessarily. | Not realizing that assignment increments refcount. | Higher CPU usage from RC manipulation. | Use references or avoid unnecessary assignments in hot loops. |
| Forgetting that function parameters copy refcount | `function foo($bigArray)` increments the array's refcount. | Not understanding pass-by-value semantics. | Array remains alive until function returns, even if not needed. | Pass by reference for large arrays if the function is read-only, but know the implications. |
| Using references in foreach on a shared array | `foreach ($array as &$val)` keeps a reference alive after the loop, causing CoW on next write to the array variable. | Not knowing that foreach retains the last reference. | Subtle bugs where the array variable unexpectedly changes after the loop. | `unset($val)` after the foreach loop. |

## Anti-Patterns

- **Deep reference chains**: `$a = &$b; $b = &$c; $c = &$d;` creates nested zend_reference containers. Each access traverses the chain.
- **Cyclic assignment via references**: `$a = &$a` creates a self-reference that RC cannot resolve. The GC must collect this.
- **Overusing `&` for performance**: References do not always improve performance. They prevent CoW sharing, often increasing memory and CPU overhead.

## Examples

```php
// Reference counting lifecycle
$a = range(1, 1000);     // refcount = 1 (assigned to $a)
$b = $a;                  // refcount = 2 (shared copy)
$c = $a;                  // refcount = 3 (shared copy)
unset($b);                // refcount = 2 (still shared by $a, $c)
unset($a);                // refcount = 1 (only $c holds it)
unset($c);                // refcount = 0 → memory freed
```

```php
// TRY semantics (PHP 8.1+)
// Interned strings skip refcount manipulation
$class = self::class;     // self::class is an interned string — no RC overhead
$name = 'example';        // Literal strings are interned — shared across all requests
```

## Related Topics

- Zval Structure and Reference Counting
- Copy-on-Write Mechanics
- Cyclic GC Algorithm
- Persistent vs Per-Request Allocators
- Zend Memory Manager

## AI Agent Notes

- Reference counting is PHP's "hidden" memory manager — it runs on every variable operation but is invisible to developers. Understanding it helps explain PHP's performance characteristics.
- The most practical takeaway: adding more references (via assignments, passing arguments, returning values) adds ~5–15ns each. For most apps, this is negligible. For hot loops running 1M+ iterations, it matters.
- PHP 8.1's TRY semantics were a significant optimization. Interned strings and immutable values skip RC entirely, removing ~5–10% of RC overhead.
- When teaching reference counting, start with the book lending mental model: each variable is a borrower, refcount is the number of borrowers, and when everyone returns the book (refcount=0), it's recycled.

## Verification

- [ ] Use `xdebug_debug_zval()` or `debug_zval_refs()` to inspect refcount values.
- [ ] Verify the refcount lifecycle: assign → increment, unset → decrement.
- [ ] Test that interned strings skip refcount manipulation.
- [ ] Measure the CPU cost of RC in a hot loop with vs without variable copying.
- [ ] Document RC patterns relevant to your application's hot code paths.
