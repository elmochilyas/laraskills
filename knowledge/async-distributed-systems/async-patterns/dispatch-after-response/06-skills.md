# Skill: Use `dispatchAfterResponse` for Post-Response Tasks

## Purpose
Dispatch non-critical jobs that execute synchronously after the HTTP response is sent, freeing the client from waiting while the server processes non-essential work in the same request lifecycle.

## When To Use
Fast, non-critical work (< 1 second) like logging, cache warming, analytics pings; environments without queue infrastructure; single isolated post-response tasks.

## When NOT To Use
Slow work (> 2 seconds) — blocks PHP-FPM children; work needing retry guarantees (no persistence); external network calls; Octane or Vapor (no terminating callback support); work that must survive process crashes; high-traffic endpoints.

## Prerequisites
- PHP-FPM with `fastcgi_finish_request` support
- Job class WITHOUT `ShouldQueue` interface

## Inputs
- Job instance (must not implement ShouldQueue)
- Job execution time estimate (< 1 second)

## Workflow
1. Ensure job does NOT implement `ShouldQueue` (silently falls back to queue otherwise)
2. Dispatch: `Bus::dispatchAfterResponse(new WarmCacheJob($id))`
3. Set timeout guards inside the job (try-finally with time check)
4. Log job start and end explicitly (only visibility after response sent)
5. Keep job idempotent (no retry mechanism)
6. Monitor PHP-FPM listen queue and active processes
7. For multiple post-response tasks in Laravel 12+: prefer `Bus::defer()` instead

## Validation Checklist
- [ ] Job does NOT implement `ShouldQueue`
- [ ] Execution time < 1 second
- [ ] Timeout guards inside the job
- [ ] Logging at start and end
- [ ] Idempotent execution (no retry available)
- [ ] PHP-FPM listen queue monitored
- [ ] Not used in Octane or Vapor
- [ ] Not used for crash-critical work
- [ ] For grouped tasks: consider `Bus::defer()` instead

## Common Failures
- Expecting retry behavior — job lost on crash, no retry
- Mixing with ShouldQueue — silently falls back to queue dispatch
- Assuming async isolation — global state changes affect subsequent callbacks
- Using with Octane or Vapor — jobs silently dropped
- Heavy work blocks PHP-FPM child, reducing concurrent capacity

## Decision Points
- Single trivial task: `dispatchAfterResponse`
- Multiple grouped tasks: `Bus::defer()` (Laravel 12+)
- Durable work: queue dispatch
- Octane/Vapor: queue dispatch only

## Related Rules
- Rule 1: use-dispatch-after-response-for-non-critical
- Rule 2: never-use-for-crash-critical-work
- Rule 3: use-for-sync-side-effects-only

## Related Skills
- Use Defer Pattern for Batched Post-Response Work
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch
- Use `afterCommit` for Transactional Dispatch Safety

## Success Criteria
`dispatchAfterResponse` is used only for fast, non-critical, non-crash-sensitive work, does not implement ShouldQueue, has timeout guards and logging, and is avoided in Octane/Vapor.
