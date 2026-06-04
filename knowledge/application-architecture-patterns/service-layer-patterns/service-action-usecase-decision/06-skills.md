# Skill: Decide Between Service, Action, and Use Case Patterns

## Purpose
Choose the right organizational pattern based on team size, application complexity, and framework coupling requirements. Default to Service + Action for most Laravel applications. Document the decision explicitly.

## When To Use
- At project initiation or when a team is deciding on architectural patterns
- When existing codebase has inconsistent patterns (pattern soup)

## When NOT To Use
- Prototype-stage (use whatever ships fastest, refactor later)

## Prerequisites
- Understanding of Service, Action, and Use Case roles
- Team composition and project complexity assessment

## Inputs
- Application complexity assessment
- Team size and experience level
- Framework independence requirements
- Delivery mechanisms needed (HTTP, CLI, queue)

## Workflow
1. **Default to Service + Action for most Laravel applications.** Services orchestrate workflows and manage transactions. Actions execute single leaf-node operations. This is the "sweet spot" for most teams. Document this choice in the project README.

2. **Adopt Use Cases only when framework coupling pain exceeds abstraction cost.** Use Cases add interfaces, DTOs, and bindings. Justified when: multiple delivery mechanisms, team > 10 developers, or Clean Architecture is a stated requirement.

3. **Document the team's chosen pattern explicitly.** Write an ADR or README section specifying what goes in Services, what goes in Actions, and what goes in Use Cases. Consistency is more important than the specific pattern choice.

4. **Use a decision tree for placement.** Complex with multiple sub-steps → Service (or Use Case if framework independence needed). Simple single operation → Action. Single simple operation → repository method or model method.

5. **Avoid architecture paralysis.** Pick a pattern, ship code, refactor later if needed. The difference between patterns is ~50μs per resolution — database time dominates.

6. **Avoid pattern soup.** Do not mix Services, Actions, and Use Cases inconsistently. If transitioning, create a documented migration plan with temporary allowances for inconsistency.

## Validation Checklist
- [ ] Team's architectural pattern choice is documented
- [ ] Service + Action is default (sweet spot) unless Clean Architecture is required
- [ ] Use Cases only where framework independence is needed
- [ ] No pattern soup (inconsistent usage across features)
- [ ] Decision tree is documented for what goes where
- [ ] No architecture paralysis (patterns debated for weeks without shipping)

## Common Failures
- **Actions when service suffices.** Creating action classes for every operation when a service method would do — class explosion.
- **Mixing patterns without rules.** Some code uses services, some actions, some use cases, inconsistently — confusion.
- **Architecture paralysis.** Team debates pattern choice instead of shipping value for weeks.

## Decision Points
- **Service + Action vs Use Cases?** Service + Action for most teams. Use Cases only when framework independence is explicitly required (multiple delivery mechanisms, Clean Architecture).

## Performance Considerations
- Difference between patterns is negligible (~50μs per resolution). Database query time dominates.

## Security Considerations
- No direct implications. All patterns use the same authorization boundaries.

## Related Rules
- Rule: Default To Service Plus Action For Most Laravel Applications (SLP-10/05-rules.md)
- Rule: Adopt Use Cases When Framework Coupling Pain Exceeds Abstraction Cost (SLP-10/05-rules.md)
- Rule: Document The Team's Chosen Pattern Explicitly (SLP-10/05-rules.md)
- Rule: Avoid Architecture Paralysis (SLP-10/05-rules.md)
- Rule: Avoid Pattern Soup (SLP-10/05-rules.md)
- Rule: Use A Decision Tree For What Goes Where (SLP-10/05-rules.md)

## Related Skills
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)
- Design Use Case Classes (SLP-06/06-skills.md)
- Build Service + Action + Repository Pyramid (SLP-04/06-skills.md)

## Success Criteria
- Team's pattern choice is documented with clear rules for where logic goes.
- No pattern soup — all features use the same dominant pattern consistently.
- Use Cases are used only where framework independence is needed, not for simple CRUD.
- Architecture decisions are pragmatic (ship first, refactor later) not paralyzed.
