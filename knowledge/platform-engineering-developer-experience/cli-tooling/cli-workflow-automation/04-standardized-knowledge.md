# 04-Standardized Knowledge: CLI Workflow Automation

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | cli-workflow-automation |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | command-scheduling, custom-artisan-command-patterns, automated-deployment-pipelines |
| **Framework/Language** | Laravel Artisan, Symfony Process, Shell Scripts, GitHub Actions |

## Overview

CLI workflow automation chains Artisan commands, shell scripts, and third-party tools into repeatable workflows: setup scripts (install deps, create DB, migrate, seed), deployment scripts (cache clear, optimize, restart queues), and CI scripts (test, lint, static analysis). Laravel supports programmatic command execution via `Artisan::call()`, `$this->call()` within commands, and shell execution via Symfony Process. The goal is reducing manual steps, enforcing consistency, and shortening feedback loops.

## Core Concepts

- **Command Chaining**: calling multiple commands sequentially where output/side effects feed into next
- **Programmatic Execution**: `Artisan::call('command:name', ['arg' => 'value'])` runs in-process with `Artisan::output()` capture
- **Shell Execution**: `Symfony\Component\Process\Process` for system tools (composer, npm, git)
- **Workflow Scripts**: shell scripts, Makefiles, or Composer scripts orchestrating multiple tools
- **Idempotent Workflows**: safe to run multiple times; check prerequisites before each step

## When to Use

- Project setup automation for new team members
- CI/CD pipeline scripts (test → lint → static analysis → deploy)
- Deployment automation (migrate → cache clear → queue restart)
- Bulk operations across multiple projects or environments
- Developer productivity workflows (create feature branch → install deps → run initial tests)

## When NOT to Use

- Simple single-command operations (run the command directly)
- Complex state machines requiring rollback orchestration (use dedicated deployment tools)
- Operations better expressed in CI config (GitHub Actions YAML, GitLab CI)
- Cross-platform workflows that need native GUI interaction

## Best Practices (WHY)

- **Guard clauses**: check prerequisites (file exists, service running) before each step; fail early with clear messages
- **Fail-fast for CI**: halt on first failure with non-zero exit code; use `&&` chaining or conditional checks
- **Idempotency**: each step should be safe to re-run — check state before acting
- **Structured logging**: log every step with timestamp, exit code, output for audit trails
- **Environment detection**: adjust behavior based on environment (verbose locally, quiet in CI)
- **Bulkhead pattern**: run independent tasks in parallel (static analysis + unit tests) to reduce total time

## Architecture Guidelines

- Use `Artisan::call()` for Laravel commands (shared state, faster); use Symfony Process for external tools
- Prefer Artisan commands for Laravel-specific logic; Makefile/shell for cross-language workflows
- Implement rollback steps or checkpoint recovery for multi-step workflows
- Set generous timeouts for Symfony Process to prevent silent hanging
- Use cache-based locks to prevent concurrent execution of deployment or maintenance workflows

## Performance Considerations

- Each Symfony Process subprocess adds ~5-10ms overhead; avoid spawning in loops
- `Artisan::call()` with config caching is ~1ms; without caching, 10-50ms per call
- PowerShell/CMD on Windows have different startup times than bash — prefer PHP tools for cross-platform
- Parallel execution via background processes reduces wall time but consumes more resources

## Security Considerations

- Never hard-code secrets (API keys, passwords) in workflow scripts — use environment variables
- Validate all external input before passing to shell commands
- Log output should never expose sensitive data; use output filtering if needed
- Lock concurrent execution of destructive workflows to prevent race conditions

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| No prerequisite checks | Running before DB is ready or Node.js installed | Assuming environment state | Cryptic failures mid-workflow | Add explicit guard clauses |
| Platform-specific paths | Using `/tmp` or `rm -rf` on Windows | Unix-centric scripting | Broken on Windows | Use PHP DIRECTORY_SEPARATOR |
| Silent failure swallowing | `|| true` without logging exit code | Ignoring error handling | Masked failures in CI | Always check and report exit codes |
| Hard-coded config | DB names, keys embedded in scripts | Quick-and-dirty approach | Security risk, not portable | Use `.env` or env variables |
| No timeout for subprocesses | Long-running process without timeout | Default configuration | Hanging workflow | Always set Process::setTimeout() |

## Anti-Patterns

- **Monolithic Script**: one large script doing everything instead of composable steps
- **No Rollback**: destructive workflow with no way to undo partial completion
- **Environment Assumptions**: assuming specific directory layout, tools installed, or OS
- **Blind Parallelism**: running parallel tasks without managing resource contention
- **Output Ignorance**: not capturing or logging subprocess output for debugging

## Examples

```php
// Custom Artisan command for project setup
class SetupProject extends Command
{
    protected $signature = 'project:setup {name}';

    public function handle(): int
    {
        $this->info("Setting up {$this->argument('name')}...");

        // Guard: check prerequisites
        $this->guardPhpVersion();
        $this->guardDockerRunning();

        // Chain commands
        $this->step('Generating app key', fn() => $this->call('key:generate'));
        $this->step('Running migrations', fn() => $this->call('migrate', ['--seed' => true]));
        $this->step('Installing NPM deps', fn() => $this->runProcess(['npm', 'install']));
        $this->step('Building assets', fn() => $this->runProcess(['npm', 'run', 'build']));

        $this->info('Setup complete!');
        return Command::SUCCESS;
    }

    private function step(string $label, \Closure $fn): void
    {
        $this->output->write("<comment>{$label}...</comment> ");
        $exitCode = $fn();
        $exitCode === 0
            ? $this->info('✓')
            : $this->error('✗');
    }
}
```

## Related Topics

- command-scheduling — cron-based task automation
- custom-artisan-command-patterns — command structure and registration
- automated-deployment-pipelines — deployment workflow automation
- automated-testing-in-ci — CI pipeline integration

## AI Agent Notes

- `Artisan::call()` uses `ArrayInput`, bypassing interactive prompts — suitable for automated calls
- For workflows needing real-time output, pass an `OutputStyle` instance to `Artisan::call()`
- Use Makefiles for development workflows (standard, cross-platform with GNU Make)
- Composer scripts (`composer.json` `scripts` section) are underutilized for simple automation

## Verification

- [ ] Prerequisite checks before each workflow step
- [ ] Exit codes propagate correctly through chain
- [ ] Idempotent: re-running workflow produces same result
- [ ] Cross-platform: tested on Linux, macOS, Windows
- [ ] Timeout configured for all subprocess calls
- [ ] No sensitive data in logs or output
- [ ] Concurrent execution lock prevents races
- [ ] Rollback available for destructive operations
- [ ] Steps log with timestamps and exit codes
