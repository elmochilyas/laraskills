# Skill: Document API Architecture Decisions with ADRs

## Purpose
Create and maintain Architecture Decision Records for significant API design decisions using structured templates with YAML frontmatter, PR-based review, sequential numbering, and a non-deletion policy to preserve organizational memory.

## When To Use
- Any significant API design decision (naming, pagination, auth, versioning)
- Decisions with multiple viable alternatives
- Choices with long-term impact on API surface or consumer experience
- Decisions that future team members will need to understand

## When NOT To Use
- Trivial implementation details (variable naming, code organization)
- Decisions covered by existing style guides or consistency rules
- Reversible choices with minimal consumer impact
- Personal preferences with no architectural significance

## Prerequisites
- Understanding of ADR methodology
- Markdown editing workflow
- PR-based code review process

## Inputs
- Decision context and problem statement
- List of options considered with pros/cons
- Decision rationale and chosen option
- Expected consequences

## Workflow
1. Create one ADR per decision — if it exceeds 2 pages, split into multiple ADRs
2. Write ADRs during the design phase before implementation begins
3. Use YAML frontmatter (status, date, supersedes, affects) for machine-readability
4. Use sequential numbering with descriptive names: `0014-pagination-strategy.md`
5. Submit ADRs as pull requests with mandatory review and approval before merging
6. Reference ADR numbers in commit messages and code comments for traceability
7. Never delete superseded ADRs — update status to "superseded" and link to replacing ADR
8. Keep individual ADRs to 1-2 pages maximum — use executive summary if longer

## Validation Checklist
- [ ] One ADR per decision (not bundled)
- [ ] Written during design phase, not after implementation
- [ ] YAML frontmatter included (status, date, supersedes, affects)
- [ ] Sequential numbering with descriptive name
- [ ] Submitted and reviewed as PR before merging
- [ ] ADR numbers referenced in commit messages and code comments
- [ ] Superseded ADRs retained with updated status
- [ ] ADR length within 1-2 page limit

## Common Failures
- Writing ADRs that are too long (novels nobody reads)
- Using ADRs for trivial decisions not warranting documentation
- Forgetting to update ADR status when decision changes
- Writing ADRs after implementation (rationale forgotten or post-hoc rationalized)
- Not reviewing ADRs during design phase — become historical records rather than decision tools

## Decision Points
- Template choice: Michael Nygard template vs ADR GitHub template vs custom API-specific template
- Status lifecycle: proposed/accepted/deprecated/superseded vs simpler states
- Storage location: docs/adr/ in repo vs wiki vs dedicated ADR tool

## Performance Considerations
- ADRs are static documents — no runtime performance impact
- ADR tooling (search, indexing) has negligible overhead

## Security Considerations
- ADRs may document security decisions — ensure access control if stored in private repo
- Security-related ADRs should be reviewed by security team before acceptance
- Do not include credentials, secrets, or vulnerability details in ADRs

## Related Rules
- Write One ADR Per Decision
- Write ADRs Before or During Design Phase
- Review ADRs Like Code in PRs
- Reference ADR Numbers in Commit Messages and Code Comments
- Never Delete Superseded ADRs
- Use YAML Frontmatter for Machine-Readability
- Keep ADRs to 1-2 Pages

## Related Skills
- Enforce Team API Consistency
- Manage Breaking Changes
- Review API Design Decisions

## Success Criteria
- Each significant API decision has a corresponding ADR
- ADRs are written and reviewed before implementation begins
- ADR numbers are traceable in commit messages and code
- Superseded ADRs remain in repository for historical context
- ADRs remain concise (1-2 pages) and focused on a single decision
- YAML frontmatter enables automated tooling for status tracking
- ADR process is lightweight enough that team follows it consistently
