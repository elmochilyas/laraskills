# PHP String Memory

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | PHP String Memory |
| Difficulty | Intermediate |
| Last Updated | 2026-06-04 |

## Overview

PHP strings are heap-allocated `zend_string` structures with a 32-byte header (refcount, hash, length) plus variable-length character data. Every string operation — concatenation, interpolation, encoding, transformation — allocates a new `zend_string` on the heap. String memory is the most frequently allocated data type in typical Laravel applications: request URIs, SQL queries, rendered Blade templates, JSON responses, session data, and cache keys are all strings. Understanding string memory means knowing when repeated concatenation creates O(n²) allocation patterns, how interned strings save memory, and when streaming avoids in-memory string construction entirely.

## Core Concepts

- **zend_string structure**: 32-byte header (`gc_refcount`, `gc_type_info`, `h` hash, `len` length) + variable-length character buffer. Total: 32 + len bytes.
- **Interned strings**: Class names, function names, constant strings used in source code are interned (deduplicated) in a global table. They are never freed. Saves memory when the same string appears many times.
- **String concatenation overhead**: `$a .= $b` allocates a new `zend_string` of size `len(a) + len(b)` and frees the old one. In loops, this creates O(n²) allocation cost — each iteration allocates and copies the entire accumulated string.
- **Copy-on-write for strings**: String assignment increments refcount (~5ns). Full copy (on modification) allocates a new `zend_string` and copies the character data.
- **Type juggling strings**: When a non-string value is used as a string (echo, interpolation, concatenation), PHP creates a temporary zend_string. Repeated juggling in loops is a hidden allocation source.
- **Binary-safe**: PHP strings are binary-safe (length-tracked, not null-terminated). This means the entire string is stored, including null bytes, up to 2GB.

## When To Use

- Applications generating large strings (HTML output, JSON responses, CSV data).
- Hot-path string operations in loops (building SQL queries, rendering views, processing text).
- Memory-constrained environments (containers with low limits, Octane workers).
- Profiling showing high allocation counts in `zend_string_create` or `zend_string_copy`.

## When NOT To Use

- Small strings (< 1KB) outside hot loops — overhead is negligible.
- One-off string operations per request — the 32-byte header is immaterial.
- Development environments where debugging convenience outweighs optimization.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Use `implode()` for assembling multi-segment strings | Collect parts in an array and join once — avoids O(n²) reallocation of repeated `.=`. |
| Prefer `sprintf()` over concatenation | Single allocation for the formatted result instead of multiple temporary strings. |
| Avoid string type juggling in hot loops | Cast explicitly with `(string)` or `strval()` — implicit juggling creates hidden allocations. |
| Use output buffering sparingly | `ob_start()` accumulates content in memory. For large output, flush in chunks. |
| Stream large responses instead of building in memory | `response()->stream()` or `fwrite()` to output avoids holding the entire string in memory. |

## Architecture Guidelines

- **Template rendering**: Blade compiles to PHP that uses `echo` statements directly. Each echo is a write to the output buffer, not an in-memory string concatenation — this is memory efficient by design.
- **JSON response construction**: Use `response()->json()` which encodes directly to the output buffer. Avoid building JSON strings manually with concatenation.
- **CSV generation**: Stream rows to output via `fputcsv()` on `php://output`. Never build a multi-MB CSV string in memory.
- **Log message formatting**: Structured logging (JSON) is formatted outside PHP's string allocator. Avoid `sprintf` log messages in hot paths.
- **Cache key construction**: Use consistent, short schemas. Each cache key is a zend_string allocation. Overly verbose keys waste memory at scale.

## Performance Considerations

- zend_string allocation: ~50ns for the header + copy time proportional to string length.
- String copy-on-write: ~5ns for refcount inc. Full copy allocates + copies data — O(len).
- `.=` concatenation in loop: O(n²) total time for building an n-length string. 100KB string = ~5ms for naive concatenation vs ~0.1ms for `implode()`.
- Interned string lookup: ~10ns. Once interned, no additional allocation for that string.
- Temporary string from type juggling: each implicit conversion allocates a zend_string. In hot loops, this adds measurable overhead.

## Security Considerations

- Very long strings (> 10MB) can exhaust memory_limit. Always limit input string lengths at validation boundaries.
- String comparison timing: PHP uses byte-level comparison (`memcmp`). For security-critical comparisons (API tokens, passwords), use `hash_equals()` to prevent timing attacks.
- Binary-safe concerns: Strings containing null bytes may cause unexpected truncation in C-level functions. PHP handles this correctly, but extensions may not.
- Interned string leaking: Interned strings are never freed. Dynamically generating interned strings (e.g., via `var_dump` on user input) can exhaust memory.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Building strings with `.=` in loops | Repeated concatenation creates O(n²) allocation pattern. | Readability of `.=` is appealing. Students and examples teach it. | 50+ intermediate allocations for a 10KB string built 100 chars at a time. | Collect parts in array, `implode()` once. |
| Not casting explicitly in string context | Relying on implicit `__toString()` or type juggling in hot loops. | Assuming the engine optimizes implicitly. | Hidden zend_string allocations per iteration. | Use `(string)` cast or `strval()` explicitly. |
| Holding large strings in memory unnecessarily | Building a full CSV/JSON string in a variable before writing to output or file. | Convenience of string manipulation functions. | Memory spike = 2× the string size (original + copy during write). | Stream output directly. |
| Using string flags instead of int enums | `$status = 'active'` instead of `$status = 1` with a constant. | Readability preference. | Each string flag is a heap allocation. | Use int/bool enums for internal state flags. |

## Anti-Patterns

- **JSON string building by hand**: `'{"name":"' . $name . '"}'` — error-prone and allocates many intermediate strings. Use `json_encode()`.
- **SQL query string interpolation**: Building queries with string concatenation instead of prepared statements. Inefficient and insecure (SQL injection).
- **Large file reads into strings**: `file_get_contents()` for a 200MB file loads it entirely into a zend_string. Stream the file via `fread()` chunks.
- **String interning overuse**: Calling `interned_string = (string) $userInput` doesn't intern — only compiler-visible string literals are interned.

## Examples

```php
<?php
// Bad: O(n²) concatenation in loop
$result = '';
for ($i = 0; $i < 1000; $i++) {
    $result .= $data[$i]; // Each iteration: allocate + copy entire accumulated string
}

// Good: O(n) with implode
$parts = [];
for ($i = 0; $i < 1000; $i++) {
    $parts[] = $data[$i];
}
$result = implode('', $parts); // Single allocation
```

```php
<?php
// Streaming CSV output — no string memory spike
$stream = fopen('php://output', 'w');
foreach ($rows as $row) {
    fputcsv($stream, $row);
}
fclose($stream);
```

## Related Topics

- **Prerequisites**: PHP Memory Model, Zval Structure
- **Closely Related**: Generators and Yield, Output Buffering, JSON Encoding
- **Advanced Follow-Up**: Array Memory Usage, String Search and Comparison Performance
- **Cross-Domain Connections**: Blade Template Compilation, Response Streaming, Logging

## AI Agent Notes

- String memory is the most frequently allocated type in Laravel apps, but it is rarely the bottleneck. Only optimize when profiling shows `zend_string_create` in top function time.
- The `.=` in loops antipattern is the single most common string performance issue. A 50-char string built 1000 times at `.= 1 char` creates ~500KB of temporary allocations.
- Interned strings are a free optimization for repeated literals (class names, method names, database column names). The engine handles this automatically.
- Streaming is the ultimate string memory optimization: if the data never needs to exist as a single string in memory, don't put it there.
