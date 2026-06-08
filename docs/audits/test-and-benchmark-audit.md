# Test and Benchmark Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Test Results

| Metric | Count |
|--------|-------|
| Total Tests | **139** |
| Suites | 30 |
| Pass | **139** |
| Fail | **0** |
| Skipped | **0** |
| Pass Rate | **100%** |

## Test Files (`tests/retrieval/`)

| File | Tests | Covers |
|------|-------|--------|
| cli.test.mjs | 11 | retrieve/search/get/prerequisites/related/validate smoke tests |
| context-bundler.test.mjs | 15 | Bundle structure, modes (compact/standard/deep), determinism |
| ranker.test.mjs | 6 | Scoring, breakdown, determinism, tie-breaking, domain priority |
| catalog-loader.test.mjs | 14 | KU loading, error handling, dedup |
| alias-resolver.test.mjs | 7 | Exact/normalized/substring alias, dedup |
| graph-expander.test.mjs | 8 | Prerequisites, related, cycle safety, limits |
| validator.test.mjs | 18 | Cycles (self-loop/2-node/multi-node/SCC), duplicates, CLI errors |
| encoding.test.mjs | 11 | UTF-8 validity, mojibake detection across all 10 JSON files |
| mcp.test.mjs | 18 | Startup, shutdown, stdio cleanliness, all 5 MCP tools, determinism |

## Benchmark Results

| Metric | Count |
|--------|-------|
| Total Tasks | **70** |
| Pass | **70** |
| Fail | **0** |
| Pass Rate | **100%** |

### Q-Metrics

| Metric | Value |
|--------|-------|
| Primary Domain Accuracy | 100.0% (70/70) |
| Supporting Domain Recall | 89.3% (92/103) |
| Forbidden Domain Precision | 94.4% (51/54 clean) |
| Top-KU Recall | 100.0% (13/13) |
| Avg Tokens per Query | 3,267 |

## Regression Tasks Verified

| ID | Task | Domains | Expected KUs | Status |
|----|------|---------|-------------|--------|
| bench-066 | CRUD API with Policies and Pagination | api-crud-system-engineering, security-identity-engineering, data-storage-systems | pagination, policy, controller | **PASS** |
| bench-067 | N+1 query with eager loading/caching | laravel-eloquent-domain-modeling, data-storage-systems, performance-runtime-engineering | n-plus-one, eager-loading | **PASS** |
| bench-068 | Sanctum SPA auth with multi-tenant isolation | security-identity-engineering, api-crud-system-engineering, data-storage-systems | sanctum, tenant | **PASS** |
| bench-069 | Queue email with retry and failure handling | async-distributed-systems, performance-runtime-engineering | queue, retry, failure | **PASS** |
| bench-070 | Semantic search with embeddings and pgvector | search-retrieval-systems, ai-intelligence-systems, data-storage-systems | search, pgvector, vector | **PASS** |

## Verdict

| Check | Result |
|-------|--------|
| 139/139 tests passing | ✅ |
| 70/70 benchmarks passing | ✅ |
| CRUD regression task | ✅ |
| N+1 regression task | ✅ |
| Sanctum + tenant regression | ✅ |
| Queue retry regression | ✅ |
| pgvector regression | ✅ |
