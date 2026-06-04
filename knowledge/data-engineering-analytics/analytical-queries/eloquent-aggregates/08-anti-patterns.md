# Anti-Patterns: Eloquent withSum/withAvg/withCount and Subquery Patterns

## N+1 Counting in Blade
The Blade template loops over `$users` and calls `$user->orders->count()` inside the loop. Each call lazy-loads all orders for that user. 100 users = 101 queries. With 10,000 orders per user, each query transfers 10K rows of data.

**Solution:** `User::withCount('orders')->get()`. The count is computed in the database and included as a `orders_count` column. One query, no data transfer overhead.

## withCount Without Index
`User::withCount('orders')` runs a correlated subquery: `SELECT COUNT(*) FROM orders WHERE user_id = users.id`. Without an index on `orders.user_id`, each of 100K subqueries scans the full orders table. Query time: minutes.

**Solution:** Add `INDEX orders_user_id_index (user_id)`. Review `EXPLAIN` output to verify index usage.

## Selecting All Columns With Aggregates
`User::withCount('orders')->get()` selects `*` from users, including `password`, `remember_token`, `api_token`. These columns are transferred unnecessarily.

**Solution:** `User::select('id', 'name', 'email')->withCount('orders')->get()`. Minimize data transfer.

## loadCount After Lazy Collection
`$users = User::all()` loads all 50K users. `$users->loadCount('orders')` loads 50K users and runs a second query for counts. Two round trips with 50K rows transferred twice.

**Solution:** `User::withCount('orders')->get()`. One round trip, counts are computed during the main query.
