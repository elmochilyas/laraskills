# Decision Trees: CLI Workflow Automation

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/cli-workflow-automation
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Execution method | `Artisan::call()` / Symfony Process / Shell script | In-process Laravel vs subprocess for external tools |
| 2 | Workflow structure | Monolithic script / Composable steps / Makefile targets | Modularity, reusability, and debugging needs |
| 3 | Error handling strategy | Fail-fast / Continue on warning / Checkpoint recovery | Criticality of each step and idempotency |
| 4 | Concurrency model | Sequential / Parallel independent steps / Background workers | Performance optimization vs resource contention |
| 5 | Cross-platform support | PHP-only / Unix-only / Cross-platform with detection | Team OS diversity and CI runner environments |

## Architecture-Level Decision Trees

### Tree 1: Execution Method Selection

- **Start:** Choosing how to run a command in a workflow
- **Is the command a Laravel Artisan command?**
  - Yes → Continue.
  - No → Use Symfony Process for external tools (composer, npm, git).
- **Does the command need to share Laravel state (config, DB, cache)?**
  - Yes → Use `Artisan::call()`. Runs in-process, shares state, faster (~1ms cached, 10-50ms uncached).
  - No → Use Symfony Process or `Artisan::call()` based on whether it's an Artisan command.
- **Is the command an external system tool (shell, git, npm, composer)?**
  - Yes → Use Symfony Process. Set timeout, capture output, check exit code.
  - No → Use `Artisan::call()` for other Artisan commands.
- **Cross-platform note:** PHP tools are portable. Shell scripts and Makefiles require Unix or WSL2. Prefer PHP for cross-platform needs.

### Tree 2: Workflow Structure Design

- **Start:** Structuring a multi-step workflow
- **How many steps does the workflow have?**
  - 1-3 → Simple script. Keep in a single command or Makefile target.
  - 4-8 → Composable steps. Each step is a named function or separate command. Steps can be run independently.
  - 9+ → Modular workflow. Break into separate commands. Use a Makefile or orchestrator script.
- **Are steps reusable across workflows?**
  - Yes → Extract shared steps into standalone Artisan commands or functions. Compose in orchestrator.
  - No → Keep steps inline. Document clearly.
- **Structure pattern:**
  1. Guard clauses (check prerequisites first)
  2. Sequential independent steps
  3. Optional parallel steps
  4. Validation/cleanup step
  5. Summary output

### Tree 3: Error Handling and Idempotency

- **Start:** Determining error handling behavior
- **Is this a CI/CD workflow?**
  - Yes → Fail-fast. Halt on first error. Return non-zero exit code. Each step checks exit code before proceeding.
  - No → Continue.
- **Is the workflow interactive (developer machine)?**
  - Yes → Fail with clear message. Show what failed and how to resolve. Option to retry the failed step.
  - No (automated/CI) → Fail-fast with detailed logging.
- **Idempotency check per step:**
  - Can the step be safely re-run? → Implement guard clause: check state before acting. Use `cp -n`, check-before-create, etc.
  - Does the step modify state destructively? → Implement checkpoint recovery. Save intermediate state. Allow restart from last checkpoint.
- **Logging:** Log every step with timestamp, exit code, and output. Never log sensitive data.

### Tree 4: Concurrency and Parallel Execution

- **Start:** Deciding whether to run tasks in parallel
- **Are steps independent (no shared state, no ordering requirement)?**
  - Yes → Run in parallel. Use background processes or queued jobs. Reduces total wall time.
  - No → Run sequentially. Dependent steps must wait for previous output.
- **Example parallel tasks:** Static analysis + Unit tests (independent). Run concurrently.
- **Example sequential tasks:** Migrate → Seed → Cache clear (dependent). Run in order.
- **Resource considerations:** Background tasks consume memory/CPU. Monitor concurrent limits. Use cache-based locks for exclusive operations (deployments, maintenance).
- **Timeout:** Always set timeout for subprocesses with `Process::setTimeout()`. Default has no timeout and can hang indefinitely.
