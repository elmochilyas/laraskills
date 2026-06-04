# Phase 10.5 — Dependency Schema Repair & Coverage Foundation

> **Date:** 2026-06-04
> **Status:** Complete

## Summary

Repaired the ECC intelligence layer's dependency graph schema, fixed the rebuild pipeline to produce valid JSON deterministically, and established a dependency coverage baseline with authoring backlog.

### What Was Broken

1. **`dependencies.json` schema** — malformed from the start. Missing `"knowledge_units"` wrapper key; raw KU objects directly embedded after edges array.
2. **BOM contamination** — all 8 JSON files had UTF-8 BOM (`0xFEFF`) from `Set-Content -Encoding UTF8` in PowerShell 5.1 (which always writes BOM).
3. **`rebuild-intelligence.ps1` Step 3g** — used `nodes` as the key name for the KU array instead of `knowledge_units`.
4. **`inject-dependency-edges.ps1` Phase 5** — fragile string manipulation to replace edges array. Broke when key name changed because it assumed key ordering. Also used BOM-producing `Set-Content`.

### What Was Fixed

#### File Repairs (Part 1)

| File | Fix |
|---|---|
| `intelligence/json/dependencies.json` | Rebuilt with correct `{"edges":[...],"knowledge_units":[...]}` schema. No BOM. |
| `intelligence/json/knowledge-units.json` | BOM stripped |
| `intelligence/json/rules.json` | BOM stripped |
| `intelligence/json/skills.json` | BOM stripped |
| `intelligence/json/decision-trees.json` | BOM stripped |
| `intelligence/json/anti-patterns.json` | BOM stripped |
| `intelligence/json/checklists.json` | BOM stripped |
| `intelligence/json/relationships.json` | BOM stripped |

#### Script Fixes (Part 2)

**`tools/rebuild-intelligence.ps1`:**
- Line 183: `nodes = $nodes` → `knowledge_units = $nodes`
- All 7 `Set-Content -Encoding UTF8` calls replaced with `Write-Utf8File` helper (writes BOM-free UTF-8 via `[System.IO.File]::WriteAllText`)

**`tools/generation/inject-dependency-edges.ps1`:**
- Line 160: `"nodes"` → `"knowledge_units"` in key lookup
- Phase 5: String manipulation replaced with proper JSON parse → modify → serialize using `ConvertFrom-Json`/`ConvertTo-Json`
- All 3 `Set-Content -Encoding UTF8` calls replaced with `Write-Utf8File` helper
- Closing `]` indentation fixed from 14 spaces → 4 spaces

#### Content Fixes (04 files)

Three cycles were fixed in `data-storage-systems` 04 files by moving inappropriate section-number references from Dependencies to Related KUs:

| 04 File | Change |
|---|---|
| `partitioning/range-partitioning` | Moved "Partition pruning" and "Partition management" from Dependencies → Related KUs |
| `connections/connection-lifecycle` | Moved "Laravel Octane connections" and "Connection count management" from Dependencies → Related KUs |
| `connections/connection-count-management` | Moved "Connection tags observability" from Dependencies → Related KUs |
| `optimization/explain-output-interpretation` | Moved all deps ("EXPLAIN ANALYZE", "Type column values", "Extra column flags") from Dependencies → Related KUs |

### Validation Results (46/46 schema checks pass)

| Check | Result |
|---|---|
| BOM-free (all 8 files) | PASS |
| `dependencies.json` edge count | 264 (down from 269, net -5: 3 cycle removals + 2 duplicate removals) |
| `relationships.json` edge count | 3,626 (up from 3,621, net +5 from new Related KUs metadata) |
| All dep edges resolve to canonical KUs | PASS (0 unresolved) |
| All rel edges resolve to canonical KUs | PASS (0 unresolved) |
| No duplicate edge IDs | PASS |
| No duplicate KU IDs | PASS |
| All dep KU IDs match canonical | PASS (2,321) |
| Artifact files (6) parse correctly | PASS |

### Known Content Issues (not schema)

1. **7 circular dependencies remain** — all in `data-storage-systems` domain. Caused by cross-referencing section numbers (e.g., "2.3" ↔ "2.4"). These do not affect schema validity but should be resolved by domain experts.
2. **324 unmatched dependency references** — external concepts like "Playwright basics", "HTTP protocol" that don't correspond to internal KUs. Expected behavior.
3. **2,043 KUs have no dependency edges** — only 278/2,321 KUs participate in the dependency graph. Addressed by the authoring backlog.

### Files Changed

- `tools/rebuild-intelligence.ps1` — schema key fix + BOM-free writes
- `tools/generation/inject-dependency-edges.ps1` — key fix + JSON-based Phase 5 + BOM-free writes
- `intelligence/json/dependencies.json` — schema repair + BOM strip
- `intelligence/json/knowledge-units.json` — BOM strip
- `intelligence/json/rules.json` — BOM strip
- `intelligence/json/skills.json` — BOM strip
- `intelligence/json/decision-trees.json` — BOM strip
- `intelligence/json/anti-patterns.json` — BOM strip
- `intelligence/json/checklists.json` — BOM strip
- `intelligence/json/relationships.json` — BOM strip
- `intelligence/indexes/dependency-index.md` — regenerated with real edge data
- `knowledge/data-storage-systems/partitioning/range-partitioning/04-standardized-knowledge.md` — cycle fix
- `knowledge/data-storage-systems/connections/connection-lifecycle/04-standardized-knowledge.md` — cycle fix
- `knowledge/data-storage-systems/connections/connection-count-management/04-standardized-knowledge.md` — cycle fix
- `knowledge/data-storage-systems/optimization/explain-output-interpretation/04-standardized-knowledge.md` — cycle fix
- `docs/dependency-coverage-baseline.md` — new
- `docs/dependency-authoring-backlog.md` — new

### New Documentation

| Doc | Purpose |
|---|---|
| `docs/dependency-coverage-baseline.md` | Per-domain coverage metrics, orphan analysis, cross-domain pairs, top depended-upon KUs |
| `docs/dependency-authoring-backlog.md` | Priority-ranked authoring backlog with proposed edges for zero-dep domains |

### Pipeline Verification

Both rebuild scripts now produce valid JSON deterministically without manual post-processing:

```powershell
# Full pipeline:
.\tools\rebuild-intelligence.ps1           # Generates all JSON + indexes + registry
.\tools\generation\inject-dependency-edges.ps1  # Injects dep/rel edges, regenerates dep index
```

Both steps produce valid JSON files with correct schema and no BOM.
