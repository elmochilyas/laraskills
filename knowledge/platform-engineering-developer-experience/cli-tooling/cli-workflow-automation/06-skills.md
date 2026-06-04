# Skill: Automate CLI Workflows

## Purpose
Chain Artisan commands, shell scripts, and third-party tools into repeatable workflows for project setup, CI/CD pipelines, deployment automation, and developer productivity tasks.

## When To Use
- Project setup automation for new team members
- CI/CD pipeline scripts (test → lint → static analysis → deploy)
- Deployment automation (migrate → cache clear → queue restart)
- Bulk operations across multiple projects or environments
- Developer productivity workflows (create branch → install deps → run tests)

## When NOT To Use
- Simple single-command operations (run the command directly)
- Complex state machines requiring rollback orchestration (use dedicated deployment tools)
- Operations better expressed in CI config (GitHub Actions YAML, GitLab CI)

## Prerequisites
- Laravel Artisan configured
- Symfony Process (`composer require symfony/process`)
- Makefile or shell scripting knowledge
- Understanding of exit codes and error handling

## Inputs
- List of commands to chain (Artisan and external)
- Prerequisite checks (file exists, service running)
- Environment context (local, CI, production)

## Workflow
1. Map the workflow steps in dependency order (parallel tasks identified)
2. Add guard clauses at each step — check prerequisites before proceeding
3. Use `Artisan::call()` for Laravel commands (shared state, faster)
4. Use Symfony Process for external tools (composer, npm, git)
5. Set generous timeouts for Process execution to prevent silent hanging
6. Use fail-fast approach for CI: halt on first failure with non-zero exit code
7. Make each step idempotent: check state before acting, safe to re-run
8. Add structured logging: timestamp, exit code, output per step
9. Run independent tasks in parallel (bulkhead pattern)
10. Detect environment and adjust behavior (verbose locally, quiet in CI)

## Validation Checklist
- [ ] Guard clauses check prerequisites before each step
- [ ] Fail-fast behavior with non-zero exit code on failure
- [ ] Each step is idempotent (safe to re-run)
- [ ] Logging captures timestamp, exit code, and output per step
- [ ] Environment detection adjusts verbosity and behavior
- [ ] Independent tasks run in parallel when possible
- [ ] Timeouts set for external process execution
- [ ] Cache-based locks prevent concurrent deployment/maintenance workflow execution

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Workflow continues after failure | No fail-fast | Add non-zero exit codes and `&&` chaining |
| Workflow fails on second run | Not idempotent | Check state before each step; safe to re-run |
| External process hangs indefinitely | No timeout | Set generous but finite Process timeout |
| Workflow runs in wrong environment | No environment detection | Detect environment; adjust behavior |
| Silent failures (exit code 0 but task failed) | No output capture | Log exit code and output per step |
| Concurrent deployment runs | No locking | Use cache-based locks to prevent concurrent execution |

## Decision Points
- **Execution method:** `Artisan::call()` (shared state) vs Symfony Process (isolation) vs shell script
- **Workflow format:** Composer scripts vs Makefile vs shell script vs Artisan command
- **Parallel vs sequential:** Independent tasks in parallel; dependent tasks sequential
- **Locking mechanism:** Cache-based (Redis) vs file-based vs database lock

## Performance/Security Considerations
- Never log sensitive values (environment variables, credentials)
- Set timeouts for all external process execution
- Use cache-based locks to prevent concurrent deployment or maintenance workflows
- Ensure CI mode suppresses interactive prompts with `--no-interaction`
- Environment variables in workflows must be stored in CI secrets, not hardcoded

## Related Rules
- CLIWA-RULE-001 through CLIWA-RULE-012

## Related Skills
- Schedule Commands
- Create Custom Artisan Commands
- Set Up GitHub Actions for Laravel
- Automate Deployment Pipelines
- Set Up Automated Testing in CI

## Success Criteria
- Setup workflow completes in a single command
- CI workflow runs all quality checks and reports results in <5 minutes
- Deployment workflow includes rollback procedure
- All steps are idempotent and safe to re-run
- Workflow detects environment (CI vs local) and adjusts verbosity accordingly
