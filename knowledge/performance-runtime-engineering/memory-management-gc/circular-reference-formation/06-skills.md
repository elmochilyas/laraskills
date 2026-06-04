# Skill: Prevent Circular Reference Formation in Object Graphs

## Purpose

Design object relationships to avoid creating circular references that prevent garbage collection of otherwise unused object graphs.

## When To Use

- Designing entity relationships in ORM models
- Implementing observer or event patterns
- Building tree or graph data structures
- Auditing existing code for cycle-prone patterns

## When NOT To Use

- For simple unidirectional relationships
- When all objects are short-lived and destroyed at request end (PHP-FPM)
- Without confirming that cycles are causing memory growth

## Prerequisites

- Understanding of how circular references form (A references B, B references A)
- Knowledge of GC cycle collection mechanism
- Profiling showing GC root buffer growth from cycles

## Inputs

- Object relationship design (UML, entity relationship diagram)
- Code with bidirectional references (parent-child, subject-observer)
- GC telemetry showing accumulating cycles

## Workflow (numbered steps)

1. Map all bidirectional object relationships in the application
2. For each bidirectional relationship, designate one side as the "owner" (controls lifetime)
3. On the non-owner side, use a weak reference (WeakReference) or a simple ID-based lookup instead of a direct object reference
4. For observer patterns: have the subject maintain a list of weak references to observers, not strong references
5. For tree structures: parent holds strong references to children; children hold WeakReference (or parent ID) back to parent
6. For ORM bidirectional relations: the owning side (with foreign key) holds the strong reference; the inverse side uses a lazy lookup
7. For callback closures: avoid `$this` capture in closures that are stored as class properties (creates $this→closure→$this cycle)
8. After restructuring, verify GC root buffer no longer accumulates from the resolved cycles
9. Document the relationship design rules for the team

## Validation Checklist

- [ ] All bidirectional object relationships mapped
- [ ] Owner-dependent relationship clarified for each cycle
- [ ] WeakReference or ID-based lookup used on non-owner side
- [ ] Observer pattern uses weak references
- [ ] Tree structures use weak parent references
- [ ] ORM bidirectional relations structured correctly
- [ ] Closure $this capture cycles eliminated
- [ ] GC root buffer stabilized
- [ ] Relationship design rules documented

## Common Failures

- **Cycles through closures**: `$this->callback = function() use ($this) { ... }` creates $this→callback→$this cycle
- **Event listener holding dispatcher reference**: Dispatcher holds strong listener ref; listener holds strong dispatcher ref → cycle
- **ORM inverse side always loaded**: Loading the inverse side creates an object reference (not lazy, not weak)
- **Ignoring self-referencing relationships**: An object referencing itself (direct property) is also a cycle

## Decision Points

- Bidirectional entity: owner side = strong, inverse side = weak or ID lookup
- Observer/subject: subject = strong to observers, observer = weak to subject
- Tree: parent = strong to children, child = weak to parent
- Closure stored as property: avoid `$this` capture, use `use (&$self)` or extract needed properties
- Cache with object keys: use spl_object_id() or WeakReference, never strong object references

## Performance Considerations

- WeakReference creation: ~10ns
- ID-based lookup: requires query/map lookup (1-100µs) but avoids cycle
- Lazy loading proxy: adds ~200ns per access
- GC collection of cycles: 1-50ms per collection — avoiding cycles prevents this cost
- Object graph with strong cycles: memory cannot be reclaimed until all external references are released

## Security Considerations

- Circular references themselves are not security issues
- ID-based lookups (instead of direct references) may introduce TOCTOU (time-of-check-time-of-use) issues
- WeakReference null pointer: must always check before dereferencing

## Related Rules (from 05-rules.md)

- Use WeakReference for Optional Parent References
- Use WeakReference for Observer Pattern to Prevent Leaks
- Never Trust WeakReference::get() Without Null Check

## Related Skills

- WeakReference API Usage
- GC Algorithm and Cycle Collection
- Memory Leak Detection Patterns
- Reference Counting and Refcount Lifecycle

## Success Criteria

- Circular reference formation prevented at design level
- All bidirectional relationships mapped and structured correctly
- GC root buffer shows no accumulation from resolved cycles
- Relationship design rules documented and enforced in code reviews
