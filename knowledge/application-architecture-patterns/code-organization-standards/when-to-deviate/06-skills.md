# Skill: Evaluate When to Deviate from Laravel Defaults

## Purpose
Apply a structured decision framework to evaluate whether structural deviations from Laravel's default conventions are justified, ensuring every architectural change solves a specific, measurable pain point.

## When To Use
- Considering any structural change from Laravel defaults
- Team discussions about adopting new architectural patterns
- Architecture review or planning sessions
- Before implementing repository pattern, domain structure, or Clean Architecture

## When NOT To Use
- Application is primarily CRUD with simple business rules
- Team is 1-5 developers
- Project expected to live <3 years
- No clear domain boundaries exist
- Can't articulate a specific problem with defaults

## Prerequisites
- Understanding of the current default structure
- Experience with the project's existing pain points
- Knowledge of alternative structures (hybrid, domain-based, feature-based)
- ADR template for documenting decisions

## Inputs
- Current directory structure and its pain points
- List of proposed deviations
- Team size and growth trajectory
- Application complexity and expected lifespan

## Workflow
1. **Identify specific, measurable friction.** Name concrete problems: "15 minutes tracing 6 files to understand checkout" or "5 merge conflicts per week in `routes/web.php`." Vague problems like "hard to find code" are not sufficient.

2. **Evaluate against five questions.** Before adopting any deviation:
   - Q1: What specific friction exists?
   - Q2: Does the proposed deviation address it?
   - Q3: Does the benefit exceed the cost?
   - Q4: Is there a less invasive option? (hybrid before full domain)
   - Q5: Can it be incremental? (one domain before all domains)

3. **Apply the six-month rule for new projects.** Wait at least six months before making significant structural deviations. Domain boundaries, team structure, and architectural needs reveal themselves organically.

4. **Deviate one level at a time.** Progress incrementally: defaults → add subdirectories → hybrid → domain-based → modules. Never skip directly to the most complex structure.

5. **Ensure enforcement capability.** Before implementing any deviation, confirm you can enforce it via architecture tests or static analysis. A new structure without enforcement degrades within months.

6. **Document with an Architecture Decision Record.** Write an ADR covering: the specific problem, alternatives considered, chosen solution, expected costs/benefits, and enforcement strategy.

## Validation Checklist
- [ ] All deviations from defaults are documented with ADRs
- [ ] Each deviation can be traced to a specific, measurable pain point
- [ ] Half-migration situations are identified and being resolved
- [ ] Deviations are enforced via architecture tests or static analysis
- [ ] Team can articulate why structure exists without referencing "that's how it was set up"
- [ ] The five-question evaluation was applied before each deviation

## Common Failures
- **Pre-emptive architecture:** Building Clean Architecture for a project that doesn't exist yet. Start simple, evolve.
- **Deviation without enforcement:** Creating a new structure but not enforcing it. Files scatter across old and new locations.
- **Following trends:** Adopting patterns because "that's what real Laravel projects use." Identify your own pain points first.
- **Half-migration:** Some code in new structure, some in old. Complete the migration or don't start.

## Decision Points
- **Repository pattern?** Reject for all-model single-data-source projects. Justified only when models have multiple data sources.
- **Interface-per-service?** Reject when only one implementation exists. Add interfaces only when a second implementation is planned.
- **Domain structure?** Wait for clear bounded contexts and team ownership boundaries.

## Performance Considerations
- Most deviations don't affect runtime performance.
- Per-domain service providers increase boot time — monitor with 10+ providers.
- Config and route caching mitigates boot-time costs.

## Security Considerations
- No direct security impact. Custom structures can hide security-sensitive code if not well-documented.

## Related Rules
- Rule: Start with Defaults — Never Deviate Without Measured Pain (COS-09/05-rules.md)
- Rule: Document Every Deviation with an Architecture Decision Record (COS-09/05-rules.md)
- Rule: Apply the Six-Month Rule for New Projects (COS-09/05-rules.md)
- Rule: Deviate One Level at a Time — No Leapfrogging (COS-09/05-rules.md)
- Rule: Never Deviate Without Automated Enforcement (COS-09/05-rules.md)
- Rule: Evaluate Deviations Against Five Questions (COS-09/05-rules.md)
- Rule: Reject Repository Pattern for All-Model Single-DataSource Projects (COS-09/05-rules.md)
- Rule: Reject Interface-Per-Service When Only One Implementation Exists (COS-09/05-rules.md)

## Related Skills
- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)
- Document Architecture Decisions with ADRs (AEG-06/06-skills.md)

## Success Criteria
- All structural deviations are documented and justified by specific pain points.
- No deviation exists without automated enforcement.
- Team can explain the rationale for every architectural choice.
- Less invasive options were considered and rejected before adopting current structure.
