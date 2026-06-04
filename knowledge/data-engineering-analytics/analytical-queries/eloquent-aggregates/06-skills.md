# Skills: Eloquent withSum/withAvg/withCount and Subquery Patterns

## Skill: Using withCount for Dashboard Widgets
**Purpose:** Replace N+1 relationship counting with efficient Eloquent aggregate queries.
**When to use:** Dashboard widgets that display counts from related tables.
**Steps:**
1. Identify N+1 patterns where relationships are counted in a loop
2. Replace with `withCount('relationship')` on the parent query
3. Use aliasing for multiple counts on the same relationship
4. Select only needed parent columns
5. Verify index exists on relationship foreign key
6. Review generated SQL using `->toSql()` during development
