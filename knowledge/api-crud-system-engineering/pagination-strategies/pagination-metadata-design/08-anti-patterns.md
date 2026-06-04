# Anti-Patterns: Pagination Metadata Design

## Missing Navigation Links
**Description:** Returning pagination metadata (current_page, total) but no URLs for navigating between pages.
**Why it happens:** Developers think metadata fields are sufficient for client navigation.
**Consequences:** Clients must construct URLs themselves, leading to inconsistency and errors.
**Better approach:** Always include first, prev, next, last URLs.

## Inconsistent Metadata Structure
**Description:** Different endpoints returning pagination metadata in different locations or formats.
**Why it happens:** No centralized pagination metadata builder.
**Consequences:** Client-side pagination handling requires endpoint-specific logic.
**Better approach:** Standardize pagination metadata format across all endpoints using a shared response structure.

## Metadata Overload
**Description:** Including unnecessary fields in pagination metadata that clients never use.
**Why it happens:** Default paginator output includes all possible fields.
**Consequences:** Response bloat; confusion about which fields are important.
**Better approach:** Include only what consumers need. Customize via API resource.
