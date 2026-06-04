# ECC Anti-Patterns — Console Kernel Dispatch

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Request Lifecycle |
| **Knowledge Unit** | Console Kernel Dispatch |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Not Returning Integer Exit Codes from Commands
2. Heavy Logic in Command Constructors
3. Not Setting Mutex Expiration for withoutOverlapping
4. Using `->call()` for Stateful Scheduled Tasks
5. Resolving Container Services Inside schedule() Method

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — commands control processing flow, not queries
- Premature Caching — command registration caching is for performance, not correctness

---

## Anti-Pattern 1: Not Returning Integer Exit Codes from Commands

### Category
Reliability

### Description
Returning `void`, `null`, or a string from `handle()` instead of `Command::SUCCESS` or `Command::FAILURE` — scheduler mutexes never release.

### Why It Happens
Developers treat commands like controller actions that return strings or views. They don't realize exit codes drive scheduler behavior and CI/CD pipelines.

### Warning Signs
- `handle()` has no return statement or returns `$this->info('Done')`
- `Command::FAILURE` never used
- Scheduler tasks stuck in `running` state

### Why It Is Harmful
Returning `void` produces exit code 0 (success) because PHP defaults to null. But the scheduler uses explicit exit codes to determine if a task failed. When `Command::FAILURE` is never returned, crashed commands appear as successes. Worse, `->withoutOverlapping()` relies on exit codes to release mutexes — a command that never returns (hangs) permanently holds its mutex, preventing future runs.

### Preferred Alternative
Always return `Command::SUCCESS` (0) or `Command::FAILURE` (1) on every code path.

### Detection Checklist
- [ ] `handle()` returns void or string
- [ ] Scheduler mutexes stuck
- [ ] CI/CD misinterprets results

### Related Rules
Return Integer Exit Codes From Commands (05-rules.md)

---

## Anti-Pattern 2: Heavy Logic in Command Constructors

### Category
Performance

### Description
Placing heavy initialization or I/O in command constructors — runs on every `artisan` invocation, not just when the command executes.

### Preferred Alternative
Place all logic in `handle()`. Keep constructors lightweight.

### Detection Checklist
- [ ] Database queries in constructor
- [ ] API calls in constructor
- [ ] Slow `artisan list` output

---

## Anti-Pattern 3: Not Setting Mutex Expiration for withoutOverlapping

### Category
Reliability

### Description
Using `->withoutOverlapping()` without `$expiresIn` — crashed commands permanently hold the mutex.

### Preferred Alternative
Always pass an expiration: `->withoutOverlapping(3600)`.

### Detection Checklist
- [ ] `->withoutOverlapping()` without `$expiresIn`
- [ ] Scheduler tasks permanently stuck
- [ ] Manual mutex cleanup required

---

## Anti-Pattern 4: Using `->call()` for Stateful Scheduled Tasks

### Category
Reliability

### Description
Using `$schedule->call()` for tasks that modify application state — closure runs in the current process, sharing singletons and facades.

### Preferred Alternative
Use `$schedule->command()` or `$schedule->exec()` for stateful tasks — spawns a subprocess with clean bootstrap.

### Detection Checklist
- [ ] `->call()` with mutations
- [ ] State leakage between tasks
- [ ] Singleton corruption

---

## Anti-Pattern 5: Resolving Container Services Inside schedule() Method

### Category
Reliability

### Description
Calling `$this->app->make()` or `app()` directly in the `schedule()` method — container may not be fully ready.

### Preferred Alternative
Use closures with lazy resolution. Only read configuration values in `schedule()`.

### Detection Checklist
- [ ] `app()` or `make()` in `schedule()`
- [ ] Container resolution failures during `schedule:run`
- [ ] Incomplete service instances
