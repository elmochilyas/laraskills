# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # String Memory Usage â€” zend_string Structure, Interned Strings, Concatenation Cost, Encoding Overhead
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Measure memory: build a 100K-line string via concatenation vs implode vs stream.
- [ ] Verify interned strings are shared: compare spl_object_id for two identical string literals.
- [ ] Check `opcache_get_status()['interned_strings_usage']` for utilization.
- [ ] Profile a string-heavy code path and identify allocation hot spots.
- [ ] Monitor string memory in Octane workers â€” ensure no accumulation across requests.
- [ ] String memory usage reduced by 20-50% on targeted code paths
- [ ] Loop concatenation replaced where beneficial
- [ ] Large strings processed via streams or offset-based methods
- [ ] Memory reduction measured and documented
- [ ] Largest string allocations identified
- [ ] Loop concatenation replaced with array+implode
- [ ] Stream-based processing for large documents
- [ ] Binary storage used where applicable
- [ ] substring copy avoided for large documents
- [ ] Memory reduction measured
- [ ] Patterns documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Interned string lifecycle**: Interned strings are created at PHP startup (compilation phase) from string literals. They are shared across all workers and survive request boundaries. They are never freed until PHP-FPM restart.
- [ ] **String hash caching**: The first time a string is used as an array key, its hash is computed and stored in the `zend_string::hash` field. Subsequent hash lookups (e.g., accessing the same array key) skip the hash computation â€” O(1) instead of O(n).
- [ ] **String concatenation in Zend Engine**: `$a . $b` â†’ Zend Engine creates a new `zend_string` with length `len(a) + len(b)`, copies `a` to offset 0, copies `b` to offset `len(a)`. The copy is done via `memcpy()` â€” fast for small strings, measurable for large strings.
- [ ] **Binary-safe strings**: PHP strings can contain null bytes (`\0`). The `length` field tracks actual length, not relying on null termination. This means `strlen($binary)` works correctly for binary data.
- [ ] **UTF-8 awareness**: PHP strings are byte sequences, not character sequences. `strlen()` returns bytes, not characters. `mb_strlen()` returns characters. UTF-8 multi-byte sequences (e.g., emoji) use 2â€“4 bytes per character.
- [ ] Document and follow through on architectural decision: String construction for memory efficiency
- [ ] Ensure architecture aligns with core concept: **zend_string header (32 bytes)**: `refcount` (4 bytes), `hash` (4 bytes â€” pre-computed, 0 = not computed), `length` (4 bytes), `val` (variable length â€” null-terminated).
- [ ] Ensure architecture aligns with core concept: **Total string memory**: 32 bytes header + length bytes character data + 1 byte null terminator. A string of length N uses 33+N bytes.
- [ ] Ensure architecture aligns with core concept: **Interned strings**: Strings that are deduplicated across all PHP files and requests. Stored in a shared interned strings buffer (configured by `opcache.interned_strings_buffer`). Class names, function names, method names, and string literals are interned.
- [ ] Ensure architecture aligns with core concept: **String concatenation cost**: `$a . $b` allocates a new `zend_string` of length len(a)+len(b), then copies both parts. O(n+m) time and memory. In a loop, `$result .= $part` allocates and copies the entire accumulated string on every iteration â€” O(nÂ²).
- [ ] Ensure architecture aligns with core concept: **String immutability**: After creation, a string's content never changes. Any modification (concatenation, replacement, trimming) creates a new string. The old string is freed when refcount reaches 0.
- [ ] Ensure architecture aligns with core concept: **mb_string overhead**: Multibyte string functions add encoding detection/validation overhead. UTF-8 variable-width encoding means `strlen()` != `mb_strlen()` for strings with multi-byte characters.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile string memory usage: identify the largest string allocations and most frequent concatenations
- [ ] For string concatenation in loops: replace `$str .= $part` with building an array of parts and using `implode()` â€” avoids repeated reallocation
- [ ] For large string processing: use `strpos`, `substr`, and `fread` on streams instead of loading entire strings
- [ ] For repeated string values: rely on PHP's interned strings mechanism â€” the same literal string is stored once
- [ ] For string comparisons: use `===` (binary-safe, no copy) over `strcmp`
- [ ] For Base64 or serialized data: store in binary format when possible (reduces size by 33% for Base64)
- [ ] For substring operations: `substr()` creates a new string (copy) â€” use offset-based processing for large documents
- [ ] Benchmark memory before and after string optimizations
- [ ] Document the memory-efficient string patterns

# Performance Checklist (from 04/06)
- [ ] Interned string lookup: O(1) hash table lookup in the interned strings buffer. Near-zero cost.
- [ ] String allocation: `zend_string` allocation from Zend MM takes ~10â€“20ns for the header + memcpy for data.
- [ ] Concatenation in loop (bad): `$str .= $part` â€” O(nÂ²) time, O(n) memory per iteration (cumulative). Example: building a 1MB string via 1K concatenations creates ~500MB total allocation (temporary strings + GC).
- [ ] Implode (good): `implode('', $parts)` â€” O(n) time, O(n) memory (one allocation for the result).
- [ ] Hash caching: Saves ~50â€“100ns per array key access after the first lookup. Significant for arrays accessed in loops.
- [ ] Interned strings buffer sizing: Too small â†’ wasted memory from duplicate interned strings. Too large â†’ wasted shared memory. Aim for 50â€“70% utilization.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] String injection: Building SQL queries or shell commands via string concatenation is error-prone and insecure. Use prepared statements or dedicated query builders.
- [ ] Binary string handling: Strings containing null bytes are valid in PHP but may cause issues when passed to C libraries (NUL-terminated). Ensure external calls handle binary strings correctly.
- [ ] Encoding confusion: Mixing encodings (UTF-8, Latin-1, CP1252) in string operations can produce garbled output. Normalize to UTF-8 at application boundaries.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Measure memory: build a 100K-line string via concatenation vs implode vs stream.
- [ ] Verify interned strings are shared: compare spl_object_id for two identical string literals.
- [ ] Check `opcache_get_status()['interned_strings_usage']` for utilization.
- [ ] Profile a string-heavy code path and identify allocation hot spots.
- [ ] Monitor string memory in Octane workers â€” ensure no accumulation across requests.
- [ ] Document string optimization patterns used in your application.
- [ ] String memory usage reduced by 20-50% on targeted code paths
- [ ] Loop concatenation replaced where beneficial
- [ ] Large strings processed via streams or offset-based methods
- [ ] Memory reduction measured and documented
- [ ] Largest string allocations identified
- [ ] Loop concatenation replaced with array+implode
- [ ] Stream-based processing for large documents
- [ ] Binary storage used where applicable
- [ ] substring copy avoided for large documents
- [ ] Memory reduction measured
- [ ] Patterns documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Building large strings via concatenation in loops
- [ ] Avoid: Using `str_replace()` in a loop for multiple replacements
- [ ] Avoid: Not interning dynamic strings with reuse
- [ ] Avoid: Assuming `strlen()` returns character count
- [ ] Avoid: Not configuring `interned_strings_buffer`
- [ ] Avoid anti-pattern: **String-as-collection**: Using a string with delimiters as a data structure (`"1,2,3,4"`) when arrays or SplFixedArray would be more efficient. Parsing and splitting adds overhead.
- [ ] Avoid anti-pattern: **Excessive double-quoted string complexity**: `"Hello {$user->getName()} at {$company->getAddress()}"` triggers method calls during compilation. For repeated execution, use `sprintf()`.
- [ ] Avoid anti-pattern: **Not using output buffering for large string generation**: For generating large responses (CSV exports), use `ob_start()` and `ob_flush()` to stream output instead of building the entire string in memory.
- [ ] Avoid anti-pattern: **Strlen in loop conditions**: `for ($i = 0; $i < strlen($str); $i++)` calls strlen on every iteration. Cache the length: `$len = strlen($str)`.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **zend_string header (32 bytes)**: `refcount` (4 bytes), `hash` (4 bytes â€” pre-computed, 0 = not computed), `length` (4 bytes), `val` (variable length â€” null-terminated)., **Total string memory**: 32 bytes header + length bytes character data + 1 byte null terminator. A string of length N uses 33+N bytes., **Interned strings**: Strings that are deduplicated across all PHP files and requests. Stored in a shared interned strings buffer (configured by `opcache.interned_strings_buffer`). Class names, function names, method names, and string literals are interned., **String concatenation cost**: `$a . $b` allocates a new `zend_string` of length len(a)+len(b), then copies both parts. O(n+m) time and memory. In a loop, `$result .= $part` allocates and copies the entire accumulated string on every iteration â€” O(nÂ²)., **String immutability**: After creation, a string's content never changes. Any modification (concatenation, replacement, trimming) creates a new string. The old string is freed when refcount reaches 0.
**Rules:**
- General: Use Streaming for Large String Output
**Skills:** PHP Memory Model, Efficient Data Structures, Generators and Yield, Interned Strings Configuration
**Decision Trees:** String construction for memory efficiency
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Array Memory Usage â€” HashTable and bucket overhead, Object Memory Usage â€” zend_object structure, Efficient Data Structures, OpCache Interned Strings Buffer, Zend Memory Manager

