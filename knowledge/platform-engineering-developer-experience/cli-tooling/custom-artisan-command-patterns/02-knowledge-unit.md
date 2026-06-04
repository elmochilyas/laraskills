# Knowledge Unit: Custom Artisan Command Patterns

## Metadata
- **Subdomain:** CLI Tooling & Artisan Extensions
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** cli-tooling-artisan-extensions/custom-artisan-command-patterns
- **Maturity:** Mature
- **Related Technologies:** Laravel Artisan, Symfony Console, PHP, Composer

## Executive Summary

Custom Artisan commands are the primary mechanism for extending Laravel's CLI capabilities. Each command extends `Illuminate\Console\Command` and defines a `$signature` (name, arguments, options) and a `handle()` method containing the command logic. Commands are registered in `App\Console\Kernel` (by class name in the `$commands` array or via autodiscovery with `load()`) and can inject dependencies via the `handle()` method's type-hinted parameters. The Laravel command system is built on Symfony's Console component, inheriting its full capabilities—input validation, output formatting, lifecycle hooks, and event dispatching. Best practices include: single responsibility in commands, using dependency injection, handling exit codes properly, writing testable command logic, and leveraging the `__invoke()` pattern for simple commands.

## Core Concepts

- **Command Class:** A class extending `Illuminate\Console\Command` with `$signature`, `$description`, and `handle()` method
- **Command Registration:** Commands registered via `$commands` array in Kernel, `load()` method for directory autodiscovery, or `registerCommand()` for programmatic registration
- **Dependency Injection in handle():** `handle(MyService $service)` receives resolved dependencies from the container, enabling testable command logic without facades
- **Exit Codes:** `return 0` (success) or `return 1` (failure) signal command outcome to the calling process
- **Command Events:** Events dispatched: `Illuminate\Console\Events\CommandStarting` and `CommandFinished`, enabling hooks for logging, timing, and monitoring
- **Hidden Commands:** `$hidden = true` prevents the command from appearing in `list` but keeps it executable

## Mental Models

- **Command as Controller:** The `handle()` method is like a controller action—it receives input, delegates to services, and returns a response (exit code)
- **Signature as Route:** The `$signature` is like a route definition: it specifies the URI pattern, parameters, and validation rules for the command
- **Command as Boundary:** Each command is a boundary between the CLI and the application logic; it should handle input parsing and output formatting but not business logic

## Internal Mechanics

1. **Command Resolution:** When `php artisan command:name` is run, the Kernel resolves the command class from the container, applying constructor injection
2. **Input Parsing:** Symfony's `ArgvInput` parses the command-line arguments and options into an `InputInterface` object matching the signature's definitions
3. **Dependency Injection in handle:** Laravel's `Illuminate\Container\Container::callMethod()` resolves type-hinted dependencies for the `handle()` method via the container
4. **Execution:** The `run()` method (Symfony) calls `execute()` (Laravel), which wraps `handle()` with error handling, output buffering, and event dispatching
5. **Exit Code Propagation:** The return value of `handle()` (or exit code from exceptions) is returned to the OS as the process exit code

## Patterns

- **Single Responsibility Pattern:** Each command does one thing (send emails, generate reports, clean up data). Split complex workflows into multiple focused commands.
- **Service Delegation Pattern:** The `handle()` method delegates to a service class for business logic, keeping the command focused on I/O (input parsing, output formatting)
- **Testable Command Pattern:** Commands that accept services via `handle()` injection are easily tested: `$this->artisan('command:name', ['arg'])->assertExitCode(0)`
- **Progress Reporting Pattern:** Long-running commands report progress via `$this->output->createProgressBar()` and structured output, enabling CI integration
- **Idempotent Command Pattern:** Commands check state before acting (already migrated, already seeded, already sent) and report "nothing to do" instead of erroring
- **Hidden Command Pattern:** Use `$hidden = true` for maintenance or internal commands that should not appear in `help` but remain callable
- **Lazy Command Pattern:** Use `__invoke()` in Laravel 11+ for simple commands: `Artisan::command('report:generate {date}', function ($date) { ... })`

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Command structure | Class-based vs closure-based (`__invoke`) | Class for complex commands with dependencies; closure for simple one-off commands |
| Dependency injection | Handle() injection vs constructor vs `$this->resolve()` | Handle injection for testability; constructor for shared dependencies; resolve sparingly |
| Output formatting | Helper methods vs SymfonyStyle vs raw writeln | Helpers for common cases; SymfonyStyle for advanced formatting |
| Registration | Kernel array vs `load()` vs manual service provider | `load()` for autodiscovery in modular apps; Kernel for small apps |

## Tradeoffs

- **Class vs Closure Commands:** Class-based commands offer inheritance, traits, and constructor injection but require more boilerplate. Closure commands (`__invoke`) are concise but lack reuse capabilities.
- **Facade vs Injection in Commands:** Using facades in commands is concise and familiar but makes testing harder (requires `Facade::shouldReceive()`). Constructor/handle injection enables cleaner unit tests.
- **Single vs Multiple Exit Codes:** Most commands return 0 (success) or 1 (failure). Using multiple exit codes (2 for partial success, 3 for timeout) enables richer automation but adds complexity.

## Performance Considerations

- **Command Bootstrap Overhead:** Each Artisan command invocation bootstraps the full Laravel application. For simple commands, bootstrap time (50-200ms) dominates execution time. Consider `laravel-zero` for micro-command applications.
- **Lazy Loading:** Commands not in the `$commands` array are loaded lazily (on first use), reducing memory for each `php artisan` invocation. Use autodiscovery for installed packages.
- **Memory Limits:** Long-running commands (queue workers, data migrations) should call `Memory::reset()` or explicitly unset large variables to prevent memory growth.

## Production Considerations

- **Exit Codes in Automation:** Commands called from CI/CD or shell scripts must return proper exit codes. Always `return 0` on success and `return 1` (or throw) on failure. Test exit codes in CI.
- **Logging in Commands:** Commands should log significant actions (start, completion, errors) via Laravel's logging system, not just output to the console. This provides audit trails in production.
- **Sensitive Data:** Commands that handle sensitive data (export user data, generate API tokens) should warn about output redirects and never echo sensitive values to the console.
- **Unattended Execution:** Commands run via scheduler or deployment hooks run non-interactively. Avoid `$this->ask()`, `$this->confirm()`, or interactive prompts in commands scheduled for automated execution.

## Common Mistakes

- **Putting business logic in commands:** Making commands thick with business logic instead of delegating to service classes; commands become untestable and non-reusable
- **Not returning exit codes:** Omitting `return 0;` at the end of `handle()`—PHP returns null (which becomes 0) but it's better to be explicit
- **Using die() or exit() in commands:** Calling `exit()` bypasses Laravel's shutdown handling, event dispatching, and output flushing. Always `return` exit codes.
- **Forgetting to register commands:** Creating a command class but not adding it to `$commands` or the `load()` directory; running it gives "Command not found"
- **Hard-coding paths:** Using `public_path()`, `base_path()`, `storage_path()` inside commands makes them environment-specific; pass paths as arguments/options

## Failure Modes

- **Uncaught Exception in Command:** An exception in `handle()` without try/catch causes exit code 1 and a stack trace in output. Mitigate: wrap command logic in try/catch and return meaningful exit codes.
- **Memory Exhaustion:** Long-running commands that iterate large datasets without batching exhaust PHP memory. Mitigate: chunk results, unset variables, and use generators.
- **Deadlock with Concurrent Execution:** Two instances of the same command run simultaneously via cron and manually, causing database deadlocks. Mitigate: use `->withoutOverlapping()` in scheduling or command-level mutexes.
- **Signature Change After CI Reliance:** Changing a command's signature (argument name/order) breaks scripts that call it. Mitigate: follow semantic versioning for publicly exposed commands.

## Ecosystem Usage

- **Laravel Framework:** Core commands (`make:model`, `migrate`, `cache:clear`) follow these patterns, setting the standard for custom command development
- **Laravel Horizon:** Horizon registers commands for monitoring, pausing, and managing queue workers
- **Laravel Telescope:** Telescope's `telescope:prune` command follows the service delegation pattern with progress reporting
- **Spatie Packages:** Spatie packages consistently use well-structured commands with signatures, descriptions, and proper exit codes
- **Blueprint:** Blueprint commands demonstrate complex multi-phase execution with progress reporting and error handling

## Related Knowledge Units

- artisan-command-signatures-arguments
- custom-generator-commands
- interactive-commands
- console-output-formatting

## Research Notes

- The `__invoke()` pattern for commands was introduced in Laravel 11.x, enabling routing-style command definitions in `routes/console.php`
- Before Laravel 5.5, commands needed to be registered in `$commands` array; autodiscovery via `load()` was added in 5.5 for package auto-discovery
- The `handle()` method signature changed in Laravel 5.5 to support dependency injection; before, dependencies were resolved via `app()` in the command body
- Symfony Console's `Command::run()` executes `execute()` (which calls `handle()`) within a try/catch that converts exceptions to exit code 1 unless `Command::ignoreValidationErrors()` is called
