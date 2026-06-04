# Decision Trees: Custom Artisan Command Patterns

## Metadata
- **KU ID:** cli-tooling-artisan-extensions/custom-artisan-command-patterns
- **Subdomain:** cli-tooling-artisan-extensions
- **Domain:** platform-engineering-developer-experience
- **Phase:** 4 (Experience Curation)
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Command class vs closure | Full command class / `__invoke()` closure / Route closure | Complexity and reuse requirements |
| 2 | Business logic location | In `handle()` / Delegated to service / Inline helpers | Testability and separation of concerns |
| 3 | Dependency injection | Constructor / `handle()` parameters / Manual resolution | Service lifecycle and testability needs |
| 4 | Registration method | `$commands` array / `load()` autodiscovery / Manual registration | Application size and modularity |
| 5 | Exit code convention | `Command::SUCCESS` / `Command::FAILURE` / Custom codes | Signaling outcome to calling processes |

## Architecture-Level Decision Trees

### Tree 1: Command Class vs Closure

- **Start:** Choosing how to define the command
- **Is the command simple (one-off task, <20 lines)?**
  - Yes → Use `__invoke()` closure in `routes/console.php`. Laravel 11+ syntax. Minimal boilerplate.
  - No → Continue.
- **Does the command need dependency injection, testing, or reusability?**
  - Yes → Use full command class extending `Illuminate\Console\Command`. Supports constructor/handle injection, test assertions, and reuse across contexts.
  - No → Closure is sufficient for simple prototyping or experimentation.
- **Closure limitation:** Closures cannot be tested with `$this->artisan()->assertExitCode()`. They lack command events and lifecycle hooks.

### Tree 2: Business Logic Placement

- **Start:** Where to put business logic
- **Is the logic specific to this command only, unlikely to be reused?**
  - Yes → Keep in `handle()` or private methods. Keep methods focused (one per concern).
  - No → Delegate to service class. Inject via `handle()` parameter. Keeps command focused on I/O.
- **Thick command anti-pattern:** If `handle()` exceeds 50 lines or has multiple responsibilities, extract services. Commands should be thin orchestrators.
- **Testability concern:** Logic in `handle()` requires `$this->artisan()` to test. Logic in services can be tested with unit tests. Prefer services for complex business rules.

### Tree 3: Dependency Injection Strategy

- **Start:** Choosing injection method
- **Is the dependency shared across many commands (logger, config)?**
  - Yes → Constructor injection. Dependency resolved once and shared across all methods.
  - No → Continue.
- **Is the dependency specific to this command's execution (report service, external API)?**
  - Yes → Handle injection: `handle(ReportService $service)`. Resolved per-call. Easier to test.
  - No → Constructor injection for cross-cutting concerns.
- **Rule of thumb:** Constructor for shared infrastructure. `handle()` for per-command services. Never instantiate services manually inside `handle()`.

### Tree 4: Registration Method

- **Start:** Registering the command with the Kernel
- **Is the application small (<20 commands)?**
  - Yes → Use `$commands` array in `App\Console\Kernel`. Explicit registration, clear listing.
  - No → Continue.
- **Does the application have modular packages or many commands?**
  - Yes → Use `$this->load(__DIR__.'/Commands')` in Kernel. Autodiscovers all commands in directory. No manual registration needed.
  - No → `$commands` array is simpler and more explicit.
- **Hidden commands:** Set `$hidden = true` for utility commands that should not appear in `php artisan list` but remain executable.
- **Verification:** Run `php artisan list` to confirm command appears. Run `php artisan command:name --help` to verify signature and description.
