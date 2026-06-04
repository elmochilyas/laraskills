# ECC Retrieval Ranking Strategy

## Overview

The ranking system uses deterministic weighted signal scoring. Every result receives a score derived from configurable weights. Higher scores indicate stronger relevance to the query. Tie-breaking is performed lexicographically by KU ID for stable, reproducible results.

All weights are stored in `src/retrieval/config.mjs` under `SCORE_WEIGHTS` and can be tuned without changing business logic.

## Scoring Signals

| Signal | Weight | Description | Source |
|---|---|---|---|
| `exactKuName` | 100 | Exact match between normalized query and canonical KU name | `knowledge-units.json` → `knowledge_unit` field |
| `exactAlias` | 95 | Query matched a known alias for this KU | `aliases.json` |
| `exactSkill` | 90 | KU has an associated skill entry | `skills.json` matching by KU ID prefix |
| `domainRoute` (primary) | 45 | KU belongs to the primary routed domain | Domain routing rules in `domain-router.mjs` |
| `domainRoute` (supporting) | 35 | KU belongs to a supporting domain | Domain routing rules |
| `tokenOverlap` | 10-35 | Token overlap between query tokens and KU name tokens | Token set intersection |
| `prerequisiteExpansion` | 20 | KU was found via prerequisite graph expansion | `dependencies.json` |
| `relatedTopicExpansion` | 10 | KU was found via relationship graph expansion | `relationships.json` |

## Scoring Process

### 1. Query Normalization

The raw query is:
- Lowercased
- Punctuation removed
- Laravel-specific abbreviations expanded (e.g., `N+1` → `n plus one`, `auth` → `authentication`, `RBAC` → `role based access control`)
- Stop words filtered
- Tokenized for overlap analysis

### 2. Domain Analysis

Each of the 21 domains is scored against the normalized query using keyword matching. Each keyword match adds points. The top domain becomes the primary domain; subsequent matches become supporting domains.

### 3. Alias Resolution

Known aliases are matched against the query tokens via:
- Exact phrase match
- Substring containment
- Multi-token overlap

Each successful alias match provides a high-confidence signal.

### 4. Candidate Generation

Candidates are generated from multiple sources:
- Knowledge units whose domain matches the routed domains
- Knowledge units linked via resolved aliases
- Knowledge units with token overlap in their name/subdomain

### 5. Ranking

For each candidate, the ranker computes a total score by summing all applicable signal weights. The result array is sorted by score descending, with lexicographic tie-breaking by KU ID.

### 6. Graph Expansion

From the top-ranked KUs, the graph expander walks:
- **Prerequisites** (from `dependencies.json`): recommended foundational KUs
- **Related topics** (from `relationships.json`): correlated KUs

Both expansions are bounded by configurable depth and count limits, with cycle-safe visited sets.

### 7. Context Bundle Assembly

The bundler collects:
- Top KUs (ranked)
- Associated rules, skills, decision trees, anti-patterns, checklists
- Expanded prerequisites and related topics
- External concepts referenced by selected KUs

## Token Estimation

Token counts are estimated using `Intl.Segmenter` with word granularity, multiplied by 1.3x for token overhead. This provides Unicode-aware word segmentation superior to naive split-by-space.

## Determinism Guarantees

1. **No randomness**: All scoring is deterministic given the same inputs
2. **Stable sorting**: Equal scores are broken by lexicographic KU ID comparison
3. **Set-based deduplication**: Ensures no duplicate results regardless of multiple match sources
4. **No external dependencies**: No network calls, databases, or vector stores

## Configuration

All weights and limits are in `src/retrieval/config.mjs`:

```javascript
export const SCORE_WEIGHTS = {
  exactKuName: 100,
  exactAlias: 95,
  exactSkill: 90,
  exactRule: 80,
  exactDecisionTree: 75,
  exactSubdomain: 60,
  domainRoute: 45,
  tokenOverlapSummary: 35,
  tokenOverlapMin: 10,
  prerequisiteExpansion: 20,
  relatedTopicExpansion: 10,
  externalConcept: 5,
};
```

## Limitations

- Token overlap scoring is naive (no TF-IDF, no semantic similarity)
- Domain keyword matching is rule-based, not learned
- No synonym expansion beyond the alias file
- Score weights are hand-tuned and may benefit from empirical calibration
