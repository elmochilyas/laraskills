# Decomposition: Standard Webhooks Specification (Signature Format, Retry, Metadata)

## Topic Overview
The Standard Webhooks specification defines a unified protocol for webhook delivery across different providers, covering signature format (both HMAC-SHA256 symmetric and Ed25519 asymmetric), metadata headers (webhook-id, webhook-timestamp, webhook-signature), retry schedules, idempotency, and verification procedures. Backed by Svix and adopted by Clerk, Liveblocks, and other platforms, it aims to eliminate the fragmentation of custom webhook implementations. The specification includes reference implementations in multiple languages including PHP.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k035-standard-webhooks-spec/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Standard Webhooks Specification (Signature Format, Retry, Metadata)
- **Purpose:** The Standard Webhooks specification defines a unified protocol for webhook delivery across different providers, covering signature format (both HMAC-SHA256 symmetric and Ed25519 asymmetric), metadata headers (webhook-id, webhook-timestamp, webhook-signature), retry schedules, idempotency, and verification procedures. Backed by Svix and adopted by Clerk, Liveblocks, and other platforms, it aims to eliminate the fragmentation of custom webhook implementations. The specification includes reference implementations in multiple languages including PHP.
- **Difficulty:** Intermediate
- **Dependencies:** K003, K005, K021, K022, K006, K035

## Dependency Graph
**Depends on:**
- K003
- K005
- K021
- K022
- K006
- K035

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- webhook-id
- webhook-timestamp
- webhook-signature
- Signature Scheme
- Retry Schedule
- Idempotency

**Out of scope:**
- K003 topics covered in their respective KUs
- K005 topics covered in their respective KUs
- K021 topics covered in their respective KUs
- K022 topics covered in their respective KUs
- K006 topics covered in their respective KUs
- K035 topics covered in their respective KUs

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