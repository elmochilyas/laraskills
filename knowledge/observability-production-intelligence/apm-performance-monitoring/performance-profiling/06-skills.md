# Anti-Patterns: Performance Profiling

## AP-PP-01: Profiling Everything Continuously

**Description:** Running profilers 24/7 in production, accumulating massive amounts of profile data.

**Why It Happens:** "More data is better" — teams configure profilers to always run and never review the output, assuming the data will be useful someday.

**Consequences:**
- Continuous 5-15% overhead reduces application capacity
- Profile data accumulates in TBs without actionable insights
- Team becomes desensitized to profiling data — never reviews it
- When a real performance issue occurs, the continuous noise obscures the signal

**Detection:** Check if profiling tool is configured with "always on" mode vs "on-demand" mode in production. Check profile data storage growth rate.

**Remediation:** Configure profiling to run on-demand only. Trigger via APM alerts or manual investigation requests. Set data retention limits.

---

## AP-PP-02: Micro-Optimization Without Profile Evidence

**Description:** Refactoring code to be "faster" based on developer intuition rather than profile data.

**Why It Happens:** Developers have strong intuitions about what is slow — loops must be slow, function calls are expensive, "this looks inefficient." Almost all developer intuition about performance bottlenecks is wrong.

**Consequences:**
- Engineering time spent optimizing code that is not the bottleneck (Amdahl's Law — optimizing 5% of runtime yields 5% improvement max)
- Code complexity increases from refactoring that proves unnecessary
- Real bottlenecks remain unfixed

**Detection:** Review PRs that claim performance improvements. If the description does not include "before/after profiling data," this anti-pattern may be active.

**Remediation:** Require profiling evidence for all performance-related changes. Capture "before" profile, implement optimization, capture "after" profile, include both in PR description.

---

## AP-PP-03: Profiling Under No Load

**Description:** Capturing single-request profiles without concurrent traffic, generating profiles that miss contention, garbage collection, and resource pool exhaustion.

**Why It Happens:** Convenience — capturing a profile via browser request or Curl is quick. Setting up load generation requires additional tooling.

**Consequences:**
- Profile shows 50ms wall time for the request — but under load it takes 500ms
- Missing: database connection pool contention, Redis connection limits, PHP-FPM process starvation
- Optimization based on no-load profile may not improve production performance

**Detection:** Check if profiling was performed with concurrent load. Any profile captured without load generation tool (k6, Locust, ab) is suspect.

**Remediation:** Use load generation tools to profile under realistic concurrency. Target 80% of expected peak throughput during profiling sessions.

---

## AP-PP-04: CI Performance Budget Too Tight

**Description:** Setting CI performance budgets at baseline + 5% or tighter, causing frequent false-positive failures.

**Why It Happens:** Teams want strict performance enforcement. They set budgets based on a single profile run without understanding normal variance.

**Consequences:**
- CI builds fail intermittently due to normal performance variance (5-15%)
- Team disables performance budgets due to frustration
- Real regressions are lost because the alerting is ignored

**Detection:** Check CI failure rate for performance budget violations. If >10% of builds fail and manual review confirms no actual regression, the budget is too tight.

**Remediation:** Set budgets at baseline + 20%. Monitor failure rate for 1 month. If no failures, tighten to +15%. If too many false failures, loosen.
