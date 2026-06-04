# Metadata
Domain: API Integration Engineering
Subdomain: Resilience & Reliability Patterns
Knowledge Unit: Circuit Breaker Integration with Queue Jobs (Laravel Fuse)
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Laravel Fuse (harris21/laravel-fuse) is a circuit breaker package designed specifically for Laravel queue jobs, presented at Laracon India 2026. It solves the problem of queue workers grinding to a halt when external services fail: instead of each job waiting for a timeout, the circuit opens and jobs fail fast (1ms) and release back to queue with delay. When the service recovers, Fuse automatically detects this and resumes normal processing. It implements the three-state circuit breaker pattern as queue job middleware with intelligent failure classification, peak hours support, and zero data loss through job release.

## Core Concepts
- **Queue Job Middleware**: Fuse implements the circuit breaker as Laravel job middleware, applying to specific jobs
- **Unlimited Release**: Jobs use `$tries = 0` so Fuse can release them indefinitely without consuming retry counts
- **Failure Rate Threshold**: Percentage of failures (e.g., 50% of 10+ requests) that triggers the Open state
- **Intelligent Failure Classification**: 429, 401, 403 don't trip the breaker (they're not service failures)
- **Peak Hours Support**: Different failure thresholds during business hours vs off-peak
- **Cache::lock() Probing**: Only one worker probes the service during Half-Open recovery testing
- **Zero Data Loss**: Jobs are released (not failed); they retry automatically when the circuit closes

## Mental Models
- **Fuse as Circuit Breaker**: Like an electrical fuse that blows (opens) when too much current (failures) flows
- **Queue Protection**: Fuse protects the queue from being clogged by jobs that will fail anyway
- **Self-Healing**: The circuit automatically tests recovery and resumes; no manual intervention needed

## Internal Mechanics
- Fuse uses minute-based fixed windows in Laravel's Cache (Redis) for failure counting
- `CircuitBreakerMiddleware` intercepts the job before `handle()`; if circuit is Open, releases job back with delay
- Failure counting: when `handle()` throws, middleware checks failure classification; if classified as failure, increments counter
- Open → Half-Open transition after timeout; uses `Cache::lock()` for exclusive probe access
- Half-Open probe: one job is allowed to execute its `handle()`; success → Closed, failure → Open
- Configuration via `config/fuse.php` with per-service thresholds, timeouts, and min_requests
- Built-in status page, events for state transitions (`CircuitBreakerOpened`, etc.), and Artisan commands (`fuse:open`, `fuse:close`)

## Patterns
- **Per-Service Middleware**: Apply `CircuitBreakerMiddleware('stripe')` to Stripe-related jobs, `('mailgun')` for email jobs
- **Peak Hours Tuning**: Configure `peak_hours_threshold` higher to reduce false positives during business traffic
- **Event-Driven Alerting**: Listen to `CircuitBreakerOpened` for Slack/PagerDuty notifications
- **Manual Override**: Use `php artisan fuse:open stripe` for emergency circuit opening during known outages
- **Status Monitoring**: Enable the built-in real-time status page for operations dashboards
- **Direct Usage**: Use `CircuitBreaker` class directly in synchronous code when Fuse middleware isn't applicable

## Architectural Decisions
- Use Fuse for all queue jobs that make external API calls (protects queue throughput)
- Set `$tries = 0` on Fuse-protected jobs for unlimited releases; `$maxExceptions = 3` to cap actual failures
- Configure conservative thresholds (40-50% failure rate) for critical payment processing
- Use Redis cache backend for distributed state across multiple queue workers
- Enable peak hours tuning for services with different reliability SLOs during business vs off-peak hours
- Combine Fuse with retry: Fuse prevents wasted retries when service is down; retry handles transient blips when circuit is closed

## Tradeoffs
- Fuse adds cache operations per job (failure counting, state checks) adding ~5-10ms overhead per job
- Unlimited releases ($tries = 0) can mask persistent issues if not monitored
- File cache is insufficient for production (race conditions); Redis required for distributed deployments
- Fuse protects queue throughput but doesn't prevent the initial failures that trip it
- Peak hours thresholds add configuration complexity but improve user experience during business hours

## Performance Considerations
- Cache operations: state check + failure count + possible lock acquisition = 2-4 Redis calls per job
- Open state: job fails in ~1ms (cache check only) vs 30s+ timeout without Fuse
- Half-Open probe: single request per timeout period, negligible overhead
- Cache storage: minute-based buckets auto-expire; minimal memory footprint
- Redis `Cache::lock()` for probing adds reliability vs thundering herd

## Production Considerations
- Deploy with Redis cache backend; file cache has race conditions during Half-Open probing
- Set up alerts on `CircuitBreakerOpened` events for critical services (Stripe, payment gateways)
- Monitor the Fuse status page for real-time circuit state across all services
- Configure per-service thresholds based on observed failure rates during normal operations
- Combine Fuse with Horizon monitoring to correlate circuit state with queue length metrics
- Test Fuse behavior during load testing with simulated service failures

## Common Mistakes
- Using Fuse without Redis (file cache causes race conditions in multi-worker)
- Forgetting to set `$tries = 0` on Fuse-protected jobs (Laravel's default retry counter conflicts with Fuse releases)
- Classifying all errors as failures (Fuse excludes 429/401/403 by default, but custom classifiers may not)
- Not configuring `min_requests`, causing the circuit to trip on tiny sample sizes (single failure = 100% failure rate)
- Applying Fuse to jobs that don't make external API calls (unnecessary overhead)
- Not monitoring Half-Open transitions (indicates persistent issues that should be investigated)

## Failure Modes
- Redis outage: Fuse cannot read/write circuit state; all jobs fall through to their normal execution (potential overload)
- Misconfigured thresholds: circuit trips too early (false positive) or doesn't trip (no protection)
- Cache key collision: two services with the same key name share the same circuit breaker
- Job timeout vs circuit timeout: job may time out before the circuit opens, causing repeated timeout exceptions
- Permanent Open: bug in recovery logic prevents circuit from ever transitioning to Half-Open

## Ecosystem Usage
- Fuse v0.4.0 (March 2026) is the stable version; requires PHP 8.3+, Laravel 11+
- Built by Harris Raftopoulos for Laracon India 2026; presented alongside a video tutorial on Laravel News
- At 386+ GitHub stars within months of release, indicating strong community adoption
- No external dependencies; pure Laravel using Cache system and native job middleware
- Complemented by algoyounes/circuit-breaker for synchronous circuit breaker needs
- Community uses Fuse for payment processing (Stripe), email delivery (Mailgun, Postmark), and API-dependent queue jobs

## Related Knowledge Units
- K007: Circuit Breaker Pattern (conceptual foundation for Fuse)
- K005: Retry Strategies (Fuse's release() integrates with retry logic)
- K008: Rate Limiting Algorithms (Fuse classifies 429 as non-failure)
- K013: Laravel Queue Integration (Fuse operates as job middleware)
- K025: Rate Limit Plugin for SaloonPHP (complementary rate limiting for synchronous calls)

## Research Notes
- Fuse is the first Laravel-native circuit breaker designed specifically for queue jobs
- Prior packages (algoyounes/circuit-breaker) targeted synchronous HTTP calls via Guzzle middleware
- The thundering herd problem in Half-Open is solved via `Cache::lock()` with a configurable lock timeout
- Intelligent failure classification is a key differentiator: many failures (429, 401) don't indicate service outage
- Peak hours support is unique to Fuse among Laravel circuit breaker implementations
- Source: github.com/harris21/laravel-fuse README and Laravel News articles
