# Decomposition: BYOK vs HYOK Encryption Strategies

## Topic Overview
BYOK and HYOK are encryption key management strategies that determine who controls cryptographic keys in cloud environments. BYOK: customer generates keys and imports them to the provider's KMS; the provider retains operational access after import. HYOK: keys never leave the customer's environment (EU-based HSM); the provider requests temporary access for encryption operations and keys are purged afterward.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
byok-hyok-encryption/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### BYOK vs HYOK Encryption Strategies
- **Purpose:** BYOK and HYOK are encryption key management strategies that determine who controls cryptographic keys in cloud environments.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-DCS-001 (three-tier-classification) — Determines which encryption strategy applies, GCE-MUL-002 (data-residency-tenants) — Key management per region, GCE-COM-002 (evidence-collection-automation) — Key usage auditing for compliance

## Dependency Graph
**Depends on:**
- GCE-DCS-001 (three-tier-classification) — Determines which encryption strategy applies
- GCE-MUL-002 (data-residency-tenants) — Key management per region
- GCE-COM-002 (evidence-collection-automation) — Key usage auditing for compliance

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- BYOK (Bring Your Own Key)
- HYOK (Hold Your Own Key)
- Envelope encryption
- HSM (Hardware Security Module)
- KMIP (Key Management Interoperability Protocol)
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-DCS-001 (three-tier-classification) — Determines which encryption strategy applies, GCE-MUL-002 (data-residency-tenants) — Key management per region, GCE-COM-002 (evidence-collection-automation) — Key usage auditing for compliance

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