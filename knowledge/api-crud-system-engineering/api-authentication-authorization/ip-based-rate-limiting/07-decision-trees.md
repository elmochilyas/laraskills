# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** IP-Based Rate Limiting
**Generated:** 2026-06-03

---

# Decision Inventory

* Rate limit key strategy (IP-only vs compound user/IP)
* IPv6 handling for rate limit keys
* IP-based limiting for unauthenticated vs authenticated routes

---

# Architecture-Level Decision Trees

---

## Rate Limit Key Strategy — IP-Only vs Compound User/IP

---

## Decision Context

Should IP-based rate limits use the IP address alone, or switch to user ID for authenticated requests? Arises when defining rate limiters for API endpoints.

---

## Decision Criteria

* fairness — NAT users sharing a single IP should not penalize each other
* security — IP-only limits easily bypassed via VPN/proxy rotation
* performance — compound key logic adds minimal overhead
* architectural — authenticated users have a stable identifier (user ID)

---

## Decision Tree

Is the endpoint authenticated or unauthenticated?
↓
Authenticated?
YES → Use user ID as the rate limit key (`user:{id}`)
NO → Guest/unauthenticated?
    YES → Use IP as the rate limit key (`ip:{address}`)
    NO → Mixed (some users authenticated, some guests)?
        YES → Compound key: user ID if authenticated, IP if guest

---

## Rationale

Authenticated users have a stable identifier (user ID) that provides per-user fairness regardless of IP changes. IP-only limits unfairly penalize all users behind a NAT gateway when one user hits the limit. Guest users have no alternative identifier, so IP is the only option. A compound key handles mixed-auth endpoints correctly.

---

## Recommended Default

**Default:** Compound key — `$request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip()`
**Reason:** Provides per-user fairness for authenticated users while still protecting guest endpoints.

---

## Risks Of Wrong Choice

IP-only for authenticated users: entire office blocked when one user exceeds limits. User ID-only for guest endpoints: unauthenticated requests have no user ID, defaulting to null and collapsing all guests into one counter.

---

## Related Rules

- Use Compound Keys: User ID for Authenticated, IP for Guests (from 05-rules.md)
- Always Configure TrustProxies Behind Load Balancers (from 05-rules.md)

---

## Related Skills

- Implement IP-Based Rate Limiting (from 06-skills.md)
- Rate Limiter Definitions (from 06-skills.md)

---

## IPv6 Handling for Rate Limit Keys

---

## Decision Context

How should IPv6 addresses be normalized for rate limiting? Arises when clients connect over IPv6.

---

## Decision Criteria

* security — preventing IPv6 address rotation from bypassing rate limits
* fairness — a single client should not consume the entire rate limit pool
* performance — normalization overhead per request
* architectural — /64 subnet boundary as the practical client identifier

---

## Decision Tree

Is the client IP an IPv6 address?
↓
YES → Normalize to /64 prefix (first 64 bits)
NO → IPv4 → Use full IP address as-is

---

## Rationale

IPv6 provides a /64 subnet per network. A single client can rotate through billions of /128 addresses, trivially bypassing per-address rate limits. Normalizing to /64 treats all addresses from the same /64 subnet as a single client, matching the practical network topology.

---

## Recommended Default

**Default:** Always normalize IPv6 to /64 prefix
**Reason:** Without normalization, any IPv6 client can bypass per-IP rate limits by rotating through their /64 subnet's 2^64 addresses.

---

## Risks Of Wrong Choice

No IPv6 normalization: clients trivially bypass rate limits by rotating IPv6 addresses. Over-normalization (e.g., /32): multiple unrelated clients grouped together, unfairly limited.

---

## Related Rules

- Normalize IPv6 to /64 Prefix (from 05-rules.md)

---

## Related Skills

- Implement IP-Based Rate Limiting (from 06-skills.md)

---

## IP-Based Limiting for Unauthenticated vs Authenticated Routes

---

## Decision Context

Should IP-based rate limits apply to authenticated routes or only to unauthenticated/guest endpoints? Arises when designing the rate limiting architecture.

---

## Decision Criteria

* user experience — authenticated users should not be limited by their IP
* security — unauthenticated routes need protection from anonymous abuse
* architecture — separate middleware groups for guest vs authenticated routes
* fairness — authenticated users have user-ID-based limits

---

## Decision Tree

Is the route authenticated (requires user login)?
↓
YES → Apply user-ID-based rate limits, not IP-based
NO → Is the route unauthenticated (public guest access)?
    YES → Apply IP-based rate limits
    NO → Mixed auth state route?
        YES → Apply compound key (user ID if auth, IP if guest)

---

## Rationale

Authenticated users have stable, fair rate limiting via user IDs. IP-based limits on authenticated routes cause unfair blocks when multiple authenticated users share a NAT IP. Guest routes have no user context, so IP-based limits are the only available protection.

---

## Recommended Default

**Default:** IP-based limits for guest routes only; user-ID-based limits for authenticated routes
**Reason:** Fair and secure — prevents anonymous abuse without penalizing authenticated users behind NAT.

---

## Risks Of Wrong Choice

IP limits on authenticated routes: office-wide blocks from a single user hitting the limit. No IP limits on guest routes: unfettered anonymous access enables abuse and scraping.

---

## Related Rules

- Use Compound Keys: User ID for Authenticated, IP for Guests (from 05-rules.md)

---

## Related Skills

- Implement IP-Based Rate Limiting (from 06-skills.md)
- Rate Limiting by Auth Tier (from 06-skills.md)
