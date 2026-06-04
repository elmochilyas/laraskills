# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** WeakReferenceApiUsage
**Knowledge Unit:** WeakReferenceApiUsage
**Generated:** 2026-06-04

---

# Quick Checklist

- [ ] Core concepts understood (WeakReference vs WeakMap)
- [ ] Best practices identified
- [ ] Architecture guidelines reviewed
- [ ] Common mistakes prevented
- [ ] Naming conventions followed

---

# Architecture Checklist

- [ ] Responsibilities clearly separated — WeakMap used for caches, not ownership
- [ ] Correct memory layer selected (WeakMap for process-lifetime, array for request-scoped)
- [ ] Dependency boundaries respected — WeakMap injected, not created inline
- [ ] No circular dependencies through weak references
- [ ] Singleton safety verified — WeakMap in singleton holds entries keyed by bounded-lifetime objects

---

# Implementation Checklist

- [ ] WeakMap keys are objects (not scalars — TypeError otherwise)
- [ ] WeakReference::get() null check handled before accessing target
- [ ] `gc_collect_cycles()` used in tests to verify weak reference behavior
- [ ] Non-serializable nature documented — WeakMaps not stored in sessions/caches
- [ ] Destructor hooks implemented for cleanup of non-weak associated data

---

# Performance Checklist

- [ ] Memory profiling performed before introducing weak references
- [ ] Before/after memory comparison documented
- [ ] WeakMap lookups vs array lookups benchmarked for the specific use case
- [ ] Octane worker memory monitored after implementation
- [ ] No unnecessary WeakMap usage in per-request (non-singleton) services

---

# Security Checklist

- [ ] No sensitive data in WeakMap values without access control
- [ ] WeakReference not used for security-sensitive object tracking (may be GC'd)
- [ ] WeakMap value objects do not expose PII or credentials
- [ ] WeakMap access controlled via service encapsulation

---

# Reliability Checklist

- [ ] Failure handling for null WeakReference::get() defined
- [ ] Key object bounded lifetime verified — entries will be evicted
- [ ] Fallback behavior when WeakReference target is GC'd (graceful degradation)
- [ ] Concurrency safety reviewed for Swoole/coroutine environments

---

# Testing Checklist

- [ ] Unit tests verify WeakMap auto-eviction after key goes out of scope
- [ ] `gc_collect_cycles()` forced in tests to trigger collection
- [ ] Null WeakReference::get() path tested (returns null after GC)
- [ ] Singleton WeakMap tested across multiple simulated requests
- [ ] Serialization tests confirm WeakMap not exposed to sessions/caches

---

# Maintainability Checklist

- [ ] Weak reference usage documented with lifetime expectations
- [ ] No unnecessary complexity — weak references solve measured memory issue
- [ ] Code duplication reviewed (centralized WeakMap factory if multiple used)
- [ ] Related rules followed (referenced in 05-rules.md)
- [ ] Related skills followed (referenced in 06-skills.md)

---

# Anti-Pattern Prevention Checklist

- [ ] WeakReference not used as crutch for unclear ownership
- [ ] No global WeakMap registries without bounded key lifetimes
- [ ] WeakMap not used for request-scoped data
- [ ] Profiling performed before applying weak references
- [ ] WeakMaps not stored in sessions, caches, or queue payloads
- [ ] WeakReference not confused with strong reference (preventing GC)
- [ ] WeakMap values not leaking memory (key lifetime management)

---

# Production Readiness Checklist

- [ ] Octane worker memory profiled before deployment
- [ ] Memory monitoring configured for Octane workers
- [ ] Error handling for null WeakReference::get() in production paths
- [ ] Configuration validated — WeakMap used in appropriate scope
- [ ] Rollback strategy considered (remove weak references if memory not improved)

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied (memory improvement confirmed)
- [ ] Testing requirements satisfied (GC behavior tested)
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified (Octane profiling done)
