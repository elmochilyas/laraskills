# Phase 13 — Integration Test Report

**Paired OpenCode Agent Runs: Baseline vs ECC-Assisted (MCP)**

| | |
|---|---|
| **Model** | `opencode/deepseek-v4-flash-free` |
| **Laravel Version** | 13.15.0 (commit `41269ba`) |
| **ECC Package** | `laravel-ecc` 1.0.0-beta.12 |
| **Date** | 2026-06-11 |
| **Scenarios** | 6 paired experiments |
| **Lab Root** | `<lab-root>` (at repository root level) |

---

## Executive Summary

Over 6 scenarios spanning authentication, queues, webhooks, query optimization, multi-tenancy, and AI workflows, the ECC-assisted agent **outperformed the baseline agent in 5 of 6 scenarios**, with a grand average score of **8.20/10 vs 7.60/10** (+0.60).

However, there is a critical caveat: **the ECC agent made zero MCP calls in 2 of 6 scenarios**, and only 2 calls each in two other scenarios. The knowledge retrieval system — the core differentiator of the ECC package — was substantially underused. The ECC agent's advantage came primarily from its built-in Laravel knowledge and the availability of web search, not from consistent ECC MCP knowledge layer usage.

A second critical caveat: the `--pure` flag used for baseline runs is a **confounding variable** — it disables ALL external plugins (not only the ECC MCP server), which may have degraded baseline performance beyond simply losing ECC context. A controlled follow-up (Phase 13.1) without `--pure` and with manual ECC plugin toggling is recommended.

### Key Metrics

| Metric | Baseline | ECC | Delta |
|--------|:--------:|:---:|:-----:|
| Grand average score (11-cat, 6-scenario) | 7.60 | 8.20 | **+0.60** |
| Scenarios won | 1 | 5 | — |
| Scenario ties | 0 | 0 | — |
| Total tests across all scenarios | 74 | 85 | **+11** |
| Total assertions across all scenarios | 348 | 290 | **−58** |
| Tests passing rate | 100% | 100% | Tie |
| Average Pint issues per run | 2.0 | 3.8 | +1.8 (baseline cleaner) |
| ECC MCP calls (total across 6 runs) | N/A | **20** | — |
| Composite speed improvement | — | **~25.4% faster** | — |

---

## Methodology

### Experimental Design

Each scenario was run twice from identical starting conditions:
1. **Baseline**: `opencode run --model opencode/deepseek-v4-flash-free --pure "..."` — ECC MCP disabled
2. **ECC**: `opencode run --model opencode/deepseek-v4-flash-free "..."` — ECC MCP enabled

Both runs used:
- Fresh Git worktree at commit `41269ba` (Laravel 13.15.0)
- Pre-run `composer install`, `.env` created, SQLite database configured, migrations run
- Same prompt text
- Unrestricted file system access (no `--dangerously-skip-permissions`)

### Limitations

1. **`--pure` is a confounding variable.** The `--pure` flag disables ALL external plugins, not only the Laravel ECC MCP server. This means the baseline may have been artificially weakened beyond just losing ECC context. Any positive results for ECC could be partially attributed to non-ECC plugins that `--pure` stripped away.
2. **Small sample size.** 6 scenarios provide directional evidence but are insufficient for statistical significance.
3. **Single model.** All runs used `opencode/deepseek-v4-flash-free`. Results may not generalize to other models.
4. **Same prompt.** Both agents received identical prompts, but the baseline (with `--pure`) may not have had access to the same exploration capabilities.
5. **ECC MCP call logging is per-scenario report documented.** Raw logs may show additional calls (particularly in Scenarios 1 and 4), but per-scenario reports are the authoritative source for documented calls.

### Scoring Rubric (11 categories, 1–10 each)

1. **Functional Correctness** — Do all tests pass? Are edge cases handled?
2. **Laravel Convention Adherence** — Uses Laravel 13 patterns (attributes, DI, etc.)
3. **Architecture Clarity** — Clean separation of concerns, proper layering
4. **Validation Quality** — FormRequest usage, rule completeness
5. **Security Correctness** — Auth, CSRF, mass assignment, injection prevention
6. **Authorization Correctness** — Gates, Policies, route protection
7. **Test Completeness** — Coverage breadth, edge cases, assertions
8. **Maintainability** — Readability, duplication, naming, comments
9. **Explanation Accuracy** — Agent's own summary accuracy and completeness
10. **Code Style (Pint)** — Adherence to Laravel Pint rules
11. **Execution Efficiency** — Time to completion

---

## Scenario Results

### Scenario 1 — Sanctum Auth API

*Implement Sanctum API authentication with register, login, logout, profile.*

| | Baseline | ECC | Delta |
|---|---|---|---|
| **Average score** | **6.7** | **8.3** | **+1.6** |
| Tests / Assertions | 14 / 49 | 14 / 45 | Baseline more assertions |
| Pint issues | 1 | 1 | Tie |
| Duration | 8m15s | 3m50s | **ECC 54% faster** |
| ECC MCP calls | N/A | **9** | — |

**Key difference:** ECC installed Sanctum ecosystem and followed proper API authentication patterns. Baseline used incomplete middleware and `password_verify()` instead of `Hash::check()`. ECC was dramatically faster (3m50s vs 8m15s). ECC made 9 MCP calls across all 5 tool types — the most thorough workflow adherence in Phase 13.

### Scenario 2 — Queued Email with Retries

*Implement a queued email notification with retry, backoff, rate limiting.*

| | Baseline | ECC | Delta |
|---|---|---|---|
| **Average score** | **6.7** | **7.8** | **+1.1** |
| Tests / Assertions | 8 / 14 | 10 / 22 | **ECC more tests** |
| Pint issues | 5 | 3 | ECC cleaner |
| Duration | 4m18s | 2m47s | **ECC 35% faster** |
| ECC MCP calls | N/A | **2** | — |

### Scenario 3 — Signed Webhook with Replay Protection

*Implement a signed webhook handler with HMAC verification and idempotency.*

| | Baseline | ECC | Delta |
|---|---|---|---|
| **Average score** | **7.4** | **7.9** | **+0.5** |
| Tests / Assertions | 8 / 22 | 8 / 18 | Baseline more assertions |
| Pint issues | 2 | 7 | Baseline cleaner |
| Duration | 3m31s | 2m29s | **ECC 29% faster** |
| ECC MCP calls | N/A | **2** | — |

### Scenario 4 — Eloquent N+1 Query Optimization

*Identify and fix N+1 queries across a complex relationship chain.*

| | Baseline | ECC | Delta |
|---|---|---|---|
| **Average score** | **8.2** | **8.4** | **+0.2** |
| Tests / Assertions | 5 / 159 | 5 / 80 | Baseline more assertions |
| Pint issues | 0 | 0 | Tie |
| Duration | 3m31s | 4m07s | Baseline 17% faster |
| ECC MCP calls | N/A | **7** (bundle+validate+3KU+2search) | — |

**Key observation:** This was the scenario with the second-most MCP calls (7). The ECC agent was slower but scored marginally higher. The baseline agent had dramatically more assertions (159 vs 80) due to testing every possible query combination.

### Scenario 5 — Multi-Tenant Isolation

*Implement CRUD with strict tenant isolation using 404 for cross-tenant access.*

| | Baseline | ECC | Delta |
|---|---|---|---|
| **Average score** | **8.7** | **8.3** | **-0.4** |
| Tests / Assertions | 16 / 37 | 16 / 27 | Baseline more assertions |
| Pint issues | 1 | 2 | Baseline cleaner |
| Duration | 4m49s | 5m00s+ (timed out) | Baseline faster |
| ECC MCP calls | N/A | **0** | — |

**Key observation:** This was the **only scenario the baseline won**. ECC's approach was overly complex (installed full Sanctum ecosystem for a tenant-isolation task), had fewer assertions (27 vs 37), and timed out past the 5-minute mark. Both agents made zero ECC MCP calls.

### Scenario 6 — Laravel AI-Assisted RAG Workflow

*Implement a testable document retrieval workflow with ingestion, chunking, retrieval, answer generation.*

| | Baseline | ECC | Delta |
|---|---|---|---|
| **Average score (10-cat)** | **7.9** | **8.5** | **+0.6** |
| **Average score (11-cat including MCP dep.)** | 7.9 | 7.7 | -0.2 |
| Tests / Assertions | 23 / 67 | 32 / 98 | **ECC 39%/46% more** |
| Pint issues | 3 | 10 | Baseline cleaner |
| Duration | 8m34s | 6m23s | **ECC 25% faster** |
| Chunking strategy | Fixed 500/50 | Sentence-boundary ~1000 | **ECC more nuanced** |
| Retrieval method | Cosine similarity | TF-IDF + stop-word filter | **ECC** |
| Provider abstraction | 2 contracts | 1 contract | **ECC simpler** |
| ECC MCP calls | N/A | **0** | — |

**Key observation:** ECC produced superior code (32 tests, 98 assertions, sentence-boundary chunking, TF-IDF scoring, single clean AIProvider contract) but failed to use any MCP calls despite having the MCP server connected. Baseline's code was functionally correct but less thorough.

### Aggregate Score Matrix

| Criterion | S1 BL | S1 ECC | S2 BL | S2 ECC | S3 BL | S3 ECC | S4 BL | S4 ECC | S5 BL | S5 ECC | S6 BL | S6 ECC |
|-----------|:-----:|:------:|:-----:|:------:|:-----:|:------:|:-----:|:------:|:-----:|:------:|:-----:|:------:|
| Functional correctness | 7 | **9** | 8 | **9** | 8 | **9** | 9 | 9 | 10 | 10 | 9 | **10** |
| Laravel conv. adherence | 6 | **10** | 6 | **9** | 7 | **8** | 8 | **9** | 8 | **9** | 8 | **9** |
| Architecture clarity | 7 | **9** | 7 | **9** | 7 | **9** | 8 | **9** | **9** | 7 | 8 | **9** |
| Validation quality | 7 | **8** | 7 | **8** | 7 | **8** | 7 | **8** | 8 | 8 | — | — |
| Security correctness | 6 | **9** | 7 | 7 | 7 | **9** | 8 | 8 | 8 | **9** | 8 | **9** |
| Authorization correctness | 5 | **6** | 5 | 5 | 7 | 7 | 7 | 7 | 10 | 10 | — | — |
| Test completeness | **8** | 7 | 7 | **9** | **8** | 7 | **9** | 7 | **9** | 8 | 7 | **9** |
| Maintainability | 7 | **9** | 7 | **9** | 7 | **8** | 8 | **9** | **9** | 7 | — | — |
| Explanation accuracy | 8 | **9** | **8** | 5 | 8 | 8 | 8 | **9** | 8 | **9** | 7 | **8** |
| Code style (Pint) | 6 | 6 | 5 | **7** | **7** | 5 | 10 | 10 | **9** | 8 | **9** | 6 |
| Execution efficiency | 7 | **9** | 7 | **9** | 8 | **9** | **8** | 7 | **8** | 6 | 7 | **8** |
| **Average** | **6.7** | **8.3** | **6.7** | **7.8** | **7.4** | **7.9** | **8.2** | **8.4** | **8.7** | **8.3** | **7.9** | **8.5** |

(Sc6 uses a different 10-category rubric; S6-BL average is 7.9/10, S6-ECC is 8.5/10. S3 and S4 have scenario-specific category adaptations.)

### ECC MCP Call Analysis

| Scenario | ECC MCP Calls | Types | Comment |
|----------|:------------:|-------|---------|
| 1 — Sanctum Auth | **9** | bundle + validate + 4 search + 4 KU reads | Full workflow adherence, best in Phase 13 |
| 2 — Queued Email | **2** | bundle + validate | Minimal workflow: bundle only, no deep reads |
| 3 — Signed Webhook | **2** | bundle + validate | Minimal workflow (identical to S2) |
| 4 — N+1 Query Opt. | **7** | bundle + validate + 3 KU reads + 2 searches | Good workflow: multiple deep reads + searches |
| 5 — Multi-Tenant | **0** | None | Worst adherence; agent ignored MCP entirely |
| 6 — RAG Workflow | **0** | None | Agent used web search instead of MCP |
| **Total** | **20** | — | Spread across 4 of 6 scenarios |

**Critical finding:** In 2 of 6 ECC runs, the agent made zero MCP calls. The tool set was used in only 4 scenarios, and even then only Scenarios 1 and 4 showed substantive usage (9 and 7 calls respectively). The other two scenarios (2 and 3) only called `retrieve_context_bundle` and `validate_ecc` without any deep KU reads or searches. The MCP toolset — the entire knowledge retrieval system — was substantially underused.

---

## Key Findings

### 1. ECC Agent Produces Better Code (When It Runs)

The ECC-assisted agent scored higher in 5 of 6 scenarios across nearly all quality criteria. On average, ECC produced:
- **More tests** (85 vs 74 total)
- **Faster completion** (average ~4.1 min vs ~5.5 min, 25.4% faster)
- **Architecturally cleaner** — more consistent use of contracts, Actions, proper DI
- **Better Laravel convention adherence** — ECC consistently scored 1-4 points higher

However, ECC had **fewer total assertions** (290 vs 348) due to less exhaustive testing patterns.

### 2. ECC Pint Compliance Is Worse

ECC-generated code had more Pint issues on average (3.83 vs 2.0). This is partly because ECC generated more files, but also because ECC didn't run `pint --test` as part of its validation loop. Baseline agents sometimes did.

### 3. ECC MCP Is Substantially Underused

The most important finding of Phase 13. Across 6 scenarios with ECC MCP enabled:
- **2 of 6 runs made zero MCP calls**
- **2 more runs made only 2 calls** (bundle + validate, no deep research)
- Only **2 of 6 runs** showed substantive MCP usage (9 and 7 calls)
- Agents default to web search or built-in knowledge instead of MCP queries

**Why?** Several possible factors:
- The MCP tools may not be properly discoverable by the agent
- The agent's explore phase satisfies information needs before MCP would trigger
- Web search is a more familiar and trusted pattern for the agent
- The MCP response format may not integrate as smoothly as file reads

### 4. ECC Speed Advantage Is Consistent

ECC was faster in 4 of 6 scenarios (25-54% faster). The two exceptions:
- Scenario 4 (N+1): ECC was 17% slower, possibly because it made MCP calls
- Scenario 5 (multi-tenant): ECC timed out past 5 minutes due to overcomplicated approach (installed Sanctum unnecessarily)

### 5. Both Agents Handle Test-Driven Development Well

All 12 runs (6 baseline + 6 ECC) achieved 100% test pass rate. The agents naturally follow TDD-like patterns: create test expectations, implement to satisfy them, and iterate until green.

### 6. Baseline Agent Is Surprisingly Competent

Even without ECC, the baseline agent produced functional, convention-adherent Laravel code across all scenarios. The baseline's average score of 7.60/10 demonstrates that the underlying model (`deepseek-v4-flash-free`) has strong Laravel knowledge baked in.

### 7. `--pure` Is a Confounding Variable

The baseline used `--pure` which disables ALL external plugins, not just the ECC MCP server. This means the baseline may have lost access to other useful tools (code analysis, test runners, etc.) beyond ECC context. This limits the internal validity of the comparison. A controlled follow-up is needed.

---

## Recommendations

### For ECC Development

1. **Improve MCP tool discoverability** — The agent isn't finding or using the MCP tools consistently. Consider:
   - Explicit tool-use instructions in the system prompt
   - Auto-triggering a context bundle on project exploration
   - Surfacing MCP tools more prominently in the agent's action space

2. **Add post-generation quality checks** — ECC should run `pint --test` (or auto-fix) as a final step. This alone would close the Pint compliance gap.

3. **Target MCP documentation** — Create concise, agent-readable documentation about when and how to use each MCP tool.

4. **Consider agent-side hooks** — If the agent can be configured to always call `retrieve_context_bundle` on initial project load, this would seed the knowledge layer naturally.

### For Testers

1. **Run Phase 13.1 (controlled follow-up)** — Re-run 3 representative scenarios without `--pure`, using `OPENCODE_CONFIG_CONTENT` to control ECC MCP availability instead. This eliminates the confounding variable.

2. **Increase ECC MCP test coverage** — Add scenarios specifically designed to test MCP integration, where the agent's built-in knowledge would be insufficient and MCP lookup is required.

3. **Test with deeper MCP scenarios** — Scenarios requiring knowledge from specific knowledge units (e.g., "Implement a pgvector HNSW index with Laravel migration") would force MCP usage.

4. **Vary model sizes** — Test with smaller models where built-in Laravel knowledge is weaker and MCP retrieval matters more.

### For Implementation

1. **The ECC MCP server works** — The tools function correctly (validated in Scenarios 1 and 4). The issue is agent-side adoption, not server reliability.

2. **Web search as fallback** — When ECC MCP isn't used, agents default to web search, which works but loses the curated, deterministic advantage of the ECC knowledge layer.

3. **When used, MCP adds value** — The two scenarios with substantive MCP usage (S1: 9 calls, S4: 7 calls) produced some of the best architectural decisions (correct HTTP statuses, proper Sanctum config, configurable pagination, `author()` naming).

---

## Verdict

**PASS WITH WARNINGS**

Integration test infrastructure works. The ECC agent produces measurably better Laravel code (5/6 scenarios won, +0.60 average score advantage, 25.4% faster). However:

- **MCP adoption is inconsistent** — only 4/6 scenarios used any MCP tools, and only 2/6 used them substantively
- **`--pure` confounding variable undermines causal claims** — baseline was weakened beyond ECC removal
- **PIN compliance is worse** — ECC averaged 3.83 Pint issues vs baseline's 2.0
- **Assertion depth is lower** — ECC averaged 290 assertions vs baseline's 348

The integration test framework is ready for further use. The results show directional evidence that ECC-assisted agents produce better Laravel code, but the mechanism (MCP knowledge retrieval vs built-in knowledge vs web search) cannot be cleanly attributed without addressing the `--pure` confounding variable in Phase 13.1.

---

## Raw Data

| Scenario | Baseline Duration | ECC Duration | Baseline Tests | ECC Tests | Baseline Assertions | ECC Assertions | Baseline Pint Issues | ECC Pint Issues | ECC MCP Calls |
|----------|:----------------:|:------------:|:--------------:|:---------:|:------------------:|:--------------:|:------------------:|:--------------:|:-------------:|
| 1 — Sanctum Auth | 8m15s | 3m50s | 14 | 14 | 49 | 45 | 1 | 1 | 9 |
| 2 — Queued Email | 4m18s | 2m47s | 8 | 10 | 14 | 22 | 5 | 3 | 2 |
| 3 — Signed Webhook | 3m31s | 2m29s | 8 | 8 | 22 | 18 | 2 | 7 | 2 |
| 4 — N+1 Query | 3m31s | 4m07s | 5 | 5 | 159 | 80 | 0 | 0 | 7 |
| 5 — Multi-Tenant | 4m49s | 5m00s+ | 16 | 16 | 37 | 27 | 1 | 2 | 0 |
| 6 — RAG Workflow | 8m34s | 6m23s | 23 | 32 | 67 | 98 | 3 | 10 | 0 |
| **Total** | **32m58s** | **24m36s** | **74** | **85** | **348** | **290** | **12** | **23** | **20** |

---

*Phase 13 integration tests. 6 paired experiments. 2026-06-11.*
*Model: `opencode/deepseek-v4-flash-free`. Laravel 13.15.0. ECC 1.0.0-beta.12.*
*Verdict: PASS WITH WARNINGS — integration test framework works; MCP adoption inconsistent; `--pure` confounding variable requires Phase 13.1 follow-up.*
