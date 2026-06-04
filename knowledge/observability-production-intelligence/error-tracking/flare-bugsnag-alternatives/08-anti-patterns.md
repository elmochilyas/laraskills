# Anti-Patterns: Flare & BugSnag Alternatives

## AP-FBA-01: Dual SDK Operation

**Description:** Running two full error tracking SDKs simultaneously — keeping the old platform while evaluating the new one, or during a slow migration.

**Why It Happens:** Teams fear missing errors during migration. They install the new SDK before removing the old one "just to be safe."

**Consequences:**
- Every error triggers two HTTP calls, doubling network overhead
- Two breadcrumb buffers consume memory
- Both dashboards show errors — which is authoritative? Team attention splits.
- Confusion when error counts differ between platforms (different grouping algorithms)

**Detection:** Search `composer.json` for multiple error tracking packages. Check `config/app.php` providers for duplicate SDK service providers.

**Remediation:** Decommission the old SDK completely before installing the new one. Use a canary deployment (one instance with new SDK, others with old) if parallel validation is required.

---

## AP-FBA-02: Platform-as-Monoculture

**Description:** Centralizing all observability — errors, performance, uptime, logging, metrics — on a single error tracking platform.

**Why It Happens:** Platforms market themselves as "all-in-one observability." Teams adopt the error tracking platform's logging and performance features for convenience.

**Consequences:**
- Extreme vendor lock-in — switching costs become prohibitive
- Single platform outage blinds the entire observability stack
- Platform-specific pricing for non-error features may be unfavorable
- Each additional feature ties the team deeper into proprietary APIs

**Detection:** Inventory which observability features are provided by each platform. If the error tracking platform provides >50% of observability features, assess monoculture risk.

**Remediation:** Use purpose-built tools for each observability pillar: error tracking for errors, structured logging for logs (Loki/ELK), Prometheus for metrics, Grafana for dashboards. Only consolidate when the platform provides genuine feature advantage.

---

## AP-FBA-03: Choosing by Laravel Version Compatibility Alone

**Description:** Selecting an error tracking platform based solely on whether it supports the current Laravel version, ignoring integration depth, workflow features, and pricing at scale.

**Why It Happens:** The decision is made during initial project setup when traffic is low and requirements are simple. "It works with Laravel 11" becomes the sole criterion.

**Consequences:**
- Insufficient breadcrumb coverage leads to poor debugging context
- Queue job tracing is missing
- At scale, pricing becomes unfavorable but switching feels impossible
- Team spends years working around a platform that doesn't fit

**Detection:** Review the decision rationale document (if it exists). If Laravel version compatibility is the only criterion listed, the evaluation was insufficient.

**Remediation:** Run a structured evaluation using production traffic before traffic grows. Document findings. Make an informed choice even if it means switching early.
