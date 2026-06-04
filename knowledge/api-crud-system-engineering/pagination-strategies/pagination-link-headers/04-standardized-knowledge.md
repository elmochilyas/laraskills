| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Pagination Link Headers |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Offset Pagination Design, Cursor Pagination Design |
| **Metadata** | Standards | RFC 5988 (Web Linking), RFC 8288 |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Pagination link headers communicate navigational URLs in HTTP `Link` headers, following RFC 5988. This approach separates navigation metadata from the response body, allowing clients to discover `first`, `last`, `prev`, and `next` pages without parsing the payload. Link headers are the standard approach in many major APIs (GitHub, Stripe) and work with both offset and cursor pagination strategies.

## Core Concepts

- **RFC 5988 Web Linking**: `Link` header format: `<URL>; rel="relationship"`, where `rel` values define the navigation relationship.
- **Standard Pagination Rels**: `first`, `last`, `prev`, `next` — define page navigation paths.
- **Header vs Body**: Link headers separate navigation from data; response body contains only the data and minimal metadata.
- **Partial Link Set**: Cursor pagination supports only `prev` and `next`; `first` and `last` are not meaningful.
- **Query Parameter Preservation**: All link header URLs must include existing query parameters (filters, sort, search) to maintain context.

## When To Use

- When following REST best practices — Link headers are the most REST-idiomatic pagination approach.
- For APIs following the GitHub convention where Link headers are the primary navigation mechanism.
- When clients prefer header-based navigation logic instead of parsing response bodies.
- When response body space is limited and navigation metadata should be kept separate.
- Combined with body metadata for maximum client compatibility (recommended approach).

## When NOT To Use

- When some clients (browsers, simple HTTP clients) cannot access response headers easily.
- When link URLs contain very long cursors or complex parameters that exceed header size limits.
- When proxies, CDNs, or load balancers strip `Link` headers.
- When the API must conform strictly to JSON:API, which uses body-based pagination links.
- When header-only navigation would leave clients without enough context for debugging.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Include links in both headers and response body | Supports all clients regardless of how they access navigation metadata |
| Preserve all existing query parameters in link URLs | Clients navigating to next/prev pages retain their filter and sort context |
| Omit `first`/`last` for cursor pagination | Cursor pagination has no meaningful first/last page — including them misleads clients |
| Don't include `prev` on first page or `next` on last page | Clients use the presence/absence of these headers to determine boundaries |
| Percent-encode special characters in URLs | Cursor values containing `=`, `&`, `+` break link header parsing if not encoded |
| Validate link header format during development | Malformed headers cause client parsing failures |

## Architecture Guidelines

- Use `LengthAwarePaginator::toHeader()` in Laravel for automatic Link header generation with offset pagination.
- For cursor pagination, manually construct Link headers with only `prev` and `next`.
- Include link headers as a complement to body metadata, not a replacement.
- Test with target client libraries to ensure Link headers are parsed correctly.
- For APIs with long cursor values, consider body-only links to avoid header truncation.

## Performance Considerations

- Link header parsing is negligible — microseconds at most.
- Link headers add ~100-300 bytes to response headers; insignificant for most APIs.
- If the `Link` header changes between requests (new cursor values), ensure CDN cache keys include pagination parameters.
- For high-throughput microservices where every byte counts, consider body-only links.

## Security Considerations

- Link header URLs expose the API structure and parameter naming — ensure they don't leak sensitive information.
- Cursors in link header URLs may expose record ordering or timing data.
- Ensure link URLs use HTTPS to prevent man-in-the-middle manipulation of pagination navigation.
- Do not include session tokens, API keys, or authentication data in link header URLs.
- Validate incoming cursor/offset parameters from the request, even when clients follow link headers.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Including body-style URLs in Link headers | Copying full URL from response body | Missing proper RFC 5988 quoting and formatting | Generate header-specific URLs with `url()->current()` |
| Not preserving query parameters | Only including page param in links | Clients lose filter/sort/search context when navigating | Merge all existing query parameters into link URLs |
| Forgetting cursor pagination limitations | Automatically including first/last for all types | Cursor pagination can't provide first/last; misleads clients | Omit first/last for cursor pagination |
| Not handling header stripping by proxies | Relying solely on Link headers | Clients behind stripping proxies lose navigation entirely | Include links in body metadata as fallback |

## Anti-Patterns

- **Link headers only, no body fallback**: Breaks for clients that can't access headers (browsers, some HTTP clients).
- **Absolute URLs mixed with relative paths**: Inconsistent URL formats confuse clients.
- **Not encoding special characters in URLs**: Broke headers with `&`, `=`, `+` in cursor values.
- **Including `total` in headers instead of body**: No standard header for total count; use `X-Total-Count` or body metadata.
- **Generating link headers without the base URL**: Clients need absolute URLs for navigation.

## Examples

- **Complete Link header set (offset)**: `Link: <...?page=3>; rel="next", <...?page=1>; rel="prev", <...?page=1>; rel="first", <...?page=7>; rel="last"`
- **Partial Link header set (cursor)**: `Link: <...?cursor=abc>; rel="next", <...?cursor=def>; rel="prev"`
- **Laravel Link header generation**: `$paginator->toHeader()` for offset pagination.
- **Custom cursor Link header**: `Link: "<" . url()->current() . "?cursor=" . $cursor . ">; rel=\"next\""`
- **Combined approach**: Link headers + body `links` object for maximum compatibility.

## Related Topics

- Offset Pagination Design — Page-based link structure
- Cursor Pagination Design — Cursor-based link structure
- HATEOAS and Hypermedia Controls — Link headers as hypermedia controls
- Response Structure and Metadata — Body-based pagination metadata

## AI Agent Notes

- When generating pagination code, include both Link headers and body links by default.
- For cursor pagination, generate only `prev` and `next` links — omit `first` and `last`.
- Always merge existing query parameters (filters, sort) into generated link URLs.
- Validate that cursor values in link URLs are properly URL-encoded.
- Test with HTTP client libraries (curl, Guzzle, Axios) to confirm headers are parseable.

## Verification

- [ ] Link headers follow RFC 5988 format: `<URL>; rel="type"`
- [ ] All existing query parameters are preserved in link URLs
- [ ] Cursor pagination links omit `first` and `last`
- [ ] First page has no `prev` link; last page has no `next` link
- [ ] Special characters in URLs are percent-encoded
- [ ] Body metadata includes links as fallback (defensive pattern)
- [ ] Link headers are tested with target client libraries
- [ ] CDN/proxy stripping of Link headers has been accounted for
- [ ] URLs in Link headers use HTTPS
