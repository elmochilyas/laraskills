# Skill: Create Onboarding Documentation for Architecture

## Purpose
Create a 5-10 page architecture onboarding doc in the repository. Include a bounded context map as the first section. Use example-first documentation (before/after code examples). Provide a step-by-step onboarding checklist. Gate onboarding completion on passing architecture tests. Update the doc when architecture changes. Link to ADRs, convention doc, and architecture tests. Include security patterns.

## When To Use
- Onboarding new developers to the codebase
- Documenting the architecture for team-wide reference

## When NOT To Use
- Replacing detailed reference documentation (onboarding doc is a guided tour, not a reference manual)

## Prerequisites
- ADRs documented (AEG-06)
- Team conventions documented (AEG-07)

## Inputs
- Bounded context map
- Pattern reference with examples

## Workflow
1. **Keep the onboarding doc at 5-10 pages.** Structure it as a guided tour, not a reference manual. A new developer should be able to read it in one sitting.

2. **Include a bounded context map as the first section.** Show each context, its responsibilities, and its allowed dependencies. The context map answers: "What are the parts and how do they relate?"

3. **Use example-first documentation for each pattern.** Demonstrate every pattern with a before/after code example. Developers learn by seeing real code transformations.

4. **Provide a step-by-step onboarding checklist.** Sequential steps mapping to documents to read or tasks to perform. Prevents the developer from missing critical information.

5. **Gate onboarding completion on passing architecture tests.** Require the developer to write code that passes all architecture tests. Objective proof of architectural understanding.

6. **Update the onboarding doc when architecture changes.** New contexts, changed dependency rules, new patterns — update immediately. An outdated doc teaches incorrect patterns.

7. **Include security patterns in the onboarding doc.** Cover where security checks are enforced (middleware, form requests, gates/policies).

8. **Link to ADRs, convention doc, and architecture tests from the onboarding doc.** Reference links for deeper resources. The onboarding doc is a guided tour, not the only resource.

## Validation Checklist
- [ ] Onboarding doc exists in the repository
- [ ] Doc includes bounded context map
- [ ] Doc includes dependency direction rules
- [ ] Doc includes pattern reference with examples
- [ ] Doc is 5-10 pages (guided tour, not reference manual)
- [ ] Doc is updated when architecture changes
- [ ] Onboarding process is gated by passing architecture tests
- [ ] Doc includes security patterns

## Common Failures
- **No onboarding doc.** New developers learn by asking — senior developers become bottlenecks.
- **Outdated onboarding doc.** Describes old architecture — teaches incorrect patterns.
- **Onboarding doc as fire hose.** All information dumped at once — developer is overwhelmed.

## Decision Points
- **Onboarding doc vs reference docs?** Onboarding is a 5-10 page guided tour. Reference docs (ADRs, conventions, test files) are linked but separate.

## Performance Considerations
- Documentation only. No performance impact.

## Security Considerations
- Onboarding doc should cover security patterns and where security checks are enforced.

## Related Rules
- Rule: Keep The Onboarding Doc At 5-10 Pages (AEG-10/05-rules.md)
- Rule: Update The Onboarding Doc When Architecture Changes (AEG-10/05-rules.md)
- Rule: Always Include A Bounded Context Map (AEG-10/05-rules.md)
- Rule: Use Example-First Documentation (AEG-10/05-rules.md)
- Rule: Gate Onboarding On Passing Architecture Tests (AEG-10/05-rules.md)
- Rule: Provide A Step-By-Step Onboarding Checklist (AEG-10/05-rules.md)
- Rule: Include Security Patterns In Onboarding (AEG-10/05-rules.md)
- Rule: Link To ADRs, Convention Doc, And Architecture Tests (AEG-10/05-rules.md)

## Related Skills
- Document ADRs (AEG-06/06-skills.md)
- Document Team Conventions (AEG-07/06-skills.md)
- Apply Code Review Guardrails (AEG-04/06-skills.md)

## Success Criteria
- A 5-10 page onboarding doc exists in the repository — readable in one sitting.
- The doc starts with a bounded context map showing all contexts and their dependency relationships.
- Each architectural pattern is demonstrated with before/after code examples.
- A step-by-step onboarding checklist guides the developer through the learning process.
- Onboarding completion requires the developer to submit code that passes all architecture tests.
- The doc is updated whenever the architecture changes (new contexts, changed rules, new patterns).
- Security patterns and enforcement points are explicitly documented.
