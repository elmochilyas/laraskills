# Skill: Configure OpenTelemetry Auto-Instrumentation for PHP

## Purpose
Set up zero-code OpenTelemetry instrumentation for Laravel by installing the PHP extension and composer instrumentation packages — no application code changes needed.

## When To Use
- Laravel applications wanting observability without code modifications
- Teams deploying multiple services wanting consistent instrumentation
- Greenfield projects where zero-code reduces setup friction

## When NOT To Use
- Shared hosting where PHP extension installation is impossible
- Applications needing only basic monitoring (Pulse may be simpler)
- Teams already committed to vendor-specific agents

## Prerequisites
- Root access to install PHP extension
- Composer for instrumentation packages
- OTel collector or exporter endpoint

## Inputs
- PHP version and SAPI
- Framework and library versions (for matching instrumentation packages)
- OTLP endpoint

## Workflow
1. Install the opentelemetry PHP extension via pecl or OS package
2. Add opentelemetry to php.ini as extension
3. Add composer instrumentation packages matching your libraries
4. Set OTEL_SERVICE_NAME, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_TRACES_SAMPLER env vars
5. Verify extension loaded and spans appearing in backend
6. Add manual spans for business logic that auto-instrumentation cannot cover

## Validation Checklist
- [ ] PHP extension loaded (php -m | grep OpenTelemetry)
- [ ] Instrumentation packages match library versions
- [ ] Traces appear for HTTP requests, DB queries, cache operations
- [ ] No application code modified

## Common Failures
- Extension not loaded — verify php.ini and restart php-fpm
- Instrumentation package version mismatch with library version — check compatibility
- Env vars not propagated in containerized environments

## Decision Points
- Auto-instrumentation vs manual SDK for this service?
- PHP extension installation via pecl vs OS package?

## Performance Considerations
- Auto-instrumentation adds ~1-5% overhead per request
- Sampling rate controls telemetry volume — start at 10% for production

## Security Considerations
- PHP extension runs with application privileges — source from trusted registry
- Env vars may leak in error output — secure .env handling

## Related Skills
- Harden OTel Collector for Production
- Adopt Community OTel Packages for Laravel

## Success Criteria
- Zero-code traces for HTTP, DB, cache operations
- Consistent instrumentation across all services
- Easy to add manual spans for business logic
