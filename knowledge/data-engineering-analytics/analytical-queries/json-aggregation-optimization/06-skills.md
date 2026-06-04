# Skills: JSON Aggregation Query Optimization

## Skill: Implementing JSON Aggregation in Laravel
**Purpose:** Replace N+1 relationship loading with a single JSON aggregation query.
**When to use:** API endpoints or widgets loading parent + related data for > 100 parent records.
**Steps:**
1. Identify the parent query and eager-loaded relationship
2. Write the JSON aggregation using `json_agg` (PostgreSQL) or `JSON_ARRAYAGG` (MySQL)
3. Include `json_build_object` (PostgreSQL) or `JSON_OBJECT` (MySQL) for shaping related data
4. Use `addSelect` or `DB::raw` to add the JSON column to the parent query
5. Paginate the parent query to limit result size
6. Verify index on the JOIN column
7. Benchmark against the original Eloquent query
8. Document the JSON structure for API consumers
