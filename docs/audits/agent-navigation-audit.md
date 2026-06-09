# Agent Navigation Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Navigation Files (`agent/`)

| File | Lines | Purpose |
|------|-------|---------|
| agent-routing-map.md | 165 | Maps task categories → skill → agent |
| domain-routing-index.md | 179 | Per-domain KU counts and subdomain listing |
| domain-selection-guide.md | 221 | Task → domain mapping |
| retrieval-guide.md | 105 | 7 navigation paths for different use cases |
| task-to-skill-map.md | 100 | Task category → skill mapping |

All 5 files present. ✅

## Issues Found

### 🔴 ISSUE 1: Stale KU Counts in `domain-routing-index.md`

10 of 21 domains have incorrect KU counts:

| Domain | routing-index | Actual (JSON) | Delta |
|--------|:------------:|:-------------:|:-----:|
| ai-intelligence-systems | 114 | 117 | -3 |
| api-integration-engineering | 62 | 82 | **-20** |
| async-distributed-systems | 80 | 95 | **-15** |
| backend-architecture-design | 58 | 84 | **-26** |
| cost-resource-optimization | 110 | 109 | +1 |
| data-engineering-analytics | 42 | 44 | -2 |
| data-storage-systems | 275 | 289 | **-14** |
| laravel-core-application-engineering | 139 | 159 | **-20** |
| laravel-execution-lifecycle | 115 | 110 | +5 |
| observability-production-intelligence | 31 | 34 | -3 |
| security-identity-engineering | 53 | 61 | -8 |

**Total:** routing-index sums to ~2,216 vs actual 2,321.

### 🟡 ISSUE 2: Wrong Index Anchor Links

`domain-routing-index.md` links to `intelligence/indexes/checklist-index.md#domain` instead of `intelligence/indexes/knowledge-unit-index.md#domain`. Agents following these links land on the checklist index instead of the KU index.

### 🟡 ISSUE 3: Skill/Agent Gaps in `agent-routing-map.md`

Several task categories lack specific skills or agents:
- **No specific skill:** Observability, AI & LLM, Async & Queues, Real-Time, Search, Data Engineering, Cost Optimization, Frontend, Platform Engineering
- **No specific agent:** Testing, Performance, DevOps, Observability, AI & LLM, Async & Queues, Real-Time, Search, Data Engineering, Cost Optimization, Platform Engineering, Backend Architecture

### 🟡 ISSUE 4: Stale Subdomain Listings

Some subdomain listings mismatch reality (e.g., `api-integration-engineering` lists 62 KUs vs 82 actual, missing subdomains).

## Navigation Test Results

| Navigation Question | Answer | Verdict |
|--------------------|--------|---------|
| "Where should I start?" | `agent/retrieval-guide.md` provides 7 navigation paths | ✅ Clear |
| "Which domain applies for CRUD API?" | `domain-selection-guide.md` → api-crud-system-engineering | ✅ Clear |
| "Which KUs for authentication?" | `domain-routing-index.md` → security-identity-engineering | ⚠️ Count wrong |
| "Which skills for security?" | `task-to-skill-map.md` → laravel-security, laravel-authentication | ✅ Clear |
| "Which anti-patterns for Eloquent?" | `anti-pattern-index.md` → navigate to knowledge/ | ✅ Navigable |
| "Which checklist for testing?" | `checklist-index.md` → Testing & Reliability Engineering | ✅ Navigable |
| "Which prerequisites to load?" | `retrieval-guide.md` → Dependency-Aware path | ✅ Clear |
| "Which graph relationships?" | `retrieval-guide.md` → Graph expansion | ✅ Clear |

## Verdict

| Check | Result |
|-------|--------|
| 5 navigation files present | ✅ |
| Agent can find start point | ✅ |
| Domain selection works | ✅ |
| KU inspection works | ⚠️ Counts stale in routing-index |
| Skill loading works | ⚠️ Some gaps in routing map |
| Rule application works | ✅ |
| Anti-pattern avoidance works | ✅ |
| Checklist validation works | ✅ |
| Prerequisite loading works | ✅ |
| Graph relationship inspection works | ✅ |
