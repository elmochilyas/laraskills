# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Queue Worker Lifecycle
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Start a queue worker with `--max-jobs=10` and verify it stops after 10 jobs
- [ ] Register a `Queue::looping()` callback and verify it runs between jobs
- [ ] Create a job that stores state in a singleton â€” verify leak across jobs
- [ ] `--max-jobs` or `horizon.maxJobs` configured and enforced â€” workers recycle after job limit
- [ ] `Queue::looping()` callback registered and guarded with `app()->runningInConsole()`
- [ ] Job constructors do not resolve Eloquent models, auth, or session â€” only primitive IDs
- [ ] Always set --max-jobs or Horizon maxJobs. followed
- [ ] Register a Queue::looping() callback for state reset. followed
- [ ] Load dependencies in handle(), not the constructor. followed
- [ ] Guard Queue::looping() against non-queue contexts. followed
- [ ] Avoid storing mutable state on $this in job classes. followed
- [ ] Always set `--max-jobs` or configure Horizon `maxJobs` applied
- [ ] Treat every job as if in a fresh process applied
- [ ] Register `Queue::looping()` for state reset applied
- [ ] Avoid resolving singletons in the job constructor applied
- [ ] Unbounded Queue Workers prevented
- [ ] Job Constructor Injection of Request-Scoped Services prevented
- [ ] Assuming Eloquent models in constructors are fresh prevented
- [ ] Registering Queue::looping() without context check prevented

---

# Architecture Checklist

- [ ] No sandbox in queue workers architecture followed
- [ ] `Queue::looping()` as sole reset hook architecture followed
- [ ] Job instances are fresh per execution architecture followed
- [ ] Container singletons persist architecture followed

---

# Implementation Checklist

- [ ] Always set --max-jobs or Horizon maxJobs. followed
- [ ] Register a Queue::looping() callback for state reset. followed
- [ ] Load dependencies in handle(), not the constructor. followed
- [ ] Guard Queue::looping() against non-queue contexts. followed
- [ ] Avoid storing mutable state on $this in job classes. followed
- [ ] Always set `--max-jobs` or configure Horizon `maxJobs` applied
- [ ] Treat every job as if in a fresh process applied
- [ ] Register `Queue::looping()` for state reset applied
- [ ] Avoid resolving singletons in the job constructor applied
- [ ] Assuming Eloquent models in constructors are fresh prevented
- [ ] Registering Queue::looping() without context check prevented
- [ ] Storing state on $this in job prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Unbounded Queue Workers prevented
- [ ] Job Constructor Injection of Request-Scoped Services prevented
- [ ] Singleton-as-Cache in Job Classes prevented
- [ ] Over-Reliance on Horizon Defaults prevented
- [ ] Storing State on $this in Job prevented
- [ ] Always set --max-jobs or Horizon maxJobs. followed
- [ ] Register a Queue::looping() callback for state reset. followed
- [ ] Load dependencies in handle(), not the constructor. followed
- [ ] Guard Queue::looping() against non-queue contexts. followed
- [ ] Avoid storing mutable state on $this in job classes. followed

---

# Testing Checklist

- [ ] `--max-jobs` or `horizon.maxJobs` configured and enforced â€” workers recycle after job limit
- [ ] `Queue::looping()` callback registered and guarded with `app()->runningInConsole()`
- [ ] Job constructors do not resolve Eloquent models, auth, or session â€” only primitive IDs
- [ ] No mutable `$this` properties in job classes that persist across retry attempts
- [ ] Start a queue worker with `--max-jobs=10` and verify it stops after 10 jobs
- [ ] Register a `Queue::looping()` callback and verify it runs between jobs
- [ ] Create a job that stores state in a singleton â€” verify leak across jobs
- [ ] Fix the leak using Queue::looping() reset
- [ ] Queue workers consistently restart after --max-jobs without OOM crashes
- [ ] Queue::looping() resets auth guards, string caches, and static registries â€” no cross-job data contamination
- [ ] Job classes load all dependencies fresh in handle() and use only primitive IDs in constructors
- [ ] No mutable state on $this across job retry attempts â€” retry logic works correctly

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Unbounded Queue Workers prevented
- [ ] Job Constructor Injection of Request-Scoped Services prevented
- [ ] Singleton-as-Cache in Job Classes prevented
- [ ] Over-Reliance on Horizon Defaults prevented
- [ ] Storing State on $this in Job prevented

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

- singleton-state-leaks (state leak patterns apply to queue workers)
- static-property-accumulation (accumulation in queue workers)
- scoped-bindings-for-octane (scoped bindings behave differently in queue workers vs Octane)
- octane-lifecycle-hooks (RequestTerminated vs Queue::looping() parallels)
- memory-profiling-and-observability (profiling queue workers)

---


