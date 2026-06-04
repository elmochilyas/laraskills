# Skill: Create and Maintain File Placement Decision Trees

## Purpose
Design, document, and enforce file placement decision trees that eliminate developer uncertainty about where new code belongs, covering the three placement axes: domain, role, and naming.

## When To Use
- Teams of 5+ engineers working on the same codebase
- Any project with custom directory structure beyond defaults
- Onboarding new developers to understand code organization
- After 3-6 months of code exists to reveal natural patterns

## When NOT To Use
- Prototypes or throwaway projects
- Single-developer projects
- Before the project has existed long enough to reveal patterns
- When the directory structure is so simple that placement is obvious

## Prerequisites
- Existing directory structure that has stabilized (3-6 months)
- Understanding of the three placement axes (domain, role, name)
- Team agreement on directory conventions

## Inputs
- Current directory structure and file distribution
- List of common file placement questions from the team
- Examples of correctly and incorrectly placed files
- Team conventions for domains and naming

## Workflow
1. **Let patterns emerge before codifying.** Wait 3-6 months after project start. Real placement patterns reveal themselves as code is written. A tree built too early will not match reality.

2. **Apply the Three-Question Rule.** Before creating any file, answer: (1) Which domain? (2) Which role/layer? (3) What name? Document these as the universal placement questions.

3. **Design the decision tree.** Keep under 5 top-level branches. A typical tree splits between cross-cutting concerns and specific business domains:
   - Cross-cutting concern? → `app/Shared/`, `app/Http/Middleware/`, etc.
   - Specific business domain? → `app/Domains/{Domain}/` with sub-choices for role
   - Unsure? → Fallback rule

4. **Include a fallback rule.** Every tree must terminate with a "don't know?" option: ask in team channel, discuss in standup, or use a temporary directory. Without fallback, developers guess.

5. **Store the tree in a visible repository location.** Place in CONTRIBUTING.md, ARCHITECTURE.md, or README — never in a private wiki. Must be alongside the code it governs.

6. **Enforce via code review and static analysis.** Add file placement verification to the code review checklist. For teams of 10+, use custom PHPStan rules or architecture tests to automate enforcement.

7. **Review quarterly.** Schedule a quarterly review to ensure the tree still matches the application's structure. Update when new domains appear or when structure changes.

## Validation Checklist
- [ ] File placement decision tree is documented and accessible
- [ ] Tree covers domain, role, and naming questions
- [ ] Fallback rule exists for uncertain cases
- [ ] Tree is reviewed quarterly for accuracy
- [ ] Code review checklist includes placement verification
- [ ] 90%+ of new files follow the standard tree without discussion
- [ ] Tree has 5 or fewer top-level branches

## Common Failures
- **Overly complex decision trees:** A tree with 20+ branches. Nobody uses it. Simplify the directory structure instead.
- **No fallback rule:** Developer can't find their case and guesses. Always include "ask the team" as the terminal branch.
- **Perfect tree at project start:** Building the tree before code exists. Tree won't match reality. Let patterns emerge first.
- **Tree not updated:** Exists but doesn't reflect current structure. Outdated — worse than no tree. Review quarterly.

## Decision Points
- **Domain-first vs layer-first axis?** Determine the primary organizational axis. Domain-first: first subdirectory is domain name. Layer-first: first subdirectory is technical role. Hybrid: cross-cutting concerns by layer, domains by domain.
- **Tree complexity vs structure simplicity?** If the tree is complex, simplify the directory structure. Placement should be obvious without a flowchart.

## Performance Considerations
- No performance impact from decision trees themselves.
- Chosen directory structure (deep nesting, many domains) affects CI pipeline performance for file-watching operations.

## Security Considerations
- File placement decisions should not affect security boundaries — security is applied via middleware, policies, and authentication, not directory structure.

## Related Rules
- Rule: Apply the Three-Question Rule for Every New File (COS-12/05-rules.md)
- Rule: Keep Decision Trees Under 5 Branches Maximum (COS-12/05-rules.md)
- Rule: Always Include a Fallback Rule (COS-12/05-rules.md)
- Rule: Let Patterns Emerge Before Codifying the Decision Tree (COS-12/05-rules.md)
- Rule: Review and Update the Decision Tree Quarterly (COS-12/05-rules.md)
- Rule: Enforce Placement Rules via Code Review and Static Analysis (COS-12/05-rules.md)
- Rule: Target 90%+ of Files Following the Standard Tree Without Discussion (COS-12/05-rules.md)
- Rule: Store Decision Tree in a Visible, Accessible Location (COS-12/05-rules.md)

## Related Skills
- Apply Naming Conventions for Classes and Files (COS-08/06-skills.md)
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)
- Document Team Conventions and Architecture (AEG-07/06-skills.md)

## Success Criteria
- 90%+ of new files follow the standard tree without team discussion.
- Placement rules are documented and accessible in the repository.
- Code review includes placement verification.
- Tree is reviewed quarterly and reflects current structure.
