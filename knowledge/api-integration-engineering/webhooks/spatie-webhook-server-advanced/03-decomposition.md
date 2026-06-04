# Decomposition: Spatie laravel-webhook-server Dispatch and Retry Customization

## Topic Overview
Spatie's laravel-webhook-server is the standard package for sending webhooks from Laravel applications to external subscribers. It handles dispatch, HMAC signing, HTTP delivery with configurable backoff, and event-driven lifecycle with success and failure events. The package manages delivery attempt tracking, final failure notification, and supports per-webhook URL and payload customization.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k012-spatie-webhook-server/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spatie laravel-webhook-server Dispatch and Retry Customization
- **Purpose:** Spatie's laravel-webhook-server is the standard package for sending webhooks from Laravel applications to external subscribers. It handles dispatch, HMAC signing, HTTP delivery with configurable backoff, and event-driven lifecycle with success and failure events. The package manages delivery attempt tracking, final failure notification, and supports per-webhook URL and payload customization.
- **Difficulty:** Intermediate
- **Dependencies:** K019, K003, K012, K028, K018

## Dependency Graph
**Depends on:**
- K019
- K003
- K012
- K028
- K018

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- WebhookCall
- WebhookDispatcher
- HMAC Signing
- Retry/Backoff
- Events
- Dispatch Method

**Out of scope:**
- K019 topics covered in their respective KUs
- K003 topics covered in their respective KUs
- K012 topics covered in their respective KUs
- K028 topics covered in their respective KUs
- K018 topics covered in their respective KUs

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