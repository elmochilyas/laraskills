# Anti-Patterns for Package Fit / Non-Fit Analysis

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Fit/Non-Fit Analysis |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-FNA-001 | Download-Count Fetishism | Critical | High |
| AP-FNA-002 | Zero-Sum Package Thinking | High | Medium |
| AP-FNA-003 | Analysis Paralysis | Medium | Medium |
| AP-FNA-004 | Assumption Override Optimism | Critical | High |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-CPR-001 (Blind Defaultism) — from KU 01
- AP-CPR-004 (Tradeoff Denial) — from KU 01
- AP-WNB-001 (Not-Invented-Here Syndrome) — from KU 05

---

## AP-FNA-001: Download-Count Fetishism

### Category
Architecture | Decision-Making

### Description
Choosing packages based primarily on total download count, GitHub stars, or "trending" status — without checking maintenance health, last release date, or assumption fit. The assumption is that popularity equals quality, currency, and suitability.

### Why It Happens
- Downloads and stars are the most visible, lowest-effort metrics on Packagist and GitHub
- Blog posts and tutorials exclusively cite "X thousand stars" as a quality signal
- Engineers under time pressure use stars as a heuristic shortcut for deeper analysis
- "If 10 million people downloaded this, it must be good" — confusing adoption with active maintenance

### Warning Signs
- Package evaluation consists of checking the Packagist page and reading the download count
- "It has X stars" is the primary justification for package selection
- No one has checked when the last commit was made or whether the test suite passes
- The package shows 10K+ stars but the issue tracker has 200+ open issues with no maintainer response

### Why Harmful
Popularity = past usage, not current maintenance. A package downloaded 5M times in 2021 may be abandonware in 2026. Unmaintained packages don't receive security patches, PHP 8.3+ updates, or Laravel 13 support. Adopting abandonware creates instant technical debt: no upgrade path when the framework moves forward, no security patches when CVEs are discovered, no bug fixes when edge cases are found.

### Real-World Consequences
- A team adopts a widely downloaded OAuth package with 8K stars. The package hasn't been updated in 2 years. Six months later, a CVE is disclosed in the OAuth library it depends on. The package maintainer never patches it. The team must perform an emergency migration to a maintained alternative under a security deadline.
- A popular queue monitoring package with 5K stars is adopted for a production system. The team discovers it doesn't support Redis Cluster, a critical requirement. "But it had so many stars" becomes the post-mortem punchline.

### Preferred Alternative
Stars and downloads are secondary signals used as tiebreakers between two otherwise equal packages. The primary signals are: last release date, release frequency, issue response time, PR merge rate, test suite status, PHP 8.3+ support, Laravel 13 support, and maintainer bus factor. Use GitHub's Insights > Pulse and the Actions tab to verify maintenance health before checking stars.

### Refactoring Strategy
1. Audit existing packages in `composer.json`. For each, check last release date on Packagist or GitHub.
2. Flag packages with no releases in 12+ months for re-evaluation (see KU 05).
3. For packages flagged as unmaintained but currently functional, schedule a replacement evaluation within the next quarter.
4. Add a pre-adoption checklist: "Maintenance health verified (last release < 6 months, CI passing, PHP 8.3+ supported)" before any new `composer require`.

### Detection Checklist
- [ ] Package adoption justification references stars or downloads as primary evidence
- [ ] Last release date is unknown or unchecked at adoption time
- [ ] `composer.json` contains packages the team "assumes are maintained" but hasn't verified
- [ ] The team has been surprised by a package being abandoned after adoption

### Related Rules
- Check Maintenance Health Beyond Stars and Downloads
- Score Each Dimension, Do Not Rely on Gut Feeling

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)
- When NOT To Build Custom (KU 05)

### Related Decision Trees
- DT-FNA-002: Is the Maintenance Health Assessment Sufficient to Trust This Package?

---

## AP-FNA-002: Zero-Sum Package Thinking

### Category
Architecture | Decision-Making

### Description
Treating package decisions as mutually exclusive: "If we use Spatie Permission, we can never use native Gates. If we use Cashier, we can never use stripe/stripe-php directly." This false dichotomy forces the team into all-or-nothing decisions that ignore hybrid approaches.

### Why It Happens
- Architectural purity culture: "one way to do things" enforced through code review
- Fear of complexity: "two ways to do authorization will confuse the team"
- Previous bad experience with hybrid approaches that weren't properly bounded
- Simplistic mental model: package == the entire solution architecture

### Warning Signs
- "We can't use Scout because we have some queries that need complex SQL filters" — ignoring that the escape hatch pattern exists
- "We must choose between Cashier and direct Stripe" — ignoring that a BillingGateway wrapper can use both
- Team debates package choice as if the decision is permanent and total
- No consideration of partial adoption or gradual migration

### Why Harmful
The zero-sum mindset forces suboptimal package choices. The team rejects Scout because 5% of searches need SQL filters, even though Scout handles the other 95% perfectly. They reject Cashier because one edge case needs Stripe Connect, even though Cashier handles subscriptions for 95% of flows. The result: either a package that doesn't fit is forced to work (no escape hatch), or a package that fits 95% of flows is rejected entirely.

### Real-World Consequences
- A team debates for two weeks whether to use Spatie Permission or native Gates. The application needs RBAC (roles, permissions, caching, Blade directives) for 80% of authorization and ReBAC (relationship-based) for 20%. They could use Spatie for RBAC + native Gates for ReBAC with an escape hatch. Instead, they choose native Gates for everything, spending 3 weeks rebuilding RBAC features that Spatie provides out of the box.

### Preferred Alternative
Adopt the package for the flows it handles well. Use the escape hatch pattern (KU 04) for flows it does not. Bind both behind a common interface (KU 03). The result is a hybrid approach: the package handles 80-95% of use cases; the escape hatch handles the rest. Business logic sees only the interface — it doesn't know or care which path is active.

### Refactoring Strategy
1. Identify where the team is currently avoiding a package because of a single non-fit condition.
2. Evaluate whether the escape hatch pattern could cover that specific non-fit condition while the package covers everything else.
3. If escape hatch coverage would be <20% of the package's surface, adopt the hybrid approach.
4. Document which flows use the package path and which use the escape hatch path.

### Detection Checklist
- [ ] Package evaluation focuses on "does it do everything?" rather than "does it do enough?"
- [ ] A package is rejected because of a single non-fit condition affecting <20% of use cases
- [ ] Hybrid approaches (package + escape hatch) are never proposed or considered
- [ ] "We're a [package name] shop" is stated as an identity, not a decision

### Related Rules
- Score Each Dimension, Do Not Rely on Gut Feeling

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- Package Wrapper/Boundary Pattern (KU 03)

---

## AP-FNA-003: Analysis Paralysis

### Category
Architecture | Process

### Description
Spending more time analyzing packages than building the feature. The analysis framework (7 dimensions, scored, with a spike) becomes an end in itself rather than a decision-making tool. The team spends 3 weeks evaluating billing packages while the feature sits unbuilt.

### Why It Happens
- Perfectionism: "we must find the perfect package before we write a single line of code"
- Process over outcome: the analysis framework is applied with excessive rigor to non-critical decisions
- Fear of wrong choice: analysis becomes a delay tactic to avoid committing to a package
- Lack of decision authority: the team analyzes endlessly because nobody has authority to say "good enough"

### Warning Signs
- Package evaluation spans more than 1 week for a non-architectural package
- Spike work expands to "let's build the entire feature with all 3 packages and compare"
- Team has scored 5 packages for the same decision — only the top 2 candidates were ever realistic
- "We need more data" is the recurring blocker when sufficient data already exists

### Why Harmful
The analysis cost exceeds the decision risk. A 3-week analysis of a package that costs 2 days to replace if it's wrong is net negative. The feature is delayed, and the analysis delivers diminishing returns after the first 1-2 packages are evaluated. The team burns engineering time on analysis that could have been spent building.

### Real-World Consequences
- A team spends 2 weeks scoring 4 feature flag packages for a decision that needs a simple boolean toggle. They choose Pennant, which takes 30 minutes to integrate. The analysis cost (80 engineering hours) was 160x the integration cost. Any of the 4 packages would have worked acceptably.

### Preferred Alternative
Calibrate the analysis depth to the decision's architectural significance. For architectural decisions (billing, auth, search, queue): full 7-dimension analysis, 4-8 hours max. For non-architectural decisions: 3-dimension abbreviated analysis (ecosystem, fit, maintenance), 1-2 hours max. For trivial decisions: pick the most maintained package and move on. Set a timebox for analysis before starting. When the timebox expires, make a decision with the data available.

### Refactoring Strategy
1. Categorize pending package decisions into architectural, non-architectural, and trivial.
2. Apply timeboxed analysis appropriate to each category.
3. Institute a "decide by default" rule: if analysis exceeds the timebox, adopt the package with the highest maintenance health score and document it as a "timed decision" to be re-evaluated in 3 months.

### Detection Checklist
- [ ] A package evaluation has been open or in progress for more than 1 week
- [ ] More than 3 packages are being compared for the same decision
- [ ] "We need more data" is stated when the team already has sufficient data to decide
- [ ] The analysis writes more documentation than the feature will require
- [ ] The team can't identify who has the authority to make the final call

### Related Rules
- Score Each Dimension, Do Not Rely on Gut Feeling (the "exceptions" section permits abbreviated analysis for non-critical decisions)

### Related Skills
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-FNA-004: Assumption Override Optimism

### Category
Architecture | Risk Management

### Description
Adopting a package whose core assumptions don't match the project's requirements, with the belief that "we can override that behavior" or "we can extend it to work." The team underestimates how much of the package must be overridden and overestimates how cleanly those overrides will work.

### Why It Happens
- Overconfidence in Laravel's extensibility: "everything is overridable in Laravel, we can make it work"
- Desire to use a well-known package: "everyone uses Cashier, we should too" regardless of fit
- Misreading the package's extensibility points: assuming protected methods are designed for override when they're internal
- Underestimating override maintenance cost: "we'll override 3 methods" becomes "we'll maintain a fork"

### Warning Signs
- "We just need to override a few methods" — without knowing which methods or how many
- Package recommendation acknowledges assumption mismatches but rates assumption fit 7/10 anyway
- Team plans to extend the package's internal classes (not its published extension points)
- Nobody has spiked the planned overrides to verify they work

### Why Harmful
Overrides break on package upgrades. A protected method that was overridden in v1 may disappear or change signature in v2. The team must either: (a) freeze the package version forever (security risk), (b) fix overrides on every upgrade (maintenance burden), or (c) give up and maintain a fork. All three outcomes are worse than choosing a package that actually fits.

### Real-World Consequences
- A team adopts a Laravel package with "only 5 overrides." Over 18 months, the package releases 4 minor versions. Each upgrade breaks 2-3 overrides. The team spends 2-4 hours per upgrade fixing overrides. By month 18, they've overridden 12 methods (35% of the package). They're effectively maintaining a private fork without acknowledging it.

### Preferred Alternative
Apply the 20% threshold rule: if you need to override >20% of a package's methods, the package doesn't fit. Use the escape hatch pattern (KU 04) for the specific flows the package doesn't handle, keeping the package intact for flows it handles well. If escape hatch usage would exceed 20%, the package is wrong — find an alternative or build custom for that specific concern.

### Refactoring Strategy
1. Audit existing package overrides in the codebase. Count overridden methods vs. total package methods used.
2. For packages where override percentage exceeds 20%, trigger the package exit evaluation (KU 05).
3. For packages with 5-20% overrides, document each override with the reason and test the override against the next package upgrade.
4. Institute a pre-adoption rule: if the spike reveals that more than 3 methods need overriding, the package doesn't fit.

### Detection Checklist
- [ ] "We can override that" is stated during package evaluation without a spike to verify
- [ ] Package upgrade changelog is checked for breaking changes to overridden methods
- [ ] Existing package overrides are not documented or tracked
- [ ] The team has been surprised by a package upgrade breaking their overrides
- [ ] Override count exceeds 20% of the package surface used by the application

### Related Rules
- Test the Package's Assumptions in a Spike Before Adopting
- Weight Lock-In Risk Higher Than Other Dimensions

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- When NOT To Build Custom (KU 05)

### Related Decision Trees
- DT-FNA-003: Should This Package Be Adopted Despite Assumption Mismatches?
