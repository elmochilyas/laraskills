# Skill: Implement Log Context Correlation in Laravel

## Purpose
Implement end-to-end log context correlation for Laravel applications, ensuring every log entry can be traced from user action through HTTP requests, database queries, queue jobs, and external service calls.

## When To Use
- Production Laravel applications requiring efficient debugging
- Multi-service architectures needing cross-service correlation
- Queue-heavy applications where request context must survive serialization
- Compliance-driven environments requiring audit trail linking

## When NOT To Use
- Trivial single-purpose services where log volume is minimal
- Development-only applications

## Prerequisites
- Laravel 11+ (for Context facade) or Laravel 10 with manual context handling
- Monolog as logging backend (default in Laravel)
- OpenTelemetry PHP SDK (optional, for trace ID injection)
- Log aggregator supporting JSON search (ELK, Loki, Datadog)

## Inputs
- Application entry points (HTTP, queue, CLI, broadcast)
- Authentication middleware (user identity)
- Request metadata (path, method, IP)
- OpenTelemetry tracer (trace context)

## Workflow
1. **Create correlation ID middleware**: Generate or accept `X-Correlation-ID` header. Store in Context facade via `Context::add('correlation_id', $id)`. Add user ID, request path, session ID.
2. **Create trace ID processor**: Implement a Monolog processor that reads the current OTel span and injects `trace_id` and `span_id` into `$record['extra']`.
3. **Register processor in channel config**: Add the processor to the production log channel in `config/logging.php` under the `processors` key.
4. **Configure queue context propagation**: Create `App\Queue\Middleware\PropagateLogContext` middleware. On dispatch: `Context::dehydrate()`. On job execution: `Context::hydrate($job->context)`.
5. **Bridge to Sentry scope**: In service provider, configure Sentry scope to read from Context facade. Set user, tags, extras from context data.
6. **Validate context in testing**: Write integration test confirming all log entries contain correlation_id and trace_id. Assert against test logger.

## Validation Checklist
- [ ] Context facade stores correlation ID per request
- [ ] Monolog processor injects trace ID into every log record
- [ ] Queue jobs inherit correlation context from parent request
- [ ] Sentry error events carry user and request context
- [ ] Log aggregator searchable by correlation ID and trace ID
- [ ] Context serialization overhead measured and within budget
- [ ] PII audit completed — no sensitive data in context

## Common Failures
- **Context lost in queues:** Context facade not dehydrated/hydrated around queue dispatch. Symptoms: queue logs have no correlation ID.
- **Processor throws on missing span:** OpenTelemetry context not available in CLI commands. Guard processor with null check.
- **Context over-injection:** 50+ context fields. Symptoms: 500KB+ log entries, slow aggregator queries. Trim to 10-15 essential fields.

## Decision Points
- **UUID v4 vs ULID for correlation IDs:** UUID v4 is universally supported; ULID is sortable and shorter. Choose ULID if logs are frequently queried by time range.
- **Context facade vs Log::shareContext():** Facade for Laravel 11+. `shareContext()` is deprecated but functional in earlier versions.
- **Monolog processor vs middleware for trace ID:** Processor runs inside the logging pipeline — correct. Middleware is too early (trace may not be active).

## Performance Considerations
- Context facade `dehydrate()` typically < 100μs — benchmark in your traffic profile
- Each Monolog processor adds ~5-10μs per log call
- Large context arrays increase storage cost by 200-500 bytes per entry
- Queue context serialization adds payload size — keep < 5KB

## Security Considerations
- Audit all context fields for PII before production
- Configure Sentry `before_send` callback for redaction
- Validate incoming correlation IDs (if accepted from external sources)
- Never store passwords, tokens, or API keys in context

## Related Skills
- Structured JSON Logging
- Monolog Architecture & Channel Configuration
- Sentry Laravel Integration
- W3C Trace Context Propagation

## Success Criteria
- All log entries carry correlation_id and trace_id
- Single search in log aggregator reveals complete request lifecycle
- Queue job logs trace back to originating HTTP request
- MTTR reduced by enabling correlation-based debugging
