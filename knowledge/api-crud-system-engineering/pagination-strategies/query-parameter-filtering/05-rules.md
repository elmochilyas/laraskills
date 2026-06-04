# Rules: Query Parameter Filtering

## Rule: Use Filter Allowlist
- **Condition:** When implementing query parameter filtering
- **Action:** Define an explicit allowlist of filterable fields. Reject or silently ignore filters on non-allowed fields.
- **Consequence:** Database schema is not exposed; injection surface is minimized.
- **Enforcement:** Integration tests verify unknown filter parameters are rejected.

## Rule: Use Scoped Filter Syntax
- **Condition:** When designing filter parameter format
- **Action:** Use `?filter[field]=value` syntax for clarity and extensibility. Avoid flat `?field=value` parameter naming.
- **Consequence:** Filters are clearly distinguished from other query parameters.
- **Enforcement:** API style guide documents scoped filter convention.

## Rule: Validate Filter Values
- **Condition:** When applying filter parameters to queries
- **Action:** Validate filter values before query execution. Return 422 for invalid filter values.
- **Consequence:** Prevents SQL errors from invalid filter input.
- **Enforcement:** Form Request validation covers filter parameter value validation.

## Rule: Use Parameterized Queries For Filters
- **Condition:** When building filter WHERE clauses
- **Action:** Always use parameterized queries or Eloquent where methods. Never concatenate filter values into SQL strings.
- **Consequence:** SQL injection is prevented.
- **Enforcement:** Static analysis detects raw SQL concatenation with filter input.

## Rule: Only Allow Filtering On Indexed Columns
- **Condition:** When defining filter allowlist
- **Action:** Verify that all filterable columns are indexed. Remove non-indexed columns from allowlist.
- **Consequence:** Filter queries use indexes; no full table scans.
- **Enforcement:** Database review verifies index coverage for filterable columns.
