# Rules: Laravel Vapor

## VAPOR-001: Configuration Cache
**Condition:** Laravel deployed on Vapor
**Action:** Run `php artisan config:cache` before deployment
**Rationale:** Cold start time is dominated by config file parsing
**Consequences:** Violation significantly increases Lambda cold start latency

## VAPOR-002: Queue for Long Tasks
**Condition:** Task takes > 5 seconds
**Action:** Offload to Vapor queue (SQS-backed Lambda)
**Rationale:** Lambda HTTP function has 30s max execution time; queue runs up to 15min
**Consequences:** Violation causes HTTP function timeout errors

## VAPOR-003: CDN for Static Assets
**Condition:** Application serves images, CSS, or JavaScript
**Action:** Use Vapor's CloudFront CDN for static asset delivery
**Rationale:** Lambda is not optimized for static file serving; CDN reduces Lambda invocations
**Consequences:** Violation incurs unnecessary Lambda invocation costs for static assets

## VAPOR-004: Cost Monitoring
**Condition:** Production application on Vapor
**Action:** Set AWS budget alerts for Vapor-related costs
**Rationale:** Lambda costs scale with traffic; unexpected traffic spikes cause cost overruns
**Consequences:** Violation results in unbudgeted AWS charges
