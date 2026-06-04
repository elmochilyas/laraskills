# Skill: Enforce Team API Consistency

## Purpose
Define, enforce, and maintain team-level API consistency rules including naming conventions via Spectral linting in CI, design review before implementation, capped rule count, gradual enforcement, rotating consistency champion, and expiring exceptions.

## When To Use
- Multi-team organizations building multiple APIs
- APIs sharing common consumers who benefit from uniform design
- New projects where consistency is established from start
- Teams onboarding new members frequently

## When NOT To Use
- Single-developer APIs with no external consumers
- Prototype/experimental APIs
- APIs with fundamentally different design requirements (e.g., real-time vs CRUD)

## Prerequisites
- OpenAPI spec generation
- Understanding of team conventions and naming standards
- Spectral or similar API linting tool

## Inputs
- Team naming conventions (fields, paths, enums)
- List of consistency rules with severity levels
- Exception tracking mechanism

## Workflow
1. Enforce naming conventions (snake_case fields, kebab-case paths, UPPER_SNAKE_CASE enums) via Spectral rules in CI — never rely solely on code review
2. Cap active rules at 30 maximum — remove one when adding one to prevent bloat
3. Introduce new rules as "recommended" (warning) for 1 month before making them "required" (error, blocks CI)
4. Set 3-month expiration on every rule exception — require 2-sentence justification in PR description
5. Conduct design review (OpenAPI spec changes) before writing implementation code for new endpoints
6. Rotate consistency champion each sprint to review new endpoint designs and enforce rules
7. Ensure team sub-conventions extend, never contradict, organization-wide global conventions

## Validation Checklist
- [ ] Naming conventions enforced via Spectral in CI
- [ ] Active rules capped at 30 maximum
- [ ] New rules have 1-month recommended period before required
- [ ] Rule exceptions have 3-month expiration with justification
- [ ] Design review conducted before implementation for new endpoints
- [ ] Consistency champion assigned each sprint
- [ ] No contradictory sub-conventions exist

## Common Failures
- Conventions too vague to enforce — use automated validation
- Creating conventions without automated validation — ignored over time
- Over-constraining design — every endpoint looks identical regardless of purpose
- Not updating conventions when team adopts new patterns
- Enforcing internal-only API consistency as strictly as public APIs
- Rule bloat without removal — teams ignore entire rule set

## Decision Points
- Rule severity: warning (recommended) vs error (required)
- Design review scope: all endpoints vs standard CRUD only
- Consistency champion rotation: per sprint vs per month

## Performance Considerations
- Spectral linting runs in CI under 10 seconds for most OpenAPI specs
- Design review is human process — allocate 30-60 minutes
- Consistency scoring is scheduled batch job running overnight

## Security Considerations
- Consistency rules must not override security requirements (auth on every endpoint)
- Naming must not expose internal infrastructure details
- Automated linting can enforce security header presence consistently

## Related Rules
- Enforce Naming Conventions via Spectral in CI
- Cap Active Rules at 30
- Use Gradual Enforcement — Recommended Then Required
- Set Exception Expiration Dates
- Conduct Design Review Before Implementation
- Rotate Consistency Champion Each Sprint
- Never Contradict Global Conventions with Sub-Conventions

## Related Skills
- Document API Style Guide
- Implement ADR Process for APIs
- Review API Design

## Success Criteria
- Naming violations are caught by CI, not code review
- Active rule count stays at or below 30
- New rules phase in gradually with recommended period
- Rule exceptions expire and are reviewed
- New endpoint designs are reviewed before implementation
- Consistency champion ensures ongoing rule adherence
- Sub-conventions align with global conventions
