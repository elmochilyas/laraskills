# Rules: Flare & BugSnag Alternatives

## Rule FBA-01: Evaluate error tracking platforms with production traffic before committing
**Condition:** Before selecting an error tracking platform for long-term use.
**Action:** Run a 30-day trial on a staging or canary production instance. Compare: error grouping accuracy, SDK overhead, dashboard usability, alerting latency, and projected per-event cost.
**Consequence:** Informed decision based on actual performance at scale, not marketing claims.

## Rule FBA-02: Never run two full error tracking SDKs simultaneously
**Condition:** When evaluating a new platform while an existing one is active.
**Action:** Decommission the old platform's SDK before installing the new one. Or use a canary deployment with one platform per instance.
**Consequence:** Avoids duplicate error reports, doubled SDK overhead, and split team attention.

## Rule FBA-03: Document migration path before adopting any platform
**Condition:** When committing to an error tracking platform.
**Action:** Document: what would need to change to switch platforms (SDK, config, dashboards, alerts, integrations), estimated effort, and fallback options.
**Consequence:** Exit strategy exists if platform pricing, features, or reliability degrade.

## Rule FBA-04: Abstract error reporting behind an interface
**Condition:** When implementing error reporting calls in application code.
**Action:** Use Laravel's built-in `report()` helper and `ReportableException` interface. Avoid direct SDK calls (`Sentry::captureException()`) in business logic.
**Consequence:** Platform-specific SDK calls are limited to service provider configuration. Switching platforms requires minimal code changes.

## Rule FBA-05: Match platform choice to application architecture
**Condition:** When selecting error tracking for a multi-platform product (Laravel API + mobile apps).
**Action:** Choose the platform that serves the broadest set of platforms, even if it is not the best for Laravel alone.
**Consequence:** Unified error dashboard across all platforms. Single workflow for all error types.

## Rule FBA-06: Estimate monthly event volume before choosing a pricing tier
**Condition:** Before subscribing to any error tracking platform.
**Action:** Calculate daily request volume × average error rate. Add 20% headroom. Compare against platform pricing tiers to avoid overage charges.
**Consequence:** Predictable monthly cost. No surprise overage bills.

## Rule FBA-07: Prefer platforms with Laravel-specific integration depth over general-purpose tools
**Condition:** When the application stack is primarily Laravel (no mobile apps, no other frameworks).
**Action:** Evaluate Flare or Sentry (with Laravel SDK) over general-purpose platforms. Laravel-specific breadcrumbs, queue tracing, and middleware integration reduce debugging time.
**Consequence:** Deeper debugging context out of the box. Less manual instrumentation needed.
