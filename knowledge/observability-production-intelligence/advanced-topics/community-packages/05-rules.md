# Rule 1: Check Maintenance Status Before Adopting

**Condition:** Choosing a community observability package.

**Action:** Check GitHub: last commit date (within 6 months), open issues count, Laravel version compatibility, release cadence. Prefer packages with active maintenance, clear documentation, and test coverage.

**Consequence:** Actively maintained packages receive security updates, Laravel version support, and bug fixes. Abandoned packages become security risks and require emergency migration.

# Rule 2: Layer on OTel Foundation, Don't Replace

**Condition:** Building the observability stack.

**Action:** Use OpenTelemetry as the core instrumentation layer. Add community packages for specific features on top (error tracking, debug toolbar, APM). Do not make any community package the central observability dependency.

**Consequence:** OTel foundation ensures vendor neutrality. If a community package is abandoned, only the specific feature is affected — the core observability stack remains intact.

# Rule 3: Use Adapter Pattern for Vendor Abstraction

**Condition:** Depending on a community package for an observability feature.

**Action:** Define a PHP interface for the feature. Create an implementation using the community package. Register the implementation conditionally. Provide a null implementation as fallback.

**Consequence:** Adapter pattern enables switching vendors without application code changes. A Sentry-to-Flare migration is a configuration change, not a code rewrite.

# Rule 4: Test Overhead in Staging

**Condition:** Deploying a new community observability package.

**Action:** Profile application response time with and without the package in staging. Compare p50, p95, p99 latency. If overhead exceeds 5%, evaluate alternatives or accept the trade-off.

**Consequence:** Profiling prevents silent performance degradation. Some community packages add 10-20% overhead that goes unnoticed without pre-deployment profiling.

# Rule 5: Never Install Dev Packages in Production

**Condition:** Composer package management.

**Action:** Install Laravel Debugbar, Telescope, and similar development tools as `--dev` dependencies. Ensure environment checks prevent them from loading in production.

**Consequence:** Dev packages in production expose internal application data (queries, environment variables, request details) and add significant overhead.

# Rule 6: Budget for Migration

**Condition:** Adopting a community observability package.

**Action:** Estimate migration effort if the package is abandoned. Document integration points. Maintain knowledge of OTel-native alternatives. Budget 2-4 weeks for emergency migration.

**Consequence:** Migration planning prevents vendor lock-in crisis. When a package is abandoned, the team has a plan and budget to migrate.

# Rule 7: Review Data Sent to Third-Party Services

**Condition:** Using hosted error tracking or APM services.

**Action:** Review what data the package sends to the external service. Enable scrubbing for sensitive fields. Review privacy policy for data handling. Test with synthetic data first.

**Consequence:** Data review prevents PII leakage to third-party services. Error context often includes request payloads, user data, and environment details that should not leave the infrastructure.

# Rule 8: Prefer PSR-Compliant Packages

**Condition:** Evaluating community package quality.

**Action:** Check if the package follows PSR standards: PSR-3 (logging interface), PSR-14 (event dispatcher), PSR-18 (HTTP client). PSR-compliant packages are more interoperable and maintainable.

**Consequence:** PSR compliance ensures the package integrates cleanly with the Laravel ecosystem and other tools. Non-PSR packages may use incompatible abstractions.
