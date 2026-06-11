# Phase 13 — Evaluation Methodology

## Purpose

Determine whether Laravel ECC consistently improves coding-agent output across diverse, realistic Laravel tasks beyond the single Product CRUD scenario tested in Phases 11.3–11.5.

## Design: Paired Controlled Experiment

For each of 6 scenarios, two independent runs are compared:

| Run | Label | Description |
|-----|-------|-------------|
| Baseline | Without ECC MCP | Pure OpenCode session with `--pure` flag (no external plugins) |
| ECC-Assisted | With ECC MCP | OpenCode session with `laravel-ecc@1.0.0-beta.12` MCP server enabled |

## Controlled Variables

Both runs within a scenario pair share:

- **Laravel baseline commit**: `41269ba7a20c5d6cbf7f2d51e7bf1c2d1f5852e0` (Laravel 13.15.0)
- **Task prompt** — identical wording, no alterations
- **OpenCode version** — 1.17.3
- **AI model** — same across pair (configurable)
- **Starting directory** — fresh `git worktree` from the same baseline commit
- **Verification commands** — identical set for both runs
- **Time measurement** — start/end timestamp recording

## Independence Guarantees

- Each run starts from a fresh worktree (never reuses an existing one)
- No code copied between paired runs
- No manual repair of generated code before verification
- One run cannot inspect the paired run's artifacts
- Failures are recorded honestly; no fabricated results

## Baseline Run Protocol

1. Create fresh worktree from clean baseline commit
2. Disable laravel-ecc MCP server (set `enabled: false` in opencode config)
3. Verify no ECC MCP tools are listed (`opencode mcp list`)
4. Start timing
5. Execute `opencode run --pure --dangerously-skip-permissions` with scenario prompt
6. Stop timing
7. Run verification commands
8. Record results

## ECC-Assisted Run Protocol

1. Create fresh worktree from clean baseline commit
2. Enable laravel-ecc MCP server (set `enabled: true` in opencode config)
3. Verify MCP connection: `opencode mcp list` shows `laravel-ecc connected [tools: 5]`
4. Run `laravel-ecc doctor` — confirm **HEALTHY**
5. Start timing
6. Execute `opencode run --dangerously-skip-permissions` with prompt + ECC instruction appendix
7. Stop timing
8. Run verification commands
9. Record MCP tool usage from the agent's final summary

## ECC-Assisted Agent Instruction

Appended verbatim to every ECC-assisted run prompt:

> Laravel ECC MCP is available.
>
> Before implementing:
> 1. Call retrieve_context_bundle for this task using standard mode.
> 2. Review the returned rules, anti-patterns, checklists, and relevant KUs.
> 3. Use search_ecc only when additional targeted context is needed.
> 4. When calling get_knowledge_unit, use the exact canonical id returned by search_ecc.
> 5. Call validate_ecc once.
> 6. Record every Laravel ECC MCP tool call in the final summary.
>
> Implement the task, run the relevant tests, and report assumptions honestly.

## Verification Commands

Every implementation is verified with:

```powershell
php artisan test
.\vendor\bin\pint.bat --test
php artisan route:list -v
git status --short
```

Scenario-specific manual inspection includes: controllers, Form Requests, policies, middleware, jobs, migrations, API Resources, tests, queue settings, webhook signature logic, tenant scoping, and provider boundaries.

## Scoring Rubric

Each implementation scored 0–10 in 11 categories:

| # | Category | Meaning |
|---|----------|---------|
| 1 | Functional correctness | Required behavior works |
| 2 | Laravel convention adherence | Uses framework-native patterns correctly |
| 3 | Architecture clarity | Thin boundaries, appropriate separation |
| 4 | Validation quality | Correct rules and negative cases |
| 5 | Security correctness | Protects sensitive flows |
| 6 | Authorization correctness | Distinguishes authN and authZ |
| 7 | Test completeness | Covers happy and negative paths |
| 8 | Maintainability | Understandable and extensible |
| 9 | Explanation accuracy | Agent summary matches code |
| 10 | Code style | Pint quality |
| 11 | Execution efficiency | Time and unnecessary complexity |

## Metrics Recorded

For every run:

- Scenario name
- Mode (baseline / ecc-assisted)
- Branch / commit / worktree state
- Start timestamp, end timestamp, duration
- Files created, files modified
- Test count, assertion count, test result
- Pint result (pass/fail + issue count)
- Route summary
- Scenario-specific verification results
- Agent final summary accuracy
- MCP tools called, selected ECC domains, retrieved KUs, estimated retrieval tokens
- Warnings, failures, defects

## Limitations

- Results apply to this specific model, OpenCode version, and ECC release
- Manual execution required; `opencode run` from within active coding-agent session is not safe
- Small sample (6 scenarios × 2 runs = 12 total)
- Single model evaluation (not cross-model)
- No blinding — observer is aware of run condition
- Laravel AI SDK (Scenario 6) may have API changes requiring version-specific adjustment
