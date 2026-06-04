# Skill: Map Teams to Bounded Contexts for Clear Ownership

## Purpose
Assign each bounded context to exactly one team. Use CODEOWNERS to enforce context ownership. Require cross-team contract review. Limit one team to 2-3 contexts. Document the team-to-context mapping visibly. Apply Reverse Conway maneuver to restructure teams when needed.

## When To Use
- Team size >5 engineers, multiple distinct business domains, independent team ownership valued

## When NOT To Use
- Team too small (1-2 devs) — merge context ownership
- Context is stable — active ownership not needed

## Prerequisites
- Bounded contexts identified
- Team structure known

## Inputs
- Context map with all bounded contexts
- Team roster with skills and capacity

## Workflow
1. **Assign exactly one owning team per bounded context.** No context is shared across multiple teams. Shared contexts require cross-team coordination for every change.

2. **Use CODEOWNERS to enforce context ownership at the code level.** Specify which team owns which directory. PRs touching a context require that team's approval.

3. **Require cross-team contract review for interface changes.** Changes to a context's public contracts (interfaces, events, DTOs) must be reviewed by all consuming teams.

4. **Limit one team to owning no more than 2-3 contexts.** A small team owning 5+ contexts cannot maintain them all. Contexts degrade from neglect.

5. **Match the number of contexts roughly to the number of teams.** Fewer contexts than teams means some teams lack clear ownership. More contexts than teams means some teams own too many.

6. **Document team-to-context mapping in a visible matrix.** Show which team owns each context and which contexts each team consumes. Store as code in the repository.

7. **Apply Reverse Conway maneuver when needed.** Restructure teams to match the desired architecture. Architecture follows organization structure.

8. **Do not orphan contexts.** Every bounded context has an identified owning team. Even deprecated contexts need an owner responsible for sunset.

9. **Use ownership as accountability for security and data access.** The owning team is accountable for security, data access, and compliance decisions within their context.

## Validation Checklist
- [ ] Each context has exactly one owning team
- [ ] No context is shared across teams
- [ ] No context is orphaned (no owner)
- [ ] No team owns more than 3 contexts
- [ ] Team-to-context mapping is documented
- [ ] CODEOWNERS enforces context ownership
- [ ] Cross-team contract review is required for interface changes
- [ ] Security accountability is defined per owning team

## Common Failures
- **Misaligned team/context boundaries.** Two teams modifying the same context — every change needs coordination.
- **Context without an owner.** Created but no team owns it — neglected code area.
- **Team owns too many contexts.** Small team owning 5+ contexts — can't maintain all.

## Decision Points
- **One team per context vs one team owns multiple contexts?** Default to one team per context. Small teams may own 2-3 stable contexts.

## Performance Considerations
- No runtime cost. Organizational alignment affects development speed, not runtime performance.

## Security Considerations
- Team ownership provides accountability for data access and security decisions within the context.
- CODEOWNERS ensures unauthorized changes are caught at PR review.

## Related Rules
- Rule: Assign exactly one owning team per bounded context (DBC-09/05-rules.md)
- Rule: Use CODEOWNERS to enforce context ownership at the code level (DBC-09/05-rules.md)
- Rule: Require cross-team contract review for interface changes (DBC-09/05-rules.md)
- Rule: Limit one team to owning no more than 3 contexts (DBC-09/05-rules.md)
- Rule: Match the number of contexts roughly to the number of teams (DBC-09/05-rules.md)
- Rule: Document team-to-context mapping in a visible matrix (DBC-09/05-rules.md)
- Rule: Restructure teams to achieve desired architecture (Reverse Conway) (DBC-09/05-rules.md)
- Rule: Do not orphan contexts (DBC-09/05-rules.md)
- Rule: Use ownership as accountability for security and data access (DBC-09/05-rules.md)

## Related Skills
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Apply Team-Scale Strategies (COS-10/06-skills.md)
- Design Code Review Checklists (AEG-04/06-skills.md)

## Success Criteria
- Every bounded context is assigned to exactly one team with documented ownership.
- CODEOWNERS file enforces team ownership at the code level.
- Team-to-context mapping matrix is documented in the repository.
- No context is orphaned or shared across multiple teams.
- Each team owns at most 3 contexts and is accountable for security within those contexts.
