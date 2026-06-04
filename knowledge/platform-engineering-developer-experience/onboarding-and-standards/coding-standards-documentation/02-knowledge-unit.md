# Knowledge Unit: Coding Standards Documentation

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/coding-standards-documentation
- **Maturity:** Mature
- **Related Technologies:** Laravel Pint, PHPStan, PSR-12, Laravel Coding Style, PHP-CS-Fixer

## Executive Summary

Coding standards documentation for Laravel teams refers to the written conventions that govern code style, naming, structure, and patterns used across a project or organization. These standards go beyond automated formatting (handled by Pint) to cover architectural patterns (service classes, actions, DTOs), naming conventions (controllers, models, traits), database design principles (migration naming, indexing strategies), API response structures (JSON:API, custom formats), and testing conventions (test naming, assertions, feature vs unit test boundaries). Effective coding standards documentation is concise, opinionated, and enforced through a combination of automated tools (Pint, PHPStan) and PR review guidelines. The documentation lives in the project repository (CONTRIBUTING.md or a standards directory) and is referenced during code reviews and onboarding. The goal is to establish a shared mental model of "how we write Laravel code here" so that all team members produce consistent, reviewable code without redundant discussions.

## Core Concepts

- **Minimum Viable Standards:** The smallest set of standards that produces consistent, reviewable code; avoid over-documenting trivial preferences (indentation, brace placement) that Pint already enforces
- **Pint-Enforceable vs Convention-Based:** Some standards are automated (Pint rules, PHPStan level), others are manual (architecture patterns, naming conventions). The documentation must distinguish between enforced and recommended practices.
- **Context-Specific Rules:** Standards may vary by context—controllers have different conventions than jobs or mailables. Good documentation addresses each context explicitly.
- **Living Document:** Coding standards evolve as the team learns what works; the document should have a changelog or revision history to track changes over time.

## Mental Models

- **Standards as Team Contract:** Coding standards documentation is a contract among team members: "I will write code this way, and you will review it knowing this is how we agreed to write code."
- **Standards as Onboarding Accelerator:** New developers read the standards once and immediately know how to write code that passes review; without them, they learn through repeated PR feedback loops.
- **Pint as Floor, Standards as Ceiling:** Pint enforces the minimum acceptable code style (the floor). Coding standards documentation sets the aspirational patterns and practices (the ceiling).

## Internal Mechanics

1. **Tool Configuration:** Pint's pint.json and PHPStan's phpstan.neon are the executable parts of the coding standards; they enforce the automated rules without human interpretation
2. **Documentation Structure:** Typically organized by file type: Controllers (RESTful naming, method count limits, validation placement), Models (relationship naming, attribute casting, scopes), Migrations (naming conventions, batch strategy), Tests (TestDox naming, Arrange-Act-Assert structure)
3. **Review Integration:** The standards are referenced in PR review checklists; reviewers check for adherence to documented conventions that tools can't enforce
4. **Onboarding Integration:** New team members read the standards as part of their first-week checklist; pair with a "standards walkthrough" session for questions
5. **Periodic Review:** Standards are reviewed quarterly for relevance; outdated conventions are removed and new practices are added based on team experience

## Patterns

- **Documentation Template Pattern:**
  ```markdown
  ## Controllers
  - One controller per resource (ResourceController, not UserController with everything)
  - Maximum 5 public methods per controller
  - Validation in Form Request classes, not controller methods
  - Return type declarations on all methods
  ```
  Tabular format with clear examples of good and bad code.
- **Pint Configuration Reference:**
  ```json
  {
    "preset": "laravel",
    "rules": {
      "concat_space": { "spacing": "one" },
      "not_operator_with_successor_space": true
    }
  }
  ```
  Reference the actual Pint configuration in the standards doc so developers understand which rules are enforced.
- **PHPStan Level Strategy:**
  ```markdown
  ## Static Analysis
  - PHPStan level 6 for all new code
  - Existing code at level 5 (baseline)
  - PRs must not introduce new PHPStan errors
  - Use docblocks for collection generics: `@return Collection<int, User>`
  ```
  Specify the PHPStan level strategy so developers know what's expected for static analysis.
- **Naming Convention Pattern:**
  ```markdown
  | Type | Convention | Example |
  |------|-----------|---------|
  | Controller | Singular resource name | UserController |
  | Model | Singular, PascalCase | UserProfile |
  | Migration | snake_case, descriptive | add_avatar_to_users_table |
  | Route | kebab-case plural | /admin/users/{user} |
  | Relationship | snake_case method name | userProfile(), activePosts() |
  ```
- **Architecture Decision Reference:**
  ```markdown
  ## Service Layer
  - Business logic goes in Service classes, not controllers
  - Service classes are stateless (no property state)
  - Each method handles one use case
  - See ADR 0004 for rationale (Service Layer vs Action Pattern)
  ```
  Reference ADRs that document the rationale behind architectural standards.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Standard granularity | Minimal (Pint only) vs comprehensive | Comprehensive but DRY: document what Pint can't enforce; reference Pint docs for style rules |
| Standard location | CONTRIBUTING.md vs dedicated docs/standards.md | Dedicated file (avoids bloating CONTRIBUTING.md); CONTRIBUTING.md links to it |
| Enforcement level | Blocking (CI fails) vs advisory (review flags) | Blocking for automated rules (Pint, PHPStan); advisory for architectural patterns |
| Standard governance | Single author vs team consensus | Team review of standard changes via PR; single author for initial draft |

## Tradeoffs

- **Comprehensive vs Minimal Standards:** Comprehensive standards leave no ambiguity but take time to write, read, and maintain. Minimal standards are quick to create but leave gaps that cause inconsistency. Aim for "minimum viable standards" that cover the most common code review feedback points.
- **Enforced vs Recommended:** Enforced standards (CI failure) guarantee compliance but can cause developer frustration if they're too strict. Recommended standards are gentler but rely on reviewer diligence. A mix works best: enforce code style and static analysis; recommend architecture patterns.
- **Written vs Cultural Standards:** Written standards are explicit but become stale. Cultural standards (team norms passed through pairing and review) are adaptive but inconsistent between team members. Balance both: document the important, stable conventions; let ephemeral practices evolve through team discussion.

## Performance Considerations

- **Document Length:** A coding standards document longer than 20 pages is unlikely to be read. Aim for 5-10 pages covering the most impactful conventions.
- **Discovery Time:** Developers should find the answer to a specific convention question within 30 seconds. Use a clear table of contents and searchable headings.
- **Update Frequency:** Monthly minor updates, quarterly major reviews. Too frequent updates frustrate the team; infrequent updates create stale guidance.

## Production Considerations

- **Standards and Deployment:** Coding standards that affect deployment (e.g., "all configuration in .env, never in code") should be clearly documented with examples (config() helper usage, environment variable naming conventions).
- **Security Standards:** Include security-specific standards (SQL injection prevention via Eloquent, XSS protection, CSRF token usage, rate limiting patterns) as a dedicated section.
- **Breaking Changes:** When standards change (e.g., switching from PSR-12 to PER-CS), document migration steps, timeline, and Pint configuration changes.

## Common Mistakes

- **Repeating Pint documentation:** Writing "use 4 spaces for indentation" when Pint already enforces it; the document should focus on what automation cannot enforce
- **No examples:** Stating "controllers should be thin" without showing a thin controller vs a fat controller example; developers interpret "thin" differently
- **Over-specifying:** Defining conventions for every possible class type (even rarely used ones like Console Kernel, Exception Handler), making the document too long
- **Stale sections:** Keeping outdated conventions because no one removes them; a standard that no longer reflects team practice is worse than no standard
- **No rationale:** Stating "always use Form Requests" without explaining why; developers who don't understand the rationale will disregard it when they disagree

## Failure Modes

- **Standards Ignored:** Developers stop reading or following the standards because they're too long or outdated. Mitigate: keep the document concise; review quarterly; reference standards during PR reviews.
- **Tool vs Doc Disagreement:** Pint is configured differently than the documentation states. Mitigate: use the Pint configuration as the source of truth; generate the style section of the doc from the pint.json file.
- **Standards as Gatekeeping:** Standards are used to reject PRs on trivial grounds (e.g., minor style differences that Pint would catch). Mitigate: automate all trivial checks; reserve human review for architectural and logic concerns.

## Ecosystem Usage

- **Laravel Pint:** Enforces the automated style rules; the coding standards doc extends beyond Pint to cover architecture and patterns
- **Laravel PHPStan (Larastan):** Enforces static analysis standards; the doc specifies the required PHPStan level and any custom rules
- **Laravel Shift:** Provides upgrade standards; the doc should reference how Shift is used for version upgrades
- **Laravel Documentation:** The official Laravel docs serve as a baseline; team-specific standards override or extend the official conventions

## Related Knowledge Units

- laravel-pint
- pint-configuration
- laravel-phpstan
- phpstan-config-for-laravel
- architecture-decision-records

## Research Notes

- The Laravel ecosystem is opinionated by design, which reduces the need for extensive team-specific coding standards; most decisions are already made by the framework
- Spatie's open-source packages are a good reference for well-documented coding standards; their package skeleton includes a CONTRIBUTING.md with clear conventions
- PHP-FIG standards (PSR-12, PER-CS) form the baseline for most Laravel teams, overlaid with Laravel-specific conventions
- Teams that adopt coding standards documentation report 30-50% fewer style-related PR comments and faster review cycles for new team members
