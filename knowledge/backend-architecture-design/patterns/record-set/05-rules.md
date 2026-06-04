## Rule 1: Record Set is an in-memory representation of tabular data, usually from SQL
---
## Category
Architecture
---
## Rule
A Record Set is a collection of rows (usually all rows from a query result) passed around as a generic data structure, typically represented as `array` or `Collection` in PHP.
---
## Reason
Record Set provides a simple, generic way to pass tabular data without defining a typed class for every query result.
---
## Bad Example
```php
class OrderReport
{
    // Typed class for every query result
}
```
---
## Good Example
```php
// Record Set as Collection of arrays/stdClass
$orders = DB::table('orders')->where('status', 'pending')->get();
// $orders is a Record Set
```
---
## Exceptions
When the Record Set needs behavior (formatting, validation) that warrants a typed class.
---
## Consequences Of Violation
Too many small typed classes for simple query results.
---
## Rule 2: Record Set should be passed by value (immutable)
---
## Category
Architecture
---
## Rule
Do not mutate Record Sets after creation; treat them as read-only data structures. Create new Record Sets for transformed data.
---
## Reason
Mutable Record Sets cause side effects that are hard to trace, especially when passed across multiple layers.
---
## Bad Example
```php
$orders = DB::table('orders')->get();
foreach ($orders as $order) {
    $order->computed = $order->total * 0.9; // mutation
}
```
---
## Good Example
```php
$orders = DB::table('orders')->get();
$orders = $orders->map(fn($o) => (object) [
    ...(array) $o,
    'computed' => $o->total * 0.9,
]);
```
---
## Exceptions
When the Record Set is scoped to a single method and mutation is obvious and contained.
---
## Consequences Of Violation
Side effects, hard-to-trace mutations, data corruption.
---
## Rule 3: Keep Record Set operations declarative using collection pipelines
---
## Category
Architecture
---
## Rule
Use `map()`, `filter()`, `reduce()` on Record Sets rather than imperative loops with mutations.
---
## Reason
Declarative pipelines communicate intent clearly and are less error-prone than imperative loops.
---
## Bad Example
```php
$result = [];
foreach ($orders as $order) {
    if ($order->status === 'pending') {
        $result[] = $order->total;
    }
}
```
---
## Good Example
```php
$result = $orders
    ->filter(fn($o) => $o->status === 'pending')
    ->pluck('total');
```
---
## Exceptions
Performance-critical sections where pipeline overhead is significant.
---
## Consequences Of Violation
Imperative code, higher bug rate, less readable.
