# 04-Standardized Knowledge: Custom Artisan Command Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | cli-tooling-artisan-extensions |
| **Knowledge Unit** | custom-artisan-command-patterns |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | artisan-command-signatures-arguments, custom-generator-commands, interactive-commands |
| **Framework/Language** | Laravel Artisan, Symfony Console, PHP |

## Overview

Custom Artisan commands extend Laravel's CLI by extending `Illuminate\Console\Command`. Each command defines a `$signature` and a `handle()` method. Commands register in `App\Console\Kernel` via `$commands` array or autodiscovery with `load()`. Dependencies inject via type-hinted parameters. The system builds on Symfony Console for input validation, output formatting, lifecycle hooks, and event dispatching.

## Core Concepts

- **Command Class**: extends `Illuminate\Console\Command` with `$signature`, `$description`, `handle()`
- **Registration**: `$commands` array, `load()` autodiscovery, or `registerCommand()` programmatic
- **Dependency Injection**: `handle(MyService $service)` receives resolved dependencies from the container
- **Exit Codes**: `return 0` (success), `return 1` (failure) signal outcome to calling process
- **Command Events**: `CommandStarting` and `CommandFinished` enable hooks for logging, timing, monitoring
- **Hidden Commands**: `$hidden = true` excludes from `list` but keeps executable

## When to Use

- Automating repetitive development tasks (setup, migrations, data cleanup)
- Creating CLI interfaces for application features (reports, exports, notifications)
- Bridging Laravel operations with external tools (APIs, file systems, queues)
- Providing maintenance and troubleshooting commands for production operations

## When NOT to Use

- Simple one-off tasks better suited for closures in `routes/console.php`
- Business logic that belongs in service classes (commands should be thin)
- Interactive workflows that need complex state machines (use dedicated console applications)
- Operations better handled by the task scheduler or queue workers

## Best Practices (WHY)

- **Single Responsibility**: each command does one thing; splits complex workflows into focused commands for testability and reusability
- **Service Delegation**: `handle()` delegates to service classes for business logic, keeping commands focused on I/O
- **Explicit Exit Codes**: always `return 0` on success and `return 1` on failure so CI/CD and scripting tools can check results
- **Idempotent Design**: check state before acting (already migrated, seeded, sent) and report "nothing to do" instead of erroring
- **Handle Injection**: accept services via `handle()` for testability with `$this->artisan()` assertions
- **`__invoke()` for Simple Commands**: use Laravel 11+ closure syntax for one-off commands to reduce boilerplate

## Architecture Guidelines

- Keep commands in `App\Console\Commands` namespace by default
- Register via `$commands` array in small apps; use `load()` for modular/multi-package apps
- Use constructor injection for shared dependencies (loggers, config); use handle injection for per-command services
- Never use `die()`, `exit()`, or `dd()` in commands — always return exit codes
- Avoid `$this->ask()`, `$this->confirm()` in commands intended for automated/scheduled execution

## Performance Considerations

- Bootstrap overhead: each Artisan invocation bootstraps the full app (50-200ms) — use `laravel-zero` for micro-commands
- Lazy loading: commands not in `$commands` array load lazily, reducing memory per `php artisan` invocation
- Long-running commands: chunk results, unset large variables, use generators to prevent memory growth

## Security Considerations

- Never echo sensitive values (passwords, tokens, API keys) to the console
- Commands handling sensitive data should warn about output redirects
- Validate all input through signature regex and command body validation
- Avoid storing secrets in command attributes; use config/env at runtime

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Business logic in commands | Thick commands with business logic instead of delegating to services | Convenience | Untestable, non-reusable commands | Delegate to service classes |
| Missing exit codes | Omitting `return 0` | Assumption that null maps to success | Automatic scripts can't detect failure | Always return explicit exit codes |
| Using die()/exit() | Hard exit bypassing Laravel shutdown | Habit from standalone scripts | Lost event dispatching, output buffering | Return exit codes |
| Forgetting registration | Command class not added to Kernel | Oversight | "Command not found" error | Add to `$commands` or `load()` directory |
| Hard-coded paths | Using `public_path()`, `base_path()` without flexibility | Convenience | Environment-specific failures | Pass paths as arguments/options |

## Anti-Patterns

- **God Command**: a single command doing everything (reports, cleanup, notifications) — split into focused commands
- **Silent Failure**: catching exceptions without logging or returning non-zero exit code
- **Echo Overload**: using `echo` instead of `$this->output->writeln()` — bypasses formatting and verbosity control
- **Tight Coupling**: instantiating services inside `handle()` instead of injecting them
- **Unsafe Production Commands**: commands that modify data without confirmation, `--force`, or logging

## Examples

```php
namespace App\Console\Commands;

use App\Services\ReportService;
use Illuminate\Console\Command;

class GenerateReport extends Command
{
    protected $signature = 'report:generate {date : The report date} {--format=pdf : Output format}';
    protected $description = 'Generate daily performance report';

    public function handle(ReportService $reportService): int
    {
        $this->info("Generating report for {$this->argument('date')}...");

        try {
            $report = $reportService->generate($this->argument('date'), $this->option('format'));
            $this->info("Report saved to: {$report->path}");
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Report generation failed: {$e->getMessage()}");
            return Command::FAILURE;
        }
    }
}
```

## Related Topics

- artisan-command-signatures-arguments — defining input specifications
- console-output-formatting — tables, progress bars, styled output
- interactive-commands — prompts, confirmations, choices
- command-scheduling — cron-based task automation
- cli-workflow-automation — chaining commands into workflows
- command-testing — `$this->artisan()` assertions

## AI Agent Notes

- Commands are entry points; AI agents should treat `handle()` as the main execution path
- Signature parsing converts to Symfony InputDefinition — validate inputs before business logic
- For multi-step generation, extend `GeneratorCommand` instead of base `Command`
- Test commands via `$this->artisan()->assertExitCode()` in feature tests

## Verification

- [ ] Command registered and appears in `php artisan list`
- [ ] `--help` displays correct signature and description
- [ ] Arguments/options parse with correct types and defaults
- [ ] Exit codes: 0 for success, 1 for failure
- [ ] Service delegation: `handle()` calls external service classes
- [ ] Idempotent: running twice produces same result
- [ ] `--no-interaction` works without hanging
- [ ] Tests cover: success path, failure path, edge case inputs
- [ ] Logging captures start, completion, and errors
- [ ] Sensitive data not exposed in output or logs
