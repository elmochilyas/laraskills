# Anti-Patterns for Calibrated Package Recommendation

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Calibrated Package Recommendation |
| Anti-Pattern Count | 4 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-CPR-001 | Blind Defaultism | Critical | High |
| AP-CPR-002 | Analysis Without Action | High | Medium |
| AP-CPR-003 | Recommendation Without Expiration | High | High |
| AP-CPR-004 | Tradeoff Denial | Medium | High |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-FNA-001 (Download-Count Fetishism) — from KU 02
- AP-FNA-002 (Zero-Sum Package Thinking) — from KU 02
- AP-ESC-001 (The Bottomless Escape Hatch) — from KU 04
- AP-WNB-001 (Not-Invented-Here Syndrome) — from KU 05

---

## AP-CPR-001: Blind Defaultism

### Category
Architecture | Decision-Making

### Description
Always recommending the same package regardless of context. "Use Spatie for authorization" becomes a reflex applied to every project, every team, every requirement. The recommendation is not calibrated to the specific project's fit conditions — it's a default, not a decision.

### Why It Happens
- Team or individual has deep expertise with one package and recommends it universally
- "Best practice" blog posts recommend a package without contextualizing fit conditions
- Previous projects used the package successfully, so the assumption is it will always fit
- Laziness: it's faster to say "use Spatie" than to analyze whether Spatie actually fits

### Warning Signs
- The same package name appears in every recommendation regardless of project requirements
- Fit conditions are left blank or contain only subjective criteria ("good developer experience")
- Non-fit conditions are never tested because "we always use this package"
- New team members are told "we use X" without explanation of why

### Why Harmful
The package may be fundamentally wrong for the project's requirements. A team using Spatie Permission for relationship-based authorization (ReBAC) creates an explosion of roles to simulate what native Gates do naturally. A team using Cashier for marketplace payouts discovers Cashier has no Connect API. The "default" package becomes a constraint, not an enabler.

### Real-World Consequences
- A SaaS platform adopts Spatie Permission because "it's what we always use." Six months in, they need ReBAC for collaborative document editing. They create 40+ roles to simulate relationships. Every new document-sharing feature requires new role definitions. The authorization system becomes unmaintainable.
- A marketplace startup adopts Cashier because "Laravel + billing = Cashier." Two months in, they need Stripe Connect for marketplace payouts. Cashier has no Connect support. They retrofit direct Stripe API calls alongside Cashier, creating dual code paths.

### Preferred Alternative
Calibrate every package recommendation to the specific project's requirements using the eight-dimension framework. The default recommendation may still be Spatie Permission or Cashier, but ONLY after verifying fit conditions are met and non-fit conditions are absent. The recommendation includes the escape hatch, tradeoffs, and review date — making it an informed choice, not a reflex.

### Refactoring Strategy
1. For each existing package in the codebase, write a retroactive calibrated recommendation. Document the fit conditions that were present at adoption and whether they still hold.
2. If a fit condition is found to be false, trigger the package exit evaluation (KU 05).
3. Institute a policy: new package proposals must include the eight dimensions before they are accepted.
4. Add a PR checklist item: "Architectural package decisions include calibrated recommendation."

### Detection Checklist
- [ ] Same package recommended across multiple projects with different requirements
- [ ] Fit/non-fit criteria are absent or non-falsifiable
- [ ] No alternative ever considered because "we always use this"
- [ ] Team cannot articulate why the package was chosen beyond "it's the standard"
- [ ] Package friction is dismissed with "we just need to use it better"

### Related Rules
- Write All Eight Dimensions Before Recommending
- Make Fit/Non-Fit Criteria Falsifiable

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)

### Related Decision Trees
- DT-CPR-001: Does This Package Need a Full 8-Dimension Calibrated Recommendation?

---

## AP-CPR-002: Analysis Without Action

### Category
Architecture | Process

### Description
Writing detailed fit/non-fit analyses that correctly identify mismatches, then adopting the package anyway despite the analysis showing it doesn't fit. The analysis becomes a paperwork exercise rather than a decision-making tool.

### Why It Happens
- Analysis is treated as a compliance requirement ("we need an ADR"), not an actual decision gate
- Political pressure: a senior engineer or manager has already decided on the package
- Deadline pressure: "the analysis shows risks, but we don't have time to find an alternative"
- Sunk cost: the team already spent time evaluating the package and doesn't want to "waste" it

### Warning Signs
- Analysis shows 3+ non-fit conditions, but the recommendation is still "adopt"
- Analysis section is detailed but the recommendation section ignores the analysis findings
- "Conditional fit" recommendations where the conditions are known to be false
- The escape hatch is invoked in the first month of adoption

### Why Harmful
The analysis correctly identified risks, but those risks are now being deliberately ignored. When the predicted problems materialize (the package doesn't support metered billing, multi-provider, or ReBAC), the team has no excuse — they were warned. Worse, the analysis document becomes evidence of negligence in a post-mortem: "We knew this would fail and did it anyway."

### Real-World Consequences
- A team writes a 7-dimension fit analysis for a search package, scoring it 25/70 (high-risk fit). The analysis notes the package doesn't support complex filters and has no escape hatch. They adopt it anyway because "we need search now." Three months later, the complex filter requirement becomes critical. The package must be replaced. The analysis predicted this exactly.

### Preferred Alternative
The analysis must be a decision gate, not a checkbox. If the analysis shows a package doesn't fit, STOP. Either find a package that does fit, relax the requirement (if flexibility exists), or build custom for the specific gap while keeping the existing stack. If team or deadline pressure forces adoption despite poor fit, document it as a "conscious risk acceptance" with a specific review date and exit trigger — not as a "conditional fit."

### Refactoring Strategy
1. Audit existing package recommendations for cases where the analysis recommended against adoption but the package was adopted anyway.
2. For each case, trigger the package exit evaluation (KU 05) immediately — the package was adopted with known misfit.
3. Update the ADR process so that a negative analysis automatically escalates to a tech lead or architect for override approval.
4. Track "analysis-action mismatch rate" as a team metric. High mismatch rate = broken decision process.

### Detection Checklist
- [ ] Analysis scores the package below 4/10 on 3+ dimensions but recommendation is still "adopt"
- [ ] Non-fit conditions are documented but dismissed with "we'll work around it"
- [ ] Escape hatch is designed for a condition the analysis predicted would be needed
- [ ] The recommendation's "conditions" section lists conditions the team knows will break

### Related Rules
- Write All Eight Dimensions Before Recommending
- Make Fit/Non-Fit Criteria Falsifiable

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- When NOT To Build Custom (KU 05)

---

## AP-CPR-003: Recommendation Without Expiration

### Category
Architecture | Process

### Description
Package recommendations that are written once and never revisited. The recommendation from 2023 is still treated as current guidance for new team members in 2026 — despite the package's maintenance status, the business's requirements, and the ecosystem all having changed.

### Why It Happens
- "Set and forget" mentality: the recommendation was made, the ADR was filed, the ticket is closed
- No process for re-evaluating package decisions on a schedule
- The engineer who wrote the original recommendation has left the team
- "If it's not broken, don't re-evaluate it" — confusing stability with staleness

### Warning Signs
- Package recommendations in the ADR directory are dated more than 18 months ago
- The recommended package shows signs of abandonware (no commits in 12+ months)
- New team members ask "why are we using this package?" and nobody has a current answer
- The package's fit conditions reference requirements that have since changed

### Why Harmful
Stale recommendations guide new decisions toward packages that may no longer fit. The original recommendation might have assumed Stripe-only billing, but the company now needs multi-provider support. A new engineer picks up the stale recommendation and integrates Cashier, only to discover 3 months later that it's the wrong choice. Stale recommendations are worse than no recommendations — they provide false confidence.

### Real-World Consequences
- A 2022 recommendation for a PDF generation package guides a 2026 feature decision. The package hasn't been updated since 2023, doesn't support PHP 8.3, and has an open security CVE. The new feature is built on the package because "the ADR says to use it." The security vulnerability is discovered in a penetration test 2 weeks before launch.

### Preferred Alternative
Every calibrated recommendation must include a review date or re-evaluation trigger. Schedule annual package review as a recurring engineering investment (2-4 hours per major package). When a recommendation passes its review date, it must be explicitly re-validated or marked as "needs re-evaluation." Treat stale recommendations as technical debt — they should not be used to make new decisions.

### Refactoring Strategy
1. Inventory all existing package recommendations and their creation dates.
2. For recommendations older than 12 months, schedule a re-evaluation.
3. For recommendations older than 24 months that haven't been re-evaluated, treat them as "unvalidated" and trigger immediate re-evaluation.
4. Add a CI/lint check: recommendations in `docs/decisions/` with review dates older than 14 months produce a warning.

### Detection Checklist
- [ ] Package recommendation documents have no review date or re-evaluation trigger
- [ ] The original recommendation predates a major framework version upgrade
- [ ] The package's GitHub shows no commits since the recommendation was written
- [ ] Team members express uncertainty about why a package is still used
- [ ] The business requirements in the fit conditions section no longer match current requirements

### Related Rules
- Re-Evaluate Fit Annually

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- When NOT To Build Custom (KU 05)

### Related Decision Trees
- DT-CPR-003: Is This Package Recommendation Still Fit for Purpose?

---

## AP-CPR-004: Tradeoff Denial

### Category
Architecture | Decision-Making

### Description
Writing a calibrated recommendation where the "tradeoffs accepted" section is empty, contains "none," or lists only minor operational concerns while omitting the fundamental architectural tradeoffs (vendor lock-in, schema coupling, testing complexity).

### Why It Happens
- Optimism bias: the team genuinely believes the package has no significant tradeoffs
- Recommendation advocacy: the author wants the package adopted and downplays negatives
- Lack of deep package knowledge: unable to identify tradeoffs without prior experience with the package
- "Tradeoffs are for bad packages" — misunderstanding that all architectural choices have tradeoffs

### Warning Signs
- Tradeoffs section says "none" or "minimal" for a package that owns database migrations
- Testing impact says "easy to test" without noting that real API keys are required
- The recommendation reads like marketing copy, not engineering analysis
- Operational impact ignores webhook reliability, cache invalidation, or new failure modes

### Why Harmful
Tradeoffs that aren't documented become surprises. Six months later, the team encounters Stripe lock-in, Cashier upgrade breaking changes, or Spatie permission cache staleness — and reacts as if these are unexpected bugs rather than known tradeoffs they accepted. The package isn't failing; expectations were mismanaged. The team blames the package for behavior that was always inevitable.

### Real-World Consequences
- A team adopts Cashier with tradeoffs listed as "none." Six months later, they need to add Paddle as a second payment provider. They discover Cashier is Stripe-only. The team treats this as a Cashier failure ("Why doesn't Cashier support multi-provider?") when the tradeoff was always present — it just wasn't documented. Trust in package recommendations erodes.

### Preferred Alternative
Every calibrated recommendation must include at minimum: (1) vendor/provider lock-in, (2) schema/data coupling, (3) upgrade friction risk, and (4) testing complexity. If genuinely none exist for a dimension, state why explicitly ("No schema coupling — the package is a pure HTTP client with no migrations"). The tradeoff section is a contract with the team: "By choosing this package, we accept these costs." If nobody can articulate the costs, the analysis is incomplete.

### Refactoring Strategy
1. Review existing recommendations. For any that have "none" or missing tradeoffs, schedule a 30-minute review to add them.
2. Require that every new package recommendation include at least four tradeoff dimensions.
3. When a tradeoff manifests as a problem (e.g., upgrade breaks overrides), link it back to the recommendation document: "This was an accepted tradeoff (see recommendation #14). We can either accept it or trigger exit evaluation."

### Detection Checklist
- [ ] Tradeoffs section contains "none" or "minimal"
- [ ] Vendor lock-in is not mentioned for a package that wraps a specific provider (Cashier, Scout+Algolia)
- [ ] Schema coupling is not mentioned for a package that owns migrations
- [ ] Testing impact fails to mention that real API keys, test clocks, or special CI configuration is needed
- [ ] The recommendation reads like a comparison chart from the package's own documentation

### Related Rules
- Document Accepted Tradeoffs Explicitly

### Related Skills
- Package Fit/Non-Fit Analysis (KU 02)
- Package Wrapper/Boundary Pattern (KU 03)

### Related Decision Trees
- DT-CPR-001: Does This Package Need a Full 8-Dimension Calibrated Recommendation?
