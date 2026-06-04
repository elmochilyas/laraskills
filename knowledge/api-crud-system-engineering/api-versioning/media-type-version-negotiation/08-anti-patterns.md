# Anti-Patterns: Media Type Version Negotiation

## Missing Vary Header
**Description:** Responding to version-negotiated requests without including `Vary: Accept` in the response.
**Why it happens:** Developers forget that caching infrastructure needs this hint.
**Consequences:** CDNs and proxies cache one version and serve it to clients requesting different versions.
**Better approach:** Always include `Vary: Accept` on negotiated responses. Test with automated header assertions.

## Silent 406 Fallback
**Description:** When a client requests an unsupported version, the server silently returns the latest version instead of 406.
**Why it happens:** Developers think "falling back to latest is better than returning an error."
**Consequences:** Clients don't know they're requesting an unsupported version. They may depend on behavior that will change.
**Better approach:** Return 406 with documentation link. The client must explicitly update its Accept header.

## URL-Accept Dual Versioning
**Description:** Specifying version in both URL path and Accept header, creating ambiguity when they conflict.
**Why it happens:** Teams transition from URL versioning to media type negotiation but support both during migration.
**Consequences:** Confusing behavior when URL says v2 but Accept says v3. Which wins?
**Better approach:** Pick one strategy. During migration, use a header to indicate which strategy the client follows.

## Content-Type Mismatch
**Description:** Server negotiates version from Accept header but responds with Content-Type matching a different version.
**Why it happens:** The controller serves data from a different version's handler than what the client requested.
**Consequences:** Client parses response assuming one version but receives another.
**Better approach:** Set response Content-Type from the negotiated version attribute, not from controller logic.

## Vary Header Stripping
**Description:** The Vary header is set by the application but stripped by CDN, reverse proxy, or load balancer.
**Why it happens:** Infrastructure configuration that strips unknown headers.
**Consequences:** Cached responses served to wrong clients despite Vary being set.
**Better approach:** Verify CDN/proxy Vary handling in staging. Consider version-specific cache keys as backup.
