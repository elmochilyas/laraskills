# Skill: Implement Error Logging Context

## Purpose
Add structured context to error logs: request_id, user_id, route, input (sanitized), stack trace, and environment — using Laravel logging channels with JSON format.

## When To Use
- Error debugging and investigation
- Production error monitoring
- Audit trail requirements

## When NOT To Use
- Debug-level logging in development
- Non-error log entries

## Prerequisites
- Laravel logging configuration
- Log channel setup

## Inputs
- Context field specifications
- Log channel configuration

## Workflow
1. Override `context()` in `App\Exceptions\Handler` to include global context
2. Include `request_id` from request attribute — correlates across services
3. Include `user_id` from authenticated user (or 'guest')
4. Include `url` and `method` from request
5. Include `ip` from request (anonymized if needed)
6. Include sanitized input — remove passwords, tokens, credit cards
7. Exclude sensitive fields from log context
8. Configure JSON log format for structured logging: `'driver' => 'stack', 'channels' => ['single']`
9. Use `Log::channel('api')->error()` for API-specific logging
10. Test log output format and context inclusion

## Validation Checklist
- [ ] Exception handler context() overridden
- [ ] request_id in log context
- [ ] user_id in log context
- [ ] url and method in log context
- [ ] IP in log context
- [ ] Sensitive fields excluded
- [ ] JSON format configured
- [ ] Log format tested

## Related Skills
- API-Specific Middleware
- Global Exception Handler Configuration
- Sensitive Data Leak Prevention
