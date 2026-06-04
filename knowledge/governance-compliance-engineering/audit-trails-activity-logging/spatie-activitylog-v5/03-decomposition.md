# Decomposition: Spatie laravel-activitylog v5

## Topic Overview
Spatie/laravel-activitylog is the de facto standard audit logging package for Laravel, with 48M+ installs. v5 (March 2026) is a major architectural overhaul requiring PHP 8.4+ and Laravel 12+. It introduces a dedicated `attribute_changes` column, swappable action classes, in-memory activity buffering, and removes the legacy batch and pipe systems.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
spatie-activitylog-v5/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spatie laravel-activitylog v5
- **Purpose:** Spatie/laravel-activitylog is the de facto standard audit logging package for Laravel, with 48M+ installs.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-AUD-002 (laravel-audit-chain) — Cryptographic hash chain alternative for tamper-evident audit trails, GCE-AUD-003 (dineshstack-audit) — Field-level diffs, batch grouping, alert rules, GCE-AUD-004 (williamug-audited) — Admin UI-focused audit with Livewire/Vue, GCE-DRA-001 (laravel-prunable-trait) — Complements activity pruning for data retention, GCE-OWA-001 (owasp-top-10-2025) — Audit logging is a security control for OWASP #9 (Logging & Monitoring)

## Dependency Graph
**Depends on:**
- GCE-AUD-002 (laravel-audit-chain) — Cryptographic hash chain alternative for tamper-evident audit trails
- GCE-AUD-003 (dineshstack-audit) — Field-level diffs, batch grouping, alert rules
- GCE-AUD-004 (williamug-audited) — Admin UI-focused audit with Livewire/Vue
- GCE-DRA-001 (laravel-prunable-trait) — Complements activity pruning for data retention
- GCE-OWA-001 (owasp-top-10-2025) — Audit logging is a security control for OWASP #9 (Logging & Monitoring)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- LogsActivity trait
- attribute_changes column
- Activity contract
- HasActivity trait
- Named logs
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-AUD-002 (laravel-audit-chain) — Cryptographic hash chain alternative for tamper-evident audit trails, GCE-AUD-003 (dineshstack-audit) — Field-level diffs, batch grouping, alert rules, GCE-AUD-004 (williamug-audited) — Admin UI-focused audit with Livewire/Vue, GCE-DRA-001 (laravel-prunable-trait) — Complements activity pruning for data retention, GCE-OWA-001 (owasp-top-10-2025) — Audit logging is a security control for OWASP #9 (Logging & Monitoring)

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