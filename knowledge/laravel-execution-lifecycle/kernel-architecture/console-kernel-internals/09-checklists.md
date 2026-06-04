# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Console Kernel Internals
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Read `Illuminate\Foundation\Console\Kernel::handle()` source
- [ ] Trace command registration flow: `$commands` â†’ `commands()` â†’ `load()` â†’ Symfony Application
- [ ] Understand the six bootstrappers and their identical order to HTTP Kernel
- [ ] Command appears in `php artisan list` output
- [ ] Command class is autoloaded correctly (no ReflectionException)
- [ ] Arguments and options from `$signature` are parsed correctly
- [ ] Prefer explicit command registration over auto-discovery in production. followed
- [ ] Always bound long-running commands with --max-jobs and --max-time. followed
- [ ] Do not inject HTTP-specific services into console commands. followed
- [ ] Keep schedule task evaluation fast and idempotent. followed
- [ ] Use ->withoutOverlapping() for all long-running scheduled tasks. followed
- [ ] Prefer ->runInBackground() for non-critical scheduled tasks. followed
- [ ] Use `$commands` array in production applied
- [ ] Set --max-jobs and --max-time for queue workers applied
- [ ] Keep schedule tasks fast applied
- [ ] Avoid HTTP-specific services in commands applied
- [ ] Console Command as Monolith prevented
- [ ] Request-Dependent Command Logic prevented
- [ ] Injecting HTTP-specific services prevented
- [ ] Missing load() calls prevented

---

# Architecture Checklist

- [ ] Symfony Console Foundation architecture followed
- [ ] Separate bootstrap from HTTP architecture followed
- [ ] Schedule as userland code architecture followed
- [ ] Lazy command loading architecture followed

---

# Implementation Checklist

- [ ] Prefer explicit command registration over auto-discovery in production. followed
- [ ] Always bound long-running commands with --max-jobs and --max-time. followed
- [ ] Do not inject HTTP-specific services into console commands. followed
- [ ] Keep schedule task evaluation fast and idempotent. followed
- [ ] Use ->withoutOverlapping() for all long-running scheduled tasks. followed
- [ ] Use `$commands` array in production applied
- [ ] Set --max-jobs and --max-time for queue workers applied
- [ ] Keep schedule tasks fast applied
- [ ] Avoid HTTP-specific services in commands applied
- [ ] Injecting HTTP-specific services prevented
- [ ] Missing load() calls prevented
- [ ] Schedule frequency misunderstanding prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Console Command as Monolith prevented
- [ ] Request-Dependent Command Logic prevented
- [ ] Unbounded Queue Workers prevented
- [ ] Scheduling Overlapping Tasks prevented
- [ ] Auto-Discovery Overhead in Production prevented
- [ ] Prefer explicit command registration over auto-discovery in production. followed
- [ ] Always bound long-running commands with --max-jobs and --max-time. followed
- [ ] Do not inject HTTP-specific services into console commands. followed
- [ ] Keep schedule task evaluation fast and idempotent. followed
- [ ] Use ->withoutOverlapping() for all long-running scheduled tasks. followed
- [ ] Prefer ->runInBackground() for non-critical scheduled tasks. followed

---

# Testing Checklist

- [ ] Command appears in `php artisan list` output
- [ ] Command class is autoloaded correctly (no ReflectionException)
- [ ] Arguments and options from `$signature` are parsed correctly
- [ ] Running with `--help` shows expected usage text
- [ ] Read `Illuminate\Foundation\Console\Kernel::handle()` source
- [ ] Trace command registration flow: `$commands` â†’ `commands()` â†’ `load()` â†’ Symfony Application
- [ ] Understand the six bootstrappers and their identical order to HTTP Kernel
- [ ] Test with `php artisan route:list` (not a route command â€” verify console command listing works)
- [ ] New php artisan commands are discoverable and executable
- [ ] All registration methods produce identical command resolution at runtime
- [ ] Explicit registration is used in production; auto-discovery is avoided
- [ ] Running php artisan list shows all registered commands

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Console Command as Monolith prevented
- [ ] Request-Dependent Command Logic prevented
- [ ] Unbounded Queue Workers prevented
- [ ] Scheduling Overlapping Tasks prevented
- [ ] Auto-Discovery Overhead in Production prevented

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

- **Symfony Console Component** â€” foundation for CLI input parsing, output formatting, and command lifecycle
- **Service Container & Service Providers** â€” how command classes and their dependencies are resolved
- **Kernel Bootstrappers** â€” the six initialization steps shared with the HTTP kernel
- **HTTP Kernel Internals** â€” the HTTP counterpart with shared bootstrapping but request/response focus
- **Task Scheduling Internals** â€” how `schedule()` definitions are parsed and executed by `schedule:run`
- **Queue Worker Lifecycle** â€” how artisan commands like `queue:work` integrate with the console kernel

---


