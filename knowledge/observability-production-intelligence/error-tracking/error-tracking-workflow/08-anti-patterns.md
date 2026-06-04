# Anti-Patterns: Error Tracking Workflow

## AP-ETW-01: Silent Exception Swallowing

**Description:** Catching exceptions in empty `catch` blocks or logging them only to local files without reporting to error tracking.

**Why It Happens:** Developers catch exceptions to prevent 500 errors from reaching the user, but forget to report them. The application "works" from the user's perspective, but internal processes silently fail.

**Consequences:**
- Payment processing failures, data sync errors, and notification delivery failures go undetected
- Business impact accumulates silently — users don't get their orders, emails don't send
- Debugging requires correlating logs manually across services and timestamps

**Detection:** Search for `catch` blocks without `\Sentry\captureException()` or equivalent reporting call. Watch for error tracking dashboards showing fewer errors than expected.

**Remediation:** In every `catch` block, call the error tracking SDK to report the exception. Use `try/catch/report` pattern or a global exception handler for unhandled cases.

---

## AP-ETW-02: Over-Broad Fingerprinting

**Description:** Using default fingerprinting that groups all exceptions of the same class into one issue, even when they have different root causes.

**Why It Happens:** Default Sentry fingerprinting uses exception class and stack trace. For some exception types (ValidationException, HttpException), the stack trace is identical regardless of the specific error.

**Consequences:**
- A single Sentry issue shows 2000 events with 10 different root causes
- No one knows which root cause to fix first — all are mixed together
- The issue is ignored because it seems unfixable

**Detection:** Review Sentry issues with high event counts but no apparent pattern. If the same issue contains different error messages, fingerprinting is too broad.

**Remediation:** Add custom fingerprint rules that include discriminating fields (field name, HTTP status code, error code) while still grouping by the stable parts of the error.

---

## AP-ETW-03: No Release Tracking

**Description:** Sending error reports without release version information, making it impossible to correlate errors with deployments.

**Why It Happens:** Release tracking requires an extra CI/CD configuration step. Teams skip it during initial setup and never add it later.

**Consequences:**
- Cannot answer "was this error introduced by the last deployment?"
- Suspect commit identification is impossible
- Regression detection requires manual log comparison across time windows
- Release health dashboards show no data

**Detection:** Check error tracking dashboard for "Unknown Release" or missing release version on events.

**Remediation:** Add `SENTRY_RELEASE` environment variable (or equivalent) to the CI/CD deployment step. Use git SHA for precision.

---

## AP-ETW-04: Missing Source Maps for Frontend Errors

**Description:** Deploying JavaScript assets without uploading source maps to the error tracking platform, causing minified stack traces in frontend error reports.

**Why It Happens:** Frontend source maps are an additional upload step that teams forget when setting up error tracking. The CI build script creates source maps but never publishes them.

**Consequences:**
- All frontend errors show: `vendor.js:1:123456`
- Identifying the offending code requires manually downloading source maps and reverse-mapping
- Frontend errors are effectively ignored because debugging them is too time-consuming

**Detection:** Check error tracking dashboard for frontend errors with minified file names and single line numbers.

**Remediation:** Add source map upload to the CI/CD pipeline. For Sentry: `sentry-cli releases files <version> upload-sourcemaps ./dist`.
