# Skill: Identify and Resolve Circular Reference Cycles

## Purpose

Detect circular references in PHP data structures and resolve them using WeakReference or explicit cycle-breaking patterns to enable proper garbage collection.

## When To Use

- Memory usage grows monotonically in long-running workers (Octane, Swoole)
- Debugging shows cyclic references in object graphs (parent-child, observer pattern)
- Profiling shows GC root buffer growing without bound
- Memory leaks are suspected in code that creates bidirectional relationships

## When NOT To Use

- For PHP-FPM workers that recycle after each request (cycles are cleaned on process end)
- When memory growth is from non-cyclic sources (unset variables, singletons)
- Without first confirming cyclic references exist

## Prerequisites

- Understanding of circular reference formation (parent-child, observer, self-referencing)
- Profiling tool to monitor GC activity and root buffer size
- Access to garbage collector telemetry: `gc_status()`

## Inputs

- Code that creates bidirectional relationships (ORM entities, tree structures, event systems)
- GC root buffer size from `gc_status()['root_buffer_length']`
- Memory growth trend in long-running workers

## Workflow (numbered steps)

1. Monitor GC status in a long-running process: `gc_status()['root_buffer_length']` growing indicates cyclic references accumulating
2. Identify code patterns that create cycles: parent-child relationships, event listeners holding references to dispatchers, observer pattern
3. For each cycle, determine if the relationship is necessary for the application logic
4. For unnecessary cycles: restructure to use unidirectional references where possible
5. For necessary cycles: implement explicit cycle-breaking using unset() or null assignments at appropriate lifecycle points
6. For PHP 8.0+: use `WeakReference` for one side of the cycle (e.g., child references parent weakly)
7. Allow GC to collect cycles: call `gc_collect_cycles()` strategically after batch operations that create cycles
8. Verify fix: monitor root_buffer_length over time — should stabilize instead of growing
9. Document the cycle resolution pattern for each affected component

## Validation Checklist

- [ ] GC root buffer monitored and found growing
- [ ] Cyclic reference patterns identified in code
- [ ] Unnecessary cycles eliminated
- [ ] WeakReference applied for necessary cycles (PHP 8.0+)
- [ ] Explicit cycle-breaking implemented where WeakReference not possible
- [ ] GC collected strategically after batch operations
- [ ] Root buffer size stabilized over 24 hours
- [ ] Patterns documented

## Common Failures

- **Assuming all memory leaks are from cycles**: Singleton abuse and unclosed resources are more common causes
- **Using WeakReference incorrectly**: WeakReference does not prevent the referenced object from being destroyed — ensure the strong reference outlives the weak reference
- **Not verifying the fix**: Memory may stop growing for other reasons — verify root buffer length specifically
- **Forgetting that GC runs automatically**: Explicit gc_collect_cycles() is rarely needed — only when you need immediate cleanup

## Decision Points

- Bidirectional object relationship without lifecycle management: restructure or add WeakReference
- Event listener that holds reference to dispatcher: use WeakReference for the dispatcher reference
- Tree structure with parent pointer: parent pointer can be WeakReference if tree is always accessed from root
- Cached computation results referencing source objects: clear cache references when source objects are no longer needed

## Performance Considerations

- GC cycle collection runs automatically when root buffer reaches threshold (default 10000)
- Full GC collection: 1-50ms depending on object graph size
- Each cycle created adds to the root buffer — buffer growth increases GC time
- WeakReference overhead: minimal (~5ns for creation, ~10ns for read)

## Security Considerations

- Memory leaks from unresolved cycles in Octane can cause OOM — affects service availability
- WeakReference can cause unexpected null dereferences if not handled properly
- No direct security vulnerability from cycles themselves

## Related Rules (from 05-rules.md)

- Use WeakReference for Optional Parent References
- Call gc_collect_cycles() Strategically After Batch Operations
- Monitor GC Root Buffer in Long-Running Workers

## Related Skills

- GC Algorithm and Cycle Collection
- WeakReference API Usage
- Memory Leak Detection Patterns
- GC Telemetry and Root Buffer

## Success Criteria

- Cyclic references identified and resolved
- Root buffer size stabilized over 24-hour observation
- WeakReference or explicit breaking applied appropriately
- Memory leak from cycles eliminated
