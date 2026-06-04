# Skill: Integrate Error Tracking

## Purpose
Connect the error handling system to external error tracking services (Sentry, Flare, Rollbar) with structured context, user identification, breadcrumbs, and environment-specific filtering.

## When To Use
- When deploying to production with external error monitoring
- When errors need structured context for debugging
- When tracking error frequency and trends over time
- When setting up alerting on error thresholds

## When NOT To Use
- Local development with no external monitoring
- When all errors are logged to centralized logging (no third-party needed)
- Prototypes before production deployment

## Prerequisites
- Error tracking service account (Sentry, Flare, etc.)
- Exception handler configuration

## Inputs
- Error tracking service DSN/API key
- Environment configuration

## Workflow
1. Install and configure error tracking SDK — `sentry/sentry-laravel` or `flareapp/flare`
2. Configure DSN per environment — production enabled, local disabled
3. Add structured context to report calls — request ID, user ID, route, method
4. Add breadcrumbs for key operations — DTO construction, action execution, query timing
5. Set up user context — include user ID and role in error reports
6. Filter sensitive data before sending — passwords, tokens, credit cards
7. Configure environment-specific behavior — full data in staging, filtered in production
8. Set up alerting on error thresholds — warning for 4xx volume spikes, critical for 5xx
9. Group errors by error code and exception class for trend tracking

## Validation Checklist
- [ ] Tracking SDK installed and configured
- [ ] DSN configured per environment
- [ ] Structured context added to reports
- [ ] Breadcrumbs added for key operations
- [ ] User context included (where available)
- [ ] Sensitive data filtered before sending
- [ ] Alerting configured on thresholds
- [ ] Errors grouped by code/class for trends

## Common Failures
- Sending sensitive data to external service — credentials in context
- No environment filtering — local debug noise in production dashboard
- Over-reporting — tracking every 4xx as error (noisy)
- Under-reporting — not tracking critical domain exceptions
- Missing grouping — same error appearing as many separate issues

## Decision Points
- Sentry vs Flare vs Rollbar — Sentry for full-featured, Flare for Laravel-native, Rollbar for simplicity
- Report 4xx vs ignore 4xx — track volume spikes but don't alert individually
- Full context vs minimal context — full for pre-production, minimal for production privacy

## Performance Considerations
- Error tracking adds ~1-5ms per reported event (async send)
- Breadcrumb collection adds ~0.01ms per breadcrumb
- Queue-based sending prevents blocking the response
- SDK overhead minimal when no error occurs

## Security Considerations
- Never send credentials, tokens, or PII to external tracking services
- Configure data scrubbing in SDK for common sensitive fields
- Ensure tracking service is SOC2/GDPR compliant for user data
- Filter request data before sending — strip headers with auth tokens

## Related Rules
- Install and Configure Error Tracking SDK
- Add Structured Context to Reports
- Filter Sensitive Data Before Sending
- Configure Environment-Specific Behavior
- Set Up Alerting on Error Thresholds
- Group Errors by Code and Class

## Related Skills
- Error Response Testing — verifying tracked errors
- Sensitive Data Leak Prevention — ensuring data is filtered
- Production vs Dev Error Detail — environment-specific behavior

## Success Criteria
- Error tracking captures all production exceptions with context
- Sensitive data is filtered before sending to tracking service
- Errors are grouped and trended by type
- Alerting notifies on error threshold breaches
- No local development noise in production dashboard