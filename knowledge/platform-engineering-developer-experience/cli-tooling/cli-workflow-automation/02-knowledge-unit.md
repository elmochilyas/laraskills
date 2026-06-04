# Knowledge Unit: CLI Workflow Automation

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/cli-workflow-automation
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Symfony Process, Shell Scripts, GitHub Actions, Makefile

## Executive Summary

CLI workflow automation in Laravel involves chaining Artisan commands, shell scripts, and third-party CLI tools into repeatable workflows that streamline development tasks. Common patterns include: setup scripts that install dependencies, create databases, run migrations, and seed data; deployment scripts that clear caches, run optimizations, and restart queues; and CI scripts that integrate testing, linting, and static analysis. Laravel's Artisan kernel can call commands programmatically via `Artisan::call()`, `$this->call()` within commands, or by executing shell commands via Symfony Process. The goal is to reduce repetitive manual steps, enforce consistency, and shorten feedback loops for common development workflows.

## Core Concepts

- **Command Chaining:** Calling multiple Artisan commands in sequence, where each command's output or side effect feeds into the next
- **Programmatic Command Execution:** `Artisan::call('command:name', ['arg' => 'value'])` runs a command within the same process; `Artisan::output()` captures its output
- **Shell Command Integration:** Using `Symfony\Component\Process\Process` to run system commands (composer, npm, git) from within Artisan commands
- **Workflow Scripts:** Shell scripts (.sh, .bat), Makefiles, or Composer scripts that orchestrate multiple CLI tools in sequence
- **Idempotent Workflows:** Scripts designed to be run multiple times safely, checking prerequisites before each step

## Mental Models

- **CLI as API:** Each Artisan command is an endpoint; workflow scripts are orchestrators that compose these endpoints into higher-level operations
- **Pipeline Model:** Workflows are pipelines where each stage transforms state (files, database, cache) and passes control to the next stage
- **Idempotency as Safety:** An idempotent workflow can be interrupted and re-run without side effects—like database migrations that check if already applied

## Internal Mechanics

1. **Artisan::call() Flow:** `Artisan::call()` resolves the command from the Kernel, creates an `ArrayInput` from the provided arguments, runs `Command::run()`, and returns the exit code
2. **Output Capture:** `Artisan::output()` returns buffered output from `BufferedOutput`; this enables programmatic inspection of command results
3. **Process Execution:** `Symfony Process` runs shell commands as subprocesses with configurable timeout, working directory, and environment variables, streaming output in real-time
4. **Error Propagation:** Exit codes from subprocesses determine workflow continuation; non-zero exit codes typically halt the workflow at that step

## Patterns

- **Setup Automation Pattern:** Create a single `app:setup` command that chains `key:generate`, `migrate --seed`, `storage:link`, `npm install`, and `npm run build`
- **CI Pipeline Pattern:** Workflow scripts run `pint --test`, `phpstan analyse`, `phpunit`, and `dusk` sequentially, halting on failure with `&&` or conditional exit code checks
- **Guard Clause Pattern:** Check prerequisites at each step (file exists, service is running, directory is writable) before executing; fail early with clear error messages
- **Bulkhead Pattern:** Run parallel workflow branches for independent tasks (static analysis on source code while running unit tests) using background processes or `parallel` command
- **Rollback Pattern:** In deployment workflows, tag the current state before applying changes so a rollback command can restore the previous state

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| In-process vs subprocess | `Artisan::call()` vs `Symfony Process` | In-process for Laravel commands (shared state, faster); subprocess for external tools |
| Script language | Shell script vs Makefile vs Composer script vs Artisan command | Artisan for Laravel-specific logic; shell/Makefile for cross-language workflows |
| Error handling | Fail-fast vs best-effort with error reporting | Fail-fast for CI/deployment; best-effort for setup/idempotent scripts |
| Parallel execution | Background processes vs `parallel` tool vs Queue jobs | Background processes for simple parallelism; Queue for complex async workflows |

## Tradeoffs

- **In-Process vs Subprocess:** `Artisan::call()` shares memory, configuration, and state (faster, more context-aware), but any failure can corrupt the parent process state. Subprocess execution via Process is isolated (safer, crash-resistant) but slower due to process spawning overhead.
- **Shell Script vs Artisan:** Shell scripts are universal (work without PHP) but platform-specific (Windows vs Unix differences). Artisan commands are cross-platform (PHP) but require a working Laravel bootstrap.
- **Fail-Fast vs Resilient:** Fail-fast workflows are simpler and catch errors early but are brittle. Resilient workflows with retry logic and partial completion are more robust but significantly more complex.

## Performance Considerations

- **Process Spawning Overhead:** Each subprocess call via `Symfony Process` creates a new process; 10 sequential subprocess calls add ~50-100ms overhead total. Avoid spawning processes in loops—use batch operations instead.
- **Command Resolution Cache:** `Artisan::call()` resolves the command from the Kernel each time; with config caching, this is fast (~1ms per call). Without caching, each call adds 10-50ms for service provider booting.
- **Shell Execution on Windows:** PowerShell and CMD have different startup times than bash. For cross-platform workflows, prefer PHP-based tools over shell scripts.

## Production Considerations

- **Timeout Management:** Long-running workflows (deployments, data migrations) must have appropriate timeouts. Set generous timeouts for `Symfony Process` and use `Process::setTimeout()` to prevent silent hanging.
- **Logging and Audit Trails:** Log each step of automated workflows with timestamps, exit codes, and output. Use Laravel's logging or structured output for machine-parseable audit trails.
- **Environment Awareness:** Workflow scripts should detect the environment (local, staging, production) and adjust behavior—disabling destructive operations in production, enabling verbose output locally.
- **Locking for Concurrent Execution:** Use file locks or Laravel's cache-based locks to prevent concurrent execution of deployment or maintenance workflows.

## Common Mistakes

- **Not checking prerequisites:** Running migrations before the database is available or npm install without Node.js installed; add explicit prerequisite checks
- **Platform-specific path assumptions:** Using Unix paths (`/tmp`) or commands (`rm -rf`) in workflows that run on Windows; use PHP's `DIRECTORY_SEPARATOR` and cross-platform commands
- **Silent failure swallowing:** Ignoring exit codes or using `|| true` without logging the failure; always check and report subprocess exit codes
- **Hard-coded environment values:** Embedding database names, API keys, or paths in workflow scripts; use `.env` files or environment variables for configuration

## Failure Modes

- **Half-Executed Workflow:** A step fails midway through a multi-step workflow, leaving the system in an inconsistent state. Mitigate: implement rollback steps or checkpoint recovery.
- **Zombie Subprocess:** A background process continues running after the parent script exits, consuming resources or locking files. Mitigate: use Process timeouts and cleanup handlers.
- **Permission Denied:** Workflow steps require write access to directories (storage, vendor, node_modules) that are owned by a different user. Mitigate: check and document required permissions.
- **Memory Exhaustion in Long Workflows:** Processing large datasets in a loop without freeing memory leads to PHP memory limit exhaustion. Mitigate: batch operations and unset large variables.

## Ecosystem Usage

- **Laravel Forge:** Forge uses deployment scripts (deploy hook) that run Artisan commands, Composer install, and project-specific setup steps
- **Laravel Vapor:** Vapor CLI provides `vapor deploy` that automates the deployment workflow—uploading assets, running migrations, switching environments
- **Envoyer:** Envoyer's zero-downtime deployment runs project-defined deployment scripts with health checks between steps
- **Sail:** `./vendor/bin/sail` provides wrapper scripts that automate Docker Compose workflow for Laravel development

## Related Knowledge Units

- command-scheduling
- custom-artisan-command-patterns
- automated-deployment-pipelines
- automated-testing-in-ci

## Research Notes

- The `Artisan::call()` method internally uses `Symfony\Component\Console\Input\ArrayInput`, which bypasses the console's interactive features (no prompts, no styling)
- For workflows that need real-time output streaming, use `Artisan::call()` with an `OutputStyle` instance passed as the third parameter
- The trend in Laravel teams is toward Makefile-based workflow automation for development (standard, cross-platform with GNU Make for Windows) and Artisan commands for application-specific logic
- Composer scripts (defined in `composer.json` under `scripts`) are an underutilized pattern for simple workflow automation in Laravel projects
