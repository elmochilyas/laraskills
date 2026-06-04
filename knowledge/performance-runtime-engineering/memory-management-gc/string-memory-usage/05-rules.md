---
## Rule Name

Use implode Instead of String Concatenation in Loops

## Category

Performance

## Rule

Use `implode()` to build large strings. Never use `.=` concatenation in loops with more than 100 iterations.

## Reason

Each `.=` concatenation allocates a new zend_string and copies the entire accumulated content — O(n²) time and memory. Building a 1MB string via 1000 concatenations creates ~500MB in temporary allocations. `implode()` calculates total length once, allocates once, and copies each part — O(n).

## Bad Example

```php
$csv = '';
foreach ($rows as $row) {
    $csv .= $row . "\n";  // O(n²) — allocates and copies on every iteration
}
```

## Good Example

```php
$parts = [];
foreach ($rows as $row) {
    $parts[] = $row;
}
$csv = implode("\n", $parts);  // O(n) — single allocation
```

## Exceptions

Small loops (<100 iterations) where the overhead is negligible.

## Consequences Of Violation

O(n²) CPU time, hundreds of MB in temporary string allocations, frequent GC collections, eventual memory_limit fatal errors.

---

## Rule Name

Use sprintf for Complex String Formatting

## Category

Performance

## Rule

Use `sprintf()` for string formatting with multiple variables instead of double-quoted interpolation with complex expressions.

## Reason

Double-quoted strings with complex variable expressions (`"{$user->getName()} at {$company->getAddress()}"`) trigger method calls during compilation and may create temporary strings. `sprintf()` formats in one pass without intermediate allocations.

## Bad Example

```php
$message = "User {$user->getName()} registered from {$request->getIp()}";
```

## Good Example

```php
$message = sprintf('User %s registered from %s', $user->getName(), $request->getIp());
```

## Exceptions

Simple variable interpolation (`"Hello $name"`) where no method calls or complex expressions are involved.

## Consequences Of Violation

Unnecessary temporary string allocations, slightly slower compilation and execution.

---

## Rule Name

Use strtr for Multiple String Replacements

## Category

Performance

## Rule

Use `strtr()` with two array arguments for multiple simultaneous string replacements. Avoid repeated `str_replace()` calls.

## Reason

`strtr()` performs all replacements in a single pass over the string. Each `str_replace()` call scans the string entirely. For N replacements on the same string, one `strtr()` pass replaces N `str_replace()` scans.

## Bad Example

```php
$result = str_replace(' ', '-', $str);
$result = str_replace('_', '-', $result);
$result = str_replace('.', '-', $result);
```

## Good Example

```php
$result = strtr($str, [' ' => '-', '_' => '-', '.' => '-']);
// Single pass
```

## Exceptions

A single replacement (one `str_replace` call is simpler than `strtr` with one entry).

## Consequences Of Violation

Multiple full-string scans for repeated replacements, unnecessary CPU overhead in string processing.

---

## Rule Name

Cache strlen Outside Loop Conditions

## Category

Performance

## Rule

Cache the result of `strlen()` in a variable before loop conditions. Never call `strlen()` in the loop condition itself.

## Reason

`strlen()` is O(n) for multi-byte strings in PHP 8. Calling it on every loop iteration makes the loop O(n²). Caching the length in a variable makes the loop O(n).

## Bad Example

```php
for ($i = 0; $i < strlen($str); $i++) {  // strlen called every iteration
    // process
}
```

## Good Example

```php
$len = strlen($str);
for ($i = 0; $i < $len; $i++) {  // strlen called once
    // process
}
```

## Exceptions

Strings where the length changes during iteration (rare in practice).

## Consequences Of Violation

O(n²) runtime for string iteration loops, measurable performance degradation for long strings.

---

## Rule Name

Configure interned_strings_buffer Based on Monitoring

## Category

Performance

## Rule

Monitor `opcache_get_status()['interned_strings_usage']` and set `opcache.interned_strings_buffer` to achieve 50–70% utilization.

## Reason

Under-sized buffer causes interned strings to be evicted, wasting deduplication. Over-sized buffer wastes shared memory. 50–70% utilization provides adequate headroom without waste.

## Bad Example

```ini
; Default 8MB — too small for Laravel/Symfony
opcache.interned_strings_buffer=8
```

## Good Example

```ini
; Monitor usage: currently 18MB of 32MB (56% utilization)
opcache.interned_strings_buffer=32
```

## Exceptions

Small applications with minimal framework usage (class names, method names are few).

## Consequences Of Violation

Wasted memory from excessive duplication (undersized) or wasted shared memory (oversized).

---

## Rule Name

Use Streaming for Large String Output

## Category

Performance

## Rule

Use output buffering or direct stream writes for generating large responses (CSV exports, large JSON). Never build the entire response string in memory.

## Reason

Building a 100MB response string in memory requires 100MB of peak memory plus the temporary strings created during construction. Streaming writes the output incrementally, keeping memory usage constant regardless of output size.

## Bad Example

```php
$csv = '';
foreach ($rows as $row) {
    $csv .= implode(',', $row) . "\n";  // Entire CSV in memory
}
return $csv;
```

## Good Example

```php
$handle = fopen('php://output', 'w');
foreach ($rows as $row) {
    fputcsv($handle, $row);  // Streamed — O(1) memory
}
```

## Exceptions

Small responses (<1MB) where the memory cost is negligible.

## Consequences Of Violation

Memory_limit fatal errors for large exports, unnecessary memory pressure on the server.
