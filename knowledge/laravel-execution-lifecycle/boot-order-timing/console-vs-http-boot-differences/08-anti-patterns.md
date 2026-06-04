# ECC Anti-Patterns — Console vs HTTP Boot Differences

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Console vs HTTP Boot Differences |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Duplicating Middleware Logic in Commands
2. HTTP-Conditional Provider Registration Without Clear Reason
3. Console-Only Configuration Sets
4. Middleware-Dependent Code in Console Commands
5. Scheduled Commands Without withoutOverlapping()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — commands that trigger eager loading without HTTP middleware context
- Premature Caching — caching during console bootstrap before command-specific state is set

---

## Anti-Pattern 1: Duplicating Middleware Logic in Commands

### Category
Architecture

### Description
Reproducing auth checks, rate limiting, validation, or other middleware behavior inside an Artisan command's `handle()` method instead of using proper command guards or input validation.

### Why It Happens
Developers are accustomed to middleware handling auth and validation in HTTP context. When they write CLI commands, they replicate the same checks manually, not realizing commands should use different mechanisms.

### Warning Signs
- `auth()->user()` called in a command's `handle()` to check permissions
- Rate-limiting logic reimplemented in a command
- Manual session checks in CLI commands
- CSRF token handling in a command

### Why It Is Harmful
The Console kernel has no middleware pipeline — session, auth, CSRF, and other middleware-provided services are not available. Duplicating middleware logic in commands is brittle, untestable, and hides the architectural difference between HTTP and CLI execution.

### Real-World Consequences
A command generates reports and checks `auth()->user()` to verify permissions. In CLI, `auth()->user()` returns null because no auth middleware runs. The permission check always fails, even for legitimate users. The command is unusable from the scheduler.

### Preferred Alternative
Use command arguments and options for input. Use direct container resolution for services. Implement command-specific guards using Laravel's command authorization or explicit argument validation.

### Refactoring Strategy
1. Replace `auth()->user()` with `$this->argument('user_id')` or `User::findOrFail()`
2. Replace rate-limiting with command-specific guards or `withoutOverlapping()`
3. Remove all middleware-dependent code from command `handle()` methods
4. Use `$this->option()` for configuration values instead of session or auth

### Detection Checklist
- [ ] `auth()->user()` called in command `handle()`
- [ ] `session()` accessed in command
- [ ] CSRF token checked in command
- [ ] `request()` used in command

### Related Rules
Console vs HTTP Boot Differences Rule 2 (05-rules.md): Never Depend on Middleware State in Console Commands.

### Related Skills
Write Context-Aware Boot Code for Console vs HTTP (06-skills.md).

### Related Decision Trees
Middleware-Dependent Code Safety (07-decision-trees.md).

---

## Anti-Pattern 2: HTTP-Conditional Provider Registration Without Clear Reason

### Category
Code Organization

### Description
Using `app()->runningInConsole()` to conditionally register HTTP-only or CLI-only services without a documented, justified reason.

### Why It Happens
Developers add `runningInConsole()` guards out of caution or cargo-cult without understanding whether their services actually depend on middleware.

### Warning Signs
- `$this->app->runningInConsole()` guards on services that are used in both contexts
- Guards on stateless services that have no middleware dependency
- No comment explaining why the guard is needed

### Why It Is Harmful
Unnecessary `runningInConsole()` guards add complexity and reduce testability. A service registered only in HTTP context cannot be used in console commands later, leading to subtle failures when the application grows.

### Real-World Consequences
A developer guards a `ReportGenerator` registration with `runningInConsole()` because "it's HTTP-only." Six months later, a new command needs `ReportGenerator`. The binding doesn't exist in CLI. The developer spends hours debugging why the service isn't found in console context.

### Preferred Alternative
Register shared services unconditionally. Use `runningInConsole()` only for services that explicitly depend on middleware-provided state (session, auth, CSRF).

### Refactoring Strategy
1. Remove unnecessary `runningInConsole()` guards
2. For services truly tied to one context, document why
3. Add tests that verify the service resolves in both contexts

### Detection Checklist
- [ ] `runningInConsole()` guard on a service used in both contexts
- [ ] No documentation explaining the guard
- [ ] Service unavailable in CLI when it should be

### Related Rules
Console vs HTTP Boot Differences Rule 6 (05-rules.md): Use runningInConsole() for Context-Aware Logic, Not Business Decisions.

### Related Skills
Write Context-Aware Boot Code for Console vs HTTP (06-skills.md).

### Related Decision Trees
Context-Aware Service Registration (07-decision-trees.md).

---

## Anti-Pattern 3: Console-Only Configuration Sets

### Category
Architecture

### Description
Loading different configuration files or values for CLI vs HTTP contexts, leading to inconsistent application behavior.

### Why It Happens
Developers want "HTTP config" and "CLI config" to optimize each context independently, not realizing this creates two diverging application personalities.

### Warning Signs
- Different `.env` files loaded for CLI vs HTTP
- Conditional config merging based on `runningInConsole()`
- Business logic that behaves differently because config values differ between contexts

### Why It Is Harmful
The same application should behave consistently regardless of entry point. Different configs for CLI vs HTTP mean the same code path produces different results depending on how it was invoked, violating the principle of consistent behavior.

### Real-World Consequences
A queue worker (console kernel) loads a config that disables payment processing for "CLI efficiency." When a queued job calls the payment service, it silently skips processing because the config differs. Customers are not charged. The bug goes unnoticed for weeks.

### Preferred Alternative
Use a single configuration set for all contexts. If a value must differ, use environment variables that apply universally or inject different service implementations via the container.

### Refactoring Strategy
1. Merge all conditional config loading into a single, consistent set
2. Replace config-based context branching with service-level dependency injection
3. Verify the same config file is loaded regardless of kernel entry point

### Detection Checklist
- [ ] Config files loaded conditionally based on `runningInConsole()`
- [ ] Different `.env` files for CLI vs HTTP
- [ ] Business logic behavior differs between contexts due to config

### Related Rules
Console vs HTTP Boot Differences Rule 6 (05-rules.md): Use runningInConsole() for Context-Aware Logic, Not Business Decisions.

### Related Skills
Write Context-Aware Boot Code for Console vs HTTP (06-skills.md).

### Related Decision Trees
Context-Aware Service Registration (07-decision-trees.md).

---

## Anti-Pattern 4: Middleware-Dependent Code in Console Commands

### Category
Reliability

### Description
Accessing session, auth, request, CSRF, cookies, or uploaded files inside an Artisan command's `handle()` method.

### Why It Happens
Developers write commands that assume HTTP context, not realizing CLI has no middleware pipeline and therefore no request-scoped state.

### Warning Signs
- `session()->get('key')` in a command
- `auth()->user()` in a command
- `request()->input()` in a command
- Accessing `Cookie` facade in a command

### Why It Is Harmful
The Console kernel has no middleware pipeline. Session, auth guard, CSRF protection, and other request-scoped services are not available. Accessing them in CLI returns null values or throws runtime exceptions.

### Real-World Consequences
A scheduled command sends email notifications. It uses `auth()->user()` to get the current user. In CLI, `auth()->user()` returns null. The command sends notifications with a null sender, crashing the mailer. `withoutOverlapping()` is irrelevant — the command fails on every single run.

### Preferred Alternative
Use command arguments (`$this->argument()`), options (`$this->option()`), and direct container resolution (`app(Service::class)`) for all command inputs. Never use middleware-provided state.

### Refactoring Strategy
1. Search all command `handle()` methods for `auth()`, `session()`, `request()`, `Cookie`, `csrf_token`
2. Replace each with command arguments, options, or direct service resolution
3. For user context, accept a user ID argument instead of relying on auth

### Detection Checklist
- [ ] `auth()` accessed in command
- [ ] `session()` accessed in command
- [ ] `request()` accessed in command
- [ ] `Cookie` facade used in command

### Related Rules
Console vs HTTP Boot Differences Rule 2 (05-rules.md): Never Depend on Middleware State in Console Commands.

### Related Skills
Write Context-Aware Boot Code for Console vs HTTP (06-skills.md).

### Related Decision Trees
Middleware-Dependent Code Safety (07-decision-trees.md).

---

## Anti-Pattern 5: Scheduled Commands Without withoutOverlapping()

### Category
Reliability

### Description
Defining scheduled commands with `everyMinute()` or similar short intervals without `->withoutOverlapping()`, allowing overlapping executions.

### Why It Happens
Developers do not anticipate that a command might take longer than its scheduling interval, especially under load or with large datasets.

### Warning Signs
- `$schedule->command('...')->everyMinute()` without `->withoutOverlapping()`
- Commands that run more frequently than their typical execution time
- Multiple concurrent instances of the same command in process lists

### Why It Is Harmful
Each scheduled command boots the full application. Without `withoutOverlapping()`, a long-running command that starts again before finishing spawns parallel processes, all booting the application simultaneously. This wastes server resources, can cause data races, and may exhaust memory.

### Real-World Consequences
A `reports:generate` command scheduled every minute takes 90 seconds to complete. After 60 seconds, a new instance starts. After 120 seconds, two instances run simultaneously. Both try to write to the same `generated_reports` table, causing duplicate data and database deadlocks.

### Preferred Alternative
Apply `->withoutOverlapping()` to all scheduled commands that may run longer than their interval. Use `->appendOutputTo()` for logging.

### Refactoring Strategy
1. Identify all scheduled commands without `withoutOverlapping()`
2. Add `->withoutOverlapping()` to commands that may exceed their interval
3. Optionally add `->runInBackground()` to prevent the scheduler from waiting

### Detection Checklist
- [ ] `everyMinute()` without `withoutOverlapping()`
- [ ] Command execution time may exceed scheduling interval
- [ ] Multiple instances of the same command seen concurrently

### Related Rules
Console vs HTTP Boot Differences Rule 4 (05-rules.md): Use withoutOverlapping() for Scheduled Commands.

### Related Skills
Write Context-Aware Boot Code for Console vs HTTP (06-skills.md).

### Related Decision Trees
Context-Aware Service Registration (07-decision-trees.md).
