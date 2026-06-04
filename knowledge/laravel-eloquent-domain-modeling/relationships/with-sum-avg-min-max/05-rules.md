# withSum / withAvg / withMin / withMax Rules

## Rule: Aggregate-Over-Loading-Collection
---
## Category
Performance
---
## Rule
Use `withSum()`/`withAvg()`/`withMin()`/`withMax()` instead of loading related models and aggregating in PHP.
---
## Reason
Loading all related models just to compute a sum or average hydrates thousands of unnecessary objects. Database-side aggregation with a subquery is dramatically more efficient.
---
## Bad Example
```php
$orders = Order::with('items')->get();
$orders->each(fn($o) => $o->items->sum('price')); // Hydrates all items
```
---
## Good Example
```php
$orders = Order::withSum('items', 'price')->get();
// $order->items_sum_price — no item model hydration
```
---
## Exceptions
When the related models are needed for display alongside the aggregate.
---
## Consequences Of Violation
Memory bloat, slow responses, excessive data transfer.

## Rule: Aggregate-Handle-NULL-Results
---
## Category
Reliability
---
## Rule
Always handle `NULL` results from aggregate subqueries — empty child sets return `NULL`, not `0`.
---
## Reason
SQL aggregates return `NULL` for empty sets. Code that assumes a numeric return value may crash or produce incorrect results when no related records exist.
---
## Bad Example
```php
$order->items_sum_price; // NULL if no items
$total = $order->items_sum_price + 10; // NULL + 10 = NULL in some contexts
```
---
## Good Example
```php
$total = ($order->items_sum_price ?? 0) + 10;
```
---
## Exceptions
When the relationship is guaranteed to have at least one related record.
---
## Consequences Of Violation
Unexpected null values, arithmetic errors, application crashes.

## Rule: Aggregate-Index-Columns
---
## Category
Performance
---
## Rule
Create a composite index on `(foreign_key, aggregate_column)` for each aggregate subquery.
---
## Reason
Aggregate subqueries filter by FK and then scan/order by the aggregate column. A composite index covering both columns enables efficient index-only scans for the aggregation.
---
## Bad Example
```php
$table->foreignId('order_id')->constrained()->index();
// Only FK indexed — SUM scans all matching rows
```
---
## Good Example
```php
$table->foreignId('order_id')->constrained();
$table->decimal('price', 10, 2);
$table->index(['order_id', 'price']); // Composite index for SUM/AVG
```
---
## Exceptions
Trivially small tables where full scans are acceptable.
---
## Consequences Of Violation
Slow correlated subqueries, full table scans per parent row.

## Rule: Aggregate-Limit-Per-Query
---
## Category
Performance
---
## Rule
Limit aggregate methods to 3 or fewer per query — each adds a correlated subquery to the SELECT clause.
---
## Reason
Each aggregate adds an independent subquery. Five aggregates = five subqueries. The query plan becomes complex and execution time multiplies.
---
## Bad Example
```php
$products = Product::withSum('orderItems', 'revenue')
    ->withAvg('reviews', 'rating')
    ->withMin('variants', 'price')
    ->withMax('variants', 'price')
    ->withSum('views', 'count')
    ->get();
// 5 subqueries — potentially slow
```
---
## Good Example
```php
$products = Product::withSum('orderItems', 'revenue')
    ->withAvg('reviews', 'rating')
    ->get();
// 2 subqueries — manageable
```
---
## Exceptions
When the result set is small (under 100 rows) and performance is not critical.
---
## Consequences Of Violation
Slow queries, complex query plans, performance degradation.

## Rule: Aggregate-AVG-Float-Awareness
---
## Category
Reliability
---
## Rule
Be aware that `withAvg()` always returns a float, regardless of the underlying column type.
---
## Reason
SQL `AVG()` always returns a float. Code expecting an integer from an integer column may receive unexpected decimal values.
---
## Bad Example
```php
// rating column is integer
$product->reviews_avg_rating; // 4.5 (float), not 4 or 5 (int)
```
---
## Good Example
```php
// Cast to expected type
$roundedRating = round($product->reviews_avg_rating ?? 0);
```
---
## Exceptions
When float precision is the expected behavior.
---
## Consequences Of Violation
Type mismatch, unexpected serialization output.

## Rule: Aggregate-Column-Name-Validation
---
## Category
Security
---
## Rule
Never pass user input directly as the column name parameter in aggregate methods — SQL injection risk via column name.
---
## Reason
The column name in aggregate methods is interpolated directly into the SQL query. User-controlled column names allow SQL injection.
---
## Bad Example
```php
Order::withSum('items', $request->input('column')); // SQL injection vector
```
---
## Good Example
```php
$allowed = ['price', 'quantity', 'discount'];
$column = in_array($request->input('column'), $allowed) ? $request->input('column') : 'price';
Order::withSum('items', $column);
```
---
## Exceptions
When the column name comes from a trusted internal source only.
---
## Consequences Of Violation
SQL injection vulnerability, data breach, database compromise.

## Rule: Aggregate-Default-For-NULL
---
## Category
Reliability
---
## Rule
Use `COALESCE` in a raw expression or `??` in PHP to provide a default value for nullable aggregate results.
---
## Reason
Aggregates of empty child sets return `NULL`. Downstream code expecting numeric values crashes or produces incorrect results without a default.
---
## Bad Example
```php
$totalRevenue = $order->items_sum_price; // NULL for empty order
echo "Revenue: $totalRevenue"; // Displays "Revenue: " or errors
```
---
## Good Example
```php
$totalRevenue = $order->items_sum_price ?? 0.00;
echo "Revenue: $totalRevenue"; // Displays "Revenue: 0.00"
```
---
## Exceptions
When the relationship is guaranteed non-empty.
---
## Consequences Of Violation
Null display values, arithmetic errors, application crashes.
