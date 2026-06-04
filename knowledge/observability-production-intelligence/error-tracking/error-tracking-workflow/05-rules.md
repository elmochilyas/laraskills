# Rules: Error Tracking Workflow

## Rule ETW-01: Configure error fingerprinting for all custom exception types
**Condition:** When creating custom exception classes that include dynamic data (user input, identifiers) in their messages.
**Action:** Implement fingerprint rules based on exception class and category, not the dynamic message content. Use Sentry's `setFingerprint()` or equivalent.
**Consequence:** Dynamic errors from the same source are grouped together instead of creating thousands of unique issues.

## Rule ETW-02: Link every deployment to release tracking
**Condition:** When deploying to any environment where error tracking is active.
**Action:** Configure the SDK to send release version (git SHA or CI build number). Enable VCS integration for suspect commit identification.
**Consequence:** Every error can be traced to the deployment that introduced it. Regressions are immediately identifiable.

## Rule ETW-03: Never swallow exceptions without reporting
**Condition:** When catching exceptions in application code.
**Action:** Always report caught exceptions to the error tracking SDK, even when handling is legitimate. Use dedicated handling with explicit `report()` calls.
**Consequence:** All exceptions are tracked. Silent degradation is eliminated.

## Rule ETW-04: Automate source map uploads in CI/CD
**Condition:** When deploying Laravel applications with compiled frontend assets (Vite, Mix, Inertia, Livewire).
**Action:** Add source map upload step to the deployment pipeline. Upload to error tracking platform after build, before or after deployment.
**Consequence:** Frontend errors display readable stack traces with file names and line numbers.

## Rule ETW-05: Set severity mapping for all error types
**Condition:** When configuring error tracking SDK.
**Action:** Map HTTP status codes and exception types to severity levels: 5xx = error, 4xx = warning, debug = ignore. Use `Sentry\Severity` or equivalent.
**Consequence:** Severity-based triage routing works correctly. Noise is filtered.

## Rule ETW-06: Configure breadcrumb limits per environment
**Condition:** When enabling automatic breadcrumb collection.
**Action:** Set maximum breadcrumb count appropriate for the environment. Production: 50-100 breadcrumbs max. Development: 200+. Focus on query and HTTP call breadcrumbs.
**Consequence:** Breadcrumb buffer contains high-signal events, not noise.

## Rule ETW-07: Review crash-free rate per release
**Condition:** After each production deployment.
**Action:** Monitor crash-free rate within 24 hours of deployment. Alert if rate drops below target (e.g., 99.5%).
**Consequence:** Regressions are detected within the deployment cycle, not weeks later.

## Rule ETW-08: Never mark errors resolved without deployment verification
**Condition:** When resolving an error issue in the tracking platform.
**Action:** Only mark resolved after the fix is deployed and monitoring confirms no reoccurrence in the new release.
**Consequence:** Prevents "ghost errors" that reappear because the fix was never actually deployed.
