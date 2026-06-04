# Anti-Patterns: Error Code Taxonomy

## Ambiguous Error Code
**Description:** Using a single error code `ERROR_001` for multiple entirely different error scenarios.
**Why it happens:** Developers don't invest in taxonomy design; one error code seems sufficient.
**Consequences:** Clients cannot programmatically determine what went wrong; every error requires message parsing.
**Better approach:** Unique error code per distinct, actionable error scenario.

## Code Reuse
**Description:** Reassigning an old error code to a new error scenario after the original scenario was removed.
**Why it happens:** Developers see a "free" code slot and fill it without considering existing clients.
**Consequences:** Existing client error handling that checked for `VALIDATION_001` now fires for a completely different error.
**Better approach:** Never reuse codes. Deprecate and leave the slot empty.

## Semantic Numbering Overreach
**Description:** Using 1xx for validation, 2xx for auth, 3xx for not-found, creating artificial constraints and gaps.
**Why it happens:** Developers want codes to encode more information than necessary.
**Consequences:** Gaps in numbering; pressure to fit errors into inappropriate ranges; complexity without benefit.
**Better approach:** Sequential numbering within categories. Simple and gap-free.

## Undocumented Code
**Description:** Error codes that exist in the codebase but are not documented anywhere consumers can find them.
**Why it happens:** Developers add codes for internal use without considering consumer needs.
**Consequences:** Consumers can't build client-side error handling because they don't know which codes exist.
**Better approach:** Document every code in API documentation. Generate documentation from code definitions.

## No Category Prefix
**Description:** Numeric-only error codes that don't include the category (001, 002).
**Why it happens:** Copying patterns from internal systems where error types are understood by context.
**Consequences:** Clients can't determine error category from the code alone; must parse response body structure.
**Better approach:** Always include the category prefix. `VALIDATION_001` not `001`.
