# Pagination Link Headers — Phase 5 Rules

## Include Links in Both Headers and Response Body
---
## Category
Reliability | Design
---
## Rule
Always include pagination links in both HTTP `Link` headers and the response body `links` object for maximum client compatibility.
---
## Reason
Some clients (browsers, simple HTTP libraries) cannot easily access response headers; others (GitHub API client libraries) expect header-based navigation. Dual inclusion supports all clients.
---
## Bad Example
```php
// Link headers only — clients that can't read headers lose navigation
return response()->json($data)
    ->header('Link', '<...>; rel="next"');
```
---
## Good Example
```php
// Both headers and body — maximum compatibility
return response()->json([
    'data' => $data,
    'links' => [
        'first' => '...',
        'last' => '...',
        'prev' => '...',
        'next' => '...',
    ],
])->header('Link', '<...>; rel="next", <...>; rel="prev"');
```
---
## Exceptions
Bandwidth-constrained environments where every byte matters and clients can handle headers.
---
## Consequences Of Violation
Broken navigation for clients that cannot parse headers; missing navigation for HTTP client libraries.
---

## Use RFC 5988 Format for Link Headers
---
## Category
Design | Maintainability
---
## Rule
Format `Link` headers strictly per RFC 5988: `<URL>; rel="relationship"`, with proper quoting and comma-separation.
---
## Reason
Client libraries parse `Link` headers expecting RFC 5988 format. Deviations (missing angle brackets, wrong quoting, missing commas) cause parsing failures and lost navigation.
---
## Bad Example
```php
// Non-standard format — clients fail to parse
return response()->json($data)
    ->header('Link', 'next: /api/posts?page=2');
```
---
## Good Example
```php
// RFC 5988 format — parsable by all standard clients
return response()->json($data)
    ->header('Link', '</api/posts?page=2>; rel="next", </api/posts?page=1>; rel="prev"');
```
---
## Exceptions
No common exceptions — always follow RFC 5988.
---
## Consequences Of Violation
Client link parsing failures; broken navigation; support incidents.
---

## Preserve All Existing Query Parameters in Link URLs
---
## Category
Reliability | Design
---
## Rule
Merge all current query parameters (filters, sort, search) into generated pagination link URLs.
---
## Reason
Clients navigating to next/prev pages expect to retain their current filter, sort, and search context. Omitting these parameters breaks the user's session — they lose their filter state.
---
## Bad Example
```php
// Only page parameter — loses filter context
// Current URL: /api/posts?status=published&category=tech&page=2
// Next link: /api/posts?page=3
// Client loses status and category filters
```
---
## Good Example
```php
// All query parameters preserved in links
// Current URL: /api/posts?status=published&category=tech&page=2
// Next link: /api/posts?status=published&category=tech&page=3
$queryParams = $request->except('page');
$nextUrl = url()->current() . '?' . http_build_query(array_merge($queryParams, ['page' => $page + 1]));
```
---
## Exceptions
When specific parameters are session-only and should not be preserved across pagination.
---
## Consequences Of Violation
Broken filter context; user confusion; incorrect data display across pages.
---

## Omit first and last Links for Cursor Pagination
---
## Category
Design | Reliability
---
## Rule
Include only `prev` and `next` links in cursor-paginated responses; never include `first` or `last`.
---
## Reason
Cursor pagination has no meaningful first or last page — the cursor can only navigate sequentially forward or backward. Including `first`/`last` misleads clients into attempting random page access, which cursor pagination does not support.
---
## Bad Example
```php
// Including first/last for cursor pagination — misleading
// Link: </api/posts?cursor=abc>; rel="first"  ← No meaningful first page
// Link: </api/posts?cursor=xyz>; rel="last"   ← No meaningful last page
```
---
## Good Example
```php
// Only prev and next for cursor pagination
// Link: </api/posts?cursor=abc>; rel="next"
// Link: </api/posts?cursor=def>; rel="prev"
```
---
## Exceptions
No common exceptions — cursor pagination never has meaningful first/last pages.
---
## Consequences Of Violation
Misleading API responses; clients attempt unsupported random page access; errors.
---

## Omit prev on First Page and next on Last Page
---
## Category
Design | Maintainability
---
## Rule
Do not include `prev` link when on the first page; do not include `next` link when on the last page. Never include links with `rel="prev"` pointing to the current page or `rel="next"` with an invalid cursor.
---
## Reason
Clients use the presence or absence of `prev`/`next` to determine pagination boundaries. Including a `prev` link on page 1 or a `next` link that goes to an empty page confuses client logic.
---
## Bad Example
```php
// prev link on first page — client assumes there is a previous page
// Link: </api/posts?page=0>; rel="prev" — Page 0 doesn't exist
```
---
## Good Example
```php
// First page: no prev link
// Link: </api/posts?page=2>; rel="next", </api/posts?page=1>; rel="first", </api/posts?page=7>; rel="last"
// Last page: no next link
// Link: </api/posts?page=1>; rel="first", </api/posts?page=6>; rel="prev"
```
---
## Exceptions
No common exceptions — omit non-existent links.
---
## Consequences Of Violation
Client attempts to navigate to invalid pages; confusing behavior; possible errors.
---

## Percent-Encode Special Characters in Link URLs
---
## Category
Reliability
---
## Rule
Ensure cursor values and query parameters in link URLs are properly percent-encoded to handle special characters (`=`, `&`, `+`, `#`).
---
## Reason
Cursor values often contain base64 padding (`=`), query separators (`&`, `=`), and other characters that break URL parsing. Unencoded special chars in `Link` headers cause header parsing failures and broken links.
---
## Bad Example
```php
// URL-encoded cursor — special chars break header parsing
$url = '/api/posts?cursor=abc123=='; // = breaks header parsing
// Header: Link: </api/posts?cursor=abc123==>; rel="next"
// Header parser may fail on = in URL
```
---
## Good Example
```php
// Percent-encode the cursor value
$encodedCursor = urlencode($cursor); // abc123%3D%3D
$url = '/api/posts?cursor=' . $encodedCursor;
// Header: Link: </api/posts?cursor=abc123%3D%3D>; rel="next"
// Properly parsable by all clients
```
---
## Exceptions
When cursor values are guaranteed to contain only URL-safe characters (alphanumeric, `-`, `_`, `.`, `~`).
---
## Consequences Of Violation
Broken link parsing; client navigation failures; support incidents.
---

## Validate Link Header Format During Development
---
## Category
Testing | Maintainability
---
## Rule
Write tests that validate `Link` header format, URL encoding, and parameter preservation during CI — not just in response body assertions.
---
## Reason
`Link` headers are easy to construct incorrectly (RFC 5988 format violations, missing encoding, omitted parameters). Automated tests catch these issues before they reach clients.
---
## Bad Example
```php
// Testing only response body, not headers
public function test_pagination(): void
{
    $response = $this->get('/api/posts?page=2');
    $response->assertJsonStructure(['data', 'links']);
    // Link header not tested — may be malformed
}
```
---
## Good Example
```php
public function test_pagination_links(): void
{
    $response = $this->get('/api/posts?status=active&page=2');
    $response->assertHeader('Link');
    
    $linkHeader = $response->headers->get('Link');
    $this->assertStringContainsString('rel="next"', $linkHeader);
    $this->assertStringContainsString('status=active', $linkHeader); // Parameter preserved
    $this->assertMatchesRegularExpression('/^<https?:\/\/[^>]+>; rel="[a-z]+"/', $linkHeader);
}
```
---
## Exceptions
No common exceptions — always test Link header format.
---
## Consequences Of Violation
Malformed headers deployed to production; client navigation failures discovered post-deployment.
---

## Account for CDN/Proxy Stripping of Link Headers
---
## Category
Reliability
---
## Rule
Always include body-based links as a fallback since CDNs and reverse proxies may strip `Link` headers.
---
## Reason
Some CDNs, load balancers, and proxies remove non-standard or non-cacheable headers. If your API relies solely on `Link` headers, clients behind such infrastructure lose all pagination navigation.
---
## Bad Example
```php
// Relying solely on Link headers — lost behind proxy
return response()->json(['data' => $data])
    ->header('Link', '<...>; rel="next"');
// Body has no links — clients behind stripping proxies cannot navigate
```
---
## Good Example
```php
// Links in both headers and body — proxy-safe
return response()->json([
    'data' => $data,
    'links' => [
        'first' => '...',
        'last' => '...',
        'prev' => '...',
        'next' => '...',
    ],
])->header('Link', '<...>; rel="next", <...>; rel="prev"');
```
---
## Exceptions
When CDN behavior is fully understood and `Link` headers are explicitly allowed.
---
## Consequences Of Violation
Clients behind stripping proxies cannot navigate paginated results; support escalations.
---

## Ensure Link URLs Use HTTPS
---
## Category
Security
---
## Rule
Always generate `Link` header URLs with HTTPS scheme; never allow HTTP in pagination links.
---
## Reason
HTTP links in pagination responses can expose navigation patterns to man-in-the-middle interception and manipulation. HTTPS ensures link integrity and prevents mixed content warnings in client applications.
---
## Bad Example
```php
// HTTP link — vulnerable to MITM manipulation
$url = 'http://api.example.com/posts?page=2';
```
---
## Good Example
```php
// HTTPS link — secure and tamper-protected in transit
$url = 'https://api.example.com/posts?page=2';
// Laravel's url()->current() respects the request scheme
// Ensure APP_URL is set to HTTPS in production
```
---
## Exceptions
Development environments where HTTPS is not configured.
---
## Consequences Of Violation
Mixed content warnings; MITM manipulation of pagination navigation; security audit failures.
