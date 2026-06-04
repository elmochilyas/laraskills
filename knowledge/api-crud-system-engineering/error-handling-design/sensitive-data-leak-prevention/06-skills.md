# Skill: Prevent Sensitive Data Leakage in Errors

## Purpose
Ensure error responses never expose sensitive information — credentials, tokens, PII, internal paths, SQL queries, configuration values — by filtering exception context, sanitizing messages, and controlling debug output.

## When To Use
- Always — applies to all error responses in all environments
- When handling exceptions that may contain request data
- When logging exceptions to external tracking services
- As a security requirement for production APIs

## When NOT To Use
- No exceptions — this applies universally to all error handling

## Prerequisites
- Exception handler customization
- Understanding of sensitive data types

## Inputs
- Sensitive data field list (credentials, tokens, PII, internal paths)
- Data filtering configuration

## Workflow
1. Identify all sensitive data types — passwords, tokens, API keys, credit cards, SSN, internal IPs, file paths
2. Configure data scrubbing in exception handler — strip sensitive fields from exception context before rendering
3. Override `render()` to sanitize exception messages — replace sensitive values with placeholders
4. Configure error tracking SDK data scrubbing — Sentry/Flare `before_send` callback
5. Never include `$_SERVER`, `$_ENV`, or config values in error responses
6. Never return `SQL` query strings, bindings, or database error messages in responses
7. Control debug output per environment — only show internals when `APP_DEBUG=true`
8. Log full context to secure storage — sensitive values in access-controlled logs, never in responses
9. Test that sensitive data never appears in error responses

## Validation Checklist
- [ ] Sensitive data types identified and documented
- [ ] Exception context scrubbed of sensitive fields
- [ ] Exception messages sanitized
- [ ] Error tracking SDK scrubs sensitive data
- [ ] `$_SERVER`, `$_ENV`, config never in responses
- [ ] SQL queries never in responses
- [ ] Full context logged to secure storage only
- [ ] Tests verify no sensitive data in responses

## Common Failures
- Stack traces exposing file paths and line numbers
- SQL error messages exposing schema and query structure
- Validation response exposing accepted values or internal logic
- System environment variables in debug responses
- Auth tokens in request data returned in error context

## Decision Points
- Strip vs mask sensitive data — strip removes entirely, mask replaces with placeholder
- Environment-specific filtering — strict in production, relaxed in local
- Log context depth — full for debugging, minimal for error responses

## Performance Considerations
- Data scrubbing adds ~0.01-0.05ms for field filtering
- Logging full context adds I/O — use async logging for production

## Security Considerations
- Sensitive data leakage is a security vulnerability — treat prevention as security requirement
- PCI DSS requires credit card data never appear in logs or responses
- GDPR requires PII protection in error handling
- Regular audits of error responses for sensitive data exposure

## Related Rules
- Identify All Sensitive Data Types
- Configure Data Scrubbing in Exception Handler
- Sanitize Exception Messages
- Configure Error Tracking SDK Scrubbing
- Never Include SQL or Config in Responses
- Test for Sensitive Data in Error Responses

## Related Skills
- Production vs Dev Error Detail — controlling output per environment
- Error Tracking Integration — scrubbing sensitive data for external services
- Standardized Error Envelope — safe envelope format

## Success Criteria
- No sensitive data ever appears in error responses
- Exception context is scrubbed of credentials and PII
- SQL queries never exposed in responses
- `$_SERVER` and `$_ENV` values never returned
- Automated tests verify no sensitive data leakage