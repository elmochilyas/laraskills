# Decomposition: Unified Control Mapping

## Topic Overview
Unified control mapping maps a single technical control (encryption, MFA, logging, access control) to multiple regulatory frameworks (SOC 2, HIPAA, PCI-DSS, GDPR, ISO 27001) simultaneously. Instead of maintaining separate compliance implementations per framework, a single implementation satisfies multiple requirements. This reduces compliance maintenance effort by 60-80% according to industry estimates.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
unified-control-mapping/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Unified Control Mapping
- **Purpose:** Unified control mapping maps a single technical control (encryption, MFA, logging, access control) to multiple regulatory frameworks (SOC 2, HIPAA, PCI-DSS, GDPR, ISO 27001) simultaneously.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-COM-002 (evidence-collection-automation) — Evidence collection per control, GCE-COM-001 (cicd-policy-gates) — Policy gates enforce control state, GCE-COM-004 (compliance-attestation-pdf) — Attestation references control mapping

## Dependency Graph
**Depends on:**
- GCE-COM-002 (evidence-collection-automation) — Evidence collection per control
- GCE-COM-001 (cicd-policy-gates) — Policy gates enforce control state
- GCE-COM-004 (compliance-attestation-pdf) — Attestation references control mapping

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Control matrix
- Single implementation, multi-framework compliance
- Control coverage analysis
- Control drift detection
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-COM-002 (evidence-collection-automation) — Evidence collection per control, GCE-COM-001 (cicd-policy-gates) — Policy gates enforce control state, GCE-COM-004 (compliance-attestation-pdf) — Attestation references control mapping

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