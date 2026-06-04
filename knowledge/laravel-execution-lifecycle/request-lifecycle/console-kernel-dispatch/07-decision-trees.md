# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Console Kernel Dispatch
**Generated:** 2026-06-03

---

# Decision Inventory

1. Command Registration: Provider `$commands` array vs `load()` directory scanning
2. Schedule Strategy: Inline closure vs class-based scheduled tasks
3. Command Dependencies: Constructor injection vs `$this->app->make()` in commands

---

# Architecture-Level Decision Trees

---

## Decision Name: Command Registration Strategy

---

## Decision Context

Choosing between explicit provider registration and directory scanning for registering Artisan commands.

---

## Decision Criteria

* performance — directory scanning adds 5-10ms per artisan call for 50+ files
* architectural — explicit registration is declarative; directory scanning is automatic
* security — commands registered via `load()` must pass package security review
* maintainability — `load()` requires no maintenance; explicit registration is self-documenting

---

## Decision Tree

Is the command in the application's `app/Console/Commands` directory?
↓
YES → Use `$this->load(__DIR__.'/../../Commands')` in `ConsoleKernel::commands()` or in bootstrap/app.php with `->withCommands()`
NO → Is the command from a package or third-party?
↓
YES → Register explicitly via `$commands` array or `Commands\ServiceProvider` — don't scan package directories
NO → Is the command used infrequently (CLI-only admin command)?
↓
YES → Use explicit registration — document each command's purpose
NO → Use `load()` for application commands; explicit registration for package commands

---

## Rationale

Directory scanning via `load()` automatically discovers all command classes in a directory — zero maintenance for new commands. However, it adds filesystem I/O overhead on every artisan invocation. For application commands, this is acceptable. For package commands, explicit registration is preferred to avoid unintended exposure of internal commands.

---

## Recommended Default

**Default:** `load()` for application commands in `app/Console/Commands`; explicit `$commands` array for package commands.
**Reason:** Zero maintenance for app commands; explicit control for package commands.

---

## Risks Of Wrong Choice

- Using `load()` for package commands: unintended commands registered — internal CLI tools exposed.
- Not using `load()` for app commands: every new command must be manually added to the array.
- Using `load()` with path outside app: may scan vendor or other unintended directories.

---

## Related Skills

- Manage Console Kernel Dispatch (06-skills.md)

---

## Decision Name: Command Dependency Strategy

---

## Decision Context

Choosing between constructor injection and `$this->app->make()` for resolving dependencies in Artisan commands.

---

## Decision Criteria

* performance — constructor injection resolves once; `make()` resolves on every call
* architectural — commands are container-resolved; constructor injection is natural
* security — `make()` in handle() is a service locator anti-pattern
* maintainability — constructor injection makes dependencies visible

---

## Decision Tree

Are the dependencies used across multiple command methods (handle, configure, interact)?
↓
YES → Use constructor injection — resolve once, use everywhere
NO → Are the dependencies only used in the `handle()` method?
↓
YES → Use constructor injection — even for single-method use, it's cleaner than `make()`
NO → Are you tempted to use `$this->app->make()` in handle()?
↓
YES → Use constructor injection instead — `make()` hides dependencies and makes testing harder
NO → Use constructor injection — always prefer explicit dependency declaration

---

## Rationale

Commands are resolved through the container — all constructor dependencies are auto-injected. Constructor injection makes dependencies visible in the class signature, enabling testing and static analysis. `$this->app->make()` in `handle()` is a service locator that hides dependencies and makes testing require container configuration.

---

## Recommended Default

**Default:** Constructor injection for ALL command dependencies.
**Reason:** Commands are container-resolved; constructor injection is natural, testable, and explicit.

---

## Risks Of Wrong Choice

- `$this->app->make()` in handle(): hidden dependency; testing requires container config.
- Constructor injection for rarely-used command: still better than `make()` — the injection is lazy (commands are resolved on demand).
- Heavy logic in command constructor: constructor runs during command registration, not execution.

---

## Related Skills

- Manage Console Kernel Dispatch (06-skills.md)
