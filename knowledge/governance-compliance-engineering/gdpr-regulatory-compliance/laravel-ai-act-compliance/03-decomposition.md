# Decomposition: padosoft/laravel-ai-act-compliance

## Topic Overview
padosoft/laravel-ai-act-compliance is the first Laravel-native toolkit covering the EU AI Act alongside GDPR compliance. It introduces a compliance-ledger architectural pattern where the package owns the compliance records (DSAR queue, risk register, incident tickets, consent records, bias snapshots, attestations) but never the user's domain data. It provides nine integrated modules: Disclosure, Risk Register, DSAR, Bias Monitoring, Human Review Tracker, Incident Management, Consent Ledger, Cybersecurity Middleware, and Compliance Attestation PDF Generation.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-ai-act-compliance/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### padosoft/laravel-ai-act-compliance
- **Purpose:** padosoft/laravel-ai-act-compliance is the first Laravel-native toolkit covering the EU AI Act alongside GDPR compliance.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-GDP-001 (rylxes-laravel-gdpr) — Simpler GDPR-only alternative, GCE-AUD-001 (spatie-activitylog-v5) — Audit logging for compliance events, GCE-COM-004 (compliance-attestation-pdf) — PDF attestation pattern reference, GCE-MUL-001 (isolation-strategies) — Multi-tenant compliance (v1.5 feature)

## Dependency Graph
**Depends on:**
- GCE-GDP-001 (rylxes-laravel-gdpr) — Simpler GDPR-only alternative
- GCE-AUD-001 (spatie-activitylog-v5) — Audit logging for compliance events
- GCE-COM-004 (compliance-attestation-pdf) — PDF attestation pattern reference
- GCE-MUL-001 (isolation-strategies) — Multi-tenant compliance (v1.5 feature)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Compliance ledger architecture
- Two-contract pattern
- Risk register
- Bias monitoring
- Human review state machine
- Regulatory feed auto-flagger
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-GDP-001 (rylxes-laravel-gdpr) — Simpler GDPR-only alternative, GCE-AUD-001 (spatie-activitylog-v5) — Audit logging for compliance events, GCE-COM-004 (compliance-attestation-pdf) — PDF attestation pattern reference, GCE-MUL-001 (isolation-strategies) — Multi-tenant compliance (v1.5 feature)

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