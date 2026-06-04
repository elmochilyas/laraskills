# Decomposition: Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns

## Topic Overview
Webhook gateway services (Convoy, Svix) provide managed webhook infrastructure handling fan-out delivery, retry with backoff, signature signing, delivery tracking, and endpoint management. They replace the need for self-hosted webhook sender implementations (Spatie's webhook-server, custom dispatchers) with a managed API layer. The decision between gateway and self-hosted depends on scale, reliability requirements, compliance needs, and operational maturity. Gateway services are gaining traction for B2B SaaS platforms that send webhooks to many subscribers.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k032-webhook-gateways/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Webhook Gateway Services (Convoy, Svix) vs Self-Hosted Patterns
- **Purpose:** Webhook gateway services (Convoy, Svix) provide managed webhook infrastructure handling fan-out delivery, retry with backoff, signature signing, delivery tracking, and endpoint management. They replace the need for self-hosted webhook sender implementations (Spatie's webhook-server, custom dispatchers) with a managed API layer. The decision between gateway and self-hosted depends on scale, reliability requirements, compliance needs, and operational maturity. Gateway services are gaining traction for B2B SaaS platforms that send webhooks to many subscribers.
- **Difficulty:** Intermediate
- **Dependencies:** K012, K019, K035, K032

## Dependency Graph
**Depends on:**
- K012
- K019
- K035
- K032

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Webhook Gateway
- Fan-Out Delivery
- Managed Retry
- Endpoint Management
- Delivery Logs
- Webhook Gateways vs Self-Hosted

**Out of scope:**
- K012 topics covered in their respective KUs
- K019 topics covered in their respective KUs
- K035 topics covered in their respective KUs
- K032 topics covered in their respective KUs

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