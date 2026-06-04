# Decomposition: Rate Limiting by Auth Tier

## Topic Overview
Rate limiting by authentication tier assigns different API rate limits based on the client's authentication status and subscription level. Unauthenticated (guest) requests get the most restrictive limits, authenticated users get moderate limits, premium subscribers get higher limits, and internal services/machine-to-machine clients get the highest limits. This tiered approach incentivizes authentication, enables API monetization, protects infrastructure, and ensures fair resource allocation across different client types.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
rate-limiting-by-auth-tier/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Rate Limiting by Auth Tier
- **Purpose:** Rate limiting by authentication tier assigns different API rate limits based on the client's authentication status and subscription level. Unauthenticated (guest) requests get the most restrictive limits, authenticated users get moderate limits, premium subscribers get higher limits, and internal services/machine-to-machine clients get the highest limits. This tiered approach incentivizes authentication, enables API monetization, protects infrastructure, and ensures fair resource allocation across different client types.
- **Difficulty:** Intermediate
- **Dependencies:** rate-limiter-definition, rate-limit-headers, ip-based-rate-limiting

## Dependency Graph
**Depends on:**
- rate-limiter-definition
- rate-limit-headers
- ip-based-rate-limiting

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Auth tier
- Rate limit scope
- Tier multiplier
- Burst vs sustained limits
- Over-limit behavior

**Out of scope:**
- rate-limiter-definition topics covered in their respective KUs
- rate-limit-headers topics covered in their respective KUs
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