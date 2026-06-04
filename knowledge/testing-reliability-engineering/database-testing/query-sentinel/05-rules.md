# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Query Sentinel

---

### Rule 1: Start with N+1 detection only, add other detection types after establishing a baseline

| Field | Value |
|-------|-------|
| **Name** | Enable detection types incrementally |
| **Category** | Configuration |
| **Rule** | Enable only N+1 detection initially. After the test suite runs cleanly with N+1 detection, add slow query and duplicate query detection. Add full table scan and missing index detection only in a dedicated performance test suite. |
| **Reason** | Enabling all detection types at once produces many false positives, causing alert fatigue. Incremental adoption allows tuning each detection type's exclusions and thresholds before adding the next. |
| **Bad Example** | Enabling all 5 detection types on day one — team is overwhelmed with false positives and disables Sentinel entirely. |
| **Good Example** | Month 1: N+1 detection only. Month 2: add duplicate query detection. Month 3: add slow query in CI. |
| **Exceptions** | New projects starting with Sentinel can enable more types from the start since there is less legacy code. |
| **Consequences Of Violation** | Alert fatigue from false positives. Team disables or ignores Sentinel. |

---

### Rule 2: Use warning mode in development, exception mode in CI

| Field | Value |
|-------|-------|
| **Name** | Different modes for dev and CI |
| **Category** | Configuration |
| **Rule** | Configure Query Sentinel in `log` (warning) mode for local development and `exception` (strict) mode for CI. |
| **Reason** | In development, warnings give developers feedback without blocking their workflow. In CI, exceptions block PRs that introduce query regressions, enforcing performance standards. |
| **Bad Example** | Exception mode in development — false positives block all local testing. |
| **Good Example** | Local: `QUERY_SENTINEL_MODE=log`. CI: `QUERY_SENTINEL_MODE=exception`. |
| **Exceptions** | Teams with mature query practices may use exception mode everywhere. |
| **Consequences Of Violation** | Developers cannot work locally (false positives), or CI misses regressions (warnings ignored). |

---

### Rule 3: Maintain and review the exclusion list quarterly

| Field | Value |
|-------|-------|
| **Name** | Review exclusions regularly |
| **Category** | Maintenance |
| **Rule** | Maintain an exclusion list for known-safe query patterns (migrations, sessions, config cache). Review the list quarterly and remove entries that are no longer needed. |
| **Reason** | Exclusions that are too broad or outdated allow real issues to pass through undetected. Quarterly review ensures exclusions remain narrow and justified. |
| **Bad Example** | Exclusion list that grew over 2 years with 50 patterns — most no longer relevant, some masking real issues. |
| **Good Example** | Quarterly calendar reminder to review exclusions. Each entry has a comment explaining why it's excluded. |
| **Exceptions** | None. Regular review is essential for Sentinel effectiveness. |
| **Consquences Of Violation** | Exclusions mask real query regressions. Sentinel provides false confidence. |

---

### Rule 4: Combine Sentinel with `expectsDatabaseQueryCount()` for comprehensive coverage

| Field | Value |
|-------|-------|
| **Name** | Use both Sentinel and query count assertions |
| **Category** | Strategy |
| **Rule** | Use Query Sentinel for pattern detection (N+1, duplicates, slow queries) and `expectsDatabaseQueryCount()` for exact budget enforcement. They are complementary, not alternatives. |
| **Reason** | Sentinel catches unexpected patterns (a new N+1 that wasn't there before). Query count assertions enforce known budgets (preventing the count from inflating over time). Sentinel alone misses gradual inflation; assertions alone miss new patterns. |
| **Bad Example** | Relying only on Sentinel — gradual query inflation over 10 PRs adds 20 queries undetected. |
| **Good Example** | Sentinel catches the N+1. `expectsDatabaseQueryCount()` prevents the budget from growing silently. |
| **Exceptions** | None. Both should be used together. |
| **Consequences Of Violation** | Gradual query inflation goes undetected (no assertions), or unexpected N+1 patterns are missed (no Sentinel). |

---

### Rule 5: Disable Query Sentinel in production

| Field | Value |
|-------|-------|
| **Name** | Never run Sentinel in production |
| **Category** | Deployment |
| **Rule** | Ensure Query Sentinel is disabled in the production environment. Set `QUERY_SENTINEL_ENABLED=false` in production configuration. |
| **Reason** | Sentinel captures stack traces, runs EXPLAIN queries, and intercepts every database query — all of which add unacceptable overhead (1-10ms per query) for production traffic. It is designed for development and testing only. |
| **Bad Example** | `QUERY_SENTINEL_ENABLED=true` in production — every query adds 5ms overhead. Application slows to a crawl. |
| **Good Example** | Production `.env`: `QUERY_SENTINEL_ENABLED=false`. Only enabled in `.env.testing` and `.env.local`. |
| **Exceptions** | None. Sentinel has no place in production. Use Laravel Telescope or dedicated APM for production query monitoring. |
| **Consequences Of Violation** | Severe production performance degradation. Every database query pays 1-10ms overhead for stack trace capture and EXPLAIN analysis. |
