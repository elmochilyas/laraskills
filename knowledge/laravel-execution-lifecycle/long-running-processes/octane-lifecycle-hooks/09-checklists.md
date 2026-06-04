# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Octane Lifecycle Hooks
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Register a `tick()` callback and verify it runs at the configured interval
- [ ] Register a `RequestTerminated` listener and verify cleanup executes
- [ ] Test with both warm and cold workers â€” ensure WorkerStarting fires only once
- [ ] Each `tick()` callback is wrapped in try-catch to prevent silent worker death
- [ ] Each `tick()` registration is guarded against duplicate registration
- [ ] `RequestTerminated` listeners complete in under 5ms â€” no queued jobs, HTTP calls, or heavy I/O
- [ ] Wrap Octane::tick() callbacks in try-catch. followed
- [ ] Guard Octane::tick() registration against duplicates. followed
- [ ] Keep RequestTerminated listeners fast and synchronous. followed
- [ ] Never resolve request-scoped services inside tick callbacks. followed
- [ ] Always handle early returns in RequestReceived listeners. followed
- [ ] Test hooks explicitly against the target runtime. followed
- [ ] Wrap tick logic in try-catch applied
- [ ] Guard against duplicate tick registration applied
- [ ] Keep RequestTerminated listeners fast applied
- [ ] Test hooks with both warm and cold workers applied
- [ ] Tick as Cron Replacement prevented
- [ ] Listener That Re-Requests prevented
- [ ] Calling tick() without duplicate guard prevented
- [ ] Using app() in tick context prevented

---

# Architecture Checklist

- [ ] Ticks run in master container architecture followed
- [ ] Ticks are not persisted across restarts architecture followed
- [ ] Events use Laravel's dispatcher architecture followed
- [ ] `$sandbox` passed to terminal events architecture followed

---

# Implementation Checklist

- [ ] Wrap Octane::tick() callbacks in try-catch. followed
- [ ] Guard Octane::tick() registration against duplicates. followed
- [ ] Keep RequestTerminated listeners fast and synchronous. followed
- [ ] Never resolve request-scoped services inside tick callbacks. followed
- [ ] Always handle early returns in RequestReceived listeners. followed
- [ ] Wrap tick logic in try-catch applied
- [ ] Guard against duplicate tick registration applied
- [ ] Keep RequestTerminated listeners fast applied
- [ ] Test hooks with both warm and cold workers applied
- [ ] Calling tick() without duplicate guard prevented
- [ ] Using app() in tick context prevented
- [ ] Storing tick state in static properties prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Tick as Cron Replacement prevented
- [ ] Listener That Re-Requests prevented
- [ ] Tick Mutating Shared State Without Coordination prevented
- [ ] Ignoring Runtime-Specific Behavior prevented
- [ ] Heavy Listeners in RequestTerminated prevented
- [ ] Wrap Octane::tick() callbacks in try-catch. followed
- [ ] Guard Octane::tick() registration against duplicates. followed
- [ ] Keep RequestTerminated listeners fast and synchronous. followed
- [ ] Never resolve request-scoped services inside tick callbacks. followed
- [ ] Always handle early returns in RequestReceived listeners. followed
- [ ] Test hooks explicitly against the target runtime. followed

---

# Testing Checklist

- [ ] Each `tick()` callback is wrapped in try-catch to prevent silent worker death
- [ ] Each `tick()` registration is guarded against duplicate registration
- [ ] `RequestTerminated` listeners complete in under 5ms â€” no queued jobs, HTTP calls, or heavy I/O
- [ ] Tick callbacks never resolve `request()`, `auth()`, or `session()` from master container
- [ ] Register a `tick()` callback and verify it runs at the configured interval
- [ ] Register a `RequestTerminated` listener and verify cleanup executes
- [ ] Test with both warm and cold workers â€” ensure WorkerStarting fires only once
- [ ] Verify that `app()` in tick resolves from master container, not sandbox
- [ ] All known static accumulators are cleared between requests via RequestTerminated
- [ ] Tick-based health metrics report memory, GC roots, and request counts without errors
- [ ] Worker initialization in WorkerStarting completes successfully on cold start
- [ ] No duplicate tick registrations â€” each callback fires exactly once per interval

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Tick as Cron Replacement prevented
- [ ] Listener That Re-Requests prevented
- [ ] Tick Mutating Shared State Without Coordination prevented
- [ ] Ignoring Runtime-Specific Behavior prevented
- [ ] Heavy Listeners in RequestTerminated prevented

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

- octane-architecture-overview (lifecycle context)
- singleton-state-leaks (cleanup via RequestTerminated)
- static-property-accumulation (cleanup via RequestTerminated)
- octane-configuration-and-workers (worker lifecycle interplay)

---


