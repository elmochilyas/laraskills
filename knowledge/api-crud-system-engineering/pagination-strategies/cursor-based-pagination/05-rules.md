# Rules: Cursor-Based Pagination

## Rule: Use Primary Key As Default Cursor Column
- **Condition:** When implementing cursor-based pagination
- **Action:** Default the cursor column to the primary key (auto-incrementing ID). Provide configuration for custom cursor columns.
- **Consequence:** Default cursor is unique, indexed, and monotonically increasing.
- **Enforcement:** Code review verifies cursor column is unique and indexed.

## Rule: Encode Cursors For Transport
- **Condition:** When returning cursor values in API responses
- **Action:** Base64-encode cursor values with metadata (column name, direction). Never expose raw database values.
- **Consequence:** Prevents enumeration and tampering.
- **Enforcement:** Integration tests verify cursors are encoded, not raw IDs.

## Rule: Include has_more Indicator
- **Condition:** In every cursor-paginated response
- **Action:** Note whether more results exist by fetching `per_page + 1` records and only returning `per_page`. Include a boolean `has_more` field.
- **Consequence:** Clients know when to stop paginating.
- **Enforcement:** API contract tests verify has_more field presence.

## Rule: Support Forward and Backward Navigation
- **Condition:** When designing cursor pagination API
- **Action:** Accept both `after` and `before` cursor parameters. Support navigating in both directions.
- **Consequence:** Full pagination UX without page numbers.
- **Enforcement:** Integration tests verify both after and before cursors work.

## Rule: Validate and Sign Cursors
- **Condition:** When accepting cursors from client requests
- **Action:** Validate cursor format on input. Sign or encrypt cursors to prevent tampering. Reject invalid cursors with 422.
- **Consequence:** Malicious cursors cannot enumerate records or cause query errors.
- **Enforcement:** Security tests verify tampered cursors are rejected.
