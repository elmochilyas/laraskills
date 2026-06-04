# Skill: Design and Manage Object Reference Trees for Memory Efficiency

## Purpose

Design object graphs that minimize GC scanning cost, prevent memory leaks in persistent runtimes, and enable efficient serialization by controlling reference tree depth and using WeakReference patterns.

## When To Use

- Designing domain models with complex relationships
- Profiling shows high root buffer entries in `gc_status()`
- Migrating from FPM to Octane — reference cleanup is essential
- Serialization or caching of large object graphs is slow
- Code review reveals circular references between entities

## When NOT To Use

- Simple CRUD with shallow object graphs
- PHP-FPM request-scoped code where all references are freed at request end
- Value objects with no identity (they are compared by value, not reference)

## Prerequisites

- Understanding of object references, refcount, and GC root buffer
- Profiling output showing GC overhead
- PHP 7.4+ for WeakReference support
- Familiarity with the application's domain model and entity relationships

## Inputs

- Entity relationship diagram or codebase object graph
- GC status metrics (`gc_status()`, `roots`, `collected`)
- Serialization performance measurements
- Octane worker RSS trend data

## Workflow (numbered steps)

1. Map the object reference tree: identify all classes that hold references to other classes. Mark circular references and deep (> 5 level) chains.
2. Measure current GC impact: run `gc_status()` at the end of a representative request. Note `roots` and `collected`. A root count > 5000 with low collection ratio indicates a tree problem.
3. For each circular reference: determine which side of the cycle can use `WeakReference`. Typically the "parent" or "owner" side holds a strong reference; the "child" or "observer" side uses WeakReference.
4. For deep reference trees (> 5 levels): design intermediate DTOs that flatten the data. Create a `fromModel()` factory on the DTO that extracts only the needed fields.
5. For cross-layer boundaries (Repository → Controller, Service → API Resource): enforce DTO return types. No Eloquent models should cross layer boundaries.
6. For Octane workers: add a `RequestHandled` listener that nullifies any per-request object references held by singletons or long-lived services.
7. Verify the fix: re-profile `gc_status()`. Root buffer count should decrease by at least 30%. GC scanning time should reduce proportionally.
8. Run a stress test in Octane: 10,000 requests per worker. Verify worker RSS stays within 10% of baseline.
9. Document the reference tree design: which references are strong, which are WeakReference, and where layer boundaries enforce DTO conversion.

## Validation Checklist

- [ ] Reference tree depth mapped for all major entity graphs
- [ ] Circular references broken with WeakReference on the appropriate side
- [ ] Deep trees (> 5 levels) replaced with flat DTOs
- [ ] Cross-layer boundaries enforce DTO returns, not entity references
- [ ] Octane workers clear per-request references after each request
- [ ] GC root buffer count reduced by > 30%
- [ ] Octane stress test shows stable RSS over 10,000 requests per worker

## Common Failures

- **Using WeakReference on the wrong side**: If the owner uses WeakReference, the child may be freed while still needed. The dependent/observer side should use WeakReference.
- **DTOs with nested objects**: A DTO containing another DTO is still a reference tree. Flatten completely or serialize all data into scalar fields.
- **Not verifying in Octane**: A fix that looks correct in FPM may still hold references in Octane because the service container does not reset between requests.
- **Over-engineering simple trees**: Not every bidirectional relationship needs WeakReference. In FPM, the request ends quickly — the cycle is harmless.

## Decision Points

- Tree depth ≤ 3 layers → No action needed
- Tree depth 4-5 layers → Consider DTO at critical boundaries
- Tree depth > 5 layers → Must flatten. Use DTOs throughout.
- Circular reference in FPM → Acceptable unless root buffer > 5000
- Circular reference in Octane → Must use WeakReference on one side
- Cross-layer entity return → Replace with DTO
- Octane singleton holding per-request reference → Add cleanup in RequestHandled listener

## Performance Considerations

- WeakReference creation: ~100ns. Resolution: ~50ns. These are negligible — the savings from breaking cycles far outweighs the cost.
- DTO flattening: Each DTO construction copies data from the entity. For 100 entities with 10 fields each, ~10µs — far less than GC overhead from the equivalent reference tree.
- GC root buffer entry per circular reference: ~72 bytes. 10,000 circular references = 720KB in the root buffer that must be scanned every GC cycle.
- Serialization of deep trees: O(n × depth). Deep trees serialize slower because each level requires additional pointer chasing and refcount checks.

## Security Considerations

- WeakReference returning null: code that holds a WeakReference must handle the case where `->get()` returns null — the referenced object was freed. This is a feature, not a bug.
- Cross-request reference leaks in Octane can expose sensitive data from previous requests. Exhaustive cleanup is a security requirement in persistent runtimes.
- Deserialization of object graphs from user input is a known security vulnerability. Always validate and limit the depth of deserialized reference trees.

## Related Rules (from 05-rules.md)

- Keep object reference trees shallower than 5 levels
- Use WeakReference to break intentional circular references
- Return DTOs instead of entity objects across layer boundaries
- Nullify object references explicitly in Octane workers

## Related Skills

- WeakReference API Usage
- Octane Memory Management
- DTO and Value Object Design
- GC Telemetry and Root Buffer Monitoring

## Success Criteria

- All object reference trees shallower than 5 levels
- Circular references in Octane resolved with WeakReference
- DTOs used across all layer boundaries
- GC root buffer < 2000 entries in Octane workers
- Worker RSS stable (within 10%) over 10,000 requests
