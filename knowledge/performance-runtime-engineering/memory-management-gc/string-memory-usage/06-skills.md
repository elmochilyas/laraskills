# Skill: Optimize String Memory Usage in PHP

## Purpose

Reduce memory overhead from string operations by understanding zend_string structure, interned strings, and efficient string manipulation patterns.

## When To Use

- Profiling shows high memory usage from string variables
- Processing large text documents, logs, or serialized data
- Hot-path code creates many temporary strings
- Building large strings through concatenation

## When NOT To Use

- For small strings (<1KB) where overhead is negligible
- When string operations are not a significant memory consumer
- For code paths executed once per request

## Prerequisites

- Understanding of zend_string structure (32 bytes header + variable data)
- Profiling showing string-related memory usage
- PHP 7.4+ runtime (string internment behavior is well-defined)

## Inputs

- Profiling data showing largest string allocations
- String manipulation patterns in hot paths
- Data sizes (average string length, count)

## Workflow (numbered steps)

1. Profile string memory usage: identify the largest string allocations and most frequent concatenations
2. For string concatenation in loops: replace `$str .= $part` with building an array of parts and using `implode()` — avoids repeated reallocation
3. For large string processing: use `strpos`, `substr`, and `fread` on streams instead of loading entire strings
4. For repeated string values: rely on PHP's interned strings mechanism — the same literal string is stored once
5. For string comparisons: use `===` (binary-safe, no copy) over `strcmp`
6. For Base64 or serialized data: store in binary format when possible (reduces size by 33% for Base64)
7. For substring operations: `substr()` creates a new string (copy) — use offset-based processing for large documents
8. Benchmark memory before and after string optimizations
9. Document the memory-efficient string patterns

## Validation Checklist

- [ ] Largest string allocations identified
- [ ] Loop concatenation replaced with array+implode
- [ ] Stream-based processing for large documents
- [ ] Binary storage used where applicable
- [ ] substring copy avoided for large documents
- [ ] Memory reduction measured
- [ ] Patterns documented

## Common Failures

- **Replacing loop concatenation prematurely**: For <100 concatenations of short strings, the optimization is unnecessary
- **Using implode() with separator when not needed**: `implode($parts)` without separator is fastest
- **Forgetting about interned strings**: Class names, method names, and literal strings are already optimized — no action needed
- **Not measuring baseline**: Without before/after memory measurement, cannot confirm optimization benefit

## Decision Points

- Loop concatenation <10 iterations: no optimization needed (reallocation cost is negligible)
- Loop concatenation 10-100 iterations: moderate benefit from array+implode
- Loop concatenation >100 iterations: significant benefit — always use array+implode
- Strings >1MB: consider stream or offset-based processing
- Repeated identical strings in code: let interned strings handle deduplication automatically

## Performance Considerations

- zend_string header: 32 bytes + variable data — overhead is ~32 bytes per string, plus potential fragmentation
- String concatenation: each `$str .= $part` may reallocate and copy the entire string — O(n²) in loops
- implode(): pre-calculates total length, allocates once, copies each part — O(n)
- Interned strings: stored once in a global table, shared across all requests — zero overhead per additional use
- substr(): creates a new zend_string with its own allocation — O(n) copy for large strings

## Security Considerations

- String processing of user input should validate length before allocation
- Base64 encoded data can be 33% larger than binary — consider binary storage for internal processing
- No direct security implications from string memory optimization

## Related Rules (from 05-rules.md)

- Avoid String Concatenation in Loops
- Use Stream-Based Processing for Large Documents
- Prefer Binary Over Base64 for Internal Data

## Related Skills

- PHP Memory Model
- Efficient Data Structures
- Generators and Yield
- Interned Strings Configuration

## Success Criteria

- String memory usage reduced by 20-50% on targeted code paths
- Loop concatenation replaced where beneficial
- Large strings processed via streams or offset-based methods
- Memory reduction measured and documented
