# Skill: Apply Code Review Guardrails for Architecture Enforcement

## Purpose
Automate every enforceable rule before relying on code review. Apply architecture-first review order (evaluate architecture before implementation details). Use architecture checklists per change type in PR templates. Document architecture decisions from reviews as ADRs. Define escalation paths for uncertain violations. Include security items in checklists. Limit checklists to 5-10 high-impact items.

## When To Use
- Catching non-automatable violations (design quality, abstraction level, consistency)
- Knowledge sharing during reviews

## When NOT To Use
- Rules that can be automated (use tests/static analysis instead)
- High-volume trivial changes (use automated checks only)

## Prerequisites
- Architecture tests defined (AEG-01)
- ADRs documented (AEG-06)

## Inputs
- PR template
- Architecture checklist per change type
- Escalation path documentation

## Workflow
1. **Automate every enforceable rule before relying on code review.** If a rule can be automated (test, static analysis), automate it. Reserve code review for non-automatable concerns — design quality, abstraction level, consistency.

2. **Apply architecture-first review order.** Evaluate architectural impact before reading implementation details. If the architecture is wrong, reject the PR early. Architecture-first: 2 min title/description, 3 min file-structure diff, 5 min architectural impact, then implementation.

3. **Use architecture checklists per change type in PR templates.** Include targeted checklist sections in PR templates for new module, cross-context change, refactoring, and bug fix. Different change types need different checks.

4. **Document architecture decisions from code review as ADRs.** When a review results in an architectural decision, document the outcome as an ADR. Prevents recurring debates about the same decision.

5. **Define an escalation path for uncertain architectural violations.** When a reviewer identifies a potential violation but is uncertain, there is a documented path: tag PR, add senior reviewer, escalate to architecture lead if needed.

6. **Include security architecture in the review checklist.** Cover input validation, authentication checks, data exposure, and authorization at the architectural level.

7. **Limit checklist items to high-impact concerns.** Keep checklists focused on 5-10 items per change type. Remove items that are consistently checked without finding violations.

## Validation Checklist
- [ ] Architecture checklist exists per change type
- [ ] Reviewers apply architecture-first approach
- [ ] Escalation path defined for uncertain violations
- [ ] Architecture decisions from review documented as ADRs
- [ ] PR templates include architecture checklist sections
- [ ] Checklist includes security architecture items
- [ ] Checklist limited to 5-10 high-impact items

## Common Failures
- **No architecture checklist.** Reviewers check different things — consistent concerns missed.
- **Architecture review after implementation.** Reviewer less likely to suggest fundamental changes after reading code.
- **Relying solely on automated enforcement.** Automated tools miss design quality violations.

## Decision Points
- **Automate vs human review?** Automate if the rule can be encoded as a test. Use human review for design quality, abstraction level, and consistency.

## Performance Considerations
- Human review time is the cost. Architecture-first review reduces wasted time on wrong designs.

## Security Considerations
- Code review should also cover security architecture. The checklist should include security items.

## Related Rules
- Rule: Automate Every Enforceable Rule Before Relying On Code Review (AEG-04/05-rules.md)
- Rule: Apply Architecture-First Review Order (AEG-04/05-rules.md)
- Rule: Use Architecture Checklists Per Change Type In PR Templates (AEG-04/05-rules.md)
- Rule: Document Architecture Decisions From Code Review As ADRs (AEG-04/05-rules.md)
- Rule: Define An Escalation Path For Uncertain Violations (AEG-04/05-rules.md)
- Rule: Include Security In The Review Checklist (AEG-04/05-rules.md)
- Rule: Limit Checklist Items To High-Impact Concerns (AEG-04/05-rules.md)

## Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Document ADRs (AEG-06/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)

## Success Criteria
- All automatable architectural rules are enforced by tests — code review handles only non-automatable concerns.
- Reviewers always evaluate architectural impact before reading implementation details.
- PR templates have targeted architecture checklists for each change type (new module, cross-context, refactoring).
- Architectural decisions from reviews are captured as ADRs within the same PR.
- Reviewers have a documented escalation path for uncertain violations.
- Security items are included in the architecture review checklist.
