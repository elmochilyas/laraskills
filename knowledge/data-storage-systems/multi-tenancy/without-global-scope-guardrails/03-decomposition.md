# Decomposition: 5.12 withoutGlobalScope guardrails (permitted uses, review requirements)

## Topic Overview
`withoutGlobalScope` bypasses tenant isolation — it must be treated as a privileged operation. Every call should have documented justification and explicit approval. Permitted uses: cross-tenant admin reports, tenant provisioning/cleanup, system-wide analytics.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-12-without-global-scope-guardrails/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.12 withoutGlobalScope guardrails (permitted uses, review requirements)
- **Purpose:** `withoutGlobalScope` bypasses tenant isolation — it must be treated as a privileged operation. Every call should have documented justification and explicit approval.
- **Difficulty:** Intermediate
- **Dependencies:** 5.5 Global scopes, 5.11 Cross-tenant leak prevention

## Dependency Graph
**Depends on:** "5.5 Global scopes", "5.11 Cross-tenant leak prevention"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Principle**: Tenant isolation is the default. `withoutGlobalScope` is an explicit opt-out requiring justification.; - **Permitted uses**: Admin panels with proper authorization, tenant provisioning code, data export/import tools, system maintenance commands.; - **Prohibited uses**: Any user-facing controller, API endpoint, or service method that returns data to non-admin users..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization