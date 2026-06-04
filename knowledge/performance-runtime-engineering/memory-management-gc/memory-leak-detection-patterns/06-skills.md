# Skill: Detect and Fix Common PHP Memory Leak Patterns

## Purpose

Identify the seven most common PHP memory leak patterns (static properties, singletons, closures, listeners, circular references, connection leaks, file handles) and fix each one.

## When To Use

- Memory usage grows monotonically in long-running workers
- Debugging memory leaks identified through monitoring
- Auditing codebase for Octane/Swoole readiness
- Training developers on memory leak prevention

## When NOT To Use

- For PHP-FPM where leaks reset per request
- When memory growth is from expected sources (caches, warm-up)
- Without first confirming a leak exists via monitoring

## Prerequisites

- Memory monitoring in production or staging
- Understanding of common leak sources
- Access to the codebase for fixes

## Inputs

- Codebase to audit
- Memory growth trend data
- GC telemetry (gc_status)
- Static property grep results

## Workflow (numbered steps)

1. Scan for static properties: `grep -rn "static \$" app/ --include="*.php"` — each static property is a potential leak vector
2. Scan for singleton registries: classes that accumulate data in static arrays (event listeners, middleware registries)
3. Scan for closures that capture large scopes: closures defined inside loops or request handlers that capture `$this` or large variables
4. Scan for event listeners registered per-request (hook into a framework's event system from within a controller)
5. Scan for circular references: parent-child relationships where both sides hold strong references
6. Scan for unclosed resources: fopen(), mysql_connect(), curl_init() without corresponding fclose(), mysql_close(), curl_close()
7. Scan for growing caches: in-memory caches (static arrays, APCu) that never expire entries
8. For each pattern found, implement the fix based on the specific cause
9. Verify the fix with a 4-hour memory growth test
10. Document the patterns found and fixes applied

## Validation Checklist

- [ ] Static properties audited and refactored where needed
- [ ] Singleton registries checked for unbounded growth
- [ ] Closure scopes reviewed for unnecessary captures
- [ ] Event listener registrations moved to boot-time only
- [ ] Circular references resolved with WeakReference or unset
- [ ] All resources explicitly closed
- [ ] In-memory caches have size limits or TTL
- [ ] 4-hour memory test passed
- [ ] Patterns documented for team training

## Common Failures

- **Fixing one pattern while others remain**: Memory leaks often come from multiple sources — address all patterns
- **Assuming max_requests is sufficient**: Recycling masks the symptom but does not fix the leak — memory may grow faster than recycling frequency
- **Not testing after fixes**: Always verify with a 4-hour soak test that memory has stabilized
- **Introducing new leaks while fixing old ones**: Audit the fix itself for new static or singleton patterns

## Decision Points

- Static property holding data across requests: convert to instance property or remove
- Singleton registry growing unbounded: add size limit, TTL, or switch to WeakReference
- Closure capturing large scope: pass only the needed variables explicitly
- Per-request listener registration: move to service provider boot() or Octane::booted()
- Circular reference: add WeakReference on one side or unset during cleanup
- Resource not closed: add try/finally or use destructor

## Performance Considerations

- Each leak pattern has different memory cost:
  - Static array accumulating data: O(n) over worker lifetime — can reach GBs
  - Listener leak: O(listeners × events) — thousands of handlers = MBs
  - Closure scope capture: O(captured variables) — typically KBs per leak
  - Resource leak: O(handles) — limited by OS but degrades system performance

## Security Considerations

- Memory leaks can cause OOM — denial of service for the application
- State leaks from singletons/statics can expose data between users (security incident)
- Resource leaks (unclosed connections) can exhaust database connection pools
- All memory leaks in Octane should be treated as potential security issues

## Related Rules (from 05-rules.md)

- Never Use Static Properties for Request-Scoped Data
- Set max_requests to 500-1000
- Use Octane::booted() for Per-Worker Initialization
- Always Audit Service Providers Before Octane Deployment

## Related Skills

- PHP Memory Model
- GC Telemetry and Root Buffer
- Circular Reference Detection
- Octane Memory Management

## Success Criteria

- All seven leak patterns audited across the codebase
- Each identified leak fixed with appropriate mitigation
- 4-hour memory test confirms stable RSS
- Patterns documented for ongoing development standards
