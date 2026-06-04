# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Rate Limit Headers
**Generated:** 2026-06-03

---

# Decision Inventory

* Header naming convention (X-RateLimit-* vs RateLimit-*)
* Reset timestamp format (Unix epoch vs ISO 8601)
* Multi-bucket header computation strategy

---

# Architecture-Level Decision Trees

---

## Header Naming Convention — X-RateLimit-* vs RateLimit-*

---

## Decision Context

Should the API use the conventional `X-RateLimit-*` headers or the newer RFC 9213 `RateLimit-*` standard headers? Arises when implementing rate limit response headers.

---

## Decision Criteria

* client compatibility — which header names clients expect and parse
* forward compatibility — RFC 9213 is the emerging standard
* consistency — pick one and use it everywhere
* proxy behavior — some proxies strip `X-` prefixed headers

---

## Decision Tree

Do you control the client libraries consuming the API?
↓
YES → Use `RateLimit-*` (RFC 9213) — forward-compatible, not deprecated
NO → Do clients already parse `X-RateLimit-*` headers?
    YES → Use both `X-RateLimit-*` and `RateLimit-*` during transition
    NO → Use `RateLimit-*` (RFC 9213)

---

## Rationale

`X-RateLimit-*` is the de facto standard after GitHub/GitLab/Twitter popularized it, but RFC 9213 formalizes `RateLimit-*` as the standard. `X-` prefixed headers are technically deprecated by RFC 6648. Using both during transition ensures compatibility while shifting to the standard.

---

## Recommended Default

**Default:** `RateLimit-*` (RFC 9213) for new APIs; both headers for existing APIs
**Reason:** RFC 9213 is the current standard. New APIs should adopt it. Existing APIs should dual-emit to avoid breaking clients.

---

## Risks Of Wrong Choice

`X-RateLimit-*` only: deprecated header pattern, potentially stripped by future proxies. `RateLimit-*` only: older clients may not parse the standard headers, breaking client-side backoff.

---

## Related Rules

- Always Return Rate Limit Headers on Every Rate-Limited Endpoint (from 05-rules.md)

---

## Related Skills

- Implement Rate Limit Headers (from 06-skills.md)

---

## Reset Timestamp Format — Unix Epoch vs ISO 8601

---

## Decision Context

Should `X-RateLimit-Reset` be a Unix epoch timestamp or an ISO 8601 datetime string? Arises when formatting the reset value.

---

## Decision Criteria

* machine readability — Unix timestamps are trivially parsed by all languages
* human readability — ISO 8601 is readable during debugging
* precision — both support second-level precision
* convention — industry standard for rate limit headers

---

## Decision Tree

Is the primary consumer a machine client (SDK, script, app)?
↓
YES → Unix epoch timestamp (industry standard for rate limit headers)
NO → Is debugging and human inspection a priority?
    YES → ISO 8601 datetime string
    NO → Unix epoch timestamp (always correct)

---

## Rationale

Unix epoch timestamps are the industry standard for rate limit Reset headers (GitHub, Stripe, Twitter all use them). Machine clients parse epoch timestamps efficiently. ISO 8601 adds parsing complexity for no benefit in rate limit contexts.

---

## Recommended Default

**Default:** Absolute Unix epoch timestamp (seconds since 1970-01-01)
**Reason:** Industry standard, machine-efficient, avoids clock drift issues, and matches client expectations.

---

## Risks Of Wrong Choice

Relative offset: clients must add current time, introducing clock drift errors. ISO 8601: parsing overhead, non-standard for rate limit headers. Missing timestamp: clients cannot schedule retry timing.

---

## Related Rules

- Use Absolute Unix Timestamps for X-RateLimit-Reset (from 05-rules.md)

---

## Related Skills

- Implement Rate Limit Headers (from 06-skills.md)

---

## Multi-Bucket Header Computation Strategy

---

## Decision Context

When multiple rate limit buckets apply (e.g., per-minute and per-hour), which bucket's values should be reported in the headers? Arises when implementing multi-bucket rate limiting.

---

## Decision Criteria

* accuracy — headers must reflect the most restrictive limit
* transparency — clients benefit from knowing all active limits
* complexity — communicating multiple bucket states in single headers
* backward compatibility — clients expect a single set of rate limit headers

---

## Decision Tree

How many rate limit buckets apply to the endpoint?
↓
Single bucket?
YES → Report this bucket's values in headers
NO → Multiple buckets (e.g., per-minute AND per-hour)?
    YES → Report the most restrictive bucket's remaining count
    → Option: Add custom headers for each bucket (non-standard, for internal clients)
NO → No bucket → No rate limit headers needed

---

## Rationale

Standard rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) represent a single bucket. When multiple buckets apply, the most restrictive remaining count provides the most accurate guidance to clients. Additional custom headers (X-RateLimit-Minute-*, X-RateLimit-Hour-*) can expose per-bucket data for sophisticated clients.

---

## Recommended Default

**Default:** Report the most restrictive bucket's values in standard headers
**Reason:** Clients need the worst-case remaining count to avoid hitting any limit. The most restrictive bucket is the one that will trigger the next 429.

---

## Risks Of Wrong Choice

Reporting the least restrictive bucket: clients see 100 remaining but the per-minute limit has 0 remaining, causing unexpected 429s. Reporting sum of buckets: artificially inflated remaining count, same problem.

---

## Related Rules

- Always Return Rate Limit Headers on Every Rate-Limited Endpoint (from 05-rules.md)
- Always Include Retry-After on 429 Responses (from 05-rules.md)

---

## Related Skills

- Implement Rate Limit Headers (from 06-skills.md)
- Rate Limiter Definitions (from 06-skills.md)
