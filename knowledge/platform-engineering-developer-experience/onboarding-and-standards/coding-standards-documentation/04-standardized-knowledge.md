# Experience Curation: Coding Standards Documentation

## Metadata
- **KU ID:** onboarding-team-standards/coding-standards-documentation
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Mature
- **Dependencies:** laravel-pint, pint-configuration, laravel-phpstan
- **Related Technologies:** Laravel Pint, PHPStan, PSR-12, Laravel Coding Style, PHP-CS-Fixer
- **Target Audience:** Laravel developers, team leads, code reviewers

## Overview

Coding standards documentation for Laravel teams refers to the written conventions that govern code style, naming, structure, and patterns used across a project or organization. These standards go beyond automated formatting (handled by Pint) to cover architectural patterns (service classes, actions, DTOs), naming conventions (controllers, models, traits), database design principles (migration naming, indexing strategies), API response structures, and testing conventions. Effective coding standards documentation is concise, opinionated, and enforced through a combination of automated tools (Pint, PHPStan) and PR review guidelines. The documentation lives in the project repository and is referenced during code reviews and onboarding.

## Core Concepts

- **Minimum Viable Standards:** The smallest set of standards that produces consistent, reviewable code; avoid over-documenting trivial preferences that Pint already enforces
- **Pint-Enforceable vs Convention-Based:** Automated rules (Pint, PHPStan) vs manual practices (architecture patterns, naming). Documentation must distinguish between enforced and recommended.
- **Context-Specific Rules:** Standards may vary by context—controllers have different conventions than jobs or mailables
- **Living Document:** Coding standards evolve; the document should have a changelog or revision history
- **Standards as Team Contract:** An agreement among team members about how code is written and reviewed

## When To Use

- Team has 3+ developers and PRs frequently include style or pattern feedback
- New team members need to learn "how we write code here" quickly
- Code reviews consistently flag the same issues (repetitive feedback)
- Organization wants consistent architecture across multiple Laravel projects
- Team is distributed across time zones and can't rely on verbal knowledge transfer

## When NOT To Use

- Single developer or pair programming full-time (implicit alignment is sufficient)
- Team prefers to keep standards cultural (learned through pairing and review)
- Organization is too early-stage (standards will change frequently)
- Team is unwilling to enforce standards through CI or review

## Best Practices (WHY)

1. **Don't Repeat Pint Documentation (Why):** The coding standards doc should focus on what automation cannot enforce. Writing "use 4 spaces for indentation" when Pint already enforces it wastes space and distracts from meaningful architectural guidance. Reference Pint configuration; don't duplicate it.

2. **Show Examples of Good and Bad Code (Why):** "Controllers should be thin" is ambiguous. Show a thin controller vs a fat controller example with specific guidance (max method count, responsibility boundaries, where to put business logic). Examples eliminate interpretation differences.

3. **Provide Rationale for Each Standard (Why):** Stating "always use Form Requests" without explaining why means developers who disagree will disregard it. Include the reasoning (separation of concerns, testability, reusability) so developers understand and buy into the standard.

4. **Enforce with CI What Can Be Enforced (Why):** Automated enforcement (Pint, PHPStan) is objective, instant, and scales better than human review. Reserve human review for architectural patterns and logic. The doc should clearly distinguish between blocking (CI-enforced) and advisory (review-enforced) standards.

5. **Review and Update Quarterly (Why):** Standards become stale as the team learns what works and what doesn't. A quarterly review removes outdated conventions and adds new practices based on team experience. Involve the whole team in the review.

## Architecture Guidelines

- **Document Location:** Dedicated file (`docs/standards.md`) rather than bloating CONTRIBUTING.md. CONTRIBUTING.md links to it.
- **Structure:** Organized by file type: Controllers (RESTful naming, method count, validation placement), Models (relationship naming, attribute casting, scopes), Migrations (naming, batch strategy), Tests (TestDox naming, AAA structure).
- **Format:** Tabular format with clear examples of good and bad code. Include a Pint config reference section.
- **Enforcement Levels:** Blocking (CI fails) for automated rules. Advisory (review flags) for architectural patterns.
- **Governance:** Team review of standard changes via PR. Single author for initial draft. Quarterly review cadence.

## Performance

- **Document Length:** 5-10 pages covering the most impactful conventions. Longer docs are not read.
- **Discovery Time:** Developers should find the answer to a specific convention question within 30 seconds. Use clear table of contents and searchable headings.
- **Update Frequency:** Monthly minor updates, quarterly major reviews. Too frequent updates frustrate the team; infrequent updates create stale guidance.

## Security

- **Security Standards Section:** Include SQL injection prevention via Eloquent, XSS protection, CSRF token usage, rate limiting patterns as a dedicated section.
- **Configuration Standards:** Document that all configuration comes from .env, never hardcoded. Include naming conventions for environment variables.
- **Dependency Standards:** Document approved packages and versions. Include security scanning requirements for new dependencies.

## Common Mistakes

### Mistake 1: Repeating Pint Documentation
- **Description:** Documenting style rules that Pint already enforces
- **Cause:** Not understanding that Pint is the executable standard
- **Consequence:** Bloated document, duplicate maintenance, risk of doc-tool disagreement
- **Better:** Reference Pint config; only document what automation cannot enforce

### Mistake 2: No Examples
- **Description:** Stating rules without showing what they look like in practice
- **Cause:** Assuming verbal descriptions are sufficient
- **Consequence:** Ambiguous interpretation, inconsistent application
- **Better:** Always include "good" and "bad" code examples

### Mistake 3: Over-Specifying
- **Description:** Defining conventions for every possible class type (even rarely used ones)
- **Cause:** Desire for completeness
- **Consequence:** Document becomes too long to read, maintenance burden
- **Better:** Cover the most common 80% of cases; document edge cases when they become problematic

### Mistake 4: Stale Standards
- **Description:** Standards reference outdated tools or practices
- **Cause:** No scheduled review process
- **Consequence:** Developers ignore outdated standards, document loses credibility
- **Better:** Quarterly review cycle; remove or update outdated sections

## Anti-Patterns

- **The Encyclopedia:** 50-page coding standards document that no one reads. Keep it to 5-10 pages covering the most impactful conventions.
- **The Style Guide Only:** Only covers formatting (indentation, brace placement) that Pint handles. Misses architectural patterns, naming conventions, and testing standards.
- **The Opinionated Gospel:** Standards presented as unquestionable rules without rationale. Always explain the "why" so developers understand and buy in.
- **The Frozen Document:** Standards haven't changed in 2+ years. Code and team practices have evolved; the document is now misleading.

## Examples

### Example 1: Controller Standards Section
```markdown
## Controllers
- One controller per resource (UserController, not UserController with admin/API methods)
- Maximum 5 public methods per controller
- Validation in Form Request classes, not controller methods
- Return type declarations on all methods
- No business logic in controllers → delegate to Services/Actions

### Good
class UserController extends Controller {
    public function index(): JsonResponse { ... }
    public function show(User $user): JsonResponse { ... }
    // 3 more methods
}

### Bad
class UserController extends Controller {
    public function index(): JsonResponse { ... }
    public function store(StoreUserRequest): JsonResponse { ... }
    public function update(UpdateUserRequest, User $user): JsonResponse { ... }
    public function adminDashboard(): View { ... }  // Wrong responsibility
}
```

### Example 2: PHPStan Level Strategy
```markdown
## Static Analysis
- PHPStan level 6 for all new code
- Existing code at level 5 (baseline managed in phpstan-baseline.neon)
- PRs must not introduce new PHPStan errors
- Use docblocks for collection generics: `@return Collection<int, User>`
- Laravel-specific rules enabled via larastan/larastan
```

## Related Topics

- **laravel-pint:** Automated code style enforcement
- **laravel-phpstan:** Static analysis configuration
- **architecture-decision-records:** Documenting rationale behind standards
- **contributing-dot-md-patterns:** Where standards are referenced for contributors
- **code-review-standards:** How standards are enforced in reviews

## AI Agent Notes

- **Context Requirements:** When advising on coding standards, first understand the team size, current code review pain points, existing tooling (Pint, PHPStan), and specific areas of inconsistency (naming, architecture, patterns).
- **Key Decision Points:** Granularity (minimal vs comprehensive), enforcement level (blocking vs advisory), location (standalone file vs CONTRIBUTING.md), governance (team consensus vs single author).
- **Common Pitfalls in AI Assist:** Don't duplicate Pint documentation. Always include examples. Provide rationale for each standard. Don't over-specify rarely-used patterns.
- **Laravel-Specific Nuances:** Laravel's opinionated design reduces the need for extensive team-specific standards. Most decisions are already made by the framework. Focus on team-specific architectural patterns and conventions.

## Verification
- [ ] KU accurately defines coding standards documentation
- [ ] Core concepts cover minimum viable standards and enforcement levels
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize examples and rationale
- [ ] Architecture guidelines cover location, structure, governance
- [ ] Performance addresses document length and discovery time
- [ ] Security covers security-specific standards section
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify encyclopedia and frozen document
- [ ] Examples show controller standards and PHPStan strategy
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
