# Decomposition: Three-Tier Data Classification

## Topic Overview
The three-tier data classification model maps data sensitivity to encryption strategy and cloud provider choice. Tier 1 (High — PII, financial, healthcare) requires HYOK encryption and EU-native cloud providers. Tier 2 (Medium — analytics, logs) requires BYOK with EU region guardrails.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
three-tier-classification/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Three-Tier Data Classification
- **Purpose:** The three-tier data classification model maps data sensitivity to encryption strategy and cloud provider choice.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-DCS-002 (byok-hyok-encryption) — Encryption strategy per classification tier, GCE-MUL-002 (data-residency-tenants) — Multi-region data placement, GCE-COM-002 (evidence-collection-automation) — Evidence collection for classification compliance

## Dependency Graph
**Depends on:**
- GCE-DCS-002 (byok-hyok-encryption) — Encryption strategy per classification tier
- GCE-MUL-002 (data-residency-tenants) — Multi-region data placement
- GCE-COM-002 (evidence-collection-automation) — Evidence collection for classification compliance

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Tier 1 — High Sovereignty Risk
- Tier 2 — Medium Sovereignty Risk
- Tier 3 — Low Sovereignty Risk
- Three-layer sovereignty model
- Metadata sovereignty
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-DCS-002 (byok-hyok-encryption) — Encryption strategy per classification tier, GCE-MUL-002 (data-residency-tenants) — Multi-region data placement, GCE-COM-002 (evidence-collection-automation) — Evidence collection for classification compliance

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