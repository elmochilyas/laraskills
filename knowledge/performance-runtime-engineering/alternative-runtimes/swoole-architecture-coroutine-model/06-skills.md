# Skill: Understand Swoole's Coroutine Architecture

## Purpose

Comprehend how Swoole's coroutine-based event-driven architecture enables non-blocking I/O in PHP, and how auto-hooking works for PDO, MySQLi, Redis, and cURL.

## When To Use

- Evaluating Swoole for a high-I/O workload
- Understanding coroutine vs thread vs process models
- Debugging Swoole coroutine behavior
- Writing coroutine-safe PHP code

## When NOT To Use

- Without understanding the difference between coroutines and threads
- When the application does not have significant I/O wait time
- For CPU-bound workloads where coroutines provide minimal benefit

## Prerequisites

- PHP 8.0+ with Swoole extension installed
- Understanding of synchronous blocking I/O
- Familiarity with event-driven programming concepts

## Inputs

- Application I/O profile (database, Redis, cURL latency)
- Swoole extension version
- PHP version

## Workflow (numbered steps)

1. Understand Swoole's architecture: event loop (Reactor) -> worker processes -> coroutine containers
2. Coroutines are user-space, cooperative multitasking — they yield at I/O operations, not at arbitrary points
3. Swoole auto-hooks PHP functions: `PDO->query()`, `MySQLi->query()`, `Redis->get()`, `curl_exec()` — these become non-blocking automatically
4. When a coroutine calls a hooked function, it yields (suspends) and other coroutines in the same worker run
5. When the I/O completes, the coroutine is resumed — this happens transparently
6. Coroutine overhead: ~1µs per yield point — negligible compared to I/O wait time (1-100ms)
7. For coroutine-unsafe code (global state, static variables): each coroutine within the same worker shares memory — must be re-entrant
8. For debugging: check `Co::stats()` for coroutine counts and `swoole_async::` for I/O operation tracing
9. Document the coroutine model and its implications for the application code

## Validation Checklist

- [ ] Event loop / coroutine architecture understood
- [ ] Auto-hooking for PDO, MySQLi, Redis, cURL understood
- [ ] Coroutine yield/resume mechanism understood
- [ ] Coroutine overhead quantified (~1µs per yield)
- [ ] Coroutine-safe coding practices identified
- [ ] Debugging tools (Co::stats, swoole_async) known
- [ ] Architecture documented for team

## Common Failures

- **Writing blocking code in coroutines**: Using `sleep()` instead of `Co::sleep()` blocks the entire worker
- **Assuming coroutines are threads**: Coroutines share memory within the same worker — global state is shared
- **Not using auto-hooking**: Manually wrapping I/O calls in `go()` creates coroutines but does not auto-hook them
- **Forgetting coroutine overhead**: For sub-1ms I/O operations, coroutine overhead (~1µs) may exceed the benefit

## Decision Points

- I/O wait >50ms per operation: coroutines provide significant benefit
- I/O wait 1-50ms: moderate benefit — benchmark to confirm
- I/O wait <1ms: minimal benefit — coroutine overhead may exceed savings
- CPU-bound code: no benefit — stay with traditional execution model
- Code uses global state: must be refactored for coroutine safety

## Performance Considerations

- Coroutine yield: ~1µs overhead
- Coroutine resume: ~1µs overhead
- Auto-hooked PDO: ~1-5µs additional overhead per query
- Worker with 100 coroutines: ~200µs total overhead per request (negligible for I/O-bound workloads)
- Event loop: single-threaded per worker — CPU-bound coroutines block all other coroutines in the same worker

## Security Considerations

- Swoole is a C extension — compile from trusted sources
- Coroutine-unsafe code can lead to data races — all shared state must be protected
- Global variables and static properties are shared across coroutines — review for thread safety
- Swoole's event loop runs as the configured user — limit permissions

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Swoole Installation and Configuration
- Swoole io_uring Integration
- Architecture Model Differences
- Concurrency Model Selection

## Success Criteria

- Swoole's coroutine architecture understood
- Auto-hooking mechanism understood
- Coroutine-safe coding practices identified
- Performance implications documented
- Architecture documented for team reference
