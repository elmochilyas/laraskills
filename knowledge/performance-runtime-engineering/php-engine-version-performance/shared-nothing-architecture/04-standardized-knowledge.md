# Standardized Knowledge: Shared-Nothing Architecture

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Shared-Nothing Architecture |
| Difficulty | Foundation |
| Lifecycle | Understand, Architect |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP-FPM's shared-nothing architecture creates an isolated process (or request in embedded runtimes) for each HTTP request. Every request boots the framework, loads configuration, establishes database connections, processes the request, and tears down all state. This provides **memory isolation** (no request can corrupt another) at the cost of **per-request bootstrap overhead** (60-80% of fast request time).

## Core Concepts

- **Process-per-request**: Each PHP-FPM worker handles one request, then becomes available for the next.
- **No state sharing**: Class definitions, variables, connections are destroyed when the request ends.
- **Memory isolation**: A crash in one worker never affects other workers or requests.
- **Bootstrap cost**: Every request re-executes autoloading, service container construction, config loading.
- **Framework overhead dominance**: For sub-50ms API requests, bootstrap accounts for 60-80% of total time.

## When To Use

- Multi-tenant hosting environments where request isolation is critical
- Traditional web applications with mixed traffic patterns
- Teams prioritizing simplicity and debugging ease over maximum throughput
- Legacy applications where refactoring for memory-resident architecture is infeasible

## When NOT To Use

- High-throughput API services where sub-10ms latency is required
- Applications where bootstrap overhead dominates response time (>50% of total)
- CPU-heavy endpoints that don't benefit from per-request isolation
- New projects where memory-resident architecture can be designed from the start

## Best Practices (WHY)

- **Understand the tradeoff**: Shared-nothing maximizes safety (no request can corrupt another) at the cost of performance. Choose based on your workload's priority.
- **Optimize within the model**: OpCache tuning, preloading, and Composer optimization reduce bootstrap cost even within the shared-nothing model.
- **Consider Octane for fast endpoints**: If bootstrap is 60-80% of request time, memory-resident architecture provides 3-15x throughput gains.
- **Don't fight the model**: Trying to share state across FPM workers (APCu, shared memory) violates the architecture and introduces subtle bugs.

## Architecture Guidelines

| Aspect | Shared-Nothing (FPM) | Memory-Resident (Octane) |
|--------|---------------------|-------------------------|
| Memory isolation | Complete | Leaked state risks |
| Bootstrap overhead | Every request | Once at worker start |
| Deployment simplicity | Drop-in | Requires code audit |
| Package compatibility | Universal | Some packages break |

## Performance

- Framework bootstrap: 10-40ms per request depending on application size
- For high-throughput APIs (<50ms): Octane/persistent workers provide 3-15x throughput gains
- For slow apps (>500ms): Bootstrap overhead is proportionally small (<10% of total time)
- OpCache and preloading reduce bootstrap cost within the shared-nothing model

## Security

- Complete process isolation prevents data leakage between requests
- A crash in one worker never affects other requests or workers
- Residual memory in a worker process is cleared when the worker is recycled
- No shared state means no cross-request contamination of authentication or session data

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Treating shared-nothing as a performance feature | Confusing safety with speed | Accepting unnecessary latency for fast APIs | Choose memory-resident when bootstrap dominates |
| Trying to share state across workers | Familiarity with stateful languages | Subtle race conditions, hard-to-debug bugs | Use external caches (Redis) for shared state |
| Not optimizing bootstrap | Accepting default performance | 60-80% of response time wasted | Use preloading, OpCache, Composer optimization |
| Migrating to Octane without audit | Assuming "faster is always better" | State leaks, data corruption | Carefully audit static properties first |

## Anti-Patterns

- **Forcing state sharing across FPM workers**: APCu, shared memory, and file-based state sharing violate the shared-nothing model. Use external services (Redis, database) for cross-request state.
- **Using shared-nothing for everything**: High-throughput APIs pay an unnecessary bootstrap tax. Match architecture to workload.
- **Over-isolating**: Not every application needs process-level isolation. For dedicated API servers, memory-resident architecture is safer and faster.

## Examples

```php
<?php
// Shared-nothing model — every request starts fresh
// No state persists between requests
// This is safe but slower for fast endpoints

// Example: Each request loads the framework from scratch
// With OpCache: opcodes are cached, but bootstrap still runs
// With preloading: some classes are pre-loaded, reducing bootstrap time

// To optimize within shared-nothing:
// 1. Enable OpCache with proper memory sizing
// 2. Use preloading for frequently used classes
// 3. Optimize Composer autoloader (--classmap-authoritative)
// 4. Tune OpCache memory and file limits
```

## Related Topics

- Memory-Resident Architecture
- Concurrency Models
- PHP-FPM Process Manager Modes
- Laravel Octane Architecture
- Web Server Architectures

## AI Agent Notes

- Shared-nothing provides complete isolation at the cost of per-request bootstrap overhead.
- Bootstrap accounts for 60-80% of <50ms request time.
- Memory-resident architectures (Octane) eliminate bootstrap cost but introduce state management complexity.
- The choice depends on workload: isolation-sensitive (shared-nothing) vs performance-sensitive (memory-resident).
- OpCache and preloading optimize within the shared-nothing model but don't eliminate the overhead.

## Verification

- [ ] Architecture choice matches workload priority (isolation vs performance)
- [ ] If using shared-nothing: OpCache, preloading, and Composer optimization applied
- [ ] If considering Octane: bootstrap cost measured and confirmed > 20% of request time
- [ ] No cross-request state sharing attempted via APCu or shared memory
- [ ] Understanding of the isolation vs performance tradeoff demonstrated
