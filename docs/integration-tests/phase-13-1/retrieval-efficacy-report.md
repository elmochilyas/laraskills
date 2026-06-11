# Phase 13.1 — Retrieval Efficacy Report

## Purpose

This report evaluates whether retrieved ECC knowledge influenced implementation decisions and whether that influence produced measurably better outcomes.

## Was Retrieval Used?

| Run | MCP Used? | Calls | Guidance Applied? |
|-----|-----------|-------|-------------------|
| 03-webhook baseline-controlled | No | 0 | N/A |
| 03-webhook ecc-voluntary | No | 0 | — |
| 03-webhook ecc-required | Yes | 51 | Yes — see below |
| 05-multi-tenant baseline-controlled | No | 0 | N/A |
| 05-multi-tenant ecc-voluntary | Yes | 12 | Partial — see below |
| 05-multi-tenant ecc-required | Yes | 94 | Yes — see below |
| 06-rag baseline-controlled | No | 0 | N/A |
| 06-rag ecc-voluntary | No | 0 | — |
| 06-rag ecc-required | Yes | 45 | Yes — see below |

## Domain Coverage by Run

### 03-Webhook ECC-Required

Retrieved knowledge spanned these domains:

| Domain | Queries | Impact |
|--------|---------|--------|
| API Integration Engineering | HMAC verification, webhooks, idempotency | **High** — guided testable webhook structure |
| Security & Identity Engineering | Signature verification, replay protection | **High** — hash_equals, timestamp ordering, 409 for duplicates |
| Async & Distributed Systems | Queue dispatch, dispatch-after-response | **Medium** — queue after verification pattern |
| Laravel Core Application Engineering | Controller method injection, middleware | **Medium** — thin controller pattern |
| Testing & Reliability Engineering | HTTP test helpers, Pest feature tests | **High** — 7 tests, 6 negative test scenarios |
| Data Storage Systems | Migration best practices | **Low** — basic schema design |

**Evidence of influence:** The ECC-required webhook implementation is the only one that:
- Stores the raw signature in the database
- Returns 409 Conflict for duplicate events (vs. 200 idempotent)
- Uses config-based timestamp tolerance
- Tests missing headers and invalid JSON

These differences align with ECC knowledge on security best practices for webhook handling.

### 05-Multi-Tenant ECC-Voluntary

Retrieved knowledge spanned these domains:

| Domain | KUs Retrieved | Impact |
|--------|--------------|--------|
| Multi-Tenant Architecture | multi-tenant-isolation | **Medium** — guided overall approach |
| Laravel Eloquent Domain Modeling | eloquent-global-scopes | **Low** — didn't implement global scopes |
| API CRUD System Engineering | form-request-validation, api-resources | **High** — FormRequests + Resources implemented |
| Security & Identity Engineering | policy-authorization | **Low** — didn't implement Policy class |

**Evidence of partial influence:** The voluntary run read about global scopes and policies but chose to use manual `abort(404)` checks instead. It did use FormRequests and API Resources (matching retrieved guidance) but the overall architecture (no Policy, manual checks) diverges from ECC recommendations.

### 05-Multi-Tenant ECC-Required

Retrieved knowledge spanned these domains:

| Domain | Queries | Impact |
|--------|---------|--------|
| Security & Identity Engineering | cross-tenant-data-leak-prevention | **High** — guided Policy-focused authorization |
| Data Storage Systems | database-per-tenant | **Medium** — scoping strategy |
| API CRUD System Engineering | api-resource-laravel, form-request-validation | **High** — implemented both patterns |
| Application Architecture Patterns | architecture/multi-tenant | **Medium** — influenced overall structure |

**Evidence of influence:** The ECC-required run is the only one that:
- Uses Policy as the primary authorization mechanism (matches ECC guidance)
- Has per-endpoint unauthenticated tests (matches ECC testing guidance)
- Uses apiResource routing (matches ECC convention guidance)
- Has pagination tests (matches ECC completeness guidance)

However, it has a bug (missing `return` in `Tenant->users()`) and uses Policy-only scoping without query-level defense — which partially contradicts ECC's defense-in-depth guidance.

### 06-RAG ECC-Required

Retrieved knowledge spanned these domains:

| Domain | Queries | Impact |
|--------|---------|--------|
| AI Intelligence Systems | Laravel AI SDK, RAG pipeline, document chunking | **High** — guided provider abstraction, chunking strategy |
| Async & Distributed Systems | Queue dispatch, job patterns | **Medium** — queue ingestion pattern |
| API CRUD System Engineering | API resources, thin controllers, form requests | **High** — clean controller architecture |
| Testing & Reliability Engineering | Model factories, fake providers | **High** — factories, Http::preventStrayRequests() |
| Laravel Core Application Engineering | Read/write config, controller methods | **Low** — minor structural guidance |

**Evidence of influence:** The ECC-required RAG implementation is the only one that:
- Uses PHP 8 `#[Fillable]` attributes on models (matches ECC's Laravel 13 first principle)
- Has `DocumentFactory` and `DocumentChunkFactory` (matches ECC testing guidance)
- Uses `Http::preventStrayRequests()` (matches ECC test isolation guidance)
- Has dedicated unit tests for chunking boundaries, overlap, and edge cases (matches ECC TDD guidance)
- Uses constructor injection in all actions (matches ECC DI guidance)
- Has a composite index on `(document_id, position)` (matches ECC database guidance)

## Retrieval Quality Assessment

### Strengths

1. **`retrieve_context_bundle` provides excellent task routing** — The 10 KUs + 10 rules + 6 skills returned consistently cover the relevant domain space
2. **`search_ecc` enables targeted deep dives** — Agents used it for iterative refinement (up to 33 queries per run)
3. **`validate_ecc` confirms integrity** — All runs confirmed the knowledge graph is cycle-free
4. **Knowledge influenced architecture** — ECC-required implementations consistently follow better patterns (constructor injection, contracts, factories, thin controllers)

### Weaknesses

1. **Canonical ID mismatch** — ~85% of `get_knowledge_unit` calls failed because agents used display names instead of canonical IDs
2. **No `get_graph_context` usage** — Agents don't naturally explore related knowledge via graph edges
3. **Context budget waste** — Agents paste full prompt text as `retrieve_context_bundle` task description
4. **Voluntary adoption is low** — Only 1 of 3 voluntary runs used MCP at all
5. **Decoupling**: High MCP call counts (94 in multi-tenant required) consume significant context budget, potentially crowding out implementation quality

## Correlation: MCP Usage vs. Score

| Run | Total MCP Calls | Score | Rank in Scenario |
|-----|----------------|-------|------------------|
| 03-baseline-controlled | 0 | 72.5 | 2nd |
| 03-ecc-voluntary | 0 | 70.0 | 3rd |
| 03-ecc-required | 51 | **81.0** | **1st** |
| 05-baseline-controlled | 0 | **87.0** | **1st** |
| 05-ecc-voluntary | 12 | 72.5 | 3rd |
| 05-ecc-required | 94 | 77.0 | 2nd |
| 06-baseline-controlled | 0 | 74.0 | 2nd |
| 06-ecc-voluntary | 0 | 72.0 | 3rd |
| 06-ecc-required | 45 | **86.0** | **1st** |

**Pattern**: ECC-required wins in 2 of 3 scenarios (webhook, RAG). Baseline wins in 1 (multi-tenant). The correlation between MCP usage and score is not monotonic — 94 calls (multi-tenant required) did not produce the best score.

## Recommendations

1. **Fix canonical ID resolution** in `get_knowledge_unit` to accept multiple ID formats
2. **Improve `search_ecc` result display** to prioritize canonical IDs in search results
3. **Add `get_graph_context` to the required-retrieval instruction** to test if agents can learn to use it
4. **Consider a "recommended workflow" hint** in voluntary mode to increase adoption
5. **Reduce context waste** by suggesting agents summarize task descriptions for `retrieve_context_bundle`
