# Skill: Evaluate Whether Clean Architecture Pays Off for Your Application
## Purpose
Make an informed, data-driven decision about whether to adopt Clean Architecture — quantifying the architecture tax (2-4x files, 1.5-3x development time), evaluating the sufficient complexity threshold, piloting before committing codebase-wide, and documenting the decision with measurable success criteria.
## When To Use
- Deciding which architectural pattern to adopt for a new project
- Evaluating whether to migrate an existing application to Clean Architecture
- Team considering adding another architectural phase/layer
- Architecture decision review (quarterly or annual)
## When NOT To Use
- Team has already committed to an architecture (apply the chosen pattern consistently)
- Application is purely CRUD with no business complexity
- Team lacks capacity or motivation to evaluate architecture tradeoffs
## Prerequisites
- Understanding of Clean Architecture patterns (LAP-02, LAP-03)
- Current architecture pain points documented and measured
- Team availability for pilot evaluation (1-2 months)
- ADR process established for documenting decisions
## Inputs
- Current application complexity assessment (feature count, rule count, delivery mechanisms)
- Team size and experience level with layered architecture
- Current metrics: avg feature delivery time, bug rate, test suite runtime
- Expected application lifespan and framework upgrade timeline
## Workflow
1. Assess ACTUAL (not anticipated) complexity: count business invariants, delivery mechanisms, expected lifespan, team size
2. Quantify current pain: measure feature delivery time, bug rate in business logic, test suite runtime, onboarding time for new devs
3. Estimate Clean Architecture costs: 2-4x more files per feature, 1.5-3x initial dev time, 2-4 week onboarding, ongoing maintenance overhead
4. Document cost-benefit analysis in ADR: what problems does Clean Architecture solve? Does this application have those problems?
5. If complexity justifies it: pilot Clean Architecture on ONE feature or bounded context — not the whole codebase
6. Run pilot for 1-2 months: track feature delivery time, bug rate, team satisfaction, test suite performance
7. Compare pilot metrics against baseline: did the architecture tax pay off? Fewer bugs? Faster tests? Easier changes?
8. Decide: adopt codebase-wide, adopt conditionally (specific bounded contexts), or revert to simpler pattern
9. Document decision in ADR with rationale, expected benefits, and triggers for revisiting
10. If adopting: enforce the chosen architecture with architecture tests from day one — no "Clean Architecture Theater"
## Validation Checklist
- [ ] Current architecture pain points documented with metrics (not feelings)
- [ ] Clean Architecture costs quantified (files, dev time, onboarding, complexity)
- [ ] Complexity threshold matched to actual application complexity (not aspirational)
- [ ] Pilot feature selected for architecture evaluation
- [ ] Pilot results measured: delivery time, bugs, test speed, team satisfaction
- [ ] Architecture decision documented in ADR (Clean Architecture, Lite, or Service Layer)
- [ ] If pilot positive: architecture tests enforce the pattern codebase-wide
- [ ] If pilot negative: no Clean Architecture theater (directories ≠ code)
- [ ] Team productivity impact tracked after adoption
- [ ] Decision reviewed within 6 months with updated metrics
## Common Failures
- **Clean Architecture for simple CRUD:** Architecture tax paid for benefits that never materialize. Fix: match architecture to actual complexity.
- **Not applying when needed:** Complex business rules in fat controllers — risky and slow to test. Fix: pilot Clean Architecture on the most complex feature.
- **Clean Architecture theater:** Directory structure says Clean Architecture but code imports Eloquent in Domain. Fix: enforce with architecture tests or use honest naming.
- **Piloting the wrong feature:** Piloting on a simple CRUD feature that gets no benefit. Fix: pilot on the feature with the most complex business rules.
- **No reversion plan:** Team decides overhead isn't worth it but doesn't refactor back. Fix: commit to revert if pilot fails, or accept partial architecture with documented tradeoffs.
## Decision Points
- **Clean Architecture vs Clean Architecture Lite:** Full Port-Adapter = 20% more benefit at 60% more cost. Lite (Domain + Application only) is the pragmatic sweet spot for most apps.
- **Codebase-wide vs bounded context:** Single delivery mechanism = apply pattern consistently. Multiple contexts = apply per bounded context based on complexity.
- **Adopt vs defer:** Complex domain NOW = adopt. Project likely to grow = defer with Service Layer, add layers as justified.
## Performance Considerations
- No significant production performance difference between architectures
- Clean architecture may improve test performance (Domain tests: 50ms vs 500ms Laravel-bootstrapped)
- Mapping overhead is negligible for typical request volumes
- Architecture tax is in development time, not runtime performance
## Security Considerations
- Architecture level does not determine security — proper patterns matter regardless of architectural choice
- Clean Architecture may improve security auditability (clear layer boundaries, explicit data flow)
- Framework independence enables easier security testing in isolation
- Architecture theater (clean directories, coupled code) gives false security confidence
## Related Rules (from 05-rules.md)
- Start with Service Layer and Evolve
- Consider Clean Architecture Lite
- Pilot Before Committing Codebase-Wide
- Quantify Costs Before Deciding
- Match Architecture to Actual Complexity
- Document Architectural Choice Explicitly
- Avoid Clean Architecture "Theater"
- Track Productivity Impact
## Related Skills
- Framework Independence Decisions (LAP-09)
- Incremental Migration (LAP-12)
- Architecture Tests (LAP-13)
- ADR Documentation (cross-domain)
## Success Criteria
- Architecture choice documented in ADR with quantified cost-benefit analysis
- Pilot feature proves (or disproves) Clean Architecture value for the specific application
- No Clean Architecture theater — directory structure matches actual code coupling
- Team productivity impact tracked: at minimum, feature delivery time and bug rate
- Architecture decision reviewed annually with updated metrics
