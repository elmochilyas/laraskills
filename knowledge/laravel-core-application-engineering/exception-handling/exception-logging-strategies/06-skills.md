# Skill: Configure Exception Logging Strategy

## Purpose

Configure log levels, channels, and context for exception logging to ensure actionable error intelligence without noise or sensitive data exposure.

## When To Use

- During initial application setup
- When adding domain-specific logging requirements
- When integrating external error tracking
- When reducing log noise from expected exceptions

## Prerequisites

- Exception handler is configured
- Understanding of RFC 5424 log levels
- List of exception types and their severity

## Workflow

1. Map log levels per exception type using `$levels`:
   ```php
   protected $levels = [
       AuthenticationException::class => LogLevel::INFO,
       ValidationException::class => LogLevel::INFO,
       PaymentFailedException::class => LogLevel::ERROR,
       HttpException::class => LogLevel::WARNING,
       Throwable::class => LogLevel::CRITICAL,
   ];
   ```

2. Configure `daily` log driver for production with 30-day retention.

3. Set LOG_LEVEL per environment: debug in local, warning in production.

4. Add global context via `context()` method.

5. Configure domain-specific channels for billing, audit, security.

6. Integrate external error tracker via `reportable()` callback.

7. Verify no sensitive data appears in log contexts.

## Validation Checklist

- [ ] Log levels are mapped per exception type
- [ ] `daily` driver is used in production
- [ ] LOG_LEVEL is appropriate per environment
- [ ] Global context includes user_id, url, method, ip, request_id
- [ ] Domain-specific channels exist for payment, audit, security
- [ ] No sensitive data in log outputs
- [ ] External error tracker is integrated (if needed)

## Common Failures

1. No log level mapping — all exceptions at ERROR.
2. `single` driver in production — disk fills up.
3. PII in context — regulatory violation.
4. LOG_LEVEL=debug in production — massive volume.

---

# Skill: Implement Structured Logging

## Purpose

Configure JSON-formatted structured logging for production to enable log aggregation, searching, and visualization.

## Workflow

1. Configure JSON formatter in `config/logging.php`:
   ```php
   'daily' => [
       'driver' => 'daily',
       'path' => storage_path('logs/laravel.log'),
       'level' => env('LOG_LEVEL', 'warning'),
       'days' => 30,
       'tap' => [App\Logging\JsonFormatter::class],
   ],
   ```

2. Create a custom formatter tap:
   ```php
   class JsonFormatter
   {
       public function __invoke($logger)
       {
           foreach ($logger->getHandlers() as $handler) {
               $handler->setFormatter(new \Monolog\Formatter\JsonFormatter());
           }
       }
   }
   ```

3. Always pass context as structured array — never interpolate into message strings.

4. Use consistent context keys across all log entries.

## Validation Checklist

- [ ] JSON formatter is configured for production log channel
- [ ] Context is always passed as structured array
- [ ] Context keys are consistent across log entries
- [ ] Log aggregation tool can parse the formatted logs

## Common Failures

1. Mixing plain-text and JSON — aggregation tool can't parse both formats.
2. Inconsistent context keys — searching requires multiple queries.
3. Missing context — log entries lack identifiers for debugging.
