# Graph Integrity Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Graph Metrics

| Metric | Value |
|--------|-------|
| Canonical Nodes (KU) | 2,321 |
| Dependency Edges | 428 |
| Relationship Edges | 3,633 |
| Aliases | 120 |
| External Concepts | 26 |
| Cycles | **0** ✅ |
| Dependency Self-Loops | **0** ✅ |
| Relationship Self-Loops | **45** ⚠️ |
| Dangling Dependency References | **0** ✅ |
| Dangling Relationship References | **0** ✅ |
| Broken Aliases | **0** ✅ |
| Duplicate Dependency Edges | **0** ✅ |
| Duplicate Relationship Edges | **0** ✅ |
| Cross-Domain Dependency Edges | 101 |
| Participating Domains | 21 |
| Domains with Dependencies | 13 |
| Domains without Dependencies | 8 |

## Cycle Detection

Algorithm: DFS-based topological sort with recursion stack tracking.

**Result: 0 cycles** ✅

The graph is acyclic. No circular dependency paths exist.

## Self-Loop Analysis

### Dependencies: 0 self-loops ✅
No KU has a dependency edge pointing to itself.

### Relationships: 45 self-loops ⚠️
All 45 are `related-topic` type where `source === target`. Each KU relating to itself is a logical error — relationships should be between distinct KUs.

**Affected:** 45 KUs in relationships.json have self-referencing related-topic edges.

## Dangling Reference Check

### Dependencies
All 428 edges: both source and target IDs exist in `knowledge-units.json`. **0 dangling references.** ✅

### Relationships
All 3,633 edges: both source and target IDs exist. **0 dangling references.** ✅

## Alias Validation

All 120 aliases target IDs that exist in `knowledge-units.json`. **0 broken aliases.** ✅

## Orphan Analysis

Domains **without** dependency edges (8 domains):
- ai-intelligence-systems
- api-integration-engineering
- application-architecture-patterns
- data-engineering-analytics
- governance-compliance-engineering
- observability-production-intelligence
- platform-engineering-developer-experience
- real-time-systems

These domains are fully isolated in the dependency graph. This is not necessarily a problem — they may be independent topics — but it means the graph does not express their connections.

## Cross-Domain Edges

**101 cross-domain dependency edges** connect KUs from different domains. This indicates meaningful knowledge sharing across domain boundaries.

## Verdict

| Check | Result |
|-------|--------|
| Cycles = 0 | ✅ PASS |
| Self-loops (deps) = 0 | ✅ PASS |
| Self-loops (rels) = 0 | ❌ 45 found |
| Dangling dep references = 0 | ✅ PASS |
| Dangling rel references = 0 | ✅ PASS |
| Broken aliases = 0 | ✅ PASS |
| Duplicate deps = 0 | ✅ PASS |
