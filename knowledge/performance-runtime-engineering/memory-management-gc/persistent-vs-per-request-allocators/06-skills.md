# Skill: Understand and Apply Persistent vs Per-Request Memory Allocation

## Purpose

Distinguish between PHP's persistent (cross-request) and per-request memory allocators and use them correctly for optimal memory management in different runtime models.

## When To Use

- Configuring preloading or interned strings (persistent allocation)
- Running Octane/Swoole where per-request cleanup is manual
- Understanding why certain data survives opcache_reset()
- Debugging memory growth in long-running processes

## When NOT To Use

- For typical PHP-FPM where per-request heap destruction is automatic
- When not working with memory-resident runtimes
- Without understanding the Zend MM heap lifecycle

## Prerequisites

- Understanding of PHP-FPM's per-request heap destruction
- Familiarity with Octane/Swoole persistent worker model
- Knowledge of GC_IMMUTABLE and GC_PERSISTENT flags

## Inputs

- Runtime type (PHP-FPM vs Octane vs Swoole)
- Current memory configuration (preloading, interned strings)
- Worker recycling (max_requests) configuration

## Workflow (numbered steps)

1. Identify the runtime model: PHP-FPM (per-request heap), Octane (persistent heap with sandbox), CLI (single heap)
2. For PHP-FPM: memory allocated during a request is freed automatically when the request ends — no manual cleanup needed
3. For Octane: memory allocated on the persistent heap accumulates across requests — explicit unset() and worker recycling are required
4. For preloaded classes: allocated with GC_PERSISTENT flag — never freed, survive opcache_reset()
5. For interned strings: allocated with GC_IMMUTABLE flag — stored in shared interned strings table, never freed
6. For OpCache shared memory: allocated at PHP-FPM startup — persists across all requests, never released
7. For per-request data in Octane: ensure services use scoped() bindings (new instance per request), not singleton()
8. Document the allocation model relevant to the runtime and its memory management implications

## Validation Checklist

- [ ] Runtime model identified (FPM vs Octane vs CLI)
- [ ] Persistent allocation sources identified (preloading, interned strings, OpCache)
- [ ] Per-request vs persistent distinction understood
- [ ] Octane: scoped() bindings used, unset() applied for large data
- [ ] Persistent data confirmed independent of opcache_reset()
- [ ] Allocation model documented

## Common Failures

- **Assuming OpCache reset clears everything**: Preloaded classes and interned strings survive opcache_reset()
- **Treating Octane like FPM**: In Octane, memory is NOT freed between requests — requires explicit management
- **Understanding GC_PERSISTENT vs GC_IMMUTABLE**: Both prevent collection — GC_PERSISTENT is for preloaded, GC_IMMUTABLE for interned strings
- **Not accounting for persistent memory in capacity planning**: Preloading and interned strings consume memory permanently

## Decision Points

- Data that should live across all requests: preloaded classes, interned strings, OpCache
- Data that should be fresh per request: user sessions, database queries, request-specific objects
- Data that accumulates: Octane worker memory — manage via max_requests
- Data that is never freed: interned strings, preloaded classes — account for these in memory budget

## Performance Considerations

- Per-request allocation (PHP-FPM): fast (free-list), freed in bulk at request end — minimal fragmentation
- Persistent allocation (preloading): allocated once, never freed — zero per-request cost but permanent memory commitment
- Interned strings: one-time allocation per unique string, shared across all requests — reduces per-request memory
- Octane persistent heap: grows with fragmentation over time — recycling clears it
- Zend MM chunk allocation: 256KB per chunk, freed at process end in FPM, accumulates in Octane

## Security Considerations

- Interned strings contain class names, method names, and constant strings — no sensitive data
- Preloaded classes are loaded into shared memory — accessible to all workers on the same system
- Persistent memory in Octane that is not cleaned between requests may expose stale data from previous requests

## Related Rules (from 05-rules.md)

- Preload Framework Classes for Cold-Start Reduction
- Never Use opcache_reset() for Preloading Invalidation
- Set max_requests to 500-1000

## Related Skills

- PHP Memory Model
- Octane Memory Management
- Preloading Script Design Patterns
- OpCache Configuration Overview

## Success Criteria

- Persistent vs per-request allocation understood for the runtime
- Preloading and interned strings configured with awareness of their persistent nature
- Octane memory management practices applied
- Allocation model documented for team reference
