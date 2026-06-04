# Decomposition: rylxes/laravel-gdpr

## Topic Overview
rylxes/laravel-gdpr is the most comprehensive standalone GDPR compliance toolkit for Laravel. It covers data export (portability via JSON/CSV/XML with signed URLs), right to erasure (cooling-off period, per-model strategy overrides), consent management (versioned, IP-logged), and CCPA "Do Not Sell" support. The package provides Artisan commands for compliance officer workflows and an event system for extensibility.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
rylxes-laravel-gdpr/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### rylxes/laravel-gdpr
- **Purpose:** rylxes/laravel-gdpr is the most comprehensive standalone GDPR compliance toolkit for Laravel.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-GDP-002 (laravel-ai-act-compliance) — More comprehensive but AI-focused compliance stack, GCE-GDP-004 (soved-laravel-gdpr) — Legacy alternative, unmaintained, GCE-DRA-002 (retainable-contract-pattern) — Complements rylxes with full retention pipeline, GCE-AUD-002 (laravel-audit-chain) — Immutable audit for erasure request lifecycle

## Dependency Graph
**Depends on:**
- GCE-GDP-002 (laravel-ai-act-compliance) — More comprehensive but AI-focused compliance stack
- GCE-GDP-004 (soved-laravel-gdpr) — Legacy alternative, unmaintained
- GCE-DRA-002 (retainable-contract-pattern) — Complements rylxes with full retention pipeline
- GCE-AUD-002 (laravel-audit-chain) — Immutable audit for erasure request lifecycle

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Data export
- Right to erasure
- Consent management
- Cooling-off period
- Per-model strategy overrides
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-GDP-002 (laravel-ai-act-compliance) — More comprehensive but AI-focused compliance stack, GCE-GDP-004 (soved-laravel-gdpr) — Legacy alternative, unmaintained, GCE-DRA-002 (retainable-contract-pattern) — Complements rylxes with full retention pipeline, GCE-AUD-002 (laravel-audit-chain) — Immutable audit for erasure request lifecycle

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