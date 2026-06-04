# Anti-Pattern 1: Auto-Instrumentation as Complete Solution

**Name:** "We installed auto-instrumentation, observability is done"

**Problem:** Installing auto-instrumentation packages and considering the observability implementation complete. Business logic (checkout flow, user registration, payment processing) is not instrumented because auto-instrumentation does not cover custom code. When a business transaction fails, there are no spans for the business logic path.

**Detection:** Traces show HTTP request, database queries, and HTTP client calls. No spans for business operations (order creation, payment processing, user registration). Cannot debug "user couldn't complete checkout" because the checkout flow is invisible.

**Remediation:** Audit all business-critical paths. Add manual spans for each. Combine auto-instrumentation (libraries) with manual instrumentation (business logic).

**Prevention:** Auto-instrumentation covers 50% of observability needs. Manual instrumentation covers the other 50%. Both are required.

# Anti-Pattern 2: Ignoring Attribute Content

**Name:** Auto-captured data leakage

**Problem:** Assuming auto-instrumentation only captures metadata (timing, status). PDO instrumentation captures full SQL query text including WHERE clause values. Guzzle instrumentation captures full URLs including query parameters and tokens. Sensitive data flows into the tracing backend.

**Detection:** Tracing backend shows database queries with user email addresses in WHERE clauses. Guzzle traces show API keys in URL query parameters.

**Remediation:** Configure attribute filtering in SDK or Collector. Sanitize sensitive attributes: replace query values with `<redacted>`, mask token parameters in URLs.

**Prevention:** Review each auto-instrumentation package's attribute set before enabling. Assume all captured data may contain sensitive information until proven otherwise.

# Anti-Pattern 3: Outdated Instrumentation

**Name:** Instrumentation packages not upgraded

**Problem:** Auto-instrumentation packages are installed during initial setup and never upgraded. When the Laravel framework or library is upgraded, the instrumentation package version is incompatible. Instrumentation silently stops working — no spans are created, but no errors are thrown.

**Detection:** After a Laravel upgrade, traces suddenly have fewer spans. Database query spans are missing. Team notices after weeks of reduced observability.

**Remediation:** Keep instrumentation packages updated alongside the libraries they instrument. Add instrumentation to the regular upgrade checklist.

**Prevention:** Auto-instrumentation packages are dependencies, not one-time installations. They must be maintained like any other dependency. Add "verify auto-instrumentation still works" to upgrade checklists.

# Anti-Pattern 4: Unnecessary Instrumentation

**Name:** Installing every available package

**Problem:** Installing all available auto-instrumentation packages regardless of whether the application uses those libraries. Each unnecessary instrumentation package adds 50-200KB of loaded code and potential compatibility issues. Some packages may produce errors on unsupported library versions.

**Detection:** Application has 15 auto-instrumentation packages installed. Only 8 cover libraries actually used. Logs show warnings from unused instrumentation packages.

**Remediation:** Remove instrumentation packages for libraries not used by the application. Keep only: Laravel, PDO/MySQL, Guzzle/HTTP, Redis.

**Prevention:** Only install auto-instrumentation for libraries that are actively used in the application. Check before installation: "Does this application use this library?"
