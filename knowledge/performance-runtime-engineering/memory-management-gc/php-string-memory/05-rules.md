## Never build strings with `.=` in hot loops
---
Category: Performance
---
Collect string parts in an array and call `implode()` once after the loop. Avoid `.=`, `sprintf()` chaining, or repeated string concatenation inside loops.
---
Reason: `.=` allocates a new zend_string and copies the entire accumulated content for each iteration — O(n²) allocation cost.
---
Bad Example:
```php
$csv = '';
foreach ($rows as $row) {
    $csv .= implode(',', $row) . "\n"; // O(n²) allocation
}
```

Good Example:
```php
$lines = [];
foreach ($rows as $row) {
    $lines[] = implode(',', $row);
}
$csv = implode("\n", $lines); // O(n)
```
---
Exceptions: Loops with < 10 iterations and small strings (< 1KB total).
---
Consequences Of Violation: Quadratic allocation cost, measurable for loops > 100 iterations.

## Cast values explicitly when used as strings in hot paths
---
Category: Performance
---
Use explicit `(string)` cast or `strval()` instead of relying on implicit type juggling in performance-critical loops.
---
Reason: Implicit type juggling in string context (echo, concatenation, interpolation) creates a temporary zend_string allocation. Explicit cast communicates intent and may avoid redundant checks.
---
Bad Example:
```php
for ($i = 0; $i < 10000; $i++) {
    $log .= $value . ','; // Implicit cast on $value
}
```

Good Example:
```php
for ($i = 0; $i < 10000; $i++) {
    $log .= (string) $value . ','; // Explicit cast
}
```
---
Exceptions: Code paths called fewer than 100 times per request.
---
Consequences Of Violation: Hidden zend_string allocations per iteration — may add 0.5-2ms in hot loops.

## Stream large output instead of building strings in memory
---
Category: Architecture
---
Use `response()->stream()`, `fwrite()` to `php://output`, or chunked file reads for responses larger than 1MB.
---
Reason: Building a multi-MB string in memory temporarily doubles memory (original data + string buffer). Streaming keeps memory constant regardless of content size.
---
Bad Example:
```php
$csv = '';
// Build string in memory
foreach ($data as $row) {
    $csv .= implode(',', $row) . "\n";
}
return response($csv);
```

Good Example:
```php
return response()->stream(function () use ($data) {
    $handle = fopen('php://output', 'w');
    foreach ($data as $row) {
        fputcsv($handle, $row);
    }
    fclose($handle);
});
```
---
Exceptions: Small responses (< 100KB) where streaming adds unnecessary complexity.
---
Consequences Of Violation: Memory spike of 2× the response size — can exhaust limit for large payloads.

## Use sprintf() over string concatenation for formatted strings
---
Category: Performance
---
Prefer `sprintf()` when assembling a string from multiple parts with a fixed template.
---
Reason: `sprintf()` allocates a single zend_string for the result. Concatenation creates intermediate strings for each `.=` operation.
---
Bad Example:
```php
$message = 'User ' . $user->id . ' created ' . $count . ' records';
```

Good Example:
```php
$message = sprintf('User %s created %d records', $user->id, $count);
```
---
Exceptions: Performance guidance applies only to hot paths; readability may favor concatenation for simple cases.
---
Consequences Of Violation: Multiple temporary string allocations (3-5 intermediate strings for a typical formatted message).
