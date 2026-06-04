# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Octane Architecture Overview
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Understand the one-time boot vs per-request boot distinction
- [ ] Trace the Octane worker boot sequence: worker start â†’ bootstrap â†’ event loop â†’ sandbox â†’ request â†’ flush
- [ ] Identify the three runtime adapters and their concurrency models
- [ ] Every `singleton()` call in application and vendor providers is identified
- [ ] Each singleton is classified as safe or unsafe with documented rationale
- [ ] Dependency graph traced for each singleton â€” no transitive contamination
- [ ] Audit every singleton for mutable state before deploying Octane. followed
- [ ] Use scoped() for all per-request stateful services. followed
- [ ] Set max_requests based on memory profiling, never disable it. followed
- [ ] Test Octane readiness with sequential request sequences. followed
- [ ] Never share Octane workers with Horizon or queue workers. followed
- [ ] Run each Octane runtime's adapter-specific tests. followed
- [ ] Audit all singletons before Octane deployment applied
- [ ] Use `scoped()` for per-request state applied
- [ ] Set `max_requests` based on leak profile applied
- [ ] Test with sequential requests applied
- [ ] Blind Singleton-to-Scoped Conversion prevented
- [ ] Ignoring Static Properties prevented
- [ ] Treating Octane as "drop-in faster Laravel" prevented
- [ ] Registering mutable repositories as singletons prevented

---

# Architecture Checklist

- [ ] Sandbox over clone-and-replace architecture followed
- [ ] Singleton sharing across sandboxes architecture followed
- [ ] `max_requests` recycling architecture followed
- [ ] Separate master/sandbox containers architecture followed
- [ ] One-time boot architecture followed

---

# Implementation Checklist

- [ ] Audit every singleton for mutable state before deploying Octane. followed
- [ ] Use scoped() for all per-request stateful services. followed
- [ ] Set max_requests based on memory profiling, never disable it. followed
- [ ] Test Octane readiness with sequential request sequences. followed
- [ ] Never share Octane workers with Horizon or queue workers. followed
- [ ] Audit all singletons before Octane deployment applied
- [ ] Use `scoped()` for per-request state applied
- [ ] Set `max_requests` based on leak profile applied
- [ ] Test with sequential requests applied
- [ ] Treating Octane as "drop-in faster Laravel" prevented
- [ ] Registering mutable repositories as singletons prevented
- [ ] Using global state expecting per-request isolation prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Blind Singleton-to-Scoped Conversion prevented
- [ ] Ignoring Static Properties prevented
- [ ] No max_requests prevented
- [ ] Sharing Octane Workers with Horizon prevented
- [ ] Treating Octane as "Drop-In Faster Laravel" prevented
- [ ] Audit every singleton for mutable state before deploying Octane. followed
- [ ] Use scoped() for all per-request stateful services. followed
- [ ] Set max_requests based on memory profiling, never disable it. followed
- [ ] Test Octane readiness with sequential request sequences. followed
- [ ] Never share Octane workers with Horizon or queue workers. followed
- [ ] Run each Octane runtime's adapter-specific tests. followed

---

# Testing Checklist

- [ ] Every `singleton()` call in application and vendor providers is identified
- [ ] Each singleton is classified as safe or unsafe with documented rationale
- [ ] Dependency graph traced for each singleton â€” no transitive contamination
- [ ] Remediation plan created with priority based on risk impact
- [ ] Understand the one-time boot vs per-request boot distinction
- [ ] Trace the Octane worker boot sequence: worker start â†’ bootstrap â†’ event loop â†’ sandbox â†’ request â†’ flush
- [ ] Identify the three runtime adapters and their concurrency models
- [ ] Audit at least 5 service providers for singleton state safety
- [ ] All singletons with mutable per-request state are identified and remediated
- [ ] Dependency graph traced for every shared binding â€” no transitive contamination
- [ ] Remediation plan is documented with priority and owner for each fix
- [ ] CI pipeline rejects new singleton() registrations without human review

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Blind Singleton-to-Scoped Conversion prevented
- [ ] Ignoring Static Properties prevented
- [ ] No max_requests prevented
- [ ] Sharing Octane Workers with Horizon prevented
- [ ] Treating Octane as "Drop-In Faster Laravel" prevented

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

- singleton-state-leaks (deep dive on the primary failure mode)
- scoped-bindings-for-octane (the solution to singleton leaks)
- static-property-accumulation (the second major leak vector)
- octane-lifecycle-hooks (tick, RequestTerminated)
- octane-configuration-and-workers (worker tuning details)

---


