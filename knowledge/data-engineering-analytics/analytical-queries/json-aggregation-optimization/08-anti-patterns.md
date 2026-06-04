# Anti-Patterns: JSON Aggregation Query Optimization

## JSON Aggregation for Nested Relations
A query uses three levels of JSON aggregation to load users → orders → order_items. The resulting query is a 200-line SQL monster with nested subqueries. The JSON structure is 5 levels deep. Parsing the response is painful.

**Solution:** Use Eloquent `with()` for relationships deeper than one level. The per-query cost is worth the maintainability.

## No Pagination on JSON Aggregation
10K parent records with 50 related records each. JSON aggregation returns a single response with 10K rows, each containing a JSON array of 50 items. Total response: 500MB. The web server runs out of memory trying to serialize the response.

**Solution:** Paginate the parent query. Apply JSON aggregation per page. Set a maximum page size.

## JSON Aggregation Without Index
`SELECT users.*, json_agg(json_build_object('id', orders.id)) AS orders_json FROM users LEFT JOIN orders ON orders.user_id = users.id GROUP BY users.id`. No index on `orders.user_id`. The JOIN scans the full orders table for each user group.

**Solution:** Add `INDEX (user_id)` on orders table. Review query plan with `EXPLAIN ANALYZE`.

## JSON Aggregation When Models Are Needed
The API uses JSON aggregation but needs to return `UserResource` with `OrderResource` transformation. The developer manually maps JSON arrays to array structures, duplicating the Resource transformation logic.

**Solution:** Use Eloquent `with()` with `Resource::collection()`. The Resource layer handles transformation and keeps the code maintainable.
