# OpCache Interned Strings — interned_strings_buffer, String Deduplication, Memory Savings

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Interned Strings — interned_strings_buffer, String Deduplication, Memory Savings |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

`opcache.interned_strings_buffer` controls the shared memory dedicated to **interned strings** — deduplicated string values shared across all PHP files and all requests. When PHP encounters a string literal, it stores it once in the interned strings buffer. All references to the same literal point to the same memory. This saves significant memory in framework applications where class names, method names, constant values, and other string literals appear in thousands of files. The interned strings buffer is separate from the main `memory_consumption` pool and requires independent sizing.

## Core Concepts

- **Interned strings**: String literals (class names, function names, method names, string constants, string literals in code) stored once in shared memory. All PHP files share the same interned string table.
- **Deduplication**: When two PHP files reference the string `"App\Models\User"`, they share the same `zend_string` pointer. Without interning, each file would store its own copy.
- **interned_strings_buffer**: Size in MB of the interned strings buffer. Default: 8MB. Recommended: 16–64MB for framework applications.
- **Separate from memory_consumption**: Interned strings use their own memory pool. Not freed until PHP-FPM restart. Independent of the opcode cache eviction cycle.
- **Scope of interning**: String literals declared at compile time. Dynamically generated strings (`"User_{$id}"`) are NOT interned.
- **Pre-computed hashes**: Each interned string has its hash cached in the `zend_string::hash` field. When used as array keys, hash computation is skipped — saving ~50–100ns per lookup.

## When To Use

- You are configuring OpCache for a framework application with many class names and string literals.
- You have observed low free space in the interned strings buffer.
- You want to maximize string deduplication across your application.
- You are working with a large monorepo containing multiple applications.
- You want to reduce per-worker memory by sharing string allocations across workers.

## When NOT To Use

- Your application is very small (<5000 PHP files) — default 8MB is likely sufficient.
- You haven't monitored interned strings usage — tune based on data, not guesses.
- You are running a development environment — production traffic patterns differ.
- Your application uses mostly dynamically generated strings (templating-heavy apps).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Set `interned_strings_buffer` to 16–32MB for Laravel/Symfony | Framework applications have many class names, method names, and string literals that benefit from deduplication. 8MB default is typically insufficient. |
| Monitor interned strings usage: `opcache_get_status()['interned_strings_usage']` | Check `used_memory` vs `free_memory`. If approaching capacity, increase the buffer. |
| Set higher for monorepos or multi-application environments | Each application has its own strings. A monorepo with 3 apps needs ~3× the strings buffer of a single app. |
| Interned strings are never freed — size conservatively | Unlike the main opcode cache, interned strings have no eviction. Over-allocation wastes RAM permanently; under-allocation causes wasted strings to accumulate. |
| Larger buffer does not improve performance | It only prevents wasted strings. The performance comes from deduplication, which is already happening within the available space. More space = more strings deduplicated. |
| Combine with `memory_consumption` tuning | The interned strings buffer is independent. Tune both separately based on their respective monitoring metrics. |

## Architecture Guidelines

- **String lifecycle**: At PHP startup (compilation phase), all string literals are added to the interned strings table. The string is stored once; all references point to it via pointer equality.
- **Interning across workers**: Interned strings are stored in shared memory accessible by all PHP-FPM workers. Worker A and Worker B referencing `"App\Models\User"` use the same memory.
- **Wasted interned strings**: When the buffer fills, new strings cannot be interned. They are stored in per-request memory instead. This wastes the buffer space occupied by less-frequently-used strings, but no strings are evicted.
- **Interning during preloading**: Strings from preloaded files are interned at startup. The preload script can trigger interning of additional strings that wouldn't normally be literals.
- **Hash caching on interned strings**: The `zend_string::hash` field stores the pre-computed hash. This speeds up HashTable lookups when the string is used as an array key (common for class names in autoloading and service container resolution).

## Performance Considerations

- Interned string lookup: O(1) hash table lookup in the interned strings table.
- Hash caching benefit: ~50–100ns saved per array key access using an interned string. Significant for framework autoloading and service container lookups.
- Buffer undersizing: When full, new strings are not interned. They use per-request allocation (more memory, no deduplication). The already-interned strings are unaffected.
- Buffer oversizing: No performance penalty beyond reserved RAM. 32MB buffer that's only 30% used still reserves 32MB.
- Memory comparison: Without interning, `"App\Models\User"` appearing in 1000 files uses ~1000 × 35 bytes = 35KB. With interning, it uses 35 bytes total — a 1000× reduction for that string.

## Security Considerations

- Interned strings contain all string literals from all PHP files. In theory, a process with access to shared memory could read them. In practice, this is not a security concern.
- No dynamic data (user input, database results, session data) is interned. Interned strings only contain compile-time literals.
- Preloading scripts execute with full PHP privileges. If the preload script generates strings dynamically, those are not interned (runtime strings are per-request).

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Setting `interned_strings_buffer` too low for framework apps | Default 8MB is insufficient for Laravel/Symfony. | Assuming default is adequate. | Strings don't deduplicate fully — more per-request string memory. | Set 16–32MB for framework apps. Monitor usage. |
| Confusing interned_strings_buffer with memory_consumption | Both are memory pools but for different purposes. | Not reading the OpCache documentation carefully. | Tuning the wrong parameter. Memory still insufficient. | `memory_consumption` for opcodes, `interned_strings_buffer` for string deduplication. |
| Setting interned_strings_buffer very large (256MB) | Wastes RAM on a buffer that won't be fully used. | Overcompensating without monitoring. | 256MB permanently reserved, 10% used at most. | Start at 16–32MB, monitor, increase incrementally. |
| Not considering preloaded strings | Preloading adds strings to the interned buffer. | Accounting only for autoloaded strings. | Buffer fills faster than expected. | Add 25% to the buffer estimate if using preloading. |

## Anti-Patterns

- **Interned_strings_buffer as a tuning lever for performance**: Increasing the buffer does not directly improve throughput. The benefit is memory deduplication and hash caching. Only increase if monitoring shows the buffer is full.
- **Over-reserving in memory-constrained environments**: In containers with 256MB RAM total, a 64MB interned strings buffer is 25% of memory. Reserve conservatively.
- **Ignoring interned strings monitoring**: The `interned_strings_usage` section of `opcache_get_status()` provides detailed data. Use it.

## Examples

```php
// Monitoring interned strings usage
$status = opcache_get_status(false);
$interned = $status['interned_strings_usage'];
$usedMB = round($interned['used_memory'] / 1024 / 1024, 1);
$freeMB = round($interned['free_memory'] / 1024 / 1024, 1);

echo "Interned strings: {$usedMB}MB used / {$freeMB}MB free";
echo "String count: {$interned['number_of_strings']}";

if ($freeMB < 2) {
    echo "Increase interned_strings_buffer — approaching capacity";
}
```

```ini
; Recommended interned_strings_buffer by application
; WordPress (5K+ files)
opcache.interned_strings_buffer=8

; Laravel (20K+ files)
opcache.interned_strings_buffer=16

; Symfony (30K+ files)
opcache.interned_strings_buffer=32

; Magento 2 (50K+ files)
opcache.interned_strings_buffer=32

; Monorepo with multiple apps
opcache.interned_strings_buffer=64
```

## Related Topics

- OpCache Memory Consumption — memory_consumption
- OpCache Max Accelerated Files
- String Memory Usage — zend_string structure
- OpCache Preloading and Warmup
- OpCache Monitoring

## AI Agent Notes

- Interned strings are PHP's "free lunch" for string memory. String literals are automatically deduplicated — no code changes needed.
- The default 8MB buffer is one of the few PHP defaults that's truly too small for modern applications. 16–32MB should be the starting point for framework apps.
- The interned strings buffer is separate from the opcode cache buffer. Tuning one doesn't affect the other. Both need independent attention.
- Hash caching on interned strings is an underappreciated optimization. Array key lookups using interned strings skip hash computation, which benefits framework autoloading and service container operations.

## Verification

- [ ] Run `opcache_get_status(false)['interned_strings_usage']` and check `used_memory`.
- [ ] Calculate utilization: `used_memory / (interned_strings_buffer × 1MB)`. If >80%, increase.
- [ ] Verify interned strings are shared: `$a = 'hello'; $b = 'hello';` — compare `spl_object_id()`.
- [ ] Check that framework class names are interned (they appear as string literals).
- [ ] Document the interned_strings_buffer value and monitoring approach.
