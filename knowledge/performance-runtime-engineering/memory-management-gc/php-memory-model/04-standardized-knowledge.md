# PHP Memory Model — Zend Engine Memory Manager, zval Structure, Allocation Tiers

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | PHP Memory Model — Zend Engine Memory Manager, zval Structure, Allocation Tiers |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

PHP's memory model is built on the Zend Engine's multi-tier memory allocator. Every PHP value is represented as a **zval** (Zend Value) — a 16-byte structure containing type, value, and metadata. The Zend Memory Manager (zend_mm_heap) allocates memory in three tiers: large blocks via mmap, medium blocks via segregated storage bins, and small blocks via cached free lists. Understanding this model explains why scalar types are faster than compound types, why copy-on-write optimizes memory, and why persistent workers (Octane, Swoole) require explicit memory management.

## Core Concepts

- **zval struct (16 bytes)**: `zend_value` (8 bytes union) + type_info (4 bytes) + extra (4 bytes). Inline for scalars, pointer to heap for compounds.
- **Inline scalars**: `IS_UNDEF`, `IS_NULL`, `IS_TRUE`, `IS_FALSE`, `IS_LONG`, `IS_DOUBLE` — values stored directly in the zval. No heap allocation. No refcount.
- **Pointer-based types**: `IS_STRING`, `IS_ARRAY`, `IS_OBJECT`, `IS_RESOURCE`, `IS_REFERENCE` — zval stores a pointer to a heap-allocated `zend_string`, `zend_array`, or `zend_object`. These have refcount semantics.
- **Zend Memory Manager**: mmaps 256KB chunks from the OS. Uses three-tier allocation: large (>3072 bytes) via mmap, small via segregated storage bins (2^n from 8 to 3072), cached via free lists.
- **Per-request heap**: Each PHP-FPM worker has its own zend_mm_heap, destroyed at request end. Octane workers share the heap across requests.
- **zend_string structure**: 32 bytes header (refcount, hash, length) + variable-length character data. Hash pre-computed for faster string lookups.
- **zend_array (HashTable)**: Buckets array with `nTableSize`, `nNumOfElements`, `arBuckets` pointer to packed or hash-ordered bucket slots.

## When To Use

- You need to understand why certain PHP operations are faster or slower than others (scalar vs compound, copy vs modify).
- You are debugging memory usage in a PHP application and need to know where memory goes.
- You are optimizing hot code paths and need to understand allocation overhead.
- You are working with Octane or Swoole persistent workers where memory accumulates across requests.
- You are building PHP extensions or working with PHP internals.

## When NOT To Use

- You are a beginner PHP developer — the memory model is an implementation detail. Focus on application logic first.
- You are optimizing web pages with response times >500ms — other optimizations (caching, query tuning) yield more benefit.
- You are using a shared-nothing architecture (PHP-FPM) without persistent workers — memory leaks reset per request.
- You are not experiencing memory-related performance issues.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Prefer scalar types for frequently-accessed data | Scalars are stored inline in the zval — no heap allocation, no refcount manipulation, CPU register speed. |
| Avoid unnecessary array copies | Arrays are pointer-based. Copying increments the refcount. Modify-in-place to avoid full duplication. |
| Use `unset()` to release memory early | While it doesn't free memory immediately for circular references, it decrements refcounts, enabling earlier GC collection. |
| Monitor heap fragmentation in long-running workers | Over time, the Zend MM's 2^n bin allocation can fragment. Recycle workers periodically to reset the heap. |
| Understand the real cost of object instantiation | Each object requires heap allocation + refcount management. Object pools can reduce allocation overhead in hot paths. |
| Use SplFixedArray for fixed-size arrays | SplFixedArray uses a C array internally — less memory overhead and faster access than zend_array for known-size data. |

## Architecture Guidelines

- **Zend MM chunk allocation**: The memory manager allocates 256KB chunks from the OS via mmap. Within each chunk, blocks are allocated from segregated storage bins. Free blocks are cached for reuse.
- **Per-request vs persistent**: PHP-FPM destroys the entire heap at request end — no memory leaks possible. Octane preserves the heap across requests — explicit cleanup is required.
- **Interned strings**: Common strings (class names, function names, constant strings) are stored in an interned strings table. They are never freed. This saves memory by deduplication.
- **Persistent allocator flags**: `GC_IMMUTABLE` and `GC_PERSISTENT` flags mark memory that should survive request boundaries. Used for interned strings and preloaded classes.

## Performance Considerations

- Scalar operations: 5–15ns per assignment/copy (CPU register speed, no heap allocation).
- String copy: refcount increment only (~5ns) until modification. Full copy: proportional to string length.
- Array copy: refcount increment only. Full copy is O(n) where n is number of elements. Modifying an array with references in foreach causes massive duplication.
- Object instantiation: ~100–500ns for a simple object (heap allocation + vtable setup + refcount).
- Zend MM allocation: free-list allocation ~10–20ns. mmap allocation for large blocks: ~1–5µs.
- Heap destruction per request (PHP-FPM): ~50–200µs depending on allocation count.

## Security Considerations

- Heap inspection: In persistent workers, data from previous requests may remain in freed memory. PHP zeroes freed heap, but sensitive data may persist during its lifetime.
- Buffer overflow: PHP's memory manager is type-safe. Buffer overflows in userland code are rare, but extensions may have vulnerabilities.
- Out-of-memory: When the Zend MM cannot allocate, PHP throws an `OutOfMemoryException` (PHP 8.3+) or fatal error. Monitor worker RSS to prevent OOM.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming all zvals are the same | Scalars are inline (16 bytes); strings, arrays, objects are pointers to heap. | Ignoring the zval type system. | Overestimating memory for scalars, underestimating for compounds. | Know the zval type layout. inline vs pointer has a 5–100× memory difference. |
| Modifying arrays in foreach by reference | `foreach ($array as &$value)` causes the array to be duplicated on next write. | Not understanding copy-on-write with references. | Memory doubles on the first modification after the foreach loop. | Use `foreach ($array as $value)` and modify a copy, or use indexes. |
| Creating deep object graphs | Each object has a zval and a heap allocation. Deep graphs have high traversal cost. | Object-oriented design without considering memory layout. | High memory usage, slow GC root buffer traversal. | Flatten data where possible. Use DTOs with public properties. |
| Not recycling workers in Octane | The heap accumulates fragmentation and leaks across requests. | Assuming PHP-FPM cleanup behavior. | Memory grows monotonically until OOM. | Set `max_requests` to recycle workers before memory exceeds limits. |

## Anti-Patterns

- **Creating millions of short-lived objects**: Each instance allocates heap, initializes refcount, and later frees. Use value objects sparingly in hot loops.
- **String concatenation in loops**: Each `$str .= $part` allocates a new string and copies both parts. For large iterations, use arrays and `implode()`.
- **Storing serialized objects in sessions**: `session_start()` deserializes all session data into memory. Only store what you need.
- **Assume `memory_get_usage()` shows the full picture**: It reports zend_mm_heap usage. External libraries (libxml, libcurl) allocate outside the Zend MM.

## Examples

```
// zval memory layout (16 bytes for scalars, pointer-based for compounds)
// Scalar: [zend_value (8 bytes)] [type_info (4 bytes)] [extra (4 bytes)] = 16 bytes total
// String: [ptr to zend_string (8 bytes)] [type_info (4 bytes)] [extra (4 bytes)]
//   zend_string: [refcount (4)] [hash (4)] [length (4)] [data (variable)] = 32 + len bytes
```

```php
// Memory measurement patterns
$baseline = memory_get_usage(true);
$data = range(1, 10000);
echo 'Array memory: ' . (memory_get_usage(true) - $baseline) . ' bytes';
unset($data);
```

## Related Topics

- Reference Counting — zval refcount lifecycle
- Copy-on-Write Mechanics
- Zval Type/Value Representation
- Persistent vs Per-Request Allocators
- Zend Memory Manager Chunked Allocator

## AI Agent Notes

- The PHP memory model is the foundation for understanding all other memory topics. Master this before moving to GC, leak detection, or Octane memory management.
- The key insight: scalars are free (inline in zval), compounds are expensive (heap allocation + refcount). This drives most memory optimization decisions.
- Zend MM's 2^n segregated storage means memory waste is at most 50% (e.g., a 9-byte allocation uses a 16-byte bin). This is by design for speed — the waste is acceptable for the allocation speed gain.
- In Octane workers, the Zend MM heap is never destroyed. This is why memory fragmentation accumulates — and why worker recycling is essential.

## Verification

- [ ] Use `memory_get_usage()` to measure memory for different data types (scalar, string, array, object).
- [ ] Compare memory of SplFixedArray vs regular array for a fixed-size dataset.
- [ ] Measure the difference between inline scalar ops and compound type copy operations.
- [ ] Verify heap growth in long-running workers — track baseline RSS over 1000 requests.
- [ ] Document the memory model characteristics relevant to your application.
