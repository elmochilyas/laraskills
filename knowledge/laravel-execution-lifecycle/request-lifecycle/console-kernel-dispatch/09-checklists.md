# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Request Lifecycle
**Knowledge Unit:** Console Kernel Dispatch
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Can trace the full flow from `artisan` through `handleCommand()` to command `handle()`
- [ ] Understand the 4 command registration sources and last-wins resolution
- [ ] Know the Console kernel's different bootstrapper set vs HTTP kernel
- [ ] Constructor is lightweight â€” no I/O, no heavy computation, no service resolution
- [ ] All dependencies use constructor injection â€” not facades, not `app()` in `handle()`
- [ ] `handle()` returns `Command::SUCCESS` or `Command::FAILURE` on every code path
- [ ] Return integer status codes applied
- [ ] Use constructor injection for dependencies applied
- [ ] Use `->withoutOverlapping()` with expiration applied
- [ ] Set `APP_RUNNING_IN_CONSOLE` in deployment scripts applied
- [ ] Not Returning Integer Exit Codes from Commands prevented
- [ ] Heavy Logic in Command Constructors prevented
- [ ] Using $this->app->make() inside schedule() prevented
- [ ] Returning string/Response instead of int status prevented

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Return integer status codes applied
- [ ] Use constructor injection for dependencies applied
- [ ] Use `->withoutOverlapping()` with expiration applied
- [ ] Set `APP_RUNNING_IN_CONSOLE` in deployment scripts applied
- [ ] Using $this->app->make() inside schedule() prevented
- [ ] Returning string/Response instead of int status prevented
- [ ] Not setting mutex expiration for withoutOverlapping prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not Returning Integer Exit Codes from Commands prevented
- [ ] Heavy Logic in Command Constructors prevented
- [ ] Not Setting Mutex Expiration for withoutOverlapping prevented
- [ ] Using ->call() for Stateful Scheduled Tasks prevented
- [ ] Resolving Container Services Inside schedule() Method prevented

---

# Testing Checklist

- [ ] Constructor is lightweight â€” no I/O, no heavy computation, no service resolution
- [ ] All dependencies use constructor injection â€” not facades, not `app()` in `handle()`
- [ ] `handle()` returns `Command::SUCCESS` or `Command::FAILURE` on every code path
- [ ] Command is registered explicitly â€” not relying solely on directory scanning in production
- [ ] Can trace the full flow from `artisan` through `handleCommand()` to command `handle()`
- [ ] Understand the 4 command registration sources and last-wins resolution
- [ ] Know the Console kernel's different bootstrapper set vs HTTP kernel
- [ ] Can explain scheduler subprocess isolation and mutex management

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Not Returning Integer Exit Codes from Commands prevented
- [ ] Heavy Logic in Command Constructors prevented
- [ ] Not Setting Mutex Expiration for withoutOverlapping prevented
- [ ] Using ->call() for Stateful Scheduled Tasks prevented
- [ ] Resolving Container Services Inside schedule() Method prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- Entry Point Mechanics (the `artisan` entry mirrors `public/index.php` flow)
- Application Bootstrap (Application initialization before kernel dispatch)
- Service Container (command resolution via container)
- HTTP Kernel Dispatch (parallel dispatch path â€” both use same bootstrap pattern)
- Service Providers (commands registered via provider `$commands` property)
- Boot Order & Timing (Console kernel bootstrapper differences)
- Response Sending and Termination (console commands use direct output, not Response objects)
- Kernel Architecture (Console kernel vs HTTP kernel class hierarchy)

---


