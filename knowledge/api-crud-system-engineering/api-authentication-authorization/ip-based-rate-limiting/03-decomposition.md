# Decomposition: IP-Based Rate Limiting

## Topic Overview
IP-based rate limiting restricts the number of requests from a single IP address within a given time window. It is the most basic form of rate limiting, serving as a first line of defense against DDoS attacks, web scrapers, and brute-force login attempts. Because IP addresses are readily available (from `$request->ip()` or `$_SERVER['REMOTE_ADDR']`), IP-based limiting requires no authentication and applies to all requests â€” including unauthenticated ones. However, IP addresses are unreliable identifiers due to NAT, VPNs, and IPv6 address ranges.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ip-based-rate-limiting/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### IP-Based Rate Limiting
- **Purpose:** IP-based rate limiting restricts the number of requests from a single IP address within a given time window. It is the most basic form of rate limiting, serving as a first line of defense against DDoS attacks, web scrapers, and brute-force login attempts. Because IP addresses are readily available (from `$request->ip()` or `$_SERVER['REMOTE_ADDR']`), IP-based limiting requires no authentication and applies to all requests â€” including unauthenticated ones. However, IP addresses are unreliable identifiers due to NAT, VPNs, and IPv6 address ranges.
- **Difficulty:** Intermediate
- **Dependencies:** rate-limiting-by-auth-tier, rate-limiter-definition, rate-limit-headers

## Dependency Graph
**Depends on:**
- rate-limiting-by-auth-tier
- rate-limiter-definition
- rate-limit-headers

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- `$request->ip()`
- REMOTE_ADDR
- X-Forwarded-For
- IP ranges (CIDR)
- IPv6 complications
- Whitelist

**Out of scope:**
- rate-limiting-by-auth-tier topics covered in their respective KUs
- rate-limiter-definition topics covered in their respective KUs
- rate-limit-headers topics covered in their respective KUs

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