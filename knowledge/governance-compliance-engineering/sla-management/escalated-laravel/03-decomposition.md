# Decomposition: escalated-dev/escalated-laravel

## Topic Overview
escalated-dev/escalated-laravel is an embeddable ticket system with a built-in SLA engine. It provides per-priority response and resolution targets, business hours calculation, automatic breach detection, condition-based escalation rules, and a full activity timeline audit log. It is designed as an embeddable component rather than a separate service desk application.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
escalated-laravel/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### escalated-dev/escalated-laravel
- **Purpose:** escalated-dev/escalated-laravel is an embeddable ticket system with a built-in SLA engine.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-SLA-002 (laravel-service-desk) — Headless service desk alternative, GCE-SLA-003 (queue-autoscale-sla) — Queue worker scaling for SLA targets, GCE-SLA-004 (sla-timer) — Lightweight SLA timer alternative, GCE-COM-002 (evidence-collection-automation) — SLA audit trail as evidence

## Dependency Graph
**Depends on:**
- GCE-SLA-002 (laravel-service-desk) — Headless service desk alternative
- GCE-SLA-003 (queue-autoscale-sla) — Queue worker scaling for SLA targets
- GCE-SLA-004 (sla-timer) — Lightweight SLA timer alternative
- GCE-COM-002 (evidence-collection-automation) — SLA audit trail as evidence

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- SLA engine
- Business hours calculation
- Automatic breach detection
- Condition-based escalation
- Activity timeline audit log
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-SLA-002 (laravel-service-desk) — Headless service desk alternative, GCE-SLA-003 (queue-autoscale-sla) — Queue worker scaling for SLA targets, GCE-SLA-004 (sla-timer) — Lightweight SLA timer alternative, GCE-COM-002 (evidence-collection-automation) — SLA audit trail as evidence

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