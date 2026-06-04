# ECC Retrieval — Known Limitations

## Functional Limitations

### 1. Token-Overlap Scoring Is Naive

The token overlap scorer (`tokenOverlap` signal, weight 10-35) uses simple set intersection between query tokens and KU metadata tokens. This does not account for:
- TF-IDF term frequency
- Semantic similarity
- Synonym expansion beyond the alias file
- Phrase-level matching

**Impact:** KUs with generic names may rank slightly higher than ideal for ambiguous queries.

### 2. Domain Routing Is Rule-Based

Domain routing uses hand-crafted regular expression patterns. This approach:
- Cannot learn from data
- May miss novel combinations of task terms
- Has no confidence calibration beyond simple keyword count

**Impact:** Novel or unusually-phrased tasks may receive suboptimal domain routing.

### 3. No Full-Text Search

The engine does not index or search the full Markdown content of knowledge units during initial candidate generation. It operates exclusively on JSON metadata (KU names, subdomains, domains, summaries, aliases).

**Impact:** Content-rich but poorly-named KUs may not be discovered unless their metadata contains matching terms.

### 4. Token Budget Is Approximate

Token estimation uses `Intl.Segmenter` word segmentation with a 1.3x multiplier. This is:
- Reasonable for broad estimation
- Not equivalent to any specific LLM tokenizer
- Not byte-precise

**Impact:** The `--budget` option provides a soft guide, not a hard enforcement.

### 5. Deep Mode Content Loading Limited

Deep mode is designed to load selected Markdown artifact content. The current implementation includes the mode flag and structure but does not perform full Markdown file I/O for the knowledge files.

**Impact:** Deep mode returns the same metadata structure as standard mode but with higher limits. Full Markdown content loading (from `knowledge/` directory) requires a future enhancement.

### 6. No Cache Layer

The catalog loader reads and parses all 10 JSON files (~15MB total) on every invocation. This is fast on modern hardware (~35ms cold read on SSD) but:
- No in-memory caching across invocations
- No incremental loading
- No LRU cache for repeated queries

**Impact:** Each CLI invocation incurs the full load cost. Acceptable for single queries but not optimal for repeated lookups.

### 7. No Cross-Language Support

All query analysis, domain keywords, and alias entries are English-only.

**Impact:** Non-English queries will have degraded routing accuracy.

### 8. Benchmark Tasks Are Static

The 65 benchmark tasks are hand-authored and may not represent the full diversity of real-world Laravel engineering queries.

**Impact:** Benchmark pass rate is a useful relative metric but does not guarantee performance on unseen query distributions.

## Known Issues

### Issue: Optional Alias Files

If `aliases.json` or `external-concepts.json` are absent, the loader emits a warning but continues. The engine operates correctly without them, but alias resolution will be unavailable.

### Issue: Dependency Edge Direction

Dependencies are unidirectional prerequisities. The graph expander only walks from target to source (finding what depends on what). It does not walk forward to find KUs that depend on a given KU.

### Issue: Score Weight Tuning

Score weights in `src/retrieval/config.mjs` were set based on domain expertise rather than empirical calibration. Large-scale A/B testing could identify optimal weight configurations.

## Feature Gaps

| Feature | Status | Priority |
|---|---|---|
| Full-text Markdown search | Not implemented | Medium |
| Result caching | Not implemented | Low |
| Score weight auto-tuning | Not implemented | Low |
| Non-English query support | Not implemented | Low |
| Incremental JSON loading | Not implemented | Low |
| Deep mode Markdown content | Partial (structure only) | Medium |

## Scope Exclusions (by Design)

- **No MCP server** — Will be added in Phase 11.2 as a thin adapter
- **No vector embeddings** — Deterministic, no ML dependencies
- **No external database** — File-system based, zero infrastructure
- **No network access** — Fully offline
- **No AI generation** — Retrieval only, no LLM calls
