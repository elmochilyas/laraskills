# Skill: Apply WeakReference to Prevent Memory Leaks from Object Relationships

## Purpose

Use PHP 8.0+'s `WeakReference` API to break circular references and prevent memory leaks in object graphs without sacrificing application logic.

## When To Use

- Objects hold references to each other bidirectionally (parent-child, observer pattern)
- Cache implementations that reference source objects
- Event systems where listeners reference dispatchers
- ORM entity circular references (bidirectional relationships)

## When NOT To Use

- For PHP versions below 8.0 (WeakReference not available)
- When the strong reference should outlive the weak reference (WeakReference target may be GC'd unexpectedly)
- For simple unidirectional relationships where no cycle exists
- Without profiling to confirm that the cycle is causing memory growth

## Prerequisites

- PHP 8.0+ runtime
- Understanding of circular reference formation
- Identification of object cycles in the application

## Inputs

- Object graph with bidirectional references (parent→child and child→parent)
- Code where one side of the relationship should not prevent garbage collection
- GC root buffer size showing accumulating cycles

## Workflow (numbered steps)

1. Identify circular reference patterns: parent→child (strong) and child→parent (candidate for WeakReference)
2. Determine which side of the cycle is the "owner" — the owner holds a strong reference, the dependent uses WeakReference
3. Create the WeakReference: `$weakRef = WeakReference::create($parentObject);`
4. Access the referenced object: `$parent = $weakRef->get();` — returns null if the object was collected
5. Always check for null before using the dereferenced object: `if ($parent = $weakRef->get()) { $parent->doSomething(); }`
6. For collection mapping: use `spl_object_id()` as array keys instead of WeakReference for non-cyclical caches
7. For event listener cleanup: WeakReference in listener to dispatcher allows dispatcher to be GC'd when no other references exist
8. Test: verify the cycle no longer prevents GC — check root buffer size before and after
9. Document the WeakReference usage pattern

## Validation Checklist

- [ ] Circular reference pattern identified
- [ ] Owner-dependent relationship determined
- [ ] WeakReference applied on the non-owner side
- [ ] null check implemented on WeakReference::get()
- [ ] Cycle resolved: root buffer no longer accumulates
- [ ] Edge cases handled (null after collection)
- [ ] Usage documented

## Common Failures

- **WeakReference on the owner side**: The owner (object that creates/manages the dependent) should have the strong reference — making it weak could cause premature collection
- **Not checking for null**: WeakReference::get() can return null at any time — always check before dereferencing
- **Using WeakReference for caching**: WeakReference does not prevent cache entries from being collected under memory pressure — use weak maps (SplObjectStorage) instead
- **Assuming WeakReference prevents all cycles**: WeakReference breaks one direction of the cycle, but the strong reference direction must still be cleaned up

## Decision Points

- Parent-child with parent owning child lifetime: strong from parent→child, WeakReference from child→parent
- Event dispatcher with listeners: strong from dispatcher→listener, WeakReference from listener→dispatcher (if listener needs access to dispatcher)
- ORM bidirectional relation: strong on the side that owns the foreign key, WeakReference on the inverse side
- Cache keyed by object: use spl_object_id() for lookup, not WeakReference

## Performance Considerations

- WeakReference::create(): ~10ns
- WeakReference::get(): ~5ns
- null check: negligible
- Memory saved from breaking cycles: 1-100MB depending on object graph size
- No additional memory allocation for WeakReference (it is a lightweight wrapper)

## Security Considerations

- WeakReference can cause null pointer dereferences if not handled — always check ::get() result
- Objects may be collected while still needed if the weak reference is the only remaining reference
- Debugging null dereferences from WeakReference is difficult — thoroughly test all access paths

## Related Rules (from 05-rules.md)

- Use WeakReference for Optional Parent References
- Never Trust WeakReference::get() Without Null Check
- Use WeakReference for Observer Pattern to Prevent Leaks

## Related Skills

- Circular Reference Detection and Resolution
- GC Algorithm and Cycle Collection
- Memory Leak Detection Patterns

## Success Criteria

- Circular references resolved using WeakReference
- null checks implemented for all WeakReference accesses
- GC root buffer stabilized (no accumulation from the resolved cycles)
- Pattern documented for team
