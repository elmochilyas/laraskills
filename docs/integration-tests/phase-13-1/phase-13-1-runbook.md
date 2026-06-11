# Phase 13.1 — Controlled ECC Attribution Runbook

## Purpose

Execute 9 isolated runs (3 scenarios × 3 modes) to measure the discrete impact of ECC MCP retrieval on implementation quality, removing the `--pure` confound from Phase 13.

## Key Differences from Phase 13

| Aspect | Phase 13 | Phase 13.1 |
|--------|----------|------------|
| Modes | 2 (baseline, ecc-assisted) | 3 (baseline-controlled, ecc-voluntary, ecc-required) |
| `--pure` | Used on baseline runs | **Never used** |
| MCP control | Edit `opencode.jsonc` | `$env:OPENCODE_CONFIG_CONTENT` |
| Scenarios | 6 | 3 (03, 05, 06) |
| Total runs | 12 | 9 |
| Model | Various | `opencode/deepseek-v4-flash-free` |

## Run Order

Execute in this order (03 → 05 → 06), each mode A → B → C:

```
 1. 03-signed-webhook-baseline-controlled    (Mode A — ECC MCP disabled)
 2. 03-signed-webhook-ecc-voluntary          (Mode B — ECC MCP enabled, no retrieval instruction)
 3. 03-signed-webhook-ecc-required           (Mode C — ECC MCP enabled + required-retrieval instruction)
 4. 05-multi-tenant-isolation-baseline-controlled  (Mode A)
 5. 05-multi-tenant-isolation-ecc-voluntary        (Mode B)
 6. 05-multi-tenant-isolation-ecc-required         (Mode C)
 7. 06-laravel-ai-rag-workflow-baseline-controlled (Mode A)
 8. 06-laravel-ai-rag-workflow-ecc-voluntary       (Mode B)
 9. 06-laravel-ai-rag-workflow-ecc-required        (Mode C)
```

## Environment Placeholders

| Placeholder | Value |
|------------|-------|
| `<ecc-root>` | `C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc` |
| `<baseline-root>` | `C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc-integration-lab\product-api-test` |
| `<lab-root>` | `C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc-phase-13-1-lab` |
| `<model>` | `opencode/deepseek-v4-flash-free` |

## Worktree Naming Convention

```
{scenario-number}-{scenario-slug}-{mode}
```

Modes: `baseline-controlled`, `ecc-voluntary`, `ecc-required`

### Worktree Directory Listing

```
<lab-root>/worktrees/
├── 03-signed-webhook-baseline-controlled/
├── 03-signed-webhook-ecc-voluntary/
├── 03-signed-webhook-ecc-required/
├── 05-multi-tenant-isolation-baseline-controlled/
├── 05-multi-tenant-isolation-ecc-voluntary/
├── 05-multi-tenant-isolation-ecc-required/
├── 06-laravel-ai-rag-workflow-baseline-controlled/
├── 06-laravel-ai-rag-workflow-ecc-voluntary/
└── 06-laravel-ai-rag-workflow-ecc-required/
```

## Mode Definitions

### Mode A — Baseline-Controlled

ECC MCP is **disabled** via environment variable override. Same base prompt as Phase 13 baseline.

```powershell
$env:OPENCODE_CONFIG_CONTENT = '{"mcp":{"laravel-ecc":{"enabled":false}}}'
```

### Mode B — ECC-Voluntary

ECC MCP is **enabled** and available to the agent. No explicit retrieval instruction is added to the prompt.
The agent may use or ignore ECC MCP tools at its own discretion.

```powershell
$env:OPENCODE_CONFIG_CONTENT = '{"mcpServers":{"laravel-ecc":{"type":"local","command":"node","args":["<lab-root>\\package-tools\\node_modules\\laravel-ecc\\scripts\\laravel-ecc-mcp.mjs"],"env":{"ECC_ROOT":"<ecc-root>"}}}}'
```

### Mode C — ECC-Required

ECC MCP is **enabled**. The required-retrieval instruction block is appended to the base prompt, mandating
`retrieve_context_bundle` and `validate_ecc` calls before implementation.

```powershell
$env:OPENCODE_CONFIG_CONTENT = '{"mcpServers":{"laravel-ecc":{"type":"local","command":"node","args":["<lab-root>\\package-tools\\node_modules\\laravel-ecc\\scripts\\laravel-ecc-mcp.mjs"],"env":{"ECC_ROOT":"<ecc-root>"}}}}'
```

Prompt for Mode C = base prompt + `required-retrieval-instruction.txt`.

## Generic Run Procedure

### All Modes

```powershell
# Step 1: Set the environment variable for MCP config
$env:OPENCODE_CONFIG_CONTENT = '<mode-specific-json>'

# Step 2: Verify MCP status
opencode mcp list

# Step 3: Run the experiment
opencode run --model <model> `
  --dir "<lab-root>\worktrees\<worktree-dir>" `
  --dangerously-skip-permissions `
  --message "$(Get-Content '<ecc-root>\docs\integration-tests\phase-13-1\prompts\<prompt-file>' -Raw)" `
  --print-logs > "<lab-root>\logs\<worktree-dir>.txt"

# Step 4: Record timing (note start/end time manually)

# Step 5: Run verification commands
Set-Location "<lab-root>\worktrees\<worktree-dir>"
php artisan test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-test.txt"
.\vendor\bin\pint.bat --test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-pint.txt"
php artisan route:list -v 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-routes.txt"
git status --short 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-git-status.txt"
```

### Mode C Only — Append Required-Retrieval Instruction

```powershell
$basePrompt = Get-Content '<ecc-root>\docs\integration-tests\phase-13-1\prompts\<prompt-file>' -Raw
$retrievalInstruction = Get-Content '<ecc-root>\docs\integration-tests\phase-13-1\prompts\required-retrieval-instruction.txt' -Raw

opencode run --model <model> `
  --dir "<lab-root>\worktrees\<worktree-dir>" `
  --dangerously-skip-permissions `
  --message "$basePrompt`n`n$retrievalInstruction" `
  --print-logs > "<lab-root>\logs\<worktree-dir>.txt"
```

## Scenario Matrix

| Step | Scenario | Prompt File | Baseline Worktree | Voluntary Worktree | Required Worktree |
|------|----------|-------------|-------------------|-------------------|-------------------|
| 1–3 | Signed Webhook | `03-signed-webhook.txt` | `03-signed-webhook-baseline-controlled` | `03-signed-webhook-ecc-voluntary` | `03-signed-webhook-ecc-required` |
| 4–6 | Multi-Tenant Isolation | `05-multi-tenant-isolation.txt` | `05-multi-tenant-isolation-baseline-controlled` | `05-multi-tenant-isolation-ecc-voluntary` | `05-multi-tenant-isolation-ecc-required` |
| 7–9 | RAG Workflow | `06-laravel-ai-rag-workflow.txt` | `06-laravel-ai-rag-workflow-baseline-controlled` | `06-laravel-ai-rag-workflow-ecc-voluntary` | `06-laravel-ai-rag-workflow-ecc-required` |

## Per-Scenario Verification Checklist

### Scenario 3 — Signed Webhook
- [ ] signature comparison is timing-safe
- [ ] timestamp tolerance exists
- [ ] replay protection exists
- [ ] duplicate external IDs are rejected safely
- [ ] queuing happens only after verification
- [ ] negative tests exist

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

## Post-Run Verification

```powershell
Set-Location "<lab-root>\worktrees\<worktree-dir>"
php artisan test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-test.txt"
.\vendor\bin\pint.bat --test 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-pint.txt"
php artisan route:list -v 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-routes.txt"
git status --short 2>&1 | Tee-Object -FilePath "<lab-root>\logs\<worktree-dir>-git-status.txt"
```

## Scoring Rubric

Each run scored 0–10 in:

| Category | Weight | Meaning |
|----------|--------|---------|
| Functional correctness | 1× | Required behavior works |
| Laravel convention adherence | 1× | Uses framework-native patterns correctly |
| Architecture clarity | 1× | Thin boundaries, appropriate separation |
| Validation quality | 1× | Correct rules and negative cases |
| Security correctness | 1× | Protects sensitive flows |
| Authorization correctness | 1× | Distinguishes authN and authZ |
| Test completeness | 2× | Covers happy and negative paths |
| Maintainability | 1× | Understandable and extensible |
| Code style | 0.5× | Pint quality |
| Execution efficiency | 0.5× | Time and unnecessary complexity |

Total possible = 100 (with weights applied).

## Timing Log Template

```text
Scenario: <name>
Mode: baseline-controlled | ecc-voluntary | ecc-required
Start: YYYY-MM-DD HH:MM:SS
End:   YYYY-MM-DD HH:MM:SS
Duration: Xm Ys
```

Save to `<lab-root>/timings/<worktree-dir>.txt`.

## Log File Organization

```
<lab-root>/logs/
├── 03-signed-webhook-baseline-controlled.txt
├── 03-signed-webhook-baseline-controlled-test.txt
├── 03-signed-webhook-baseline-controlled-pint.txt
├── 03-signed-webhook-baseline-controlled-routes.txt
├── 03-signed-webhook-baseline-controlled-git-status.txt
├── 03-signed-webhook-ecc-voluntary.txt
├── ... (same pattern for all 9 worktrees)
└── 06-laravel-ai-rag-workflow-ecc-required-git-status.txt

<lab-root>/timings/
├── 03-signed-webhook-baseline-controlled.txt
├── 03-signed-webhook-ecc-voluntary.txt
└── ... (same pattern for all 9 worktrees)
```

## Per-Mode MCP Config

### Mode A — Baseline-Controlled (ECC MCP Disabled)

```powershell
$env:OPENCODE_CONFIG_CONTENT = '{"mcp":{"laravel-ecc":{"enabled":false}}}'
```

### Modes B and C — ECC MCP Enabled

```powershell
$env:OPENCODE_CONFIG_CONTENT = '{"mcpServers":{"laravel-ecc":{"type":"local","command":"node","args":["<lab-root>\\package-tools\\node_modules\\laravel-ecc\\scripts\\laravel-ecc-mcp.mjs"],"env":{"ECC_ROOT":"<ecc-root>"}}}}'
```

## Quality Instruction Block (Appended to ALL modes)

```text
Before submitting:
1. Run `php artisan test` and report the test results (pass/fail count).
2. Run `.\vendor\bin\pint.bat --test` and report the result.
3. Run `php artisan route:list -v` and include the output.
4. Record honest assumptions and any deviations from the prompt.
5. State whether you used any ECC resources (if ECC MCP was available).
```

## Report Generation

After all 9 runs complete:

1. Fill per-scenario report templates at `docs/integration-tests/phase-13-1/scenarios/`
2. Generate aggregate comparison across all 3 modes
3. Write final Phase 13.1 report at `docs/integration-tests/phase-13-1/phase-13-1-final-report.md`
