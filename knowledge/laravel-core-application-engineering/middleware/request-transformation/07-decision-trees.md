# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Request Transformation
**Generated:** 2026-06-03

---

# Decision Inventory

* Attributes vs Input for Middleware-Set Data
* Global vs Group Request Transformation
* TrustedProxies Configuration (Specific IPs vs Wildcard)
* Request Transformation vs Form Request for Input Sanitization

---

# Architecture-Level Decision Trees

---

## Decision 1: Attributes vs Input for Middleware-Set Data

---

## Decision Context

Whether middleware should use `$request->attributes->set()` or `$request->merge()` to add data to the request.

---

## Decision Criteria

* Whether the data originated from the client or was resolved server-side
* Whether controllers use `$request->all()` or `$request->validated()` downstream
* Whether the data should be serializable

---

## Decision Tree

Did the data come from the client request?
↓
YES → Is the data being sanitized (trim, type cast, empty string conversion)?
    ↓
    YES → `$request->merge()` — sanitization modifies existing input; appropriate use
    NO → `$request->attributes->set()` — data from client should remain as input
NO → Was the data resolved server-side (tenant, request ID, user preferences)?
    ↓
    YES → `$request->attributes->set()` — server-enriched data belongs in attributes
    NO → Is the data context about the request itself (timing, tracing)?
        ↓
        YES → `$request->attributes->set()` — metadata about the request, not from the client
        NO → Neither — data doesn't belong on the request object
NO → Will downstream code use `$request->all()` or `$request->validated()`?
    ↓
    YES → `$request->attributes->set()` — avoid polluting validation and form request data
    NO → Either works — but attributes is the safer default

---

## Rationale

`$request->merge()` modifies user input. Controllers using `$request->all()` or `$request->validated()` receive merged data as if the client sent it. `$request->attributes->set()` stores data in the attributes bag, which is serializable, request-scoped, and distinct from user input. Attributes data is accessed via `$request->attributes->get('key')` downstream.

---

## Recommended Default

**Default:** `$request->attributes->set()` for all middleware-enriched data. `$request->merge()` only for input sanitization (trimming strings, converting empty strings).
**Reason:** Attributes keep a clean separation between client input and system data. Merge pollutes input and bypasses validation.

---

## Risks Of Wrong Choice

* `$request->merge()` for tenant ID: `$request->validated()` includes tenant_id; validation rules must account for it
* `$request->merge()` for request ID: `$request->all()` returns request ID as if client sent it; serialization includes non-client data
* Attribute namespace collisions: Two middleware using `$request->attributes->set('id', ...)` with different meanings cause silent data corruption
* Attributes for client input: Input data should remain in input bag for validation and form requests

---

## Related Rules

* Use $request->attributes->set() for Middleware-to-Controller Communication
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement a Request Transformation Middleware for Request Enrichment
* Implement a Correct handle() Method with Two-Pass Execution

---

---

## Decision 2: Global vs Group Request Transformation

---

## Decision Context

Whether to register request transformation middleware globally (every request) or at the route-group level.

---

## Decision Criteria

* Whether the transformation applies to every request unconditionally
* Whether the transformation performs I/O or database queries
* Whether the transformation needs route context

---

## Decision Tree

Does the transformation modify how the request is interpreted for routing (trusted proxies, scheme)?
↓
YES → Global — must run before routing affects request interpretation
NO → Does the transformation apply to every request including health checks and assets?
    ↓
    YES → Does it perform I/O or database queries (tenant resolution, feature flags)?
        ↓
        YES → Route-group — never register I/O middleware globally; scope to routes that need it
        NO → Global — input sanitization, request ID generation (in-memory, no I/O)
    NO → Route-group — transformation is scoped to specific route collections
NO → Does the transformation need route context (matched route, parameters)?
    ↓
    YES → Route-group — global middleware runs before routing and cannot access route data
    NO → Either — but route-group is safer to avoid unintended application

---

## Rationale

Global request transformation middleware runs on every request. In-memory transformations (request ID, TrimStrings) are acceptable globally. I/O transformations (tenant resolution, feature flag loading) must be group-scoped to avoid database load from static assets, health checks, and OPTIONS preflight requests.

---

## Recommended Default

**Default:** Route-group for most request transformations. Global only for infrastructure transformations that must run before routing (TrustedProxies, HandleCors) and in-memory sanitization (TrimStrings).
**Reason:** Global middleware applies to every request including those that don't need the transformation. Group-scoped middleware is more targeted and reduces unnecessary I/O.

---

## Risks Of Wrong Choice

* I/O transformation globally: Database queries on every health check and asset request; connection pool exhaustion
* Infrastructure transformation in group: TrustedProxies runs after routing; IP and scheme are already resolved incorrectly
* Request ID generation in group: Not all requests get a request ID; tracing gaps
* TrimStrings in group: Some routes receive untrimmed input

---

## Related Rules

* Keep Global Middleware Minimal
* Use $request->attributes->set() for Middleware-to-Controller Communication

---

## Related Skills

* Implement a Request Transformation Middleware for Request Enrichment
* Register Custom Middleware at the Correct Tier

---

---

## Decision 3: TrustedProxies Configuration (Specific IPs vs Wildcard)

---

## Decision Context

Whether to configure TrustedProxies with specific IP ranges or use `*` (trust all proxies).

---

## Decision Criteria

* Whether the proxy IPs are known and stable
* Whether the application is behind a CDN with dynamic IP ranges
* Whether IP-based security (rate limiting, access control) is critical

---

## Decision Tree

Are the proxy IPs known and documented (cloud load balancer, internal proxy)?
↓
YES → Specific IPs/CIDR ranges — `['10.0.0.0/8', '172.16.0.0/12']`
NO → Is the application behind a CDN with published IP ranges (Cloudflare, AWS CloudFront)?
    ↓
    YES → Specific IPs from CDN's published list — CDN provides documentation; use their CIDR ranges
    NO → Is the application behind a CDN with dynamic/undocumented IPs?
        ↓
        YES → `*` (trust all proxies) — last resort; accept the security risk
        NO → Specific IPs — configure your known proxy addresses
NO → Is `*` used in production?
    ↓
    YES → Review immediately — `*` trusts ALL proxies; external traffic through intermediate proxies can spoof IPs
    NO → Specific IPs is the correct default

---

## Rationale

TrustedProxies modifies `$request->ip()`, scheme, host, and port based on proxy headers. Trusting all proxies (`*`) allows any intermediate proxy to set these values, enabling IP spoofing. Specific IP ranges restrict trust to known infrastructure. CDNs like Cloudflare publish their IP ranges for this purpose.

---

## Recommended Default

**Default:** Specific IP ranges for all production environments. `*` only for development or when behind a CDN with no published IP list.
**Reason:** Specific IPs prevent IP spoofing through unauthorized proxies. `*` is a convenience that trades security for flexibility.

---

## Risks Of Wrong Choice

* `*` in production with external traffic: Attacker sets `X-Forwarded-For` to spoof IP; IP-based rate limiting and access control are bypassed
* No TrustedProxies behind LB: `$request->ip()` returns load balancer IP; `$request->getScheme()` returns `http` instead of `https`
* Missing proxy IPs: Requests from the proxy are not trusted; IP resolution is incorrect
* Too-broad CIDR: Trusts proxies outside your infrastructure; partial IP spoofing risk

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Configure TrustedProxies for Proxy Environments
* Implement a Request Transformation Middleware for Request Enrichment

---

---

## Decision 4: Request Transformation vs Form Request for Input Sanitization

---

## Decision Context

Whether to handle input sanitization (trimming, casting, cleaning) in middleware or in Form Request classes.

---

## Decision Criteria

* Whether the sanitization applies to all routes or specific ones
* Whether the sanitization is input normalization or business-specific transformation
* Whether the sanitization is needed before validation

---

## Decision Tree

Does the sanitization apply to all incoming requests?
↓
YES → Middleware — TrimStrings, ConvertEmptyStringsToNull run globally as middleware
NO → Does the sanitization apply to specific form requests only?
    ↓
    YES → Form Request — `prepareForValidation()` method for request-specific sanitization
    NO → Is the sanitization normalization (trim, case conversion, format standardization)?
        ↓
        YES → Middleware — normalization is cross-cutting and route-independent
        NO → Business-specific transformation — Form Request or Service/Action
NO → Is the sanitization needed before validation executes?
    ↓
    YES → Middleware — Form Request `prepareForValidation()` runs as part of validation; middleware runs before
    NO → Form Request — sanitization is part of the validation workflow

---

## Rationale

Global input sanitization (TrimStrings, ConvertEmptyStringsToNull) is a cross-cutting concern that applies to every route. Form Request `prepareForValidation()` handles request-specific sanitization. Both have their place: middleware for universal normalization, Form Request for per-form transformations.

---

## Recommended Default

**Default:** Middleware for global input normalization (TrimStrings, ConvertEmptyStringsToNull). Form Request `prepareForValidation()` for route-specific sanitization.
**Reason:** Middleware applies universally without per-route configuration. Form Request sanitization is visible alongside validation rules for the specific form.

---

## Risks Of Wrong Choice

* All sanitization in middleware: Cannot distinguish between routes that need vs don't need specific transformations
* All sanitization in Form Requests: Trimming must be added to every Form Request; easy to forget
* Middleware sanitization that breaks expected types: `ConvertEmptyStringsToNull` converts `''` to `null` — controllers expecting empty string get null
* Form Request sanitization after validation: `prepareForValidation()` runs during validation; middleware sanitization runs before

---

## Related Rules

* Always Return the Result of $next($request)
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement a Request Transformation Middleware for Request Enrichment
* Prepare Input Data in Form Request prepareForValidation Method
