# Anti-Patterns: Query String Versioning

## Version As Required Parameter
**Description:** Making the version query parameter required and returning 400 when omitted.
**Why it happens:** Developers design versioning for explicit usage without considering unversioned consumers.
**Consequences:** All existing consumers break when versioning is introduced; new consumers must know to add the parameter.
**Better approach:** Always default to the latest version when the parameter is missing. Make versioning opt-in.

## Minor Version Creep
**Description:** Accepting and serving distinct versions for `?version=2.0`, `?version=2.1`, `?version=2.2` as if they're different API versions.
**Why it happens:** Teams want to signal minor changes through the version parameter.
**Consequences:** Explosive growth in supported versions; maintenance burden multiplies.
**Better approach:** Major versions only. Minor changes are backward-compatible within a major version. Communicate via changelog.

## Cache Fragmentation Ignorance
**Description:** Using query string versioning on cache-heavy endpoints without considering cache fragmentation.
**Why it happens:** Cache behavior of query parameters is not obvious during development.
**Consequences:** Cache hit rates drop dramatically as unique query strings multiply.
**Better approach:** Either use header-based versioning (doesn't fragment URL caches) or normalize query parameters at the CDN/proxy level.

## No Feedback Header
**Description:** Not returning X-Api-Version header, so clients don't know which version they received.
**Why it happens:** Developers assume the version in the request is the version in the response.
**Consequences:** Clients make assumptions about which version behavior they're receiving, leading to subtle bugs.
**Better approach:** Always return X-Api-Version header with the resolved version number.
