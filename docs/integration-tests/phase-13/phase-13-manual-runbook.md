# Phase 13 — Manual Paired Run Execution Runbook

## Purpose

This runbook provides exact step-by-step instructions for executing the six paired Laravel experiments required for Phase 13. Safe isolated OpenCode orchestration was not available (nested `opencode run` sessions from within an active coding-agent session risk session conflicts, MCP reconnection issues, and deadlocks). Therefore, manual execution is required.

## Status

All 12 worktrees are **already created, prepared, and ready**. The initialization phase is complete.

- 12 git worktrees created from baseline commit `41269ba`
- 12 experiment branches created
- `composer install` complete in all 12
- `.env` and `database/database.sqlite` configured in all 12
- `php artisan migrate` run in all 12 (users, cache, jobs tables created)

## Prerequisites

- OpenCode installed and configured
- Laravel ECC checkout at `<ecc-root>`
- Clean Laravel 13 baseline repository at `<clean-baseline-root>`
- Lab workspace at `<lab-root>`
- Published `laravel-ecc@1.0.0-beta.12` installed in `<lab-root>/package-tools/`
- Worktrees are ready — no need to create them

## Environment Placeholders

Replace these before executing:

| Placeholder | Value |
|------------|-------|
| `<ecc-root>` | `C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc` |
| `<clean-baseline-root>` | `C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc-integration-lab\product-api-test` |
| `<lab-root>` | `C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc-phase-13-lab` |
| `<model>` | AI model to use (e.g., `gpt-4o`) |

---

## 1. Generic Baseline Run Procedure

For every scenario, execute these steps as the **BASELINE** run:

```powershell
# Step 1: Worktrees already exist — no need to create them
# Worktree path: <lab-root>\worktrees\<worktree-dir>

# Step 2: Disable Laravel ECC MCP server
# Edit C:\Users\Pc\.config\opencode\opencode.jsonc
# Set "laravel-ecc" -> "enabled": false
# OR use: opencode mcp list to check it's disconnected

# Step 3: Run the baseline experiment
opencode run --model <model> --dir "<lab-root>\worktrees\<worktree-dir>" `
  --dangerously-skip-permissions `
  --message "`"$(Get-Content '<ecc-root>\docs\integration-tests\phase-13\prompts\<prompt-file>' -Raw)`"" `
  --print-logs > "<lab-root>/logs/<scenario>-baseline.txt"

# Step 4: Record timing (manually note start/end time)
# Step 5: Run verification commands (see section 3)
# Step 6: Commit the result to the experiment branch for audit
git -C "<lab-root>\worktrees\<worktree-dir>" add -A
git -C "<lab-root>\worktrees\<worktree-dir>" commit -m "chore: scenario result"
```

## 2. Generic ECC-Assisted Run Procedure

For every scenario, execute these steps as the **ECC-ASSISTED** run:

```powershell
# Step 1: Worktrees already exist — no need to create them
# Worktree path: <lab-root>\worktrees\<worktree-dir>

# Step 2: Enable Laravel ECC MCP server
# Edit C:\Users\Pc\.config\opencode\opencode.jsonc
# Set "laravel-ecc" -> "enabled": true

# Step 3: Verify ECC connection
opencode mcp list

# Step 4: Run laravel-ecc doctor to confirm HEALTHY
node "<lab-root>\package-tools\node_modules\laravel-ecc\scripts\laravel-ecc.mjs" doctor

# Step 5: Run the ECC-assisted experiment
# Concatenate: ECC_INSTRUCTIONS + prompt
opencode run --model <model> --dir "<lab-root>\worktrees\<worktree-dir>" `
  --dangerously-skip-permissions `
  --message "<ECC_INSTRUCTIONS>

$(Get-Content '<ecc-root>\docs\integration-tests\phase-13\prompts\<prompt-file>' -Raw)" `
  --print-logs > "<lab-root>/logs/<scenario>-ecc.txt"

# Step 6: Record timing (manually note start/end time)
# Step 7: Run verification commands (see section 3)
# Step 8: Commit the result to the experiment branch for audit
git -C "<lab-root>\worktrees\<worktree-dir>" add -A
git -C "<lab-root>\worktrees\<worktree-dir>" commit -m "chore: scenario result"
```

## 3. Verification Commands (Every Run)

After the agent completes:

```powershell
Set-Location "<lab-root>\worktrees\<worktree-dir>"

# Run tests
php artisan test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-test.txt"

# Check code style
.\vendor\bin\pint.bat --test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-pint.txt"

# List routes
php artisan route:list -v 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-routes.txt"

# Check working tree
git status --short 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-git-status.txt"
```

---

## 4. Scenario Matrix

| # | Scenario | Prompt File | Baseline Worktree | ECC-Assisted Worktree |
|---|----------|-------------|-------------------|----------------------|
| 1 | Sanctum Authentication API | `prompts/01-sanctum-auth-api.txt` | `01-sanctum-auth-api-baseline` | `01-sanctum-auth-api-ecc-assisted` |
| 2 | Queued Email with Retries | `prompts/02-queued-email-idempotency.txt` | `02-queued-email-idempotency-baseline` | `02-queued-email-idempotency-ecc-assisted` |
| 3 | Signed Webhook with Replay Protection | `prompts/03-signed-webhook.txt` | `03-signed-webhook-baseline` | `03-signed-webhook-ecc-assisted` |
| 4 | Eloquent N+1 Optimization | `prompts/04-eloquent-n-plus-one.txt` | `04-eloquent-n-plus-one-baseline` | `04-eloquent-n-plus-one-ecc-assisted` |
| 5 | Multi-Tenant Isolation | `prompts/05-multi-tenant-isolation.txt` | `05-multi-tenant-isolation-baseline` | `05-multi-tenant-isolation-ecc-assisted` |
| 6 | Laravel AI SDK RAG Workflow | `prompts/06-laravel-ai-rag-workflow.txt` | `06-laravel-ai-rag-workflow-baseline` | `06-laravel-ai-rag-workflow-ecc-assisted` |

All worktrees are under `<lab-root>\worktrees\`.

Each scenario = 1 baseline run + 1 ECC-assisted run = 2 runs.
Total runs = 12.

## 5. ECC-Assisted Agent Instruction

For every ECC-assisted run, append this **exact instruction** after the scenario prompt:

```text
Laravel ECC MCP is available.

Before implementing:
1. Call retrieve_context_bundle for this task using standard mode.
2. Review the returned rules, anti-patterns, checklists, and relevant KUs.
3. Use search_ecc only when additional targeted context is needed.
4. When calling get_knowledge_unit, use the exact canonical id returned by search_ecc.
5. Call validate_ecc once.
6. Record every Laravel ECC MCP tool call in the final summary.

Implement the task, run the relevant tests, and report assumptions honestly.
```

Do not append this to baseline prompts.

## 6. Timing Log Template

For each run, record:

```text
Scenario: <name>
Mode: baseline | ecc-assisted
Start: YYYY-MM-DD HH:MM:SS
End:   YYYY-MM-DD HH:MM:SS
Duration: Xm Ys
```

Save to `<lab-root>/timings/<scenario>-<mode>.txt`.

## 7. Per-Scenario Verification Checklist

### Scenario 1 — Sanctum Auth
- [ ] passwords are hashed (check migration/factory)
- [ ] login rejects invalid credentials
- [ ] /me requires authentication
- [ ] logout revokes the intended token
- [ ] validation rules exist
- [ ] tests cover happy and negative paths
- [ ] routes are correct

### Scenario 2 — Queued Email
- [ ] ShouldQueue or equivalent queued boundary
- [ ] retry/backoff configured via attributes or properties
- [ ] timeout configured
- [ ] idempotency strategy exists
- [ ] duplicate dispatch behavior tested
- [ ] Mail or Queue fakes used
- [ ] no external email sent

### Scenario 3 — Signed Webhook
- [ ] signature comparison is timing-safe
- [ ] timestamp tolerance exists
- [ ] replay protection exists
- [ ] duplicate external IDs are rejected safely
- [ ] queuing happens only after verification
- [ ] negative tests exist

### Scenario 4 — N+1 Optimization
- [ ] relationships are correct
- [ ] eager loading exists
- [ ] no hidden queries inside Resources
- [ ] pagination exists
- [ ] query-count regression coverage exists
- [ ] explanation matches implementation

### Scenario 5 — Multi-Tenant Isolation
- [ ] every protected query is tenant-scoped
- [ ] route-model binding cannot leak records across tenants
- [ ] create uses authenticated tenant context
- [ ] update/delete enforce isolation
- [ ] unique validation is tenant-aware
- [ ] negative leakage tests exist

### Scenario 6 — RAG Workflow
- [ ] no API keys committed
- [ ] no live network dependency
- [ ] provider boundary is testable
- [ ] chunks persist correctly
- [ ] retrieval behavior is deterministic in tests
- [ ] controller remains thin

## 8. Scoring Rubric

Score each implementation 0–10 in every category:

| Category | Meaning |
|----------|---------|
| Functional correctness | Required behavior works |
| Laravel convention adherence | Uses framework-native patterns correctly |
| Architecture clarity | Thin boundaries, appropriate separation |
| Validation quality | Correct rules and negative cases |
| Security correctness | Protects sensitive flows |
| Authorization correctness | Distinguishes authentication and authorization |
| Test completeness | Covers happy and negative paths |
| Maintainability | Understandable and extensible |
| Explanation accuracy | Agent summary matches code |
| Code style | Pint quality |
| Execution efficiency | Time and unnecessary complexity |

## 9. Report Generation

After all 12 runs complete, fill in the scenario report templates at:
```
docs/integration-tests/phase-13/scenarios/
```
Then update the final report at:
```
docs/integration-tests/phase-13/phase-13-final-report.md
```

## 10. Quick-Start — Exact Commands for Scenario 1

### Scenario 1 Baseline (Sanctum Auth API)

```powershell
# 1. OpenCode config: DISABLE laravel-ecc MCP (set "enabled": false)
#    Edit C:\Users\Pc\.config\opencode\opencode.jsonc

# 2. Run the baseline experiment
opencode run --model <model> --dir "<lab-root>\worktrees\01-sanctum-auth-api-baseline" `
  --dangerously-skip-permissions `
  --message "`"$(Get-Content '<ecc-root>\docs\integration-tests\phase-13\prompts\01-sanctum-auth-api.txt' -Raw)`"" `
  --print-logs > "<lab-root>\logs\01-sanctum-auth-api-baseline.txt"

# 3. After completion, record timing, run verification, commit
Set-Location "<lab-root>\worktrees\01-sanctum-auth-api-baseline"
php artisan test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\01-sanctum-auth-api-baseline-test.txt"
.\vendor\bin\pint.bat --test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\01-sanctum-auth-api-baseline-pint.txt"
git add -A; git commit -m "chore: scenario 1 baseline result"
```

### Scenario 1 ECC-Assisted (Sanctum Auth API)

```powershell
# 1. OpenCode config: ENABLE laravel-ecc MCP (set "enabled": true)
#    Edit C:\Users\Pc\.config\opencode\opencode.jsonc

# 2. Verify ECC is healthy
opencode mcp list
node "<lab-root>\package-tools\node_modules\laravel-ecc\scripts\laravel-ecc.mjs" doctor

# 3. Run the ECC-assisted experiment
$ECC_INSTRUCTIONS = @"
Laravel ECC MCP is available.

Before implementing:
1. Call retrieve_context_bundle for this task using standard mode.
2. Review the returned rules, anti-patterns, checklists, and relevant KUs.
3. Use search_ecc only when additional targeted context is needed.
4. When calling get_knowledge_unit, use the exact canonical id returned by search_ecc.
5. Call validate_ecc once.
6. Record every Laravel ECC MCP tool call in the final summary.

Implement the task, run the relevant tests, and report assumptions honestly.
"@
$PROMPT = Get-Content '<ecc-root>\docs\integration-tests\phase-13\prompts\01-sanctum-auth-api.txt' -Raw

opencode run --model <model> --dir "<lab-root>\worktrees\01-sanctum-auth-api-ecc-assisted" `
  --dangerously-skip-permissions `
  --message "$ECC_INSTRUCTIONS`n`n$PROMPT" `
  --print-logs > "<lab-root>\logs\01-sanctum-auth-api-ecc.txt"

# 4. After completion, record timing, run verification, commit
Set-Location "<lab-root>\worktrees\01-sanctum-auth-api-ecc-assisted"
php artisan test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\01-sanctum-auth-api-ecc-test.txt"
.\vendor\bin\pint.bat --test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\01-sanctum-auth-api-ecc-pint.txt"
git add -A; git commit -m "chore: scenario 1 ecc-assisted result"
```
