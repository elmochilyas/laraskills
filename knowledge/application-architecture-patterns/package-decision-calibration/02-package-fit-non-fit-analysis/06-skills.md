# Skill: Package Fit/Non-Fit Scoring Analysis

## Purpose
Evaluate third-party Laravel packages against seven concrete dimensions to produce a risk-calibrated adoption recommendation (strong fit, conditional fit, or high-risk fit) — preventing both "adopt everything" and "build everything" extremes.

## When To Use
- Evaluating a new package for adoption in an existing codebase
- Re-evaluating an existing package during Laravel major version upgrades or provider API changes
- Comparing multiple packages that solve the same problem (e.g., Paddle vs. LemonSqueezy)
- Justifying a "build custom" decision with objective data rather than gut feeling
- Technical due diligence for compliance-sensitive projects (SOC2, HIPAA, PCI-DSS)

## When NOT To Use
- Framework-native features where no package decision exists (Eloquent, Blade, routing)
- Trivial utility packages with zero architectural impact (string formatters, array helpers)
- Packages already deeply integrated where re-scoring would not change behavior
- Time-critical hotfix situations where the analysis itself would block the fix

## Prerequisites
- The project's concrete technical requirements (PHP version, Laravel version, database, queue driver, cache driver)
- Access to the package's GitHub repository (insights, releases, issue tracker)
- Understanding of the calibrated recommendation framework (KU 01)
- A 1-2 day spike budget to verify assumptions before final scoring

## Inputs
- The package name and repository URL
- The business requirement the package addresses
- The project's current technology stack (database, queue, cache, PHP version)
- Any existing packages that might conflict
- The team's prior experience with the package or its underlying technology

## Workflow
1. **Score ecosystem alignment (1-10)** — Check PHP version requirements, Laravel version support, database compatibility, redis dependency, conflicting packages. Deduct 2 points per mismatch.
2. **Score assumption fit (1-10)** — List every assumption the package makes. For each assumption, verify against your actual requirements. "Assumes Stripe-only" vs. "We need multi-provider." Deduct 3 points per core assumption mismatch.
3. **Score escape hatch availability (1-10)** — Can you bypass the package for flows it can't handle? Name the concrete escape path. Deduct 5 points if no escape hatch exists and the package owns schema.
4. **Score team familiarity (1-10)** — Count team members with prior experience. Score documentation quality. Check community support channels. A team with zero experience scores 2-3, not 0 — documentation and community can compensate.
5. **Score long-term commitment risk (1-10)** — Check maintainer (individual vs. org vs. company). Check release frequency. Count active maintainers (bus factor). A solo maintainer with sporadic releases scores 2-3.
6. **Score package maintenance health (1-10)** — Last release date. Open vs. stale issues. PR merge rate. CI status. PHP 8.3+ support. Laravel 13 support. No commits in 6+ months = automatic score < 3.
7. **Score testing complexity (1-10)** — Built-in fakes? Requires real API calls? Mocking difficulty? Test speed impact? CI configuration needed? Packages requiring real Stripe keys for all tests score 4-5.
8. **Calculate total and classify** — Sum scores (max 70). 50+ = Strong fit. 30-49 = Conditional fit (document conditions). <30 = High-risk fit (requires explicit signoff). If lock-in risk scored < 4, downgrade the final recommendation by one tier.

## Validation Checklist
- [ ] All seven dimensions scored numerically (1-10), not left blank or guessed
- [ ] Assumption mismatches are explicitly listed with specific package assumptions vs. actual requirements
- [ ] Maintenance health includes last release date, not just "well maintained"
- [ ] Escape hatch path is concrete (names a specific SDK, class, or migration path)
- [ ] Testing complexity names specific strategies required (fakes, real API keys, test clocks)
- [ ] Recommendation tier matches the actual score (not inflated to justify a pre-existing preference)
- [ ] Conditional fit includes written conditions that can be re-checked in 6-12 months
- [ ] Lock-in risk is weighted more heavily — if scored < 4, recommendation is downgraded by one tier
- [ ] Analysis stored in project documentation (ADR directory or docs/decisions/)
- [ ] At least one dimension validated via spike, not documentation alone

## Common Failures
- Scoring based on gut feeling rather than checking actual GitHub data and test results
- Giving ecosystem alignment a 9/10 when the package requires PostgreSQL and the team uses MySQL — that's a 6 or lower
- Scoring maintenance health high because "it has 10K stars" while ignoring that the last commit was 18 months ago
- Ignoring assumption mismatches because "we can override that behavior" (the 20% threshold rule)
- Not factoring team ramp-up time — a package the team has never used should score 2-4 on familiarity, not 7
- Treating the recommendation as immutable — scores change when packages release new majors or business requirements shift

## Decision Points
- **Strong fit (50-70):** Proceed with adoption. Document conditions if any dimension scored below 6.
- **Conditional fit (30-49):** Adopt only if the documented conditions are met AND the team accepts the risks. Re-evaluate in 6 months.
- **High-risk fit (<30):** Do not adopt unless there is no alternative and a VP/CTO signs off on the risk. The package fundamentally doesn't fit.
- **Lock-in severity override:** If lock-in is scored < 4, downgrade the final tier regardless of total score. Lock-in is the hardest dimension to undo.

## Performance Considerations
- A full 7-dimension analysis with a spike takes 4-8 hours — a one-time cost per package
- The cost of skipping analysis is measured in weeks: removing a deeply integrated package that doesn't fit
- For non-architectural packages, use a 4-dimension abbreviated analysis (ecosystem, fit, escape hatch, maintenance)

## Security Considerations
- Maintenance health score is a security signal — unmaintained packages don't receive security patches
- Use `composer audit` to check the package's dependency chain for known vulnerabilities
- Evaluate how the package handles credentials — `.env` values are normal, hardcoded keys are a red flag
- The escape hatch path must meet the same security standards as the package path

## Related Rules (from 05-rules.md)
- Score Each Dimension, Do Not Rely on Gut Feeling
- Weight Lock-In Risk Higher Than Other Dimensions
- Test the Package's Assumptions in a Spike Before Adopting
- Check Maintenance Health Beyond Stars and Downloads
- Re-Run Analysis on Major Version Upgrades

## Related Skills
- Calibrated Package Recommendation Writing (KU 01)
- Package Wrapper/Boundary Pattern (KU 03)
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)

## Success Criteria
- The analysis scorecard is complete with all seven dimensions numerically scored and justified with specific evidence, not opinions. The recommendation tier accurately reflects the scores. A team member who has never seen the package can read the analysis and understand exactly which dimensions are strong, which are weak, and what conditions must be monitored.
