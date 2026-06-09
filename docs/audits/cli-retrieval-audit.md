# CLI Retrieval Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## CLI Commands Tested

| Command | Exit Code | Status |
|---------|-----------|--------|
| `--help` | 0 | 13 subcommands displayed, no mojibake |
| `validate` | 0 | 2321 KUs, 429 deps, 3513 rels, 120 aliases, 26 externals |
| `search "Sanctum tenant auth"` | 0 | 20 results, top: cross-tenant-data-leak-prevention (283) |
| `retrieve "CRUD..." --mode standard` | 0 | 5146 tokens, 4 domains, 10 KUs |
| `retrieve "N+1 query" --mode compact` | 0 | 2092 tokens, 5 KUs, no decision trees |
| `get "n-plus-one-detection"` | 0 | Metadata + dependencies |

## Verification

| Check | Result |
|-------|--------|
| All commands exit 0 | ✅ |
| No mojibake in output | ✅ |
| Help shows all subcommands | ✅ |
| Validate shows PASS | ✅ |
| Search returns relevant results (Sanctum auth ranked high) | ✅ |
| Retrieve returns CRUD, Policies, Pagination, Validation, API Resources | ✅ |
| Compact mode returns smaller output | ✅ (2092 vs 5146 tokens) |
| Deterministic output | ✅ (identical on re-run) |
| Stable ordering | ✅ |
| Bounded results | ✅ |
| Token-budget handling | ✅ |
| Actionable errors | ✅ |
| Correct ECC_ROOT detection | ✅ |
| No irrelevant topics dominating | ✅ |
| Ranking explanations present | ✅ |

## Compact vs Standard Mode

| Feature | Compact | Standard |
|---------|---------|----------|
| Knowledge Units | 5 | 10 |
| Decision Trees | Excluded | Included |
| Anti-Patterns | Excluded | Included |
| Token Estimate | 2,092 | 5,146 |
