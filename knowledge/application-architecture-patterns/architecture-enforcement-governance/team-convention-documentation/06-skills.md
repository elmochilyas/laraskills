# Skill: Document Team Conventions as a Living Reference

## Purpose
Maintain a single `docs/conventions.md` per project. Link each convention section to architecture tests. Update conventions via PR with team review. Review conventions quarterly. Reference conventions in code review comments with links. Keep conventions concise — one convention per section. Include security practices.

## When To Use
- Capturing team-wide coding and architecture standards
- Onboarding new team members
- Reducing debate during code review

## When NOT To Use
- Individual architecture decisions (use ADRs instead)
- Temporary or experimental patterns

## Prerequisites
- ADRs documented (AEG-06)
- Architecture tests defined (AEG-01)

## Inputs
- Team agreements on coding practices
- Architecture test references

## Workflow
1. **Maintain a single convention doc per project at `docs/conventions.md`.** A single document is easy to find and maintain. All conventions — code style, architecture, testing — in one file with clear section headers.

2. **Link each convention section to architecture tests.** For every enforceable convention, include a link to the corresponding architecure test. A convention without a test is aspirational at best.

3. **Update conventions via pull request with team review.** Convention changes are team agreements. A PR ensures the change is reviewed, discussed, and deliberately approved.

4. **Review conventions quarterly.** Schedule a quarterly review to remove outdated entries, add new patterns, and update sections that no longer match the codebase.

5. **Reference conventions in code review comments.** When leaving a review comment about a convention, link to the specific section of `docs/conventions.md`. Educates the developer and reinforces the standard.

6. **Keep conventions concise — one convention per section.** Each convention described in 2-3 sentences. Detailed explanations belong in ADRs and the onboarding doc.

7. **Include security practices in conventions.** Document the team's agreed-upon security patterns — input validation approach, authorization strategy, data encoding.

## Validation Checklist
- [ ] `docs/conventions.md` exists and is referenced
- [ ] Convention sections map to architecture tests
- [ ] Conventions are updated via PR
- [ ] Quarterly review is scheduled
- [ ] Code review comments link to convention sections
- [ ] Security practices are documented
- [ ] One convention per section, concise

## Common Failures
- **No convention doc.** Conventions exist only in senior developers' heads.
- **Convention doc too long.** 50-page doc that no one reads.
- **Outdated conventions.** Doc says one thing, codebase does another.

## Decision Points
- **Convention doc vs ADR?** Conventions for ongoing practices. ADRs for individual decisions with rationale.

## Performance Considerations
- Documentation only. No performance impact.

## Security Considerations
- Conventions should include security practices (input validation, authorization approach).

## Related Rules
- Rule: Maintain A Single Convention Doc Per Project (AEG-07/05-rules.md)
- Rule: Link Each Convention Section To Architecture Tests (AEG-07/05-rules.md)
- Rule: Update Conventions Via Pull Request (AEG-07/05-rules.md)
- Rule: Review Conventions Quarterly (AEG-07/05-rules.md)
- Rule: Reference Conventions In Code Review Comments (AEG-07/05-rules.md)
- Rule: Keep Conventions Concise (AEG-07/05-rules.md)
- Rule: Include Security Practices In Conventions (AEG-07/05-rules.md)

## Related Skills
- Document ADRs (AEG-06/06-skills.md)
- Apply Code Review Guardrails (AEG-04/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)

## Success Criteria
- A single `docs/conventions.md` exists and is the authoritative reference for all team conventions.
- Every enforceable convention section links to a corresponding architecture test.
- Convention changes go through PR review — no direct edits to main branch.
- Quarterly reviews keep the document current with the codebase.
- Code review comments reference specific convention sections with links.
- Security practices are explicitly documented in the conventions.
