# Skill: Add Logging and Request Tracing to API Integration Calls

## Purpose
Implement structured logging and correlation ID tracing for all outbound API calls to enable debugging, monitoring, and audit trails for integration behavior.

## When To Use
- Every API integration in production
- Debugging integration failures and performance issues
- Audit trails for external API communication
- Distributed tracing across microservices

## When NOT To Use
- Development-only scripts
- Non-critical background integrations where logging overhead is excessive

## Prerequisites
- Laravel logging system configured
- HTTP requests to external APIs

## Workflow
1. Add correlation ID to every outgoing request (UUID per request lifecycle)
2. Log request start: method, URL, headers (excluding auth), correlation ID
3. Log response: status code, duration, response summary, correlation ID
4. Log errors with full context: exception, request, response
5. Use structured logging (JSON format) for log aggregation
6. Configure log sampling for high-volume endpoints
7. Include correlation ID in Guzzle middleware or Http facade macro
8. For SaloonPHP: use global middleware for request/response logging

## Validation Checklist
- [ ] Correlation ID on every logged API call
- [ ] Request logs include method, URL, correlation ID
- [ ] Response logs include status, duration, correlation ID
- [ ] Error logs include full request/response context
- [ ] Structured logging format (JSON)
- [ ] Sampling configured for high-volume endpoints
