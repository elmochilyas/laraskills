# Rules: API Response Shapes

## Rule: Choose One Response Shape Consistently
- **Condition:** When designing API response format
- **Action:** Choose either envelope or bare body and apply to all endpoints. Never mix shapes.
- **Consequence:** Consistent consumer experience; unified client-side parsing.
- **Enforcement:** Architecture tests verify consistent shape across all endpoints.

## Rule: Standardize Collection Response Structure
- **Condition:** When returning lists of resources
- **Action:** All collection responses follow the same structure: `{ "data": [...], "meta": {...}, "links": {...} }`.
- **Consequence:** Generic client pagination handling works for all lists.
- **Enforcement:** Contract tests verify collection response structure.

## Rule: Standardize Error Response Structure
- **Condition:** When returning error responses
- **Action:** All error responses follow the same structure with `code`, `message`, and optional `details` fields.
- **Consequence:** Error handling is universal across endpoints.
- **Enforcement:** Integration tests verify error response structure.

## Rule: Never Change Shape After Launch
- **Condition:** When maintaining a published API
- **Action:** Response shape changes require a new API version. Never change the envelope structure within a version.
- **Consequence:** Existing consumers are not broken by structural changes.
- **Enforcement:** Contract tests compare response shape against baseline.
