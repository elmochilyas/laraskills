# Skill: Apply Weak Reference API in Laravel

## Purpose
Use PHP's `WeakReference` and `WeakMap` to manage object-keyed caches and registries in long-running Laravel processes without memory leaks.

## When To Use
- Debugging memory growth in Laravel Octane workers or queue workers
- Caching computed data keyed by model instances across requests
- Managing event listener registries that accumulate over process lifetime
- Implementing lazy proxy patterns without preventing GC

## When NOT To Use
- Short-lived PHP-FPM requests (memory is freed at request end)
- Cross-request caching (use Laravel Cache)
- Simple array-based caches that are manually cleared

## Prerequisites
- PHP 8.0+ (WeakMap) or PHP 7.4+ (WeakReference)
- Understanding of PHP object references and garbage collection
- Familiarity with Laravel Octane or queue worker lifecycle
- Memory profiling tools (Blackfire, Tideways, or basic memory_get_usage)

## Inputs
- Memory profiling data showing which objects accumulate
- Candidate cache or registry that holds object-keyed data
- Long-running process environment (Octane, queue worker, Swoole)

## Workflow
1. **Profile memory usage.** Measure baseline memory consumption in the target process. Use `memory_get_usage()`, Laravel's debug toolbar, or dedicated profiling tools. Identify which caches or registries hold references to objects across requests/jobs.

2. **Identify candidate objects.** Determine which objects accumulate and what references anchor them. Look for array-keyed caches in singleton services, listener registries, and model caches.

3. **Choose the right construct.** Use `WeakMap` when you need to associate values with object keys (auto-eviction). Use `WeakReference` when you need to optionally hold a reference to a single object without preventing GC.

4. **Replace strong references.** In the identified cache or registry, replace `array` or `SplObjectStorage` with `WeakMap`. For single-object references, replace the strong property with `WeakReference`.

5. **Guard null returns.** Add null checks after `WeakReference::get()` calls. Handle the null case with a fallback (recompute, throw, or return default).

6. **Test eviction behavior.** Write tests that create objects, populate the WeakMap, release strong references, force GC with `gc_collect_cycles()`, and verify automatic eviction.

7. **Validate memory improvement.** Re-profile after implementation. Compare peak memory usage and memory growth rate across multiple requests/jobs.

8. **Document weak reference usage.** Add inline comments explaining why weak references are used. Document the expected lifetime of key objects.

## Validation Checklist
- [ ] Memory profiling performed before implementation
- [ ] WeakMap used for object-keyed caches (not WeakReference for caches)
- [ ] WeakReference::get() guarded against null
- [ ] WeakMap/WeakReference never serialized
- [ ] Tests force GC with gc_collect_cycles() for eviction assertions
- [ ] Values stored in WeakMap are memory-conscious (not leaking large objects)
- [ ] Memory improvement measured and documented
- [ ] WeakMap injected as dependency (not created inline in singleton)
- [ ] No WeakMap used for short-lived request-scoped data (over-engineering)
- [ ] Inline comments explain why weak references are needed

## Common Failures
- **Object not collected.** Strong reference held elsewhere in the service container. Verify no other service holds the key object.
- **Premature null.** Object collected earlier than expected. Review the strong reference ownership chain.
- **No memory improvement.** Weak references applied to wrong cache. Profile more precisely to identify the actual accumulating objects.
- **Serialization errors.** WeakMap accidentally stored in session or cache. Use for process-memory only.

## Decision Points
- **WeakMap vs WeakReference?** Use WeakMap when you need key-value storage with auto-eviction. Use WeakReference when you need a single nullable object pointer.
- **WeakMap vs SplObjectStorage?** Use WeakMap (PHP 8.0+) when auto-eviction is desired. Use SplObjectStorage when you need manual control over removal or need iteration with attached data.
- **WeakMap vs array with spl_object_id()?** Use WeakMap when auto-eviction is needed. Use array with spl_object_id() when you need serializable keys or cross-request persistence.

## Related Rules
- Rule: Use WeakMap for Object-Keyed Caches (05-rules.md)
- Rule: Force GC in Tests (05-rules.md)
- Rule: No WeakRef Serialization (05-rules.md)
- Rule: Guard Null from WeakReference::get() (05-rules.md)

## Related Skills
- Debug Memory Leaks in Laravel Octane
- Profile PHP Memory Usage
- Write Long-Running Queue Workers

## Success Criteria
Memory profiling identifies an accumulating cache or registry. The strong reference container is replaced with WeakMap or WeakReference. Tests verify automatic eviction with forced GC. Re-profiling shows reduced or eliminated memory growth. Null guards prevent runtime errors.
