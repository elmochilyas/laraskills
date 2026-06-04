# Decomposition: Rate Limit Headers

## Topic Overview
Rate limit headers communicate a client's current rate limit status via HTTP response headers. Standard headers include `X-RateLimit-Limit` (maximum requests allowed in the window), `X-RateLimit-Remaining` (remaining requests in the current window), and `X-RateLimit-Reset` (Unix timestamp when the window resets). On rate limit exceedance, the `Retry-After` header tells the client how many seconds to wait before retrying. Proper rate limit headers enable clients to self-regulate their request rate, avoid 429 errors, and implement intelligent backoff strategies.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
rate-limit-headers/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Rate Limit Headers
- **Purpose:** Rate limit headers communicate a client's current rate limit status via HTTP response headers. Standard headers include `X-RateLimit-Limit` (maximum requests allowed in the window), `X-RateLimit-Remaining` (remaining requests in the current window), and `X-RateLimit-Reset` (Unix timestamp when the window resets). On rate limit exceedance, the `Retry-After` header tells the client how many seconds to wait before retrying. Proper rate limit headers enable clients to self-regulate their request rate, avoid 429 errors, and implement intelligent backoff strategies.
- **Difficulty:** Intermediate
- **Dependencies:** rate-limiting-by-auth-tier, rate-limiter-definition, ip-based-rate-limiting

## Dependency Graph
**Depends on:**
- rate-limiting-by-auth-tier
- rate-limiter-definition
- ip-based-rate-limiting

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After`
- `X-RateLimit-Tier`
- Window type

**Out of scope:**
- rate-limiting-by-auth-tier topics covered in their respective KUs
- rate-limiter-definition topics covered in their respective KUs
- ip-based-rate-limiting topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization