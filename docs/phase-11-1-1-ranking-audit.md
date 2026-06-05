# Phase 11.1.1 — Retrieval Ranking Audit

## Reproduction Query

```text
Build a CRUD REST API for products with policies and pagination
```

## Current Behavior

The engine correctly routes to `api-crud-system-engineering` as the primary domain.

However, **8 of the top 10 KUs come from the `rest-api-design` subdomain** and include:
- `conditional-requests`
- `content-negotiation`
- `cors-design`
- `hateoas-hypermedia-controls`
- `http-method-semantics`
- `idempotency-semantics`
- `resource-naming-conventions`
- `resource-vs-action-orientation`

All receive an identical score of **160** despite having no meaningful connection to the query's explicit concepts (CRUD, policies, pagination, products, validation).

## Root Causes

### 1. `skillExists: +90` — Artifact Existence Mistaken for Relevance

**File:** `src/retrieval/ranker.mjs:51-54`

```js
if (skillKuMap.has(id)) {
  totalScore += SCORE_WEIGHTS.exactSkill;  // +90
  breakdown.push({ signal: 'skillExists', value: 90, ... });
}
```

Every KU in the database that has any associated skill file receives a flat +90. The `exactSkill` weight (90) is misnamed — it does not check whether the skill name or workflow matches the query. It only checks whether a skill file exists for that KU.

**Impact:** 2,263 of 2,321 KUs have `has_skills: true`, meaning virtually every candidate gets +90. This completely dominates the scoring and makes token overlap (+25) and domain bonus (+45) marginal differentiators.

### 2. Undifferentiated Token Overlap

**File:** `src/retrieval/ranker.mjs:56-72`

Token overlap is calculated as one combined count across:
- KU name (often just a number like `"01"`)
- KU ID (e.g., `api-crud-system-engineering/rest-api-design/conditional-requests`)
- Subdomain (e.g., `rest-api-design`)

All three sources are merged into a single `overlap` count, then mapped to a clamped score of 10-35.

**Problem:** Generic terms (`api`, `rest`, `crud`, `design`, `engineering`, `system`) appear in virtually every KU in the API domain. A KU about HATEOAS gets the same token overlap score as one about CRUD controllers because `api`, `rest`, and `design` are present in both.

There is no **stopword list** for ranking-level token scoring. Terms that are useful for domain routing (`api`, `crud`, `rest`) become noise for per-KU ranking.

### 3. No Field-Aware Weighting

Token matches in the KU name (the actual content descriptor) have the same weight as token matches in the subdomain or the domain portion of the ID. A query token matching a KU's descriptive name should count more than matching its subdomain or its domain.

### 4. No Query Concept Decomposition

The query "Build a CRUD REST API for products with policies and pagination" contains at least 5 explicit concepts:
- CRUD → resource controllers
- REST API → endpoint/resource design
- Policies → authorization
- Pagination → cursor/offset pagination
- Products → resource modeling

The engine treats the query as a flat bag of words. There is no concept extraction, slot filling, or coverage tracking. If no KU about policies makes it into the top 10, the engine does not notice or compensate.

### 5. No Coverage-Aware Re-Ranking

The top 10 results can (and do) come from a single narrow subdomain (`rest-api-design`). There is no penalty for redundancy, no slot-based selection, and no diversity heuristic.

### 6. Cross-Domain Concepts Not Fulfilled

The query mentions "policies" which clearly maps to `security-identity-engineering` — listed as a supporting domain. Yet no KU from that domain appears in the top 10. The domain is correctly identified but its KUs are never boosted into the result set.

### 7. Generic Artifact Summaries

Bundled artifacts show:
```
Summary: Rules for pagination-with-complex-filters
Summary: Skills for pagination-with-complex-filters
```

These are generated from the JSON intelligence `summary` field, which stores "Rules for {KU-name}" or "Skills for {KU-name}" — generic placeholders, not actionable content.

### 8. Em-Dash Mojibake in `relationships.json`

The file `intelligence/json/relationships.json` contains 932 occurrences of `â€”` (U+00E2 U+20AC U+201D) instead of `—` (U+2014), and 8 occurrences of `â†’` (U+00E2 U+2020 U+2019) instead of `→` (U+2192).

**Cause:** During intelligence generation, Markdown files containing UTF-8 encoded em-dashes were read as Latin-1 (each byte interpreted as a separate character), then written as UTF-8. The triple-byte UTF-8 sequence `0xE2 0x80 0x94` (U+2014) became the three characters `â€”`.

## Quantitative Impact

| Metric | Current Value |
|--------|---------------|
| KUs in primary domain | 10 of 10 top results |
| KUs from `rest-api-design` subdomain | 8 of 10 |
| KUs explicitly matching query concepts | 1 of 10 (pagination) |
| Cross-domain concept coverage | 0 of 2 (policies, authorization) |
| Distinct subdomains in top 10 | 2 (rest-api-design, pagination-strategies) |
| Score spread | None — all 160 |

## Files Examined

- `src/retrieval/ranker.mjs` — Scoring logic
- `src/retrieval/candidate-generator.mjs` — Candidate selection
- `src/retrieval/domain-router.mjs` — Domain routing
- `src/retrieval/query-analyzer.mjs` — Query analysis
- `src/retrieval/query-normalizer.mjs` — Query normalization
- `src/retrieval/context-bundler.mjs` — Bundle assembly
- `src/retrieval/formatter.mjs` — Output formatting
- `src/retrieval/explainer.mjs` — Explanation generation
- `src/retrieval/config.mjs` — Score weights
- `src/retrieval/catalog-loader.mjs` — Catalog loading
- `tests/retrieval/run-benchmarks.mjs` — Benchmark runner
- `tests/retrieval/fixtures/benchmark-tasks.json` — Benchmark fixtures
- `intelligence/json/relationships.json` — Relationship edges
- `intelligence/json/knowledge-units.json` — KU metadata
- `intelligence/json/skills.json` — Skill entries

## Recommended Fixes

1. Replace `skillExists: +90` with field-aware scoring (skill name matching, not artifact existence)
2. Separate token overlap into field-aware components (KU name, subdomain, ID, generic tokens)
3. Add query concept decomposition with slot-based coverage
4. Add coverage-aware re-ranking pass
5. Boost cross-domain KUs when explicit concepts match
6. Load actual artifact content instead of generic summaries
7. Fix em-dash mojibake in relationships.json
