# Anti-Patterns: Sentry Laravel Integration

## AP-SLI-01: Hardcoded DSN

**Description:** Storing the Sentry DSN directly in `config/sentry.php` instead of referencing an environment variable.

**Why It Happens:** Configuration publishing generates a config file with a placeholder. Developers replace the placeholder with the actual DSN during setup and commit it.

**Consequences:**
- DSN is exposed in version control history — anyone with repository access can send events to your Sentry project
- Different environments (staging, production) cannot use different DSNs without code changes
- Accidentally committing a DSN to a public repository exposes your project to spam events

**Detection:** Check `config/sentry.php` for a hardcoded DSN string instead of `env('SENTRY_LARAVEL_DSN')`.

**Remediation:** Move the DSN value to `.env`. Use `env('SENTRY_LARAVEL_DSN')` in the config file with no fallback value (so it fails explicitly if unset).

---

## AP-SLI-02: Fixed traces_sample_rate

**Description:** Using `traces_sample_rate: 0.1` instead of a `traces_sampler` callback, causing uniform sampling across all transaction types.

**Why It Happens:** The Sentry documentation shows `traces_sample_rate` as the simple approach. Developers use it without considering that health check endpoints, API endpoints, and error transactions should have different rates.

**Consequences:**
- Health check endpoints consume 30-50% of trace budget despite having zero debugging value
- Important API endpoints may be undersampled
- Error transactions (which should always be captured) are sampled at the same rate as healthy ones
- Cross-service trace integrity breaks when parent sampling decisions are ignored

**Detection:** Check `config/sentry.php` for `traces_sample_rate` key. If present instead of `traces_sampler`, this anti-pattern is active.

**Remediation:** Replace `traces_sample_rate` with a `traces_sampler` callback that excludes health checks, preserves parent sampling decisions, and applies differential rates per endpoint.

---

## AP-SLI-03: Missing before_send Callback

**Description:** Deploying Sentry to production without a `before_send` callback for PII redaction.

**Why It Happens:** The Sentry config publishes without a `before_send` stub. Developers focus on getting errors flowing and never add the security callback.

**Consequences:**
- SQL query bindings with PII (user email in `WHERE email = ?`) are sent to Sentry servers
- Request payloads containing passwords, tokens, and personal data are captured
- Stack trace variable values may expose internal data structures with sensitive content

**Detection:** Check `config/sentry.php` for presence of `before_send` key. If absent, no PII redaction is active.

**Remediation:** Implement `before_send` callback that strips email, IP, password, token, and credit card fields from the event's tags, extras, and request data.

---

## AP-SLI-04: Profiling Always-On

**Description:** Running Sentry profiling continuously in production with `profiles_sample_rate` set to match the trace sampling rate.

**Why It Happens:** The profiling feature is new and exciting. Developers enable it and forget about it, not realizing it adds continuous CPU overhead.

**Consequences:**
- 5% CPU overhead on all sampled transactions — this is significant at scale
- Profiling data costs — analyzed profiles consume storage and compute in Sentry
- Team becomes dependent on profiling data that may not be actively useful

**Detection:** Check `config/sentry.php` for `profiles_sample_rate` > 0.0 without a corresponding investigation window documentation.

**Remediation:** Set `profiles_sample_rate` to 0.0 by default. Enable only during active performance investigation periods with documented start and end dates.
