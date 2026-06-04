# Skill: Implement W3C Trace Context Propagation in Laravel

## Purpose
Implement W3C TraceContext propagation for Laravel applications to enable end-to-end distributed tracing across service boundaries.

## When To Use
- Multi-service Laravel applications
- Polyglot microservice environments
- OpenTelemetry-based observability

## Prerequisites
- OpenTelemetry PHP SDK installed
- Understanding of HTTP headers and queue message metadata

## Workflow
1. Set `OTEL_PROPAGATORS=tracecontext,baggage` environment variable
2. Configure OTel propagator in service provider
3. For HTTP client calls: use OTel HTTP middleware for automatic traceparent injection
4. For queue jobs: serialize trace context into job payload, extract on execution
5. Validate incoming traceparent headers in HTTP middleware
6. Test end-to-end: generate trace, call external service, verify single trace ID in backend

## Validation Checklist
- [ ] traceparent header injected on outgoing HTTP calls
- [ ] Incoming traceparent validated and extracted
- [ ] Queue jobs propagate trace context
- [ ] tracestate forwarded without modification
- [ ] Baggage size bounded (< 1KB)
- [ ] Cross-service trace visible as single trace in backend
