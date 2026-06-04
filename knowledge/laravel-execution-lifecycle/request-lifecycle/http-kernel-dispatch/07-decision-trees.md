# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Request Lifecycle
**Knowledge Unit:** HTTP Kernel Dispatch
**Generated:** 2026-06-03

---

# Decision Inventory

1. Bootstrap Safety: Manual bootstrap call vs guard-based bootstrap
2. Pipeline Optimization: Middleware count vs bootstrap overhead
3. Exception Strategy: Kernel-level catch vs HandleExceptions bootstrapper

---

# Architecture-Level Decision Trees

---

## Decision Name: Bootstrap Invocation Safety

---

## Decision Context

Determining when it is safe to call `$this->bootstrap()` manually vs relying on the kernel's guard.

---

## Decision Criteria

* performance — re-bootstrapping re-runs all bootstrappers
* architectural — `hasBeenBootstrapped` guard prevents double execution
* security — re-running `LoadConfiguration` would reset config to defaults
* maintainability — bootstrap is automatically managed by the kernel

---

## Decision Tree

Are you inside the kernel's `handle()` method?
↓
YES → Do NOT call `bootstrap()` manually — the kernel's guard manages it automatically
NO → Do you need to re-run bootstrappers for a new request in a long-running process?
↓
YES → Call `$app->reset()` first (clears `hasBeenBootstrapped`), THEN call `bootstrapWith()` or let the kernel handle it
NO → Do you need to run specific bootstrappers programmatically?
↓
YES → Use `$app->bootstrapWith([SpecificBootstrapper::class])` — targeted, not the full sequence
NO → Never call `bootstrap()` manually — the framework manages it

---

## Rationale

Calling `$this->bootstrap()` manually re-runs all six bootstrappers, which resets configuration to its initial state, re-registers facades, and re-boots all providers. This destroys any runtime state and can cause unpredictable behavior. The `hasBeenBootstrapped` guard normally prevents this, but `reset()` clears the guard specifically for long-running process scenarios.

---

## Recommended Default

**Default:** Never call `bootstrap()` manually in application code. In Octane, use `reset()` before re-bootstrapping.
**Reason:** Manual bootstrap destroys runtime state; the guard and `reset()` provide controlled alternatives.

---

## Risks Of Wrong Choice

- Calling `bootstrap()` in middleware: re-runs all bootstrappers — config reset, providers re-registered, runtime state destroyed.
- Calling `bootstrap()` on an already-bootstrapped app: `LogicException` from `hasBeenBootstrapped` guard.
- Not calling `reset()` before re-bootstrapping in Octane: `LogicException` — cannot bootstrap twice without reset.

---

## Related Skills

- Manage HTTP Kernel Dispatch (06-skills.md)
