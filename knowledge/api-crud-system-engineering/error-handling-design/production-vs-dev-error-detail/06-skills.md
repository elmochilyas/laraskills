# Skill: Manage Production vs Development Error Detail

## Purpose
Configure environment-specific error detail — detailed stack traces and exception messages in development/local, safe generic messages in production — using `APP_DEBUG` and custom renderable callbacks.

## When To Use
- When deploying to production environments
- When developers need detailed error information locally
- When production must never expose internal details

## When NOT To Use
- Local development only (no production deployment)
- When all environments should show the same level of detail
- APIs consumed only by internal services with debug access

## Prerequisites
- Environment configuration (`APP_DEBUG`)
- Exception handler customization

## Inputs
- Environment-specific error detail policy
- Exception handler configuration

## Workflow
1. Configure `APP_DEBUG=false` in production — never true in production environments
2. Override `$this->render()` or use `renderable()` callbacks that check `config('app.debug')`
3. In debug mode: include exception message, stack trace, file, line in response
4. In production mode: return safe generic error envelope — no internals, no stack traces
5. For specific exception types, control detail independently — show validation details but hide auth details
6. Include `debug` key in response only when `APP_DEBUG=true` — optional, not always present
7. Test error responses in both modes to verify detail levels
8. Log full exception details to storage/channels in production — stack traces in logs, not responses

## Validation Checklist
- [ ] `APP_DEBUG=false` in production
- [ ] Production error responses never contain stack traces
- [ ] Production error responses never contain file paths or line numbers
- [ ] Validation details shown in both modes (safe to show)
- [ ] Auth error details hidden in both modes
- [ ] `debug` key only present when `APP_DEBUG=true`
- [ ] Full error details logged in production (not in response)

## Common Failures
- `APP_DEBUG=true` in production — stack traces exposed to all consumers
- Same render logic for both modes — no production safety
- Forgetting to override `render()` — framework default exposes details in debug mode
- Not logging in production — detailed errors lost when hidden from response

## Decision Points
- Full detail vs minimal detail — full for local/staging, minimal for production
- Per-exception-type control — validation details safe, auth details never safe
- Debug key presence — always in debug mode, never in production

## Performance Considerations
- Stack trace generation adds ~0.5-1ms — only in debug mode
- Production path is same regardless of debug setting (no additional cost)

## Security Considerations
- Production must never expose: stack traces, file paths, line numbers, SQL queries, config values
- Validation error details are generally safe in both modes
- Auth error details must be generic in ALL modes — never local vs production difference for auth
- Logs with full details must be access-controlled

## Related Rules
- Configure APP_DEBUG=false in Production
- Check app.debug in Renderable Callbacks
- Include Debug Key Only When Debug Mode
- Test Error Responses in Both Modes
- Log Full Details in Production (Not in Response)

## Related Skills
- Sensitive Data Leak Prevention — ensuring production safety
- Error Response Testing — testing both modes
- Server Error Responses — 500 handling in both modes

## Success Criteria
- Production never exposes stack traces or file paths in responses
- Debug mode provides rich detail for development
- Validation details shown in both modes
- Auth details are generic in all modes
- Full error context logged in production for debugging