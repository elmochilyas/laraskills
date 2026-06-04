# Skill: Implement Production Error Handling

## Purpose

Set up production-grade error handling including failsafe error pages, health check endpoints, maintenance mode procedures, and error monitoring.

## When To Use

- Before first production deployment
- When setting up infrastructure (load balancers, auto-scaling)
- When establishing incident response procedures
- When auditing production readiness

## Prerequisites

- Exception handler is configured
- Production infrastructure is defined (load balancers, monitoring)
- Deployment strategy is known (rolling, blue-green, maintenance window)

## Workflow

1. Create a minimal failsafe 500 error page at `resources/views/errors/500.blade.php`:
   - Inline CSS only
   - No layout inheritance
   - No database queries
   - No external assets
   - Include optional `$reference` variable for error correlation

2. Implement health check endpoints:
   ```php
   Route::get('/health', function () {
       return response()->json(['status' => 'ok', 'timestamp' => now()]);
   });

   Route::get('/health/db', function () {
       try {
           DB::select('SELECT 1');
           return response()->json(['status' => 'ok', 'database' => 'connected']);
       } catch (Throwable $e) {
           return response()->json(['status' => 'error', 'database' => 'disconnected'], 500);
       }
   });
   ```

3. Configure maintenance mode procedures:
   ```bash
   # Planned deployment
   php artisan down --retry=60 --secret="your-secret-token"

   # Bring back up
   php artisan up
   ```

4. Integrate error monitoring (Sentry/Flare/Bugsnag) and configure alerting.

5. Design degraded operation strategies for each critical feature.

## Validation Checklist

- [ ] Failsafe 500 page is self-contained with no dependencies
- [ ] Health check endpoints return correct status for app and database
- [ ] Maintenance mode procedure is documented and tested
- [ ] Error monitoring is configured with alerting
- [ ] Degraded operation strategies exist for critical features
- [ ] Failsafe page has been tested by forcing handler error

## Common Failures

1. Failsafe page depends on layout or database — fails when needed most.
2. No health check for database — load balancer routes traffic to disconnected node.
3. Maintenance mode without retry header — clients hammer the 503 page.
4. No error monitoring — production errors invisible until users report.
5. No degraded operation — partial failure takes down entire application.

---

# Skill: Design Degraded Operation Strategies

## Purpose

Design fallback behaviors for critical features to maintain partial availability during partial failures.

## Workflow

1. Identify each critical feature and its failure modes.

2. For each failure mode, define a degraded behavior:
   - **Recommendations down** → show popular items instead
   - **Search down** → show search-unavailable page, don't 503 the whole site
   - **Payment gateway down** → show "Try again later" instead of crashing
   - **Database read-only** → serve from cache, disable writes

3. Implement try/catch in service layer with fallback logic.

4. Log the degradation for monitoring visibility.

5. Test degradation paths in staging.

## Validation Checklist

- [ ] Each critical feature has a defined degraded behavior
- [ ] Degraded behavior is tested in staging
- [ ] Degradation is logged for monitoring visibility
- [ ] Users see appropriate messaging during degradation
- [ ] Full recovery is possible without deployment

## Common Failures

1. No degradation — feature failure = application failure.
2. Degradation that's worse than failure — showing wrong data is worse than showing nothing.
3. Silent degradation — no log, no alert, nobody knows the feature is degraded.
