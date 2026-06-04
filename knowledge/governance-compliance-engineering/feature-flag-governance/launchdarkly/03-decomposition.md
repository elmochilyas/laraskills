# Decomposition: LaunchDarkly

## Topic Overview
LaunchDarkly is the enterprise market leader for feature flag management. It provides FedRAMP compliance, RBAC with AWS IAM-style custom roles, approval workflows with multi-stage review, comprehensive audit logging, experiment approvals (2026 beta), kill switches, gradual rollouts, and a self-hosted Relay Proxy for air-gapped environments. Its governance model is the gold standard: per-environment approval configuration, different rules for production vs QA/staging, configurable review counts (1-5 reviewers), self-approval prevention, bypass for emergencies, and strictest-settings aggregation across environments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
launchdarkly/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### LaunchDarkly
- **Purpose:** LaunchDarkly is the enterprise market leader for feature flag management.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-FFG-001 (laravel-pennant) — Simpler, free alternative, GCE-FFG-003 (growthbook) — Open-source alternative with experimentation, GCE-FFG-005 (configcat) — Cross-platform alternative, GCE-COM-001 (cicd-policy-gates) — CI/CD integration for flag approvals

## Dependency Graph
**Depends on:**
- GCE-FFG-001 (laravel-pennant) — Simpler, free alternative
- GCE-FFG-003 (growthbook) — Open-source alternative with experimentation
- GCE-FFG-005 (configcat) — Cross-platform alternative
- GCE-COM-001 (cicd-policy-gates) — CI/CD integration for flag approvals

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- FedRAMP compliance
- RBAC with custom roles
- Approval workflows
- Audit log
- Experiment approvals (2026 beta)
- Relay Proxy
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-FFG-001 (laravel-pennant) — Simpler, free alternative, GCE-FFG-003 (growthbook) — Open-source alternative with experimentation, GCE-FFG-005 (configcat) — Cross-platform alternative, GCE-COM-001 (cicd-policy-gates) — CI/CD integration for flag approvals

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