# String Memory Usage — zend_string Structure, Interned Strings, Concatenation Cost, Encoding Overhead

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Memory Management & Garbage Collection |
| Knowledge Unit | String Memory Usage — zend_string Structure, Interned Strings, Concatenation Cost, Encoding Overhead |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Strings in PHP are stored as `zend_string` structures — a 32-byte header plus variable-length character data. Each string has a pre-computed hash value (cached in the header) that accelerates HashTable lookups when the string is used as an array key. Common strings (class names, function names, constant strings) are **interned** — stored in a deduplicated table shared across all requests. Interned strings use a single memory allocation for all references, eliminating duplication. String concatenation in loops is a common source of memory and CPU overhead because each concatenation allocates a new string and copies both parts.

## Core Concepts

- **zend_string header (32 bytes)**: `refcount` (4 bytes), `hash` (4 bytes — pre-computed, 0 = not computed), `length` (4 bytes), `val` (variable length — null-terminated).
- **Total string memory**: 32 bytes header + length bytes character data + 1 byte null terminator. A string of length N uses 33+N bytes.
- **Interned strings**: Strings that are deduplicated across all PHP files and requests. Stored in a shared interned strings buffer (configured by `opcache.interned_strings_buffer`). Class names, function names, method names, and string literals are interned.
- **String concatenation cost**: `$a . $b` allocates a new `zend_string` of length len(a)+len(b), then copies both parts. O(n+m) time and memory. In a loop, `$result .= $part` allocates and copies the entire accumulated string on every iteration — O(n²).
- **String immutability**: After creation, a string's content never changes. Any modification (concatenation, replacement, trimming) creates a new string. The old string is freed when refcount reaches 0.
- **mb_string overhead**: Multibyte string functions add encoding detection/validation overhead. UTF-8 variable-width encoding means `strlen()` != `mb_strlen()` for strings with multi-byte characters.

## When To Use

- You are processing large strings or many strings in memory-constrained environments.
- You are building string-heavy APIs (JSON generation, template rendering, report generation).
- You need to optimize string operations in hot code paths.
- You are debugging high memory usage and want to understand string allocation patterns.
- You are configuring OpCache interned strings buffer.

## When NOT To Use

- Your application uses few strings or small strings — overhead is negligible.
- You are optimizing without measurement — string optimization is visible only in data-intensive code.
- Your strings are short and temporary — Zend MM's fast allocation minimizes impact.
- You are just starting optimization — focus on database and caching first.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Prefer `implode()` over repeated concatenation in loops | `implode()` allocates the result string once after calculating total length. Loop concatenation (`$str .= $part`) allocates and copies on every iteration — O(n²). |
| Use `sprintf()` for string formatting | `sprintf()` formats in place without creating intermediate strings. Double-quoted interpolation with complex expressions creates temporary strings. |
| Use `strtr()` for multiple replacements | `str_replace()` with arrays creates intermediate strings for each replacement. `strtr()` does all replacements in one pass. |
| Use single-quoted strings for literals | Double-quoted strings are parsed for variable interpolation — adds compilation overhead. Single-quoted strings are literal. |
| Avoid unnecessary string copies in loops | Each string function that "modifies" returns a new string. Chain operations on the original variable rather than storing intermediates. |
| Use `substr()` instead of `str_replace()` for prefix/suffix removal | `str_replace()` scans the entire string. `substr()` with length is O(1) for fixed-length operations. |
| Configure `interned_strings_buffer` based on application | Laravel/Symfony: 16–32MB. WordPress: 8–16MB. Monitor wasted memory to calibrate. |

## Architecture Guidelines

- **Interned string lifecycle**: Interned strings are created at PHP startup (compilation phase) from string literals. They are shared across all workers and survive request boundaries. They are never freed until PHP-FPM restart.
- **String hash caching**: The first time a string is used as an array key, its hash is computed and stored in the `zend_string::hash` field. Subsequent hash lookups (e.g., accessing the same array key) skip the hash computation — O(1) instead of O(n).
- **String concatenation in Zend Engine**: `$a . $b` → Zend Engine creates a new `zend_string` with length `len(a) + len(b)`, copies `a` to offset 0, copies `b` to offset `len(a)`. The copy is done via `memcpy()` — fast for small strings, measurable for large strings.
- **Binary-safe strings**: PHP strings can contain null bytes (`\0`). The `length` field tracks actual length, not relying on null termination. This means `strlen($binary)` works correctly for binary data.
- **UTF-8 awareness**: PHP strings are byte sequences, not character sequences. `strlen()` returns bytes, not characters. `mb_strlen()` returns characters. UTF-8 multi-byte sequences (e.g., emoji) use 2–4 bytes per character.

## Performance Considerations

- Interned string lookup: O(1) hash table lookup in the interned strings buffer. Near-zero cost.
- String allocation: `zend_string` allocation from Zend MM takes ~10–20ns for the header + memcpy for data.
- Concatenation in loop (bad): `$str .= $part` — O(n²) time, O(n) memory per iteration (cumulative). Example: building a 1MB string via 1K concatenations creates ~500MB total allocation (temporary strings + GC).
- Implode (good): `implode('', $parts)` — O(n) time, O(n) memory (one allocation for the result).
- Hash caching: Saves ~50–100ns per array key access after the first lookup. Significant for arrays accessed in loops.
- Interned strings buffer sizing: Too small → wasted memory from duplicate interned strings. Too large → wasted shared memory. Aim for 50–70% utilization.

## Security Considerations

- String injection: Building SQL queries or shell commands via string concatenation is error-prone and insecure. Use prepared statements or dedicated query builders.
- Binary string handling: Strings containing null bytes are valid in PHP but may cause issues when passed to C libraries (NUL-terminated). Ensure external calls handle binary strings correctly.
- Encoding confusion: Mixing encodings (UTF-8, Latin-1, CP1252) in string operations can produce garbled output. Normalize to UTF-8 at application boundaries.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Building large strings via concatenation in loops | `$csv .= $row . "\n"` in a loop over 100K rows. | Not realizing concatenation creates a new string each iteration. | Frequent GC collections, high CPU, eventual memory_limit fatal error. | Collect rows in array and `implode()` at the end, or write to a stream. |
| Using `str_replace()` in a loop for multiple replacements | `str_replace` called N times on the same string. | Not knowing about the $search/$replace array overload. | Each call scans the entire string. N replacements = N full scans. | Use one `str_replace(['a', 'b'], ['x', 'y'], $str)`. |
| Not interning dynamic strings with reuse | Building the same dynamic string repeatedly. | `strtolower($className)` called 100K times with the same class name. | 100K identical strings allocated, each needing its own refcount and memory. | Avoid dynamic string creation for repeating values. Cache results. |
| Assuming `strlen()` returns character count | `strlen('café')` returns 5 (bytes), not 4 (characters). | UTF-8 encoding confusion. | Off-by-one errors in multibyte string operations. | Use `mb_strlen()` for character count in multibyte strings. |
| Not configuring `interned_strings_buffer` | Default 8MB is too small for large applications. | Using the PHP default without adjusting for application size. | Interned strings evict and re-intern on every request. | Set to 16–32MB for framework applications. Monitor wasted percentage. |

## Anti-Patterns

- **String-as-collection**: Using a string with delimiters as a data structure (`"1,2,3,4"`) when arrays or SplFixedArray would be more efficient. Parsing and splitting adds overhead.
- **Excessive double-quoted string complexity**: `"Hello {$user->getName()} at {$company->getAddress()}"` triggers method calls during compilation. For repeated execution, use `sprintf()`.
- **Not using output buffering for large string generation**: For generating large responses (CSV exports), use `ob_start()` and `ob_flush()` to stream output instead of building the entire string in memory.
- **Strlen in loop conditions**: `for ($i = 0; $i < strlen($str); $i++)` calls strlen on every iteration. Cache the length: `$len = strlen($str)`.

## Examples

```php
// Bad: O(n²) string building
$result = '';
for ($i = 0; $i < 100000; $i++) {
    $result .= "Line $i\n";
}
// Memory: up to ~100MB temporary allocations

// Good: O(n) string building
$parts = [];
for ($i = 0; $i < 100000; $i++) {
    $parts[] = "Line $i";
}
$result = implode("\n", $parts);
// Memory: ~5MB for the parts array + ~5MB for the result

// Best: O(1) memory streaming
$handle = fopen('php://output', 'w');
for ($i = 0; $i < 100000; $i++) {
    fwrite($handle, "Line $i\n");
}
// Memory: file buffer size only
```

```php
// Interned string behavior
$a = 'hello';    // Interned — stored in shared buffer
$b = 'hello';    // Points to same interned string — refcount is irrelevant
echo $a === $b;  // true — same zend_string pointer (interned)

$c = strtolower('HELLO');  // NOT interned — runtime-generated string
$d = strtolower('HELLO');  // Separate string — different zend_string, different pointer
echo $c === $d;            // true — same value, but different zend_string
```

## Related Topics

- Array Memory Usage — HashTable and bucket overhead
- Object Memory Usage — zend_object structure
- Efficient Data Structures
- OpCache Interned Strings Buffer
- Zend Memory Manager

## AI Agent Notes

- String concatenation in loops is the most common string performance mistake. A single 100K-iteration loop with `$str .= ...` can consume 100s of MB of temporary memory and take seconds.
- Interned strings are PHP's hidden performance feature — string literals (class names, method names, constants) are automatically deduplicated. This saves memory and speeds up array key lookups.
- The 32-byte `zend_string` header overhead means very short strings (1–5 chars) have ~85–97% overhead. A 4-byte string uses 37 bytes total. This is by design — the header accelerates hash lookups.
- For Octane workers, string accumulation is a common memory leak pattern. Concatenating strings across requests (e.g., log buffers, output accumulation) causes unbounded growth. Always cap or reset string buffers per-request.

## Verification

- [ ] Measure memory: build a 100K-line string via concatenation vs implode vs stream.
- [ ] Verify interned strings are shared: compare spl_object_id for two identical string literals.
- [ ] Check `opcache_get_status()['interned_strings_usage']` for utilization.
- [ ] Profile a string-heavy code path and identify allocation hot spots.
- [ ] Monitor string memory in Octane workers — ensure no accumulation across requests.
- [ ] Document string optimization patterns used in your application.
