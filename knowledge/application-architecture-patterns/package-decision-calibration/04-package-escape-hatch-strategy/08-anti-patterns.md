# Anti-Patterns for Package Escape Hatch Strategy

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Package Escape Hatch Strategy |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-ESC-001 | The Bottomless Escape Hatch | Critical | Medium |
| AP-ESC-002 | Escape Hatch as Excuse for Poor Package Selection | Critical | High |
| AP-ESC-003 | Silent Escape | High | High |
| AP-ESC-004 | Untested Escape Hatch | Critical | High |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-WRP-001 (The Passthrough Wrapper) — from KU 03
- AP-FNA-004 (Assumption Override Optimism) — from KU 02
- AP-WNB-003 (Cost-Free Custom Illusion) — from KU 05

---

## AP-ESC-001: The Bottomless Escape Hatch

### Category
Architecture | Risk Management

### Description
An escape hatch that starts as 1-2 methods for genuine edge cases but gradually grows to cover 40%+ of the adapter's methods. The escape hatch becomes the primary implementation, while the package provides diminishing value. The team is maintaining two parallel implementations of the same capability under the guise of "escape hatches."

### Why It Happens
- Incremental creep: each new requirement adds one more escape method, and nobody tracks the cumulative percentage
- Sunk cost: "we've already invested in the package and the escape hatch — replacing either seems wasteful"
- Lack of monitoring: escape hatch usage isn't tracked, so the team doesn't realize it's grown to 40%
- Deferring the hard decision: "we should probably replace this package" is acknowledged but never actioned

### Warning Signs
- Escape methods outnumber package-path methods in the adapter
- New features default to the escape path because "the package probably doesn't support it"
- Package upgrades are skipped or feared because they might break escape methods
- The team refers to the escape hatch code as "the real billing system"

### Why Harmful
The team is paying the cost of both the package (upgrades, schema coupling, vendor lock-in) AND the cost of custom code (maintenance, testing, debugging). The package provides negative value — it adds complexity and constraints without covering the majority of use cases. The escape hatch is no longer a safety valve; it's a migration that was never acknowledged as one. The worst outcome: the package upgrade breaks the escape methods, and the team discovers they've been maintaining a hidden custom implementation.

### Real-World Consequences
- A team adopts Cashier with an escape hatch for Connect transfers. Over 2 years, they add escape methods for metered billing, custom invoicing, multi-currency, and tax handling. By year 2, 7 of 10 adapter methods use the escape hatch. When Cashier v15 is released, it breaks 4 of the 7 escape methods. The team cannot upgrade Cashier without rewriting the escapes — which IS the billing system. They're trapped: can't upgrade, can't easily exit.

### Preferred Alternative
Monitor escape hatch usage from day one. When usage crosses 20%, trigger a package exit evaluation (KU 05) — replace the package with the alternative that was identified in the original calibrated recommendation. If no alternative exists, acknowledge that the escape hatch IS the implementation and remove the package, promoting the escape hatch code to the primary adapter. Either way, stop maintaining two implementations.

### Refactoring Strategy
1. Count escape methods vs. total adapter methods. Calculate the escape hatch percentage.
2. If >20%: trigger package exit evaluation. Either: (a) switch to the alternative provider, (b) make the escape hatch the primary implementation and remove the package, or (c) acknowledge the hybrid approach as permanent and invest in properly testing the escape path.
3. If 10-20%: set a hard ceiling. No new escape methods without removing old ones.
4. If <10%: add monitoring to prevent creep. Review escape hatch percentage quarterly.

### Detection Checklist
- [ ] Escape methods outnumber package-path methods in any adapter
- [ ] The team cannot quickly answer "what percentage of our billing flows use Cashier vs. the escape hatch?"
- [ ] Package upgrades are delayed or skipped because "we need to check the escape methods"
- [ ] New team members are confused about why the package exists when "everything goes through the escape"
- [ ] Escape hatch percentage has not been reviewed in 6+ months

### Related Rules
- Limit Escape Hatch Surface to 2-3 Methods
- Log Every Escape Hatch Activation
- Measure Current Package Cost Before Comparing to Custom Build Cost

### Related Skills
- When NOT To Build Custom (KU 05)
- Package Wrapper/Boundary Pattern (KU 03)

### Related Decision Trees
- DT-ESC-002: Has Escape Hatch Usage Crossed the Threshold for Package Re-Evaluation?

---

## AP-ESC-002: Escape Hatch as Excuse for Poor Package Selection

### Category
Architecture | Decision-Making

### Description
Using the existence of an escape hatch pattern to justify adopting a package that fundamentally doesn't fit. "We'll just use the escape hatch for the parts that don't work" — when those parts constitute 40%+ of the required functionality. The escape hatch becomes a crutch for avoiding the hard work of finding the right package.

### Why It Happens
- Deadline pressure: "Cashier is already installed, let's just escape the parts that don't fit"
- Package lock-in: the team has already invested in the package and uses the escape hatch to avoid admitting it was the wrong choice
- Over-reliance on the pattern: "we have an escape hatch, so any package is fine"
- Misunderstanding: treating the escape hatch as a general extension mechanism rather than an edge-case safety valve

### Warning Signs
- The escape hatch is designed BEFORE the package is evaluated — the team knows it doesn't fit but adopts anyway
- The original calibrated recommendation shows 3+ non-fit conditions but rates the package "conditional fit"
- The escape hatch covers core package features, not edge cases
- "We'll just escape it" is the response to every package limitation during evaluation

### Why Harmful
The escape hatch pattern is designed for edge cases — the 5% of flows a package doesn't handle. When it's used as a justification for adopting a package that misses 40% of requirements, the team is lying to themselves about the package's fit. The escape hatch becomes the system's primary implementation from day one, and the package adds complexity, schema coupling, and vendor lock-in for the 60% of flows it does handle — a poor tradeoff. The right decision was to find a better package, but the escape hatch provided a false sense of security.

### Real-World Consequences
- A team evaluates a search package that doesn't support complex filters (a core requirement for 40% of searches). Instead of finding a package that does, they adopt it with an escape hatch to Eloquent for complex queries. From day one, 40% of searches bypass the package. The package's index becomes incomplete (it doesn't know about escaped documents). Search results are inconsistent. The "search system" is two search systems with no unified relevance ranking.

### Preferred Alternative
If the calibrated fit/non-fit analysis (KU 02) shows that >20% of the package's surface would need escape hatches, the package doesn't fit. Do not adopt it. Find a better package, build custom for the specific concern, or accept that the team will build a hybrid solution — but call it what it is, not a "package with an escape hatch."

### Refactoring Strategy
1. For each adopted package, audit the original fit analysis. Compare the predicted escape hatch usage to actual usage.
2. If actual usage exceeds 20% and was predicted to be <20%, the analysis was wrong. Re-evaluate.
3. If predicted usage was >20% but the package was still adopted, acknowledge the decision as "conscious risk acceptance" and set a hard re-evaluation date within 6 months.

### Detection Checklist
- [ ] Escape hatch is designed during package evaluation, not after adoption
- [ ] The calibrated recommendation shows 3+ non-fit conditions but still recommends adoption
- [ ] The team says "we'll use the escape hatch for X, Y, and Z" — naming 3+ key features
- [ ] The package's alternative (from the recommendation) would have handled the escaped flows natively

### Related Rules
- Design the Escape Hatch Before the First Integration
- Limit Escape Hatch Surface to 2-3 Methods

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-ESC-003: Silent Escape

### Category
Observability | Risk Management

### Description
The escape hatch activates without any logging, metrics, or monitoring. The team has zero visibility into how many flows bypass the package, which flows they are, or whether escape usage is growing. When the escape hatch becomes the primary path, nobody knows.

### Why It Happens
- "Logging is overhead" — premature optimization that skips the log call
- "We know when we're escaping" — assuming the development team's awareness substitutes for operational visibility
- Copy-paste escape code: escape methods are copied from package methods without adding the log statement
- Underestimating the value of escape hatch telemetry

### Warning Signs
- Escape methods contain no `Log::info()` or equivalent call
- There is no dashboard or metric tracking escape hatch usage
- When asked "how many billing operations used the escape hatch last month?", nobody can answer
- Post-mortems reveal that escaped flows failed but nobody knew they were escaping

### Why Harmful
Without logging, escape hatch usage grows silently. The team upgrades the package, tests the normal path, and deploys — but nobody tests the escape path because nobody knows it's being used. When the package is eventually replaced, the team discovers that 30% of production traffic was using unhnown escape methods. The replacement system misses critical functionality that only existed in the invisible escape path. Silent escapes are invisible risks.

### Real-World Consequences
- A team escapes Cashier for metered billing. The escape method is not logged. Over 18 months, the escape method handles 25% of billing operations. When the team migrates to Paddle, they discover the metered billing escape path during the migration testing phase — 2 weeks before launch. The Paddle adapter must be rebuilt to handle metered billing logic that nobody knew was in production.

### Preferred Alternative
Every escape method must log its activation with at minimum: package name, method name, reason for escape, and contextual data. Use structured logging (JSON context) so escape metrics can be aggregated in your logging platform. Create a dashboard or alert on escape hatch activation rate. Review escape metrics at quarterly architecture reviews.

### Refactoring Strategy
1. Audit all escape methods for logging. Add `Log::info('package.escape_hatch.activated', [...])` to any that lack it.
2. Set up a metric or dashboard tracking escape hatch activation rate per package.
3. Add an alert: if escape hatch rate for any package exceeds 15%, notify the architecture team.
4. Include escape hatch usage review in the quarterly architecture review agenda.

### Detection Checklist
- [ ] Any escape method lacks a log statement on activation
- [ ] The log message does not include package name, method name, and reason
- [ ] There is no aggregated view of escape hatch usage across packages
- [ ] The team cannot answer "how much of our traffic uses escape hatches?"
- [ ] Escape hatch code paths are not covered by monitoring/alerting

### Related Rules
- Log Every Escape Hatch Activation

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)

### Related Decision Trees
- DT-ESC-002: Has Escape Hatch Usage Crossed the Threshold for Package Re-Evaluation?

---

## AP-ESC-004: Untested Escape Hatch

### Category
Testing | Reliability

### Description
Escape hatch methods exist in the adapter but have no corresponding tests. The escape path is "production-tested" — the first time it executes is under real user traffic. When the escape hatch is needed, it fails because of untested edge cases, incorrect API calls, or missing error handling.

### Why It Happens
- "We'll test it when we need it" — treating escape hatches as contingency code, not production code
- Escape methods are private, making them harder to test directly
- Test setup for escape paths is more complex (requires different test fixtures than the package path)
- The escape hatch was added under time pressure and testing was deferred indefinitely

### Warning Signs
- Escape methods have no corresponding test methods in the adapter's integration test file
- The escape path is not exercised in CI
- Code coverage reports show escape methods as uncovered
- "We tested the escape hatch manually" — manual testing that's never repeated

### Why Harmful
Untested escape hatch code is more dangerous than untested package code because it lacks the package's community-vetted safeguards. The package path benefits from thousands of other applications testing it; the escape hatch path benefits from zero testing. When the escape hatch activates under production load, it fails with errors that the package path would have handled: missing idempotency keys, incorrect webhook verification, unhandled API error responses. The safety net becomes a trap.

### Real-World Consequences
- A team adds an escape hatch for direct Stripe API calls (bypassing Cashier for Connect transfers). The escape method is not tested. Six months later, the first Connect transfer occurs in production. The escape method fails because it doesn't handle the `stripe_account` header correctly. The payment fails. The customer's funds are stuck. The escape hatch was supposed to be the safety net — instead, it was the point of failure.

### Preferred Alternative
Every escape method must have at least one integration test from day one. The test should exercise the escape path with the same rigor as the package path. If the escape path involves real API calls, use Http::fake() or the vendor's test mode. If the escape path uses a different SDK than the package path, test the SDK integration specifically. The escape hatch must be production-grade — it will be used in production, and it must not fail.

### Refactoring Strategy
1. Audit all escape methods. Identify any without tests.
2. For each untested escape method, write at minimum one integration test. Use Http::fake() for API calls, test mode credentials for real services.
3. Add escape path coverage to CI requirements. If the escape path is untested, the CI build should warn or fail.
4. Include escape hatch tests in the package upgrade test suite — verify escapes still work after upgrading the package.

### Detection Checklist
- [ ] Any escape method has zero corresponding test methods
- [ ] Code coverage reports show uncovered lines in escape methods
- [ ] "We tested it manually" is the stated testing strategy
- [ ] CI pipeline does not exercise escape hatch code paths
- [ ] Package upgrade testing does not include escape path verification

### Related Rules
- Test Both Paths — Package Path and Escape Hatch Path

### Related Skills
- Package Wrapper/Boundary Pattern (KU 03)

### Related Decision Trees
- DT-ESC-001: Does This Flow Need the Escape Hatch or the Normal Package Path?
