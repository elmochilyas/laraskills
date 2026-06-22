# Decision Trees for Telescope & Pulse Relevance

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Telescope & Pulse Relevance |
| Related KUs | 01-calibrated-package-recommendation, 09-horizon-decision-matrix, 02-package-fit-non-fit-analysis |

---

## Decision Inventory

| ID | Decision | Priority |
|----|----------|----------|
| DT-TLP-001 | Telescope, Pulse, both, or neither? | P0 |
| DT-TLP-002 | Which Pulse recorders should be enabled? | P0 |
| DT-TLP-003 | Should Telescope data be scrubbed in staging? | P0 |
| DT-TLP-004 | Is Pulse sufficient or is additional APM/exception tracking needed? | P0 |

---

## DT-TLP-001: Telescope, Pulse, Both, or Neither?

### Decision Context
Telescope and Pulse serve different stages of the observability lifecycle. Telescope is for local/staging debugging (individual requests, queries, exceptions). Pulse is for production aggregate monitoring (throughput, trends, slow operations). Understanding which tool(s) to deploy in which environment prevents both observability gaps and tool overlap.

### Decision Criteria
- Which environment? (local, staging, production)
- What type of visibility is needed? (individual request debugging vs. aggregate trend monitoring)
- Does the team already have APM (Datadog, New Relic)?
- Is there an exception tracking service (Sentry, Bugsnag)?
- What is the database capacity for observability data?

### Decision Tree

```
Which environment are we configuring?
├── LOCAL → USE TELESCOPE. Do NOT use Pulse (localhost aggregate metrics have no value).
│   └── Prune aggressively (1-hour retention).
├── STAGING → USE TELESCOPE. Do NOT use Pulse (staging traffic is too low for aggregate trending).
│   └── Prune with 24-48 hour retention. Scrub sensitive data if staging uses production-like data.
├── PRODUCTION → NEVER USE TELESCOPE. Consider Pulse.
    └── Does the team already have Datadog/New Relic for APM?
        ├── YES → PULSE IS OPTIONAL. Existing APM covers aggregate monitoring.
        │   └── Pulse may still add value for Laravel-specific metrics (slow queries by Eloquent model).
        └── NO → Does the team have Sentry/Bugsnag for exception tracking?
            ├── NO → DEPLOY PULSE + ADD SENTRY. Pulse alone is insufficient for production monitoring.
            ├── YES → DEPLOY PULSE. Pulse shows aggregate trends; Sentry shows exception details.
                └── Start with 4 cards: slow queries, slow jobs, exceptions, cache hit rate.
```

### Rationale
The tools are purpose-built for specific environments. Telescope's request recording overhead (10-30ms per request) and PII storage make it unacceptable for production. Pulse's aggregate metrics are meaningless in local development (one user, no trends). Staging is the only environment where both could theoretically run, but Pulse's aggregate data from staging traffic (low volume, synthetic) provides no actionable signal. The decision tree ensures each tool runs only where it provides value and doesn't cause harm.

### Recommended Default
**Telescope: local + staging only, never production. Pulse: production only, with Sentry alongside. Never both in production. Never Pulse in local.**

### Risks Of Wrong Choice
- **Telescope in production**: 10-30ms overhead, database fills with PII, dashboard potentially publicly accessible. Data breach + performance incident.
- **No monitoring in production**: No visibility into slow queries, job failures, or cache performance. Incidents discovered by customers.
- **Pulse without Sentry**: Aggregate awareness without investigation capability. "Exceptions are up" but no stack traces to fix them.

### Related Rules
- Telescope Must Never Run in Production
- Pulse + Sentry/Datadog — Not Pulse Instead of Sentry/Datadog

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)

---

## DT-TLP-002: Which Pulse Recorders Should Be Enabled?

### Decision Context
Pulse ships with 8+ recorders. Enabling all of them clutters the dashboard and buries important signals. This decision tree determines which recorders provide actionable value for the team's specific application.

### Decision Criteria
- Does the application use queues (Horizon or queue:work)?
- Is there a measurable slow query problem or is query performance unknown?
- Is the team actively monitoring and optimizing cache efficiency?
- Does the team need server CPU/memory monitoring (or is infrastructure monitored elsewhere)?
- Are outgoing HTTP requests (to external APIs) a performance concern?

### Decision Tree

```
Does the application use queues (Horizon or queue workers)?
├── NO → Skip SlowJobs recorder. No queue data to monitor.
├── YES → ENABLE SlowJobs. (Also see Horizon — KU 09 — for deeper queue monitoring.)
    └── Threshold: 500ms default. Adjust based on your job performance profile.

Does the application have known slow query issues OR is query performance unknown?
├── YES (or UNKNOWN) → ENABLE SlowQueries. Threshold: 100ms default.
│   └── This is the highest-value Pulse recorder for most applications.
└── NO (query performance is well-understood and optimized) → Skip or enable for regression detection.

Is the team actively monitoring cache efficiency?
├── YES → ENABLE CacheInteractions. Track hit rates per cache store.
└── NO → Skip until the team is ready to act on cache metrics.

Is server infrastructure monitored elsewhere (Grafana, CloudWatch, Datadog)?
├── YES → Skip Server recorder. Pulse's server monitoring is basic — use dedicated tools.
└── NO → ENABLE Server recorder for basic CPU/memory visibility.
    └── Set PULSE_SERVER_NAME for each server.

Are outgoing HTTP requests a performance concern (external API calls in request cycle)?
├── YES → ENABLE SlowOutgoingRequests. Threshold: 200ms default.
└── NO → Skip. This recorder is specific to apps with heavy external API dependencies.

BASELINE: Start with SlowQueries + Exceptions. This is the minimum viable Pulse setup.
STANDARD: Add SlowJobs (if queues used) + CacheInteractions (if cache monitored).
EXTENDED: Add Server (if no other infra monitoring) + SlowOutgoingRequests (if external API heavy).
```

### Rationale
Dashboard clutter is the enemy of observability. When the Pulse dashboard shows 15 cards, the team learns to ignore all of them. Starting with the 2-4 cards that map to actions the team actually takes (investigating slow queries, responding to exception spikes) ensures the dashboard is useful. Adding cards only when the team has a demonstrated habit of acting on existing cards prevents the dashboard from becoming wallpaper. The guideline: every card on the dashboard should have triggered at least one investigation or action in the past month.

### Recommended Default
**Start with SlowQueries + Exceptions (minimum). Add SlowJobs if queues are used. Add CacheInteractions if cache performance is monitored. Stop there unless a specific need justifies more cards.**

### Risks Of Wrong Choice
- **Too few cards**: Important signals missed. Slow jobs degrading user experience but not visible. Cache misconfiguration causing performance issues but not tracked.
- **Too many cards**: Dashboard ignored. Important signals (slow queries spiking after deploy) buried among noise (server CPU at 12%, outgoing request latency normal).

### Related Rules
- Start Pulse with 3-4 Cards — Add More Only When the Team Acts on Them

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)

---

## DT-TLP-003: Should Telescope Data Be Scrutched in Staging?

### Decision Context
Telescope records everything: request payloads, email bodies, query bindings, session data. When staging uses production-like data (common for realistic testing), Telescope stores real PII in development-accessible tables. Data scrubbing prevents this exposure.

### Decision Criteria
- Does staging use production-like data (real emails, names, or PII)?
- Who has access to the staging Telescope dashboard?
- Are there compliance requirements (GDPR, HIPAA, SOC2) that apply to staging data?
- Is staging data synthetic (faker-generated, no real PII)?

### Decision Tree

```
Does staging use production-like data (real or realistic PII)?
├── NO (synthetic test data only) → SCRUBBING IS OPTIONAL. No PII to protect.
│   └── Still good practice: scrub API keys and tokens if they appear in test fixtures.
├── YES → Who has access to the staging Telescope dashboard?
    ├── ONLY SENIOR ENGINEERS (with data access approval) → LIGHT SCRUBBING.
    │   └── Scrub passwords, tokens, and API keys. Leave non-sensitive data visible for debugging.
    └── ALL DEVELOPERS → FULL SCRUBBING REQUIRED.
        └── Scrub: email addresses, names, IP addresses, tokens, passwords, query bindings over 32 chars.
        └── Compliance: GDPR requires data minimization — staging shouldn't mirror production PII.
```

### Rationale
Telescope's value as a debugging tool depends on data visibility. Scrubbing everything defeats the purpose — if you can't see the email body, you can't debug the email. The decision balances debugging utility against data exposure risk. The key factor is WHO can see the data, not just WHAT data exists. If only senior engineers with production data access can see Telescope, light scrubbing (tokens, passwords) is sufficient. If all developers can see it, full PII scrubbing is required.

### Recommended Default
**If staging uses production-like data AND >3 developers have Telescope access: full PII scrubbing. If staging uses synthetic data: no scrubbing needed. If staging uses production-like data AND only senior engineers have access: scrub tokens and passwords only.**

### Risks Of Wrong Choice
- **No scrubbing with production-like data + open access**: PII visible to all developers. GDPR violation. Internal data exposure incident.
- **Full scrubbing with synthetic data**: Unnecessary configuration. Debugging impaired because all data is `[REDACTED]`.

### Related Rules
- Add Telescope Filters to Scrub Sensitive Data

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## DT-TLP-004: Is Pulse Sufficient or Is Additional APM/Exception Tracking Needed?

### Decision Context
Pulse provides Laravel-level aggregate monitoring. For production readiness, the team must determine whether Pulse alone is sufficient or whether additional tools (Sentry for exceptions, Datadog for APM) are required. This decision depends on application complexity, team size, and incident response requirements.

### Decision Criteria
- How many paying customers does the application have? (0 = Pulse alone OK for early dev; 100+ = Sentry required)
- What is the acceptable MTTR (mean time to resolution) for production incidents?
- Does the application integrate with external services whose failures need tracing?
- Is the team on-call with alerting requirements?

### Decision Tree

```
Does the application have paying customers who will notice downtime?
├── NO (pre-launch, internal tools) → Pulse alone is sufficient for early monitoring.
│   └── Add Sentry before the first paying customer.
├── YES → What is the acceptable MTTR for production incidents?
    ├── >1 hour → Pulse + Sentry is sufficient. Aggregate awareness + exception details.
    ├── 15-60 min → Pulse + Sentry + optional Datadog for infrastructure correlation.
    ├── <15 min → Pulse + Sentry + Datadog/New Relic for distributed tracing and alerting.
    └── Does the application integrate with >3 external services (APIs, databases, caches)?
        ├── YES → ADD DATADOG/NEW RELIC. Distributed tracing needed for cross-service debugging.
        └── NO → Pulse + Sentry is sufficient.
```

### Rationale
The observability stack scales with business criticality. A pre-launch app with zero users can operate on Pulse alone — there's nobody to notice downtime. An app with paying customers needs Sentry at minimum — when exceptions spike, the team needs stack traces and affected users to resolve the incident. An app with a strict MTTR SLA (<15 minutes) needs Datadog/New Relic for distributed tracing — when every minute of downtime costs money, infrastructure-level visibility pays for itself.

### Recommended Default
**Pre-launch: Pulse alone. Post-launch with paying customers: Pulse + Sentry (mandatory). Enterprise/MTTR-sensitive: Pulse + Sentry + Datadog/New Relic.**

### Risks Of Wrong Choice
- **Pulse alone with paying customers**: Exceptions spike. Team sees the count but cannot view stack traces or affected users. MTTR exceeds 1 hour. Customer churn from unresolved bugs.
- **Full APM stack for pre-launch**: $500+/month in monitoring costs for an app with zero revenue. Monitoring investment should scale with business criticality.

### Related Rules
- Pulse + Sentry/Datadog — Not Pulse Instead of Sentry/Datadog

### Related Skills
- Laravel Horizon Decision Matrix (KU 09)
