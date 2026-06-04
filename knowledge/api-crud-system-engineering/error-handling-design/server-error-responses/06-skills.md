# Skill: Design Server Error Responses

## Purpose
Handle 500-level server errors with safe generic messages in production, full detail in debug mode, and structured logging to ensure debug information is available without exposing internals to consumers.

## When To Use
- Every API application deployed to production
- When unhandled exceptions must produce safe responses
- When server errors need structured logging for debugging

## When NOT To Use
- Local development only (no production deployment)
- When all errors are caught and handled before reaching the generic handler

## Prerequisites
- Exception handler configuration
- Error tracking setup

## Inputs
- Server error types (database, external service, framework, unknown)
- Environment configuration

## Workflow
1. Register fallback `renderable` callback for unhandled `Throwable` — catches everything not explicitly mapped
2. In production (`APP_DEBUG=false`): return generic 500 error — no message, no stack trace, no file paths
3. In debug mode: include exception message, stack trace, file, line in response
4. Always log the full exception with stack trace to configured log channels
5. Send server errors to error tracking service for alerting
6. Use distinct error code — `SYSTEM.INTERNAL_ERROR` — for all unmapped server errors
7. Never expose configuration values, environment variables, or database details
8. Test server error response in both debug and production modes

## Validation Checklist
- [ ] Fallback renderable registered for unhandled Throwable
- [ ] Production 500 responses contain only generic safe message
- [ ] Debug mode includes full exception detail
- [ ] Full exception logged to log channels
- [ ] Error tracking receives server errors
- [ ] No config or env values in responses
- [ ] Server error tested in both modes

## Common Failures
- Exposing Whoops/ignition debug page in production — `APP_DEBUG=true`
- Generic handler returns nothing — client gets empty or HTML response
- Not logging — server error happens silently, no way to debug
- Exposing database error details — schema info, query details

## Decision Points
- Generic 500 vs specific server error codes — generic for unmapped, specific for known server errors
- Log level — `error` for most server errors, `critical` for database connection failures
- Include correlation ID — include in response and log for cross-referencing

## Performance Considerations
- Stack trace generation adds ~0.5-1ms — only in debug mode
- Logging adds I/O — use async logging for production
- Error tracking send adds ~1-5ms — use async/queue

## Security Considerations
- Production must never expose: stack traces, file paths, line numbers, SQL, config
- Logging server errors is security-critical — detection of attacks
- Ensure error tracking service doesn't expose data to unauthorized personnel

## Related Rules
- Register Fallback for Unhandled Throwable
- Return Generic Error in Production
- Include Full Details in Debug Mode Only
- Log Full Exception to Log Channels
- Send Server Errors to Error Tracking
- Test Server Error in Both Modes

## Related Skills
- Production vs Dev Error Detail — mode-specific handling
- Error Tracking Integration — sending errors externally
- Sensitive Data Leak Prevention — ensuring no internals exposed
- Error Response Testing — testing server error scenarios

## Success Criteria
- Production returns safe generic 500 for all unhandled errors
- Debug mode provides full stack trace for development
- All server errors are logged with full context
- Error tracking receives server errors for alerting
- No sensitive data exposed in any environment