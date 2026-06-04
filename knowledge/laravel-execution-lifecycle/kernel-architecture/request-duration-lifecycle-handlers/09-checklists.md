# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Kernel Architecture
**Knowledge Unit:** Request Duration Lifecycle Handlers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Register a duration handler with `->whenRequestLifecycleIsLongerThan(0, ...)` (triggers on every request)
- [ ] Verify handler fires after response is sent
- [ ] Measure the difference between microtime at handle start and terminate
- [ ] Handlers registered in `boot()` method, not `register()`
- [ ] Handler callbacks wrapped in try-catch â€” no uncaught exceptions can propagate
- [ ] Multiple thresholds used â€” at least info/warning/critical levels
- [ ] Always wrap handler logic in try-catch blocks. followed
- [ ] Register duration handlers in the boot() method, not register(). followed
- [ ] Use multiple thresholds for graduated severity levels instead of a single threshold. followed
- [ ] Calibrate thresholds from real traffic data â€” start high, lower incrementally. followed
- [ ] Do not log full request or response objects in duration handlers. followed
- [ ] Guard against handler recursion when handlers trigger their own requests. followed
- [ ] Wrap handler logic in try-catch applied
- [ ] Keep handlers lightweight applied
- [ ] Use multiple thresholds for severity tiers applied
- [ ] Start with high thresholds applied
- [ ] Single Global Threshold prevented
- [ ] Handler That Triggers Another Monitored Request prevented
- [ ] Throwing exceptions in handlers prevented
- [ ] Heavy work in handlers prevented

---

# Architecture Checklist

- [ ] Terminate-Phase over Events architecture followed
- [ ] Both Kernels architecture followed
- [ ] No Default Handlers architecture followed
- [ ] Simple Registration API architecture followed

---

# Implementation Checklist

- [ ] Always wrap handler logic in try-catch blocks. followed
- [ ] Register duration handlers in the boot() method, not register(). followed
- [ ] Use multiple thresholds for graduated severity levels instead of a single threshold. followed
- [ ] Calibrate thresholds from real traffic data â€” start high, lower incrementally. followed
- [ ] Do not log full request or response objects in duration handlers. followed
- [ ] Wrap handler logic in try-catch applied
- [ ] Keep handlers lightweight applied
- [ ] Use multiple thresholds for severity tiers applied
- [ ] Start with high thresholds applied
- [ ] Throwing exceptions in handlers prevented
- [ ] Heavy work in handlers prevented
- [ ] Registering in wrong location prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Single Global Threshold prevented
- [ ] Handler That Triggers Another Monitored Request prevented
- [ ] Logging Full Request Objects prevented
- [ ] Throwing Exceptions in Handlers prevented
- [ ] Disabling Handlers Instead of Tuning Thresholds prevented
- [ ] Always wrap handler logic in try-catch blocks. followed
- [ ] Register duration handlers in the boot() method, not register(). followed
- [ ] Use multiple thresholds for graduated severity levels instead of a single threshold. followed
- [ ] Calibrate thresholds from real traffic data â€” start high, lower incrementally. followed
- [ ] Do not log full request or response objects in duration handlers. followed
- [ ] Guard against handler recursion when handlers trigger their own requests. followed

---

# Testing Checklist

- [ ] Handlers registered in `boot()` method, not `register()`
- [ ] Handler callbacks wrapped in try-catch â€” no uncaught exceptions can propagate
- [ ] Multiple thresholds used â€” at least info/warning/critical levels
- [ ] Only safe diagnostic fields extracted â€” no full request/response objects logged
- [ ] Register a duration handler with `->whenRequestLifecycleIsLongerThan(0, ...)` (triggers on every request)
- [ ] Verify handler fires after response is sent
- [ ] Measure the difference between microtime at handle start and terminate
- [ ] Test with both HTTP and Console kernels
- [ ] At least two graduated thresholds registered (e.g., 500ms warning + 5000ms critical)
- [ ] Slow requests appear in the dedicated log channel with safe diagnostic fields
- [ ] Handler exceptions never crash the PHP process
- [ ] No sensitive data (passwords, tokens, PII) appears in slow request logs

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Single Global Threshold prevented
- [ ] Handler That Triggers Another Monitored Request prevented
- [ ] Logging Full Request Objects prevented
- [ ] Throwing Exceptions in Handlers prevented
- [ ] Disabling Handlers Instead of Tuning Thresholds prevented

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

- **HTTP Kernel Internals** â€” understanding the `handle()` â†’ `terminate()` lifecycle where handlers execute
- **Console Kernel Internals** â€” the console kernel's equivalent lifecycle for CLI command duration monitoring
- **PHP microtime() Precision** â€” platform-aware timing for reliable threshold measurement
- **Middleware Terminable Interface** â€” how `TerminableMiddleware` also runs in the terminate phase
- **Laravel Pulse** â€” first-party package using duration handlers for performance metrics
- **Performance Monitoring** â€” broader observability strategies including logging, APM integration, and profiling

---


