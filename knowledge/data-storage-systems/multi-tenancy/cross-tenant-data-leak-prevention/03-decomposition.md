# Decomposition: 5.11 Cross-tenant data leak prevention (testing, code review, bypass gating)

## Topic Overview
Cross-tenant data leaks are the most serious security vulnerability in multi-tenant systems. Prevention requires multiple layers: automated tests that verify tenant isolation, code review checklists for any scope bypass, and access control gating for `withoutGlobalScope`. Every new feature and every query must be assumed to leak until proven isolated.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-11-cross-tenant-data-leak-prevention/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.11 Cross-tenant data leak prevention (testing, code review, bypass gating)
- **Purpose:** Cross-tenant data leaks are the most serious security vulnerability in multi-tenant systems. Prevention requires multiple layers: automated tests that verify tenant isolation, code review checklists for any scope bypass, and access control gating for `withoutGlobalScope`.
- **Difficulty:** Advanced
- **Dependencies:** 5.5 Global scopes, 5.12 withoutGlobalScope guardrails

## Dependency Graph
**Depends on:** "5.5 Global scopes", "5.12 withoutGlobalScope guardrails"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Isolation tests**: Create two tenants with overlapping data. Assert Tenant A can never access Tenant B's data through any endpoint or command.; - **Scope bypass audit**: Every `withoutGlobalScope()` call must be reviewed and justified. Tag with a reason comment.; - **Penetration testing**: Automated cross-tenant access attempts. Try tenant_id manipulation in requests, headers, parameters..
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