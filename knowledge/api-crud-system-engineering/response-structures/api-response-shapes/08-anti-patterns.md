# Anti-Patterns: Response Structures

## Shape Inconsistency
**Description:** Mixing envelope and bare body responses across endpoints.
**Better approach:** Choose one shape and apply consistently. Envelope for public APIs, bare body for simple internal APIs.

## Missing Response Metadata
**Description:** Returning data without any context — no request ID, no pagination info, no links.
**Better approach:** Always include at minimum request ID in meta and self link in links.

## Over-Nesting
**Description:** Wrapping data in multiple unnecessary levels: `{ "response": { "result": { "data": { ... } } } }`.
**Better approach:** Flat envelope with one level of wrapping.

## Sensitive Data In Includes
**Description:** Allowing includes that expose sensitive relationships.
**Better approach:** Relationship allowlist excludes sensitive or internal relationships.

## No Compression
**Description:** Sending uncompressed JSON responses over the wire.
**Better approach:** Enable gzip/brotli at web server or CDN level. Reduces bandwidth by 70-90%.
