# Rebuild Tooling Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Script Inventory

| Script | Lines | Purpose |
|--------|-------|---------|
| `tools/rebuild-intelligence.ps1` | 493 | Build all 10 JSON files from knowledge/ |
| `tools/generation/inject-dependency-edges.ps1` | 441 | Inject dependency/relationship edges into JSON |
| `generate-intelligence.ps1` | 451 | Legacy intelligence build (root level) |
| `generate-indexes.ps1` | 580 | Generate Markdown indexes from JSON |

## Static Analysis Results

### rebuild-intelligence.ps1

| Check | Result |
|-------|--------|
| Valid PowerShell syntax | ✅ |
| Uses ConvertTo-Json (not string replace) | ✅ |
| Preserves wrapper keys | ✅ |
| Deduplicates edges | ✅ |
| Removes self-loops | ✅ |
| Detects cycles | ✅ |
| BOM-free UTF-8 | ✅ |
| Paths outside repo | ✅ No |

**Risk:** `Get-ChildItem` without `Sort-Object` (line 51) — KU order depends on filesystem traversal order.

### inject-dependency-edges.ps1

| Check | Result |
|-------|--------|
| Valid PowerShell syntax | ✅ |
| Uses ConvertFrom-Json/ConvertTo-Json | ✅ |
| Preserves wrapper keys | ✅ |
| Deduplicates edges | ✅ ($seenEdges, $seenRels) |
| Removes self-loops | ❌ **MISSING** — no explicit self-loop check |
| Detects cycles | ✅ (DFS on initial + post-alias graphs) |
| BOM-free UTF-8 | ✅ |
| Paths outside repo | ✅ No |

**Critical Risk:** Fuzzy substring match (line 127-129) with `break` on first match is **non-deterministic** due to hashtable key enumeration order. 587 potential ambiguous substring collisions exist.

### generate-intelligence.ps1

| Check | Result |
|-------|--------|
| Valid PowerShell syntax | ✅ |
| Fragile string replace | ❌ Custom JSON prettifier (lines 362-386) is fragile |
| BOM-free | ❌ Uses `Out-File -Encoding UTF8` → BOM in PowerShell 5.1 |
| Deduplicates | ✅ |
| Self-loop removal | ✅ |
| Hashtable iteration | ❌ `$uniqueEdges.Values` — non-deterministic ordering |

### generate-indexes.ps1

| Check | Result |
|-------|--------|
| Valid PowerShell syntax | ✅ |
| Sort-Object used | ✅ (most iterations) |
| BOM-free | ❌ Uses `[System.Text.Encoding]::UTF8` which has BOM |
| Bug | 🐛 Line 430: `$_.ku_id` should be `$_.id` (wrong property name) |

## Determinism Assessment

| Script | Deterministic? | Confidence |
|--------|---------------|------------|
| rebuild-intelligence.ps1 | ⚠️ Mostly | Medium — Sort-Object missing |
| inject-dependency-edges.ps1 | **❌ NO** | Low — hashtable enumeration + fuzzy match |
| generate-intelligence.ps1 | ⚠️ Mostly | Medium — hashtable .Values |
| generate-indexes.ps1 | ✅ Yes | High — all iterations sorted |

**Overall pipeline: NOT guaranteed byte-identical on re-run.**

## Current JSON Hashes

| File | SHA-256 |
|------|---------|
| aliases.json | `61A25FE28F67B292EFB7FBFDD4E191B21B3FBDBD2E1CC8EF0627904A0276459D` |
| anti-patterns.json | `CA1DD3DDEEAC95E90D88D007F2058ED53021D5406194C2497752DCAF98825935` |
| checklists.json | `9894F4D7D80E5A76678B456A592C36B2E2047BDC735FAC9C9D5BECE8526148FB` |
| decision-trees.json | `5AF1002C223EE7ACEDBE8C49D882AF8A740FE8DAB74654EE3354CA83039271A4` |
| dependencies.json | `91BC73556A1095BFDC8211E86487CC4BF75BF084F4626D0A9871F4247446D8BB` |
| external-concepts.json | `61234290C4720DB23172ACA7DE4D02A758C0F53960A5EB48A49FCE37F677C738` |
| knowledge-units.json | `4581C4BAF899CDB9EA6214A13CDBB9F5781DE5395F0A76746DB22AD704F2D25E` |
| relationships.json | `CED981795ACEF9FAAEDF4FF3A9EC58E40AC978F500A6137539E6A7BA74E997F6` |
| rules.json | `B6BD8B0CB22E80D5B74654B2C0802BD046A2A7FABCC48708F3EE45A8FD14FDCA` |
| skills.json | `27B408BCD32961C61CA327A17B8663555F4147337A6624F636A6BBA89EB11866` |

## Verdict

| Check | Result |
|-------|--------|
| Scripts parse correctly | ✅ |
| Deterministic output | ❌ Non-deterministic (edge ordering, fuzzy matching) |
| BOM-free output | ❌ generate-intelligence.ps1 and generate-indexes.ps1 write BOM |
| No fragile string replace | ❌ Custom JSON prettifier in generate-intelligence.ps1 |
| Deduplicates edges | ✅ |
| Removes self-loops | ❌ inject-dependency-edges.ps1 missing self-loop check |
| Detects cycles | ✅ |
| No paths outside repo | ✅ |
| No knowledge rewriting | ✅ |
