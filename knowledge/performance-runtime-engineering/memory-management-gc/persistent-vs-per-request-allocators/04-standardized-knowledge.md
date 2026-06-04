# Standardized Knowledge: Persistent vs Per-Request Allocators

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | Persistent vs Per-Request Allocators — GC_IMMUTABLE, Interned Strings, Shared Memory |
| Difficulty | Intermediate |
| Lifecycle | Understand, Configure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP uses two memory allocation systems: the **per-request allocator** (freed entirely at request end — fast, no fragmentation tracking) and the **persistent allocator** (allocates from shared memory / process heap — survives across requests). Interned strings, OpCache opcodes, and persistent extensions use the persistent allocator. Regular PHP variables use the per-request allocator.

## Core Concepts

- **Per-request allocator (Zend MM)**: Chunked allocator optimized for request lifecycle. All memory freed at once when request ends (no individual frees needed). Low overhead but memory is request-scoped.
- **Persistent allocator**: Uses system malloc() or shared memory (mmap). Memory persists across requests. Used by interned strings, OpCache, persistent resources (database connections in FrankenPHP/Swoole).
- **GC_IMMUTABLE flag**: Marks a zend_refcounted value as never-to-be-freed. Used for interned strings — avoids unnecessary refcounting overhead. Set once at creation, never cleared.
- **GC_PERSISTENT flag**: Marks an allocation as persistent (outside per-request heap). GC skips these during cycle collection — they cannot be freed per-request.

## When To Use

- Understanding why some memory persists across requests and some doesn't
- Tuning interned_strings_buffer size for OpCache
- Debugging memory growth from persistent allocations in long-running processes
- Optimizing memory for Octane/Swoole workers (persistent vs request-scoped tradeoffs)

## When NOT To Use

- When tuning application-level cache strategies (separate concern)
- For basic PHP-FPM configuration (per-request allocator handles everything)
- Without understanding reference counting basics first

## Best Practices

- **Monitor interned strings buffer**: Use `opcache_get_status()['interned_strings_usage']`. If near capacity, increase `opcache.interned_strings_buffer`.
- **Prefer per-request for request-scoped data**: Use persistent allocator only for data that genuinely spans requests (config, class metadata, connection pools).
- **GC_IMMUTABLE awareness**: Interned strings are never freed during a request. Don't intern dynamic strings that vary per request.
- **Persistent resource cleanup**: In Octane, persistent database connections must not leak transaction state between requests.

## Architecture Guidelines

- **Allocation speed**: Per-request allocator: ~5-15ns. Persistent allocator: ~50-200ns (system malloc). Use per-request for allocations in hot paths.
- **Mass free efficiency**: Per-request allocator frees all memory at request end in O(1) — just reset the chunk pointer. Persistent allocator must individually free each allocation.
- **Interned string deduplication**: A string appearing in 1000 places uses memory once with interning. Without interning: 1000 copies.
- **Octane memory model**: Per-request allocator still used for request-scoped data. Persistent allocator holds bootstrap results (config, service container, compiled routes).

## Performance Considerations

- Per-request allocator: Allocation in ~5-15ns. Mass free at request end: O(1) — just reset chunk pointer.
- Persistent allocator: Allocation in ~50-200ns (system malloc). Must be individually freed. Higher fragmentation.
- Interned string deduplication: PHP interned strings stored once — string appearing in 1000 places uses memory once. Without interning: 1000 copies.
- GC_IMMUTABLE eliminates refcounting overhead for interned strings — significant for frequently accessed strings.

## Security Considerations

- Persistent memory in Octane can retain sensitive data across requests if not properly cleared
- Interned strings containing secrets (API keys, passwords) persist in shared memory — avoid interning sensitive values
- Multi-tenant Octane: one tenant's interned string allocations affect shared buffer capacity

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming all memory is freed per-request | Ignoring interned strings and OpCache | Underestimating persistent memory usage | Monitor total worker RSS |
| Interning dynamic strings | Misunderstanding interning purpose | Wasted interned string buffer | Only intern static strings |
| Using persistent allocator for request-scoped data | Convenience | Memory leaks in Octane | Use per-request or scoped() bindings |
| Not cleaning persistent resources | FPM habit | Transaction state leaks across requests | Implement resetState() patterns |

## Anti-Patterns

- **Storing request-scoped data in persistent memory**: Causes state leaks between requests. Use per-request allocator.
- **Over-interned strings buffer**: Allocating 64MB+ when only 10MB needed wastes shared memory. Monitor actual usage.
- **Ignoring persistent memory in capacity planning**: Worker RSS includes both per-request and persistent allocations. Monitor total RSS, not just per-request peak.

## Examples

```php
<?php
// Interned strings (automatic for string literals)
$a = 'hello'; // Interned by default for short strings
$b = 'hello'; // Same zend_string pointer — no new allocation

// Strings longer than interned_strings_buffer are NOT interned
$long = str_repeat('x', 1000); // Not interned — per-request allocation

// Persistent resources in Octane require cleanup
public function boot(): void
{
    Octane::booted(function () {
        // Register once per worker start, not per request
        Event::listen(MyEvent::class, function ($event) {
            // This closure persists for the worker's lifetime
        });
    });
}
```

## Related Topics

- Zend Memory Manager Chunked Allocator
- Zval Structure and Reference Counting
- OpCache Memory Sizing
- Interned Strings Configuration

## AI Agent Notes

- Per-request allocator: O(1) mass free at request end. Persistent: individual frees, higher cost.
- Interned strings are GC_IMMUTABLE — never freed during request. Shared across all requests.
- In Octane, persistent memory from bootstrap is shared across requests. Request-scoped data still uses per-request allocator.
- Monitor both per-request peak and persistent baseline RSS for complete memory picture.
- GC_PERSISTENT flag tells cycle collector to skip persistent allocations.

## Verification

- [ ] Per-request vs persistent allocator difference understood
- [ ] Interned strings buffer sized appropriately (monitor usage via opcache_get_status())
- [ ] No request-scoped data stored in persistent memory
- [ ] Persistent resource cleanup implemented for Octane workers
- [ ] Worker RSS monitoring includes both per-request and persistent memory
- [ ] No sensitive data in interned strings (API keys, secrets)
