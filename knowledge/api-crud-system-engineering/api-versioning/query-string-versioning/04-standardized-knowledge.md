# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Query String Versioning
**Difficulty:** Intermediate
**Category:** API Versioning
**Last Updated:** 2026-06-03

---

# Overview

Query String Versioning is an API versioning strategy where the client specifies the desired version via a query parameter (e.g. `?version=2`). It exists as the simplest versioning mechanism to implement — requiring only middleware that reads a query parameter and resolves the version. It is popular for internal APIs and development environments where quick version switching is valuable.

Engineers must care because while query string versioning is the easiest to implement, it has significant implications for caching, URL cleanliness, and consumer experience. Understanding when to use it and when to choose alternatives is essential for making appropriate architectural tradeoffs.

---

# Core Concepts

**Query Parameter Resolution:** A middleware reads the version from the query string (`?version=2`), validates the format, and attaches the resolved version to the request for downstream use.

**Default Version:** When no version parameter is provided, the system defaults to the latest (or a configured) version. Missing version should never produce an error.

**Validation:** The version parameter must be validated — numeric only, within supported range, no minor versions. Invalid values return 400 Bad Request.

**X-Api-Version Header:** The response includes a header indicating which version was actually served, preventing consumer confusion about which version was returned.

**Cache Fragmentation:** Each unique query string creates a separate cache entry, potentially fragmenting cache storage and reducing hit rates.

---

# When To Use

- Internal APIs where URL cleanliness is not a priority
- Development and staging environments for quick version switching
- Simple APIs with few consumers and simple caching needs
- Feature flag trials where version toggles feature sets
- Migrating from unversioned to versioned APIs (adds versioning with zero URL restructuring)

---

# When NOT To Use

- Public APIs — version parameter can be accidentally omitted or stripped by proxies
- Cache-heavy APIs — query parameter fragmentation reduces cache effectiveness
- Hypermedia APIs — version should be in the media type or URL for REST purity
- APIs behind CDNs that normalize query parameters
- APIs where clean, RESTful URLs are a requirement

---

# Best Practices

**Default to latest when parameter is missing.** Never return an error for a missing version parameter. Unversioned requests should always work.

**Validate parameter format strictly.** Accept integer major versions only (2, not 2.0 or 2.1). Return 400 Bad Request for non-numeric or out-of-range values.

**Set X-Api-Version response header.** Clients need to know which version they received. The response header is the most reliable signal.

**Log explicit version requests.** Track which consumers use which versions for deprecation and capacity planning.

**Consider alternative for public APIs.** Query string versioning is appropriate for internal use; public APIs benefit from URL path or header-based versioning.

**Normalize version parameter in reverse proxy.** Configure load balancers or proxies to normalize `?version=2` to a consistent value to reduce cache fragmentation.

---

# Architecture Guidelines

**Middleware is the appropriate layer for version resolution.** The `QueryStringVersionMiddleware` reads the parameter, validates it, and sets the request attribute. Controllers should never parse `$_GET['version']` directly.

**Version resolution produces a request attribute**, not a configuration value. `$request->attributes->get('api_version')` is accessible throughout the request lifecycle.

**Route registration can use the version attribute** to conditionally register version-specific routes, or controllers can check the attribute for conditional logic.

**Monitoring should track version query parameter usage** separately from overall API traffic to understand version adoption rates.

---

# Performance Considerations

**Query string versioning fragments caches.** Every unique query parameter value creates a separate cache entry. `?version=2&page=1` and `?version=2&page=1&source=web` are different cache entries.

**CDN caching** of versioned resources requires careful query key configuration. Many CDNs can normalize or ignore specific query parameters for caching purposes.

**URL rewriting may strip version parameters.** Proxies, CDNs, and load balancers may strip unknown query parameters. Verify infrastructure behavior in staging.

---

# Security Considerations

**Validate version parameter as integer.** Cast to integer and check range before use. Prevent injection through query parameter manipulation.

**Reject out-of-range versions.** Accept only versions within the supported range. Reject 999, -1, 0, or other invalid values.

**Version parameter should not enable enumeration.** Return the same error for unsupported versions regardless of how close they are to supported versions.

---

# Common Mistakes

**No default version.** Requests without `?version=` parameter fail, breaking all unversioned consumers.

**Accepting minor versions.** `?version=2.0` or `?version=2.1` increases surface area for breakage. Clients expect v2.1 behavior is v2 + minor additions, but implementation often lags.

**No X-Api-Version response header.** Clients don't know which version they received, causing confusion when behavior differs from expectations.

**URL rewriting strips parameter.** Proxies, CDNs, or load balancers strip unknown query parameters, causing all requests to use the default version.

**Cache fragmentation not considered.** High-traffic endpoints with many query parameter variations see reduced cache effectiveness.

---

# Anti-Patterns

**Version-as-Required Parameter:** Treating version as a required parameter and returning 400 when omitted.
**Better approach:** Always default to latest when parameter is missing. Version should be opt-in, not mandatory.

**Minor Version Sprawl:** Accepting `?version=2.0`, `?version=2.1`, `?version=2.2` as distinct versions.
**Better approach:** Major versions only. Communicate minor changes via changelog, not distinct version endpoints.

**No Fallback Documentation:** Clients don't know which version they're using because there's no X-Api-Version header.
**Better approach:** Always return X-Api-Version header. Document the default version behavior in API docs.

---

# Examples

**Middleware implementation:**
```
class QueryStringVersionMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $version = $request->query('version', $this->latestVersion);
        
        if (!is_numeric($version) || $version < 1 || $version > $this->latestVersion) {
            abort(400, 'Invalid API version. Use numeric major version.');
        }
        
        $request->attributes->set('api_version', (int) $version);
        $response = $next($request);
        $response->headers->set('X-Api-Version', $version);
        
        return $response;
    }
}
```

---

# Related Topics

**Prerequisites:**
- Middleware Implementation
- Query Parameter Handling

**Closely Related Topics:**
- URL Path Versioning — URL-based alternative
- Media Type Version Negotiation — Accept-header alternative
- Versioning Strategy Selection — choosing the right approach

**Advanced Follow-Up Topics:**
- Cache Strategy for Versioned APIs
- CDN Configuration for Versioned APIs

**Cross-Domain Connections:**
- Response Headers — X-Api-Version header
- API Monitoring — tracking version usage
