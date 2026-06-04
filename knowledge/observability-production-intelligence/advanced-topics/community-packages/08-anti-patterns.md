# Anti-Pattern 1: Package as Foundation

**Name:** Observability built on a single community package

**Problem:** The entire observability strategy depends on a single community package. If the package is abandoned, changes licensing, or breaks after a Laravel upgrade, the team loses all observability. Migration requires rebuilding instrumentation from scratch.

**Detection:** The team refers to "Sentry" or "Scout" as the observability solution. No OTel instrumentation exists. If the vendor relationship ended, there would be no observability.

**Remediation:** Layer community packages on top of OTel instrumentation. Migrate core instrumentation to OTel. Keep community packages for specific added features only.

**Prevention:** Use OTel as the foundation layer. Community packages are plugins, not foundations.

# Anti-Pattern 2: Dev Packages in Production

**Name:** Debugbar or Telescope enabled in production

**Problem:** Laravel Debugbar or Telescope installed as non-dev dependencies and enabled in production. These packages add significant overhead (50-200ms per request), expose internal application data, and reveal environment variables and database queries.

**Detection:** Production response times increased after "minor deployment." Environment variables visible in the Debugbar toolbar. Telescope entries database table growing rapidly.

**Remediation:** Remove Debugbar/Telescope from production immediately. Install as `--dev` dependencies. Add environment checks in AppServiceProvider.

**Prevention:** Never install Debugbar or Telescope as non-dev dependencies. Use CI checks to prevent them from being deployed to production.

# Anti-Pattern 3: No Migration Plan

**Name:** Assuming the package will always be available

**Problem:** Adopting a community package without any migration plan or budget. When the package is abandoned (no commits for 18 months, incompatible with new Laravel version), the team is stuck — migrate under time pressure or stay on an outdated Laravel version.

**Detection:** Community package has no recent commits. Upgrading Laravel reveals incompatibility. No alternative solution is documented.

**Remediation:** Document migration paths when adopting community packages. Budget 2-4 weeks for emergency migration. Monitor package health quarterly.

**Prevention:** Every community package adoption should include: "What is the migration path if this package is abandoned?" Document the answer.

# Anti-Pattern 4: Over-Installation

**Name:** Installing every relevant package

**Problem:** Installing Debugbar, Telescope, Sentry, Scout APM, Log Viewer, and Pulse simultaneously. Each adds overhead, conflicts with others, and contributes to slow request times and memory bloat.

**Detection:** Application has 5+ observability packages installed. Request time increased by 200ms+ with no clear cause. Package conflicts cause stack traces in logs.

**Remediation:** Audit all installed packages. Remove unused ones. Consolidate on OTel + one error tracker + one dashboard tool.

**Prevention:** Before installing a new package, ask: "What existing package does this overlap with?" Avoid overlapping instrumentation.
