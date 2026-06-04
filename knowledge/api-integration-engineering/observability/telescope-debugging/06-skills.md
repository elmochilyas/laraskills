# Skill: Debug API Integrations with Laravel Telescope

## Purpose
Use Laravel Telescope to debug API integration issues by inspecting HTTP requests, queue jobs, exceptions, and logs in a unified dashboard.

## When To Use
- Debugging integration failures in development/staging
- Inspecting outbound HTTP request details (headers, body, timing)
- Tracing webhook processing through queue jobs
- Root cause analysis of integration errors

## When NOT To Use
- Production monitoring (Telescope has performance overhead)
- Long-term metric collection (use dedicated metrics tools)

## Prerequisites
- `composer require laravel/telescope`
- Telescope configured and migrated

## Workflow
1. Install Telescope: `composer require laravel/telescope --dev`
2. Configure watchers: `RequestWatcher`, `JobWatcher`, `ExceptionWatcher`, `LogWatcher`
3. Filter specific integrations by tags or URL patterns
4. Inspect outbound HTTP requests in Telescope dashboard
5. Trace webhook job processing from queue to completion
6. Examine exception context for integration errors
7. Use Telescope's `dump()` for targeted debugging
8. Batch entries with tags for filtering

## Validation Checklist
- [ ] Telescope installed with dev-only filter
- [ ] Request, Job, Exception, Log watchers enabled
- [ ] Filtering by integration tags configured
- [ ] Outbound HTTP requests visible in dashboard
- [ ] Queue job tracing available
- [ ] Exception context captured
