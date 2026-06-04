# ECC Standardized Knowledge — Logging & Tracing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | Logging & Tracing |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K029, K028 |

## Overview (Engineering Value)
Logging and tracing for HTTP client calls provides debug-level observability into outbound API requests, capturing request/response details, timing, headers, and error information. Laravel Telescope captures every HTTP client call automatically through its HTTP Client Watcher, while structured logging adds duration, status, and context to log files. Together, these tools enable rapid diagnosis of integration issues, performance analysis, and audit trails of all outbound API activity.

## Core Concepts
- **Telescope HTTP Watcher**: Captures URL, method, headers, body, status, duration for every Http facade call
- **Structured Logging**: Log entries with consistent fields (duration, status, service, endpoint)
- **Request Tracing**: Correlation ID across outbound calls, jobs, and webhooks
- **Error Context**: Full request/response details captured on failure for debugging
- **Sensitive Data Redaction**: Automatic stripping of credentials, tokens, PII from logs
- **Sampled Production Logging**: Configurable sampling rate to balance detail vs storage

## When To Use
- All production API integrations (for debugging and monitoring)
- Development and staging environments for integration testing
- Incident investigation and post-mortem analysis

## When NOT To Use
- Fully captured logs in very high-traffic integrations without sampling
- Logging raw payloads in PCI/HIPAA environments without redaction

## Best Practices
- Enable Telescope in local/staging with full capture; production with sampling
- Log every outbound API call with duration, HTTP status, and service name
- Redact sensitive data (Authorization headers, API keys, PII) before logging
- Use correlation IDs to trace requests across service boundaries
- Implement sampling (10-25%) in production to manage storage

## Architecture Guidelines
- Telescope for development debugging; structured logs for production
- Saloon Laravel plugin for automatic Telescope integration
- Log channel per integration service for focused monitoring
- Middleware-based logging for consistent capture across all outbound calls
- Automated pruning of Telescope entries (24-48h retention typical)

## Performance Considerations
- Telescope adds ~5-15ms per HTTP request (middleware + storage write)
- Structured logging adds <1ms per entry
- Storage grows proportionally to request volume; implement pruning
- Production sampling reduces overhead proportionally

## Common Mistakes
- Leaving full Telescope capture in production (storage overflow)
- Not redacting sensitive data (API keys visible in Telescope dashboard)
- Logging full response bodies without size limits
- Not implementing pruning, causing unbounded storage growth

## Related Topics
- **Prerequisites**: Laravel Telescope, logging fundamentals
- **Closely Related**: Integration health checks (ku-01 in observability), integration metrics (ku-02)
- **Advanced**: Distributed tracing with OpenTelemetry, log aggregation
- **Cross-Domain**: Observability, incident response, auditing

## Verification
- [ ] All outbound HTTP calls logged with duration and status
- [ ] Sensitive data redacted from logs
- [ ] Telescope configured with appropriate sampling for production
- [ ] Log pruning configured and operational
- [ ] Correlation IDs across integration request chains
