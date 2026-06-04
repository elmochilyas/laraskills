# Decomposition: 5.8 Tenant-aware commands (--tenant option, batch processing)

## Topic Overview
Artisan commands in multi-tenant apps must support per-tenant or all-tenant execution. A `--tenant` option selects a specific tenant. No option means process all tenants in a loop.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-8-tenant-aware-commands/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.8 Tenant-aware commands (--tenant option, batch processing)
- **Purpose:** Artisan commands in multi-tenant apps must support per-tenant or all-tenant execution. A `--tenant` option selects a specific tenant.
- **Difficulty:** Advanced
- **Dependencies:** 5.7 Tenant-aware queue jobs, 5.9 Migration orchestration

## Dependency Graph
**Depends on:** "5.7 Tenant-aware queue jobs", "5.9 Migration orchestration"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **--tenant option**: Accepts tenant ID. Single-tenant mode allows targeted maintenance, debugging, or backfill.; - **Batch mode**: With no `--tenant`, iterate all tenants, rebind context per iteration, run command logic.; - **Progress feedback**: Use `$this->output->progressStart(count($tenants))` for visibility in batch mode..
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