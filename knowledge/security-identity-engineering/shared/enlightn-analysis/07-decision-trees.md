# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Enlightn Static/Dynamic Security Analysis
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Enlightn Score Gate Threshold | What minimum score to require for CI pass | security, practicality |
| 2 | Static vs Dynamic Analysis Timing | When to run each analysis type | feedback speed, depth |

---

# Architecture-Level Decision Trees

---

## Enlightn Score Gate Threshold

---

## Decision Context

Setting the minimum Enlightn score required for CI pipeline to pass and deployment to proceed.

---

## Decision Criteria

* security
* practicality

---

## Decision Tree

Is this a new project or an existing project adopting Enlightn?
↓
New → Start at 90+ immediately (no existing debt — fix issues before deployment)
Existing → Start lower (60-70) with a baseline, increase by 10 per sprint toward 90+

What is the current Enlightn score?
↓
< 60 → Baseline and create a remediation plan (critical issues likely present)
60-89 → Acceptable with baseline; gate on preventing new issues
90+ → Pass CI (meets security standard)

Are critical severity issues present?
↓
YES → Score < 90 by definition — fix critical issues before worrying about the threshold
NO → 90+ threshold is achievable

Is there a security compliance requirement?
↓
YES → Score must be 95+ (compliance typically requires near-perfect configuration)
NO → 90 is the standard threshold

What is the team's tolerance for false positives?
↓
Low → May need to adjust threshold downward and skip specific checks
High → Standard 90+ threshold with baseline for acknowledged warnings

---

## Rationale

Score 90 means at least 90% of checks pass — critical issues automatically bring the score below 90 because they are weighted heavily. Starting at 90+ ensures critical misconfigurations (debug mode, weak APP_KEY, disabled CSRF) are caught before deployment. For existing projects, a gradual approach with baselines prevents the team from disabling Enlightn due to overwhelming initial failures.

---

## Recommended Default

**Default:** Score 90+ CI gate; baseline for existing projects starting at current score; progressive increase to 90+ over 1-3 sprints; compliance projects target 95+
**Reason:** Score 90 is the industry-standard threshold that ensures critical issues are resolved while allowing the team to manage non-critical items via the baseline. Going lower than 80 means critical issues pass CI. Going higher than 95 is unnecessary for most projects.

---

## Risks Of Wrong Choice

- Threshold too low (< 80): critical issues pass CI silently
- Threshold too high (95+ for existing project): always fails, team disables Enlightn
- No baseline for initial adoption: overwhelming failures cause team to abandon the tool
- Never re-evaluating threshold: configuration drift not caught
- Ignoring score composition: focusing only on the score number, not individual failed checks

---

## Related Rules

- Always Gate Deployments on Enlightn Score (05-rules.md)
- Use a Baseline to Manage Existing Issues (05-rules.md)
- Review All Failed Checks Individually (05-rules.md)

---

## Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)

---

## Static vs Dynamic Analysis Timing

---

## Decision Context

When to run static Enlightn analysis (source code review) vs dynamic analysis (HTTP request checks) in the development lifecycle.

---

## Decision Criteria

* feedback speed
* depth

---

## Decision Tree

Is a running application required for the check?
↓
YES → Dynamic analysis (security headers, CSRF enforcement, CORS headers)
NO → Static analysis (debug mode, APP_KEY, session config, mass assignment)

Where in the pipeline does this run?
↓
CI (before deploy) → Static analysis is sufficient and fast (<30 seconds)
Staging (pre-deploy) → Run dynamic analysis against the staging environment
Local development → Static analysis only (no running app)

What checks are needed?
↓
Configuration checks → Static (covers 80+ categories without a running app)
Response header checks → Dynamic (needs actual HTTP response)
Middleware enforcement → Dynamic (needs actual HTTP request)

Is a staging environment available?
↓
YES → Run dynamic analysis before every production deployment
NO → Run dynamic analysis locally or skip (still get 80%+ coverage from static)

---

## Rationale

Static analysis covers the majority (80%+) of Enlightn's 120+ checks without requiring a running application. Dynamic analysis adds response-level verification (security headers, CSRF enforcement, CORS behavior) that cannot be checked from source code alone. Running static in CI is fast and provides immediate feedback. Running dynamic on staging provides deeper verification before production deployment.

---

## Recommended Default

**Default:** Static analysis in CI on every push (`--score=90`); dynamic analysis on staging pre-deployment (`--dynamic --score=90`); static-only for local development
**Reason:** Static analysis catches configuration and code issues in seconds without infrastructure. Dynamic analysis catches runtime-level issues that static analysis cannot detect. Running both covers the full check surface at the appropriate stage — fast feedback in CI, deep verification before deploy.

---

## Risks Of Wrong Choice

- Only static, never dynamic: missing response-level issues (headers, CSRF enforcement failures)
- Only dynamic, never static: slow feedback, requires running app for every check
- Dynamic in CI without running app: all dynamic checks fail, score artificially low
- No dynamic on staging: runtime issues deployed to production undetected

---

## Related Rules

- Always Gate Deployments on Enlightn Score (05-rules.md)
- Use a Baseline to Manage Existing Issues (05-rules.md)

---

## Related Skills

- Gate Deployments on Enlightn Security Analysis Score (06-skills.md)
