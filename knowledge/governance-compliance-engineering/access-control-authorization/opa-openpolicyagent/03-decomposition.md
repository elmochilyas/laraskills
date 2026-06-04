# Decomposition: OPA / OpenPolicyAgent

## Topic Overview
Open Policy Agent (OPA) is a CNCF-graduated, general-purpose policy engine that decouples policy decision-making from application code. Policies are written in Rego, a declarative language purpose-built for expressing rules over hierarchical data. OPA is used for cross-service authorization, infrastructure compliance (Kubernetes, Terraform), and data access policies.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opa-openpolicyagent/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### OPA / OpenPolicyAgent
- **Purpose:** Open Policy Agent (OPA) is a CNCF-graduated, general-purpose policy engine that decouples policy decision-making from application code.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-ACC-001 (laravel-gates-policies) — Application-level authorization, GCE-ACC-002 (spatie-permission) — Role/permission data layer, GCE-COM-001 (cicd-policy-gates) — OPA for CI/CD policy evaluation, GCE-DCS-001 (three-tier-classification) — Policy-based data access controls

## Dependency Graph
**Depends on:**
- GCE-ACC-001 (laravel-gates-policies) — Application-level authorization
- GCE-ACC-002 (spatie-permission) — Role/permission data layer
- GCE-COM-001 (cicd-policy-gates) — OPA for CI/CD policy evaluation
- GCE-DCS-001 (three-tier-classification) — Policy-based data access controls

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Policy-as-code
- Rego language
- Input structure
- Bundle API
- Partial evaluation
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-ACC-001 (laravel-gates-policies) — Application-level authorization, GCE-ACC-002 (spatie-permission) — Role/permission data layer, GCE-COM-001 (cicd-policy-gates) — OPA for CI/CD policy evaluation, GCE-DCS-001 (three-tier-classification) — Policy-based data access controls

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