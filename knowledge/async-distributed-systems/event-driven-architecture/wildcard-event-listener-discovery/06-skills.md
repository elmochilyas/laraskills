# Skill: Use Wildcard Event Listener Discovery

## Purpose
Register wildcard event listeners using `*` patterns (method-based or name-based) to observe multiple events from a single handler for infrastructure concerns.

## When To Use
Cross-cutting infrastructure concerns — logging all events, collecting metrics, auditing; namespace-based event categorization; centralized monitoring of event throughput or timing.

## When NOT To Use
Business logic event handling (use exact-match listeners); high-throughput systems where pattern matching overhead is measurable; events requiring ordered execution; when debugging event flow should remain obvious.

## Prerequisites
- Listener class with `handle(* $event)` or subscriber with pattern registration
- Understanding of `Str::is()` pattern matching behavior

## Inputs
- Wildcard pattern (`order.*`, `App\Events\Order*`, `*`)
- Handler logic (must be fast and exception-safe)

## Workflow
1. For method-based wildcard: create listener with `handle(* $event): void`
2. For name-based wildcard: register in subscriber: `$events->listen('order.*', $handler)`
3. Keep handler logic minimal — log, increment metric, or dispatch async job
4. Make handler exception-safe — catch and log, never let exception propagate
5. Never mutate event state in wildcard handler
6. Never dispatch events that match the same wildcard pattern (infinite loop risk)
7. Verify exact-match listeners run before wildcard listeners
8. Run `event:cache` after wildcard changes

## Validation Checklist
- [ ] Wildcard used for infrastructure only (logging, metrics, auditing)
- [ ] Handler fast and exception-safe — no external calls, no uncaught exceptions
- [ ] No event mutation in wildcard handler
- [ ] No event dispatch from wildcard handler (infinite loop check)
- [ ] Exact-match listeners run before wildcard
- [ ] `event:cache` includes wildcard mappings
- [ ] Pattern matches expected events (not framework internal events)
- [ ] `*` does not cross namespace boundaries (one segment per `*`)

## Common Failures
- Using `* $event` for business logic — catches framework events too
- Assuming `*` matches across directory separators — only matches within one segment
- Heavy logic in wildcard — performance degradation proportional to event frequency
- Mutating event state — subsequent listeners receive modified event
- Dispatching matching events from wildcard handler — infinite loop

## Decision Points
- Method-based (`* $event`): catches ALL events indiscriminately
- Name-based (`order.*`): targeted pattern, safer
- Namespace-based (`App\Events\Order*`): matches by FQCN prefix

## Related Rules
- Rule 1: wildcards-for-infrastructure-only
- Rule 2: keep-wildcards-fast-and-safe
- Rule 3: no-catchall-for-business-logic
- Rule 4: never-mutate-event-in-wildcard

## Related Skills
- Register Event Subscribers via `$subscribe` Array
- Queue Event Listeners with `ShouldQueue`
- Implement Idempotency for Side-Effect Jobs

## Success Criteria
Wildcard listeners are used only for infrastructure, are fast and exception-safe, never mutate or dispatch events, and exact-match listeners execute first.
