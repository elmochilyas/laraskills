# cursor-pagination-metadata Rules

## Rule 1: Always Encode Cursors as Opaque Base64 Strings
---
## Category
Security
---
## Rule
Always encode cursor values as base64-encoded strings before exposing them in responses, never return raw database column values.
---
## Reason
Raw cursors expose database internals (auto-increment IDs, timestamps) and enable clients to construct their own cursors, bypassing pagination constraints or guessing dataset size.
---
## Bad Example
```php
'meta' => [
    'next_cursor' => 15, // raw ID — exposes auto-increment internals
]
```
---
## Good Example
```php
'meta' => [
    'next_cursor' => base64_encode(json_encode([
        'id' => 15,
        'direction' => 'next',
    ])),
]
```
---
## Exceptions
Internal-only APIs on isolated networks with no external client access.
---
## Consequences Of Violation
Clients decode cursors, depend on internal structure, and break when encoding changes. Attackers enumerate IDs sequentially to estimate dataset size. Bad actors forge cursors to probe out-of-range data.

## Rule 2: Use a Unique Sort Column with a Tiebreaker
---
## Category
Reliability
---
## Rule
Always paginate by a unique column (typically primary key) or add a unique tiebreaker column to non-unique sort columns.
---
## Reason
Non-unique sort columns (like `created_at`) cause records with the same value to appear on multiple pages or be skipped entirely. A tiebreaker ensures deterministic, gap-free pagination.
---
## Bad Example
```php
$users = User::orderBy('created_at')->cursorPaginate(15);
// Multiple users created at the same timestamp — some appear on multiple pages
```
---
## Good Example
```php
$users = User::orderBy('created_at')->orderBy('id')->cursorPaginate(15);
// Primary key tiebreaker ensures deterministic ordering
```
---
## Exceptions
Columns guaranteed unique by database constraint (UUID, unique index).
---
## Consequences Of Violation
Duplicate records across pages or records missing entirely. Clients display duplicate data in infinite scroll UIs or miss records in data exports.

## Rule 3: Always Include `has_more` in Every Cursor-Paginated Response
---
## Category
Design
---
## Rule
Always return an explicit `has_more` boolean field in cursor pagination metadata, never rely on null `next_cursor` as the sole end-of-data signal.
---
## Reason
A null `next_cursor` is ambiguous — it could mean no more data or a server error omitted the field. `has_more` is an explicit, unambiguous contract that clients can safely use for UI state decisions.
---
## Bad Example
```php
'meta' => [
    'next_cursor' => null,
    'prev_cursor' => 'abc123',
    // has_more missing — client must guess if there's more data
]
```
---
## Good Example
```php
'meta' => [
    'next_cursor' => null,
    'prev_cursor' => 'abc123',
    'has_more' => false,
]
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client UIs show "load more" buttons indefinitely or hide end-of-list indicators. Mobile apps make unnecessary network requests that return empty data.

## Rule 4: Validate and Sanitize Incoming Cursors
---
## Category
Security
---
## Rule
Always validate incoming cursor format and return 422 Unprocessable Entity for invalid, malformed, or tampered cursor values.
---
## Reason
Invalid cursor strings can cause unserialize errors, SQL injection attempts, or application crashes. Returning 422 signals a client error without revealing internal details.
---
## Bad Example
```php
$cursor = $request->input('cursor');
$decoded = json_decode(base64_decode($cursor)); // crash on malformed string
```
---
## Good Example
```php
use Illuminate\Validation\ValidationException;

$cursor = $request->input('cursor');
if ($cursor && ! base64_decode($cursor, true)) {
    throw ValidationException::withMessages([
        'cursor' => ['The cursor value is invalid.'],
    ]);
}
$decoded = json_decode(base64_decode($cursor), true);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
500 error page served to clients sending malformed cursors. Attackers probe cursor encoding with crafted payloads. Application logs fill with decode errors.

## Rule 5: Never Rely on Total Count with Cursor Pagination
---
## Category
Performance
---
## Rule
Never execute a `COUNT(*)` query to determine total records when using cursor pagination.
---
## Reason
Cursor pagination's primary advantage is eliminating the expensive count query. Defeating this by adding `COUNT(*)` removes the performance benefit while keeping cursor pagination's complexity.
---
## Bad Example
```php
$total = User::count(); // defeats the purpose — still does full count
$users = User::orderBy('id')->cursorPaginate(15);
```
---
## Good Example
```php
$users = User::orderBy('id')->cursorPaginate(15);
// No count query — has_more determined by fetching per_page + 1 records
```
---
## Exceptions
When total count is absolutely required and the dataset is small enough that the count query cost is negligible (under 10K rows).
---
## Consequences Of Violation
Response time dominated by full table/index scan for `COUNT(*)` on large tables. Cursor pagination effectively downgrades to offset pagination performance without the benefits.

## Rule 6: Omit `prev_cursor` in Forward-Only Infinite Scroll UIs
---
## Category
Design
---
## Rule
Always omit `prev_cursor` from cursor pagination metadata on endpoints designed for forward-only infinite scroll UIs.
---
## Reason
Forward-only UIs never need backward navigation. Exposing `prev_cursor` adds payload bytes, encourages client code that may attempt backward navigation, and implies backward pagination support that is not tested or maintained.
---
## Bad Example
```php
// Activity stream — only forward navigation ever used
'meta' => [
    'next_cursor' => 'eyJpZCI6MzB9',
    'prev_cursor' => 'eyJpZCI6MTV9', // never used — wasted bytes
]
```
---
## Good Example
```php
// Activity stream — minimal metadata
'meta' => [
    'next_cursor' => 'eyJpZCI6MzB9',
    'prev_cursor' => null,
    'has_more' => true,
]
```
---
## Exceptions
Bidirectional interfaces like admin panels, messaging apps, and audit logs that support both forward and backward navigation.
---
## Consequences Of Violation
Unnecessary payload bytes on bandwidth-constrained mobile APIs. Client developers implement backward pagination that is never tested server-side and breaks silently.

## Rule 7: Include Sort Direction in the Cursor Payload
---
## Category
Reliability
---
## Rule
Always encode the sort direction (ascending/descending) and a before/after flag inside the cursor payload, not just the cursor column value.
---
## Reason
Without direction information, the server cannot determine whether a received cursor should paginate forward or backward. Clients may request the next page using a cursor from a previous page response, and the server needs to know the original direction.
---
## Bad Example
```php
$cursor = base64_encode(json_encode([
    'id' => 15,
    // missing: direction, before/after flag
]));
```
---
## Good Example
```php
$cursor = base64_encode(json_encode([
    'id' => 15,
    'direction' => 'next',
    'pointsToNextItems' => true,
]));
```
---
## Exceptions
Forward-only pagination endpoints where direction is always "next."
---
## Consequences Of Violation
Server misinterprets cursor direction, returning pages in the wrong order or skipping records. Bidirectional pagination produces inconsistent results when navigating back and forth.
