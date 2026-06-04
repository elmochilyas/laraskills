# Skill: Use Laravel Fuse for Circuit Breaking Persisted Across Processes

## Purpose
Use the `harris21/laravel-fuse` package to implement circuit breakers with cache-backed state that persists across process restarts, suitable for queue workers and long-running processes.

## When To Use
- Circuit breaker state needs to persist across PHP process restarts
- Queue workers making external API calls
- Multi-server deployments needing shared circuit state
- When in-memory circuit breakers are insufficient

## When NOT To Use
- Single-process, short-lived requests (in-memory circuit breaker suffices)
- Simple circuit breaker needs (custom lightweight implementation)

## Prerequisites
- `composer require harris21/laravel-fuse`
- Cache driver configured for state persistence

## Workflow
1. Install package and publish config
2. Configure circuit breaker per external service
3. Configure cache driver for state storage
4. Set failure threshold and open timeout
5. Wrap API calls with fuse circuit breaker
6. Handle OpenCircuitException with fallback
7. Monitor circuit state via cache keys
8. Test circuit states with mock failure sequences

## Validation Checklist
- [ ] Package installed and configured
- [ ] Circuit breaker configured per external service
- [ ] Cache driver set for state persistence
- [ ] Failure threshold and timeout configured
- [ ] API calls wrapped with circuit breaker
- [ ] OpenCircuitException handled with fallback
- [ ] Circuit states tested end-to-end
