# Skill: When NOT To Build Custom — Exit Decision Making

## Purpose
Make disciplined, data-driven decisions about when to abandon a third-party package in favor of custom code — preventing both premature abandonment (rewriting 95%-working packages) and delayed abandonment (maintaining packages that became net negatives years ago).

## When To Use
- When a package shows 3+ liability signals (method overrides >30%, core assumption fights, unmaintained status)
- During annual architecture review for all major package dependencies
- When a package's maintainer announces deprecation or abandonware status
- When estimating a new feature and "build custom" is on the table
- When escape hatch usage exceeds 20% of flows (the escape hatch is becoming the primary implementation)

## When NOT To Use
- When the package works fine but the team "wants to own it" — ownership pride is not a valid reason
- For packages handling commodity concerns (email, logging, caching) — these are solved problems
- When the team hasn't measured the actual cost of the current package — measure before deciding
- For a single override or single missing feature — use the escape hatch pattern instead (KU 04)

## Prerequisites
- Accurate measurement of current package cost (hours/month spent on workarounds, upgrades, debugging)
- Complete custom build cost estimation including 3-year maintenance projection
- Understanding of the Calibrated Package Recommendation (KU 01) — the original recommendation may contain exit triggers
- Knowledge of the Escape Hatch Strategy (KU 04) — ensure escape hatch has been tried before exit

## Inputs
- Current package cost data (tracked over 2-4 weeks, not estimated from memory)
- List of package liability signals present (from the 8-signal checklist)
- Original calibrated recommendation (if it exists — contains fit conditions and exit triggers)
- Escape hatch usage percentage (from monitoring data)
- The package's alternative (from the original recommendation or a new evaluation)

## Workflow
1. **Measure current package cost** — Track actual hours spent on package workarounds, upgrade friction, debugging, and documentation over 2-4 weeks. Do not estimate from memory — frustration inflates estimates. Use a time-tracking category or quick log.
2. **Check liability signals** — Run through the 8 liability signals. Count how many are present. If <3, the package likely still fits. If 3+, exit evaluation is warranted.
3. **Estimate full custom build cost** — Initial build (weeks) + 3 years of maintenance (hours/month). Include: bug fixes, security patches, feature parity, onboarding docs, production incident response. Ongoing maintenance typically costs 2-3x the initial build over 3 years.
4. **Evaluate fork-before-build** — If the package is 80% right, estimate the cost of forking and maintaining the fork. Forking preserves documentation, community knowledge, and the existing test suite. Forking costs ~25% of a full custom build.
5. **Compare costs over 3-year horizon** — Package cost (integration + upgrades + workarounds) vs. custom cost (initial build + 3 years maintenance) vs. fork cost. Choose the lowest-cost option that meets requirements.
6. **Scope the custom build narrowly** — If custom wins, build ONLY the features the package fails at. Do not rebuild features the package already handles well. The goal is replacement, not expansion.
7. **Plan the migration timeline** — Exit is a project, not a task. Budget 2 weeks for simple packages, 2 months for billing systems. Include a parallel run period where both old and new systems operate. Migrate data carefully if the package owns schema.

## Validation Checklist
- [ ] At least 3 liability signals present before recommending package exit
- [ ] Current package cost has been measured, not estimated from memory
- [ ] Custom build cost includes initial build + 3 years of maintenance (not just initial build)
- [ ] Fork-and-maintain option has been evaluated before committing to full custom build
- [ ] Custom build scope is limited to features the package actually fails at (not the entire package surface)
- [ ] Exit triggers existed for every major package BEFORE adoption (or are documented now)
- [ ] Migration timeline includes a parallel run period
- [ ] Security and compliance implications of custom build are documented and accepted
- [ ] The escape hatch pattern was tried (or evaluated) before the exit decision
- [ ] The team accepts that custom code receives no community security scrutiny

## Common Failures
- Abandoning a package because of a single frustrating debugging session, without measuring actual cost
- Underestimating ongoing maintenance: assuming custom code is "done" after initial build
- Rebuilding the entire package surface area instead of just the features that don't fit
- Exiting because of 3 overrides when the package has 50 methods (6% override rate — normal)
- Not evaluating the fork option and jumping straight to "build from scratch"
- Treating developer time as free: "we're already paying the developers"

## Decision Points
- **Exit now vs. wait**: Is the package's cost increasing (maintainer leaving, breaking API changes) or stable?
- **Fork vs. build custom**: Can the fork preserve enough package value to justify the ongoing rebase cost?
- **Full exit vs. partial exit**: Can the package be kept for some features while custom handles others?
- **Exit timing**: Should exit happen during a feature cycle (urgent) or between cycles (safe)?

## Performance Considerations
- Custom builds may be slower initially — packages have years of profiling and optimization
- If the package causes N+1 queries or bloated serialization, switching to custom may improve performance — measure the package's query footprint
- Fork maintenance overhead includes rebasing on upstream releases — budget 2-4 hours per upstream release

## Security Considerations
- The biggest security cost of custom code: no community security scrutiny. Every vulnerability is yours to find and fix
- Building custom auth, billing, or encryption is a compliance red flag for SOC2, PCI-DSS, HIPAA — prefer established packages
- Security patch latency: with packages, patches come from the community. With custom, you must actively monitor your own code for vulnerabilities
- Budget 2-4 hours/month for security review of custom code

## Related Rules (from 05-rules.md)
- Measure Current Package Cost Before Comparing to Custom Build Cost
- Account for ALL Costs of Custom, Not Just Initial Build
- Evaluate Fork-Before-Build
- Set an Exit Threshold Before Adopting a Package

## Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- Package Escape Hatch Strategy (KU 04)
- Calibrated Package Recommendation Writing (KU 01)

## Success Criteria
- The exit decision is based on measured data (package cost over 4 weeks, custom cost over 3 years), not feelings. The team can point to specific liability signals and cost numbers that justify the decision. If the team chose to keep the package, they can explain why the measured cost is lower than the custom alternative.
