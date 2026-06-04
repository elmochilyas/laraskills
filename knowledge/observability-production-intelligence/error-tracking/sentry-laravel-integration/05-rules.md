# Rules: Sentry Laravel Integration

## Rule SLI-01: Store DSN in environment variable only
**Condition:** When configuring Sentry in any environment.
**Action:** Set `SENTRY_LARAVEL_DSN` in `.env`. Reference via `env('SENTRY_LARAVEL_DSN')` in `config/sentry.php`. Never hardcode the DSN.
**Consequence:** DSN is never committed to version control. Environment-specific DSNs are supported.

## Rule SLI-02: Use traces_sampler callback, not traces_sample_rate
**Condition:** When configuring performance transaction sampling.
**Action:** Implement `traces_sampler` callback that returns sampling rate per transaction. Exclude health checks, return 1.0 for parent-sampled transactions, apply base rate otherwise.
**Consequence:** Sampling budget spent on meaningful transactions. Zero sampled health checks. Parent trace integrity preserved.

## Rule SLI-03: Implement before_send for PII redaction
**Condition:** Before deploying Sentry to production.
**Action:** Configure `before_send` callback that removes email, IP, and custom PII fields from events before transmission. Test with sample events.
**Consequence:** No PII reaches Sentry servers. Compliance with data protection requirements.

## Rule SLI-04: Set environment explicitly in sentry config
**Condition:** When configuring the Sentry SDK.
**Action:** Set `'environment' => env('APP_ENV')` in `config/sentry.php`. This tags every event with the current environment.
**Consequence:** Production and staging errors are cleanly separated in the Sentry dashboard. Environment-based filtering works correctly.

## Rule SLI-05: Exclude health check endpoints from tracing
**Condition:** When configuring `traces_sampler`.
**Action:** Return `0.0` for health check, status, and metrics endpoints in the sampler callback.
**Consequence:** 30-50% span budget savings in typical deployments. Health monitoring does not consume tracing quota.

## Rule SLI-06: Enable session replay only after privacy review
**Condition:** Before enabling Sentry's session replay feature.
**Action:** Conduct privacy impact assessment. Document what user data may be captured. Configure redaction rules for sensitive fields. Obtain compliance approval.
**Consequence:** Privacy-compliant session replay. No unexpected PII collection.

## Rule SLI-07: Validate send_default_pii is false in production
**Condition:** When reviewing Sentry configuration for production deployment.
**Action:** Confirm `'send_default_pii' => false` in `config/sentry.php`. Set it explicitly — do not rely on defaults.
**Consequence:** User IP addresses and other automatically-detected PII are not sent to Sentry.

## Rule SLI-08: Pin SDK version and monitor changelog for breaking changes
**Condition:** When managing the `sentry/sentry-laravel` dependency.
**Action:** Pin to a specific minor version in `composer.json`. Subscribe to Sentry changelog. Review breaking changes before upgrading.
**Consequence:** Avoids unexpected behavior from SDK upgrades. Controlled upgrade process.

## Rule SLI-09: Disable profiling in production unless actively investigating
**Condition:** When configuring Sentry profiling features.
**Action:** Enable `profiles_sample_rate` only during active performance investigations. Set to 0.0 otherwise.
**Consequence:** Avoids continuous 5% CPU overhead from profiling. Profiling is available on-demand.
