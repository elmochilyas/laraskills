# Skill: Minimize String Memory Allocation in Hot Paths

## Purpose

Reduce memory allocation and CPU overhead from string operations by choosing the correct construction method (implode, sprintf, streaming), avoiding implicit juggling, and leveraging interned strings.

## When To Use

- Profiling shows `zend_string_create` or `zend_string_copy` in top functions
- Building large strings (> 10KB) programmatically
- Hot loops performing string concatenation or transformation
- Octane workers where temporary string memory accumulates across requests

## When NOT To Use

- Code paths with < 10 string operations per request
- Simple string interpolation in non-critical code (Blade templates, error messages)
- Development or debugging environments

## Prerequisites

- Profiling output showing string allocation counts
- Understanding of zend_string structure and COW semantics
- PHP 7.4+ for typed property awareness

## Inputs

- String size and construction pattern (concatenation vs template)
- Loop iteration counts
- Output destination (in-memory variable vs stream)
- Type juggling frequency in hot paths

## Workflow (numbered steps)

1. Profile to identify functions with high string allocation counts. Focus on `zend_string_create`, `zend_string_copy`, and `zend_string_concat`.
2. For each hotspot, determine the string construction pattern:
   - `.=` in loop → Convert to array collection + `implode()`
   - Multi-part concatenation → Convert to `sprintf()` for fixed templates
   - Implicit type juggling → Add explicit `(string)` casts
3. For outputs > 1MB (CSV, JSON, reports): convert to streaming. Use `fwrite()` to `php://output` or Laravel's `response()->stream()`.
4. For cache key or identifier construction: design a compact schema. Short keys = fewer zend_string bytes.
5. For repeated string literals in source code: verify they are natural candidates for interning (they are — PHP interns all string literals automatically).
6. Benchmark before/after each change. Use `hrtime()` around the specific string operation and `memory_get_usage(true)` for the enclosing request scope.
7. Document the optimized patterns in the team knowledge base.

## Validation Checklist

- [ ] String allocation hotspot identified in profiler
- [ ] `.=` in loops replaced with array + implode
- [ ] Multi-part concatenation replaced with sprintf
- [ ] Implicit type juggling replaced with explicit casts
- [ ] Large output paths converted to streaming
- [ ] Cache key schema optimized for minimal length
- [ ] Before/after benchmarks show reduction

## Common Failures

- **Applying changes to cold paths**: Optimizing a string operation that runs twice per request saves ~0.01ms. Focus on hot loops.
- **Overusing sprintf**: For simple appends (`$a . $b`), `sprintf('%s%s', $a, $b)` is less readable and not measurably faster. Only use sprintf for 3+ parts.
- **Streaming too early**: A 50KB JSON response does not need streaming. The complexity of stream callbacks is not worth the memory savings.
- **Forgetting fclose()**: Streaming to `php://output` without closing may leave the output buffer in an unexpected state for subsequent middleware.

## Decision Points

- Single append (< 10 parts) → `.=` is fine
- 10-100 parts → Use `implode()` with array
- 100+ parts or unknown size → Generator + streaming
- Template with 3+ variables → `sprintf()`
- Output > 1MB → Stream. Output < 100KB → Build in memory
- String length known at compile time → Interned automatically

## Performance Considerations

- Single `.=` (small string): ~50ns allocation
- `implode()` of 100 parts: ~5µs total
- `sprintf()` with 5 args: ~200ns
- Streaming 100MB: constant ~1MB peak memory
- Building 100MB string in memory: 100MB peak + 100MB during output = 200MB

## Security Considerations

- User-controlled strings should always be length-limited at the input boundary before any string processing.
- Streaming responses prevent a class of memory exhaustion attacks where a crafted request triggers a large in-memory string build.
- Interned strings are process-scoped and never freed — they cannot be targeted for injection, but excessively many unique interned strings (unlikely in PHP) could bloat memory.

## Related Rules (from 05-rules.md)

- Never build strings with `.=` in hot loops
- Cast values explicitly when used as strings in hot paths
- Stream large output instead of building strings in memory
- Use sprintf() over string concatenation for formatted strings

## Related Skills

- Array Memory Usage
- Output Buffer Management
- Response Streaming
- Cache Key Design

## Success Criteria

- String allocation count reduced by > 50% on optimized paths
- All loop-based string building uses array + implode
- Large outputs streamed instead of built in memory
- Before/after profiling confirms improvement
