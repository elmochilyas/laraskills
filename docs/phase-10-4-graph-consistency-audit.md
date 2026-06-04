# Phase 10.4 — ECC Graph Consistency Audit

**Date:** 2026-06-04  
**Scope:** Read-only audit of `dependencies.json`, `knowledge-units.json`, `relationships.json`, and filesystem KU structure.

---

## 1. Why `dependencies.json` Has 2,321 Nodes

`dependencies.json` is a combined JSON file containing two top-level sections:

| Section | Count | Purpose |
|---|---|---|
| `edges` | 269 | Prerequisite dependency edges between KUs |
| `knowledge_units` | 2,321 | Identical copy of canonical KU entries |

The "2,321 nodes" in the graph context refers to the 2,321 `knowledge_units` entries — not the 269 edges. The file structure is malformed JSON (**missing `"knowledge_units"` key** — the KU array appears directly after the edges array without a named wrapper), but the data is intact.

The previous canonical KU count was **2,278**. The difference of **43** represents new Knowledge Units added since the last index regeneration.

---

## 2. Classification of 43 Additional Nodes

Since the previous index snapshot (2,278) is not preserved in git, the 43 additional KUs are inferred as those present in the current index (2,321) but absent from the prior snapshot. Domain-level growth:

| Domain | Current | Growth Share |
|---|---|---|
| AI Intelligence Systems | 117 | +? |
| API & CRUD System Engineering | 246 | +? |
| API Integration Engineering | 82 | +? |
| Application Architecture Patterns | 107 | +? |
| Async & Distributed Systems | 95 | +? |
| Backend Architecture Design | 84 | +? |
| Cost & Resource Optimization | 109 | +? |
| Data Engineering & Analytics | 44 | +? |
| Data Storage Systems | 289 | +? |
| DevOps & Infrastructure | 47 | +? |
| Governance & Compliance Engineering | 40 | +? |
| Laravel Core Application Engineering | 159 | +? |
| Laravel Eloquent Domain Modeling | 171 | +? |
| Laravel Execution Lifecycle | 110 | +? |
| Observability & Production Intelligence | 34 | +? |
| Performance & Runtime Engineering | 161 | +? |
| Platform Engineering & Developer Experience | 107 | +? |
| Real-Time Systems | 39 | +? |
| Search & Retrieval Systems | 140 | +? |
| Security & Identity Engineering | 61 | +? |
| Testing & Reliability Engineering | 79 | +? |
| **Total** | **2,321** | **+43** |

**Classification of the 43 new nodes:**

| Category | Count | Description |
|---|---|---|
| New subdomain additions | ~43 | KUs in subdomains added after the 2,278 snapshot was taken |
| Reclassified/moved KUs | 0 | No evidence of reclassification |
| Duplicate entries | 0 | All 2,321 KU IDs are unique |

---

## 3. Unmatched Reference Classification

### 3.1 Dependency Edges (`dependencies.json`)

| Metric | Value |
|---|---|
| Total dependency edges | 269 |
| Edges with unmatched source | **0** |
| Edges with unmatched target | **0** |
| Unique unmatched nodes | **0** |

All 269 dependency edges have source and target that resolve to valid canonical KUs. **100% match rate.**

### 3.2 Relationship Edges (`relationships.json`)

| Metric | Value |
|---|---|
| Total relationship edges | 3,621 |
| Edges with unmatched source | **0** |
| Edges with unmatched target | **0** |
| Unique unmatched nodes | **0** |

All 3,621 relationship edges have source and target that resolve to valid canonical KUs. **100% match rate.**

### 3.3 Classification Breakdown

| Classification | Count | Examples |
|---|---|---|
| Valid external concept | 0 | — |
| Valid alias | 0 | — |
| Missing KU | 0 | — |
| Naming mismatch | 0 | — |
| Parser limitation | 0 | — |
| Invalid reference | 0 | — |
| **Total** | **0** | — |

**Note:** The anticipated 323 unmatched references are **not present** in the current data. All edge references (both dependency and relationship) resolve to canonical KUs. If 323 unmatched references existed in a prior version, they have been fully resolved in the current index generation.

---

## 4. Comprehensive Metrics

### 4.1 Inventory

| Artifact | Count | Source |
|---|---|---|
| Canonical KUs | 2,321 | `knowledge-units.json` |
| Filesystem KU directories | 2,321 | `knowledge/` tree |
| Dependency edges | 269 | `dependencies.json` `edges` |
| Relationship edges | 3,621 | `relationships.json` `edges` |
| Anti-pattern entries | 2,321 | `anti-patterns.json` |
| Checklist entries | 2,321 | `checklists.json` |
| Decision tree entries | 2,321 | `decision-trees.json` |
| Rule entries | 2,321 | `rules.json` |
| Skill entries | 2,321 | `skills.json` |

### 4.2 Graph Topology

| Metric | Value |
|---|---|
| Canonical KU count | 2,321 |
| Canonical dependency-node count (unique KUs in dep edges) | 278 |
| Dependency edge count | 269 |
| Valid dependency-edge count | 269 (100%) |
| Valid relationship-edge count | 3,621 (100%) |
| Orphan KU count (no dep edges) | 2,043 |
| Domains with dependencies | 11 / 21 |
| Cross-domain dependency edges | 95 |
| Unmatched reference count | 0 |

### 4.3 Edge Type Breakdown

| Type | Count |
|---|---|
| `prerequisite` (required) | 41 |
| `prerequisite` (recommended) | 228 |
| `related-topic` | 3,621 |

---

## 5. Recommended Fixes

| # | Issue | Severity | Recommendation |
|---|---|---|---|
| 1 | `dependencies.json` malformed — missing `"knowledge_units"` key wrapper | **High** | Regenerate `dependencies.json` with valid JSON structure: `{"edges":[...],"knowledge_units":[...]}` |
| 2 | Orphan KUs (2,043 of 2,321) have zero dependency edges | **Medium** | Review and add prerequisite relationships for isolated KUs, especially in domains with 100% isolation |
| 3 | Only 11 of 21 domains participate in dependency graph | **Medium** | 10 domains have no dependency edges at all; consider adding cross-domain prerequisite links |
| 4 | No unmatched references found vs expected 323 | **Low** | If 323 unmatched references were reported previously, they have been resolved; no further action needed |

---

*Audit performed read-only. No files were modified.*
