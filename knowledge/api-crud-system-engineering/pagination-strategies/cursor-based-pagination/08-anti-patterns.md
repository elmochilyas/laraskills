# Anti-Patterns: Cursor-Based Pagination

## Cursor Without Index
**Description:** Using cursor pagination queries without an index on the cursor column, resulting in full table scans on every page request.
**Why it happens:** Developers focus on the pagination logic and forget database indexing.
**Consequences:** Deep pagination is slower than offset pagination; database performance degrades.
**Better approach:** Always index the cursor column. Use composite indexes for multi-column sorts.

## Exposed Raw Cursor
**Description:** Returning raw database IDs as cursor values without encoding, allowing clients to enumerate records.
**Why it happens:** Convenience — raw IDs are simple to implement.
**Consequences:** Clients can access any record by manipulating the cursor; security vulnerability.
**Better approach:** Encode cursors. Sign or encrypt for sensitive data.

## No has_more Detection
**Description:** Returning the last page without any indication that more records exist.
**Why it happens:** Developers don't fetch `per_page + 1` to check for next page.
**Consequences:** Clients don't know when pagination is complete; infinite scroll may stop prematurely.
**Better approach:** Always fetch one extra record to determine has_more.

## Total Count With Every Cursor Request
**Description:** Running `SELECT COUNT(*)` on every cursor-paginated request, defeating the performance benefit of cursor pagination.
**Why it happens:** Legacy requirements for total count display.
**Consequences:** Database load increases; pagination becomes slower than offset.
**Better approach:** Only compute total count when explicitly requested. Cache the count. Or remove the requirement.

## Offset-Cursor Confusion
**Description:** Using cursor pagination but accepting `?page=2` URL parameters, creating ambiguity.
**Why it happens:** Developers try to support both pagination styles simultaneously.
**Consequences:** Neither pagination strategy works correctly; results are inconsistent.
**Better approach:** Choose one strategy. Cursor uses `?cursor=` and `?after=`/`?before=`.
