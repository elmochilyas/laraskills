# Anti-Patterns for When NOT To Build Custom

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | When NOT To Build Custom |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-WNB-001 | Not-Invented-Here Syndrome | Critical | High |
| AP-WNB-002 | Rewrite as Default Response | High | High |
| AP-WNB-003 | Cost-Free Custom Illusion | Critical | High |
| AP-WNB-004 | Rebuilding the Entire Package Surface | High | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-ESC-001 (The Bottomless Escape Hatch) — from KU 04
- AP-FNA-004 (Assumption Override Optimism) — from KU 02
- AP-CPR-001 (Blind Defaultism) — from KU 01

---

## AP-WNB-001: Not-Invented-Here Syndrome

### Category
Architecture | Decision-Making

### Description
Rejecting established, well-maintained packages because "we can build it better" or "we want to own it." The team discounts the thousands of engineering hours, edge case discoveries, and community security scrutiny that the package represents. Ownership pride drives technical decisions instead of engineering analysis.

### Why It Happens
- Cultural value on "building things" over "integrating things"
- Overconfidence: "how hard can a billing system/search engine/auth system be?"
- Prior bad experience with a different package generalized to all packages
- Resume-driven development: building custom is more interesting than integrating
- "We have unique requirements" — without verifying whether they're actually unique

### Warning Signs
- "We can build that in a week" — said about functionality that a package team of 3 has maintained for 5 years
- Package evaluation focuses on its limitations rather than its capabilities
- "We'll have more control" — without acknowledging that control = responsibility for all bugs, security, and edge cases
- The team has never evaluated the package's full feature set before deciding to build custom
- "We're not a [package name] shop" — identity statement, not engineering decision

### Why Harmful
In 90% of cases, the team cannot build it better. The package has: more engineering hours invested, more users finding bugs, more edge cases discovered, more security scrutiny, more documentation, and more community knowledge (StackOverflow, blog posts). A custom build starts from zero on all dimensions. The team spends months rebuilding commodity features (caching, middleware, Blade directives) that the package already solved years ago, instead of building features unique to their business.

### Real-World Consequences
- A team rejects Spatie Permission because "we can build our own RBAC in a week." Eight weeks later, they've implemented roles and permissions but haven't built caching, middleware, Blade directives, team scoping, wildcard permissions, or an admin UI. They've spent 8 weeks building 40% of Spatie's features — and the remaining 60% are "coming soon" on the backlog forever.

### Preferred Alternative
Evaluate the package against the fit/non-fit framework (KU 02). If the package fits (scores 40+), adopt it. If some features don't fit, use the escape hatch (KU 04) for those specific flows. Only build custom when the package fundamentally doesn't fit (scores <30) AND the custom build cost over 3 years is lower than the package's friction cost. "Ownership pride" is not a valid dimension in the fit analysis.

### Refactoring Strategy
1. For each custom system that replaced a package, retroactively run the fit/non-fit analysis on the package that was rejected.
2. If the package would have scored 40+, acknowledge the "not-invented-here" decision and document the actual vs. estimated cost of the custom build.
3. Consider migrating back to the package if the custom build's maintenance cost exceeds expectations.
4. Institute a policy: "build custom" proposals must include the fit/non-fit analysis of the equivalent package and explain why the package doesn't fit.

### Detection Checklist
- [ ] "We can build that" is stated within the first 5 minutes of package evaluation
- [ ] The team spends more time criticizing the package than understanding it
- [ ] Custom build proposals never reference the existing package's feature set
- [ ] "Ownership" or "control" is cited as a primary reason without qualification
- [ ] A previously rejected package is used successfully by similar teams/companies

### Related Rules
- Measure Current Package Cost Before Comparing to Custom Build Cost
- Account for ALL Costs of Custom, Not Just Initial Build

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- Calibrated Package Recommendation Writing (KU 01)

---

## AP-WNB-002: Rewrite as Default Response

### Category
Architecture | Decision-Making

### Description
When a package shows any friction — a single difficult upgrade, a missing edge case, a confusing API — the default team response is "let's replace it." The rewrite reflex is triggered before investigating whether the friction can be resolved through better integration, escape hatches, or configuration changes.

### Why It Happens
- Frustration-driven decision making: a painful afternoon with the package creates a permanent negative association
- "Clean slate" bias: new code feels better than fixing existing integration
- Underestimating the cost of replacement vs. the cost of fixing
- Not distinguishing between package problems and integration problems

### Warning Signs
- "This package is terrible" — based on a single incident or missing feature
- The team has never explored the package's extension points, configuration options, or upgrade guides
- "Let's just rewrite it" is proposed before root-causing the actual problem
- Package replacement is discussed before measuring how much time the package actually costs per month
- The escape hatch pattern has not been tried or even considered

### Why Harmful
An hour of adapter improvement often beats a month of rewrite. Many package frictions are integration problems, not package problems: incorrect configuration, misuse of the API, lack of an adapter wrapper, or trying to use the package for a flow it explicitly doesn't support (which an escape hatch would handle). Replacing the package doesn't fix integration problems — it just moves them to a new system where the same integration mistakes will happen, plus the new system has its own bugs.

### Real-World Consequences
- A team struggles with Cashier's webhook handling for 2 days. The default response: "Cashier is terrible, let's use stripe/stripe-php directly." They spend 3 weeks rebuilding subscription management from scratch. The webhook issue was caused by a misconfigured webhook secret — a 10-minute fix. The rewrite was a 3-week solution to a 10-minute problem.

### Preferred Alternative
When package friction occurs: (1) root-cause the specific issue — is it a package bug, a configuration problem, or a misuse of the API? (2) explore the package's documented extension points — can the behavior be changed via configuration, events, or published extension hooks? (3) if the package genuinely doesn't support the flow, design an escape hatch in the adapter (KU 04). (4) only if escape hatches accumulate to >20% of usage, consider replacement.

### Refactoring Strategy
1. Require a "root cause analysis" step before any package replacement discussion. What specifically is the problem? Can it be fixed without replacing?
2. For each package friction incident, document: the root cause, whether it was a package bug or integration issue, and the fix (configuration change, escape hatch, or package upgrade).
3. After 6 months of tracking, analyze the data. Packages with high genuine bug rates are candidates for replacement; packages with high integration issue rates signal a team training need, not a package problem.

### Detection Checklist
- [ ] "Let's replace it" is the first response to package friction, not the last
- [ ] The team has not explored the package's configuration options or extension points
- [ ] Package replacement is proposed without measuring actual friction cost over time
- [ ] The escape hatch pattern has not been considered
- [ ] Previous "replace it" decisions resulted in systems that were not measurably better

### Related Rules
- Measure Current Package Cost Before Comparing to Custom Build Cost
- Evaluate Fork-Before-Build

### Related Skills
- Package Escape Hatch Strategy (KU 04)

---

## AP-WNB-003: Cost-Free Custom Illusion

### Category
Architecture | Decision-Making

### Description
Treating custom code as "free" because "we're already paying the developers." This mental accounting ignores the opportunity cost of developer time: every hour spent maintaining custom billing is an hour not spent building revenue-generating features. The package's cost is visible (composer require, upgrade time); custom code's cost is invisible (diffused across every sprint).

### Why It Happens
- Developer salaries are a fixed cost in the budget, so incremental time "doesn't cost extra"
- Maintenance time is diffused — 30 minutes here, 1 hour there — and never aggregated into a visible cost
- The package's cost is discrete (2 hours for an upgrade) and feels expensive; custom cost is continuous and feels "free"
- Teams don't track time spent on custom code maintenance separately from feature development

### Warning Signs
- "We already have the developers, so building custom doesn't cost anything extra"
- Custom code maintenance time is not tracked or budgeted
- The team doesn't know how many hours/month they spend on custom billing/auth/search maintenance
- Custom build proposals only show initial build cost, never ongoing maintenance
- If developer time were billed at $150-200/hour, the custom build decision would be different

### Why Harmful
Developer time is the most expensive resource in a software organization. If developers spend 10 hours/week maintaining a custom billing system, that's $100K+/year in opportunity cost — features NOT built, bugs NOT fixed, tech debt NOT addressed. The package's visible cost (a few hours/month for upgrades and workarounds) looks expensive compared to custom code's invisible cost (diffused maintenance that nobody tracks). The illusion that custom is cheaper persists only because nobody aggregates the true cost.

### Real-World Consequences
- A team builds a custom billing system to save $200/month on Stripe fees. The initial build takes 3 months ($60K in developer time). Ongoing maintenance takes 10 hours/week ($100K/year in developer time). Over 3 years, the custom system costs $360K. The "savings" were a $200/month fee on $100K/month in processing. The team spent $360K to avoid $7,200 in fees.

### Preferred Alternative
Track ALL time spent on custom code maintenance: bug fixes, security patches, feature additions, onboarding. Aggregate it monthly. Multiply by the fully-loaded cost of a developer ($150-200/hour). Compare against the package's total cost (integration time + upgrade time + workaround time). Only when custom cost is genuinely lower over a 3-year horizon should custom be chosen. "Developer time is free" is a fantasy — expose it with data.

### Refactoring Strategy
1. For each existing custom system, implement time tracking for maintenance. Log every hour spent on that system for one quarter.
2. Annualize the quarterly data to get a true annual maintenance cost.
3. Compare against the package alternative's estimated total cost over the same period.
4. If custom cost exceeds package cost, schedule a migration evaluation.

### Detection Checklist
- [ ] Custom build proposals show only initial build cost, never ongoing maintenance
- [ ] "Developer time is free" or equivalent statement is made or implied
- [ ] The team cannot answer "how many hours/month do we spend on our custom [billing/auth/search] system?"
- [ ] Custom code bugs are fixed in "spare time" without being tracked as maintenance cost
- [ ] The fully-loaded cost of developer time has never been calculated for cost comparison

### Related Rules
- Account for ALL Costs of Custom, Not Just Initial Build
- Measure Current Package Cost Before Comparing to Custom Build Cost

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)

### Related Decision Trees
- DT-WNB-001: Should We Exit This Package and Build Custom?

---

## AP-WNB-004: Rebuilding the Entire Package Surface

### Category
Architecture | Scope Management

### Description
When the team decides to build custom to replace a package, they rebuild the entire package surface — every feature, every edge case, every configuration option — instead of building only the specific 2-3 features the package failed at. The custom build becomes a worse clone of the package that took 5x longer than necessary.

### Why It Happens
- "If we're building custom, we should replace the whole package" — all-or-nothing thinking
- Scope creep: "while we're building the replacement, let's also add these 5 features"
- Not identifying which specific package features the team actually uses vs. what the package offers
- Fear of maintaining two billing/auth/search systems (package for 80% + custom for 20%)

### Warning Signs
- Custom build requirements list includes features the package handled perfectly for years
- "We need feature parity with Cashier" — rebuilding Cashier, not replacing Cashier
- The custom build spec is a copy of the package's documentation table of contents
- Nobody has identified the specific 2-3 areas where the package failed
- The custom build timeline is 6+ months for a system that could be a 1-month partial replacement + escape hatch

### Why Harmful
The package already solved 80-95% of the problem. Rebuilding the entire surface throws away those solutions and re-creates them from scratch — with more bugs, less documentation, and no community testing. The custom build delivers a worse version of what the package already did, and the specific features the package failed at (the reason for the exit) get lost in the scope of rebuilding everything. The project takes 6 months instead of 1 month, and at the end, the team has a system that's less reliable than the package was.

### Real-World Consequences
- A team exits Cashier because it doesn't support metered billing. Instead of building just the metered billing component (keeping Cashier for subscriptions, invoices, trials, proration), they rebuild the entire billing system: subscriptions, invoices, trials, proration, webhooks, customer portal, AND metered billing. The project takes 5 months. The resulting system has bugs in subscription handling that Cashier solved 5 years ago. The metered billing feature (the actual reason for exiting) works well — but it's buried in a sea of regressions in features that Cashier already handled perfectly.

### Preferred Alternative
Scope the custom build to ONLY the features the package fails at. Keep the package for everything else. Use the wrapper pattern (KU 03) so business logic doesn't know or care whether a given operation goes through the package or the custom code. The package handles 80% of operations; the custom code handles 20%. This is the package + escape hatch pattern at the architectural level: the package IS the package path, and the custom code IS the escape hatch. Only rebuild everything if the package fails at >50% of the surface area.

### Refactoring Strategy
1. For any planned custom build, list every feature the package currently provides. Mark each as: KEEP (use package), BUILD (custom replacement needed), or DROP (not needed by either).
2. If BUILD items are <50% of total features, the partial replacement + package retention strategy is viable.
3. If BUILD items are >50%, full replacement is warranted — but scope the MVP to only the KEEP + BUILD items, not every feature the package ever offered.
4. After the custom build is complete and stable, consider removing the package for the KEEP features as a separate, smaller project.

### Detection Checklist
- [ ] Custom build requirements include features the package handles with zero friction
- [ ] "We need feature parity" is stated without specifying which features
- [ ] The specific 2-3 reasons for exiting the package are not prominently listed in the build scope
- [ ] No analysis has been done on which package features are actually used by the application
- [ ] The custom build timeline exceeds 3 months for a single-domain system

### Related Rules
- Account for ALL Costs of Custom, Not Just Initial Build
- Evaluate Fork-Before-Build

### Related Skills
- Package Escape Hatch Strategy (KU 04)
- Package Wrapper/Boundary Pattern (KU 03)

### Related Decision Trees
- DT-WNB-001: Should We Exit This Package and Build Custom?
