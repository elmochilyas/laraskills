# Skill: Write and Maintain Coding Standards Documentation

## Purpose
Establish consistent code style, naming, structure, and architectural patterns across a Laravel team through documented conventions enforced by tools and review.

## When To Use
- Team has 3+ developers and PRs frequently include style or pattern feedback
- New team members need to learn "how we write code here" quickly
- Code reviews consistently flag the same issues
- Organization wants consistent architecture across multiple Laravel projects
- Team is distributed across time zones

## When NOT To Use
- Single developer or pair programming full-time
- Organization is too early-stage (standards will change frequently)
- Team is unwilling to enforce standards through CI or review

## Prerequisites
- Laravel Pint configured and running in CI
- PHPStan configured at appropriate level
- PR review workflow established
- Team agreement that standards documentation is valuable

## Inputs
- Existing code review feedback (recurring patterns)
- Pint and PHPStan configuration files
- Team's architectural conventions (service layer, actions, DTOs)
- Laravel ecosystem conventions and PSR-12

## Workflow
1. Audit recent PR feedback to identify recurring style and pattern comments
2. Distinguish between what Pint/PHPStan can enforce vs what needs manual review
3. Create `docs/standards.md` with sections per file type (Controllers, Models, Migrations, Tests)
4. For each standard: show a good example AND a bad example with explanation
5. Provide rationale for each standard (why this matters)
6. Mark each standard as "blocking" (CI-enforced) or "advisory" (review-enforced)
7. Link to Pint config and PHPStan config from the standards doc (don't duplicate)
8. Review with the team and get consensus via PR
9. Enforce blocking standards in CI pipeline
10. Review and update the document quarterly

## Validation Checklist
- [ ] Document does not repeat Pint/PHPStan documentation
- [ ] Each standard includes a good example and a bad example
- [ ] Each standard includes rationale explaining the "why"
- [ ] Blocking vs advisory standards are clearly distinguished
- [ ] Document is 5-10 pages (longer docs are not read)
- [ ] CONTRIBUTING.md links to the standards document
- [ ] Team has reviewed and agreed to the standards
- [ ] CI enforces all blocking standards

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Standards doc is 50+ pages | Over-documenting trivial preferences | Focus on what automation cannot enforce |
| Developers ignore the standards | No rationale provided | Explain the "why" behind each standard |
| Standards repeat Pint docs | Duplicating automated rules | Reference Pint config; don't copy it |
| Standards become stale | No review cycle | Schedule quarterly review |
| Ambiguous standards cause debate | No examples provided | Always include good/bad code examples |
| Advisory standards never followed | No enforcement mechanism | Consider making frequent advisory items blocking |

## Decision Points
- **Enforcement level:** Blocking (CI fails) vs Advisory (review flags)
- **Document length:** Comprehensive (10 pages) vs focused (5 pages)
- **Review cadence:** Quarterly vs per-sprint vs on-demand
- **Scope:** Single project vs organization-wide

## Performance/Security Considerations
- Security-related standards (SQL injection prevention, XSS protection, mass assignment) MUST be blocking
- Performance-related standards (N+1 query prevention, eager loading) should be blocking in CI
- No sensitive information or credentials in standards documentation

## Related Rules
- CSDOC-RULE-001 through CSDOC-RULE-012

## Related Skills
- Configure Laravel Pint
- Set Up Laravel PHPStan
- Contribute to Projects via CONTRIBUTING.md
- Define Code Review Standards
- Set Up Pre-commit Hooks

## Success Criteria
- PR style feedback decreases by 80% within 2 months
- New team members can read standards and write PRs that pass review
- Standards document is updated quarterly with current conventions
- Blocking standards are enforced by CI; advisory standards are flagged in review
- All team members can articulate the rationale behind each standard
