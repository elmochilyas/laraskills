# Rules: Query Parameter Sorting

## Rule: Use Sort Allowlist
- **Condition:** When implementing sort parameters
- **Action:** Define an explicit allowlist of sortable fields. Reject or ignore sorting on disallowed fields.
- **Consequence:** Prevents sorting on non-indexed or sensitive columns.
- **Enforcement:** Integration tests verify invalid sort fields are rejected.

## Rule: Default Sort To Primary Key Descending
- **Condition:** When no sort parameter is provided
- **Action:** Default the sort order to `-id` (primary key descending) for consistent pagination ordering.
- **Consequence:** New records appear first; pagination is consistent across requests.
- **Enforcement:** Review verifies default sort is defined for all list endpoints.

## Rule: Use `-` Prefix For Descending Order
- **Condition:** When defining sort parameter format
- **Action:** Use `?sort=-field` for descending and `?sort=field` for ascending. Prefix with `-` for descending.
- **Consequence:** Intuitive syntax; multi-column sort supported with commas.
- **Enforcement:** API style guide documents sort parameter format.

## Rule: Sort Only On Indexed Columns
- **Condition:** When defining sort allowlist
- **Action:** Verify all sortable columns are indexed. Remove non-indexed columns from allowlist.
- **Consequence:** No filesort operations; queries remain performant.
- **Enforcement:** Database review verifies index coverage for sortable columns.

## Rule: Validate Sort Parameters Before Query
- **Condition:** When accepting sort parameters
- **Action:** Parse and validate sort parameters before applying to the query. Return 422 for invalid sort fields.
- **Consequence:** Consumers receive clear error for invalid sort; SQL injection prevented.
- **Enforcement:** Form Request validation covers sort parameter validation.
