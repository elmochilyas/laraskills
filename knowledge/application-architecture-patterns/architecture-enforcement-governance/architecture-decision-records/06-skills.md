# Skill: Document Architecture Decisions as ADRs

## Purpose
Write ADRs before implementing the decision (forces clarity). Include rejected options with rationale. Review ADRs as part of the PR alongside implementation. Keep ADRs short (1-2 pages). Store in `docs/adr/` in the repository. Document one decision per ADR. Mark superseded ADRs clearly — never delete. Never include secrets in ADRs.

## When To Use
- Documenting significant architecture decisions with lasting impact
- Capturing context and rationale for future reference

## When NOT To Use
- Routine implementation choices (use code comments)
- Decisions that are clearly temporary

## Prerequisites
- Understanding of architectural decision-making
- Code review guardrails (AEG-04)

## Inputs
- Decision context and options considered
- Chosen architecture direction

## Workflow
1. **Write ADRs before implementing the decision.** If the ADR rationale is weak, rethink before coding. Prevents costly implementation of poorly-thought-out decisions.

2. **Include rejected options with rationale.** Document why options were rejected. Future readers need to know alternatives were considered and why they were dismissed — prevents recurring debates.

3. **Review ADRs as part of the pull request.** Include the ADR in the same PR as the implementation code. Reviewers check that implementation matches the ADR.

4. **Keep ADRs short (1-2 pages).** If a decision needs more space, split into multiple focused ADRs. Concise ADRs are actually read by the team.

5. **Store ADRs in `docs/adr/` in the repository.** Versioned alongside the code. Never store in wiki, Confluence, or separate documentation systems.

6. **Document one decision per ADR.** Each ADR is independently referenceable, supersedeable, and reviewable. Combined decisions cannot be superseded independently.

7. **Mark superseded ADRs clearly.** Update superseded ADRs with a `Superseded by ADR-NNN` header. Never delete — preserves decision history.

8. **Never include secrets or credentials in ADRs.** ADRs are in the repository and visible to everyone with access. Secrets are permanently retained in Git history.

## Validation Checklist
- [ ] ADRs exist for all significant architecture decisions
- [ ] ADRs follow the template (Title, Status, Context, Decision, Consequences)
- [ ] ADRs include rejected options
- [ ] ADRs are stored in `docs/adr/` and versioned in the repo
- [ ] ADRs are short (1-2 pages)
- [ ] One decision per ADR
- [ ] Superseded ADRs are clearly marked

## Common Failures
- **No ADRs.** Decisions made in Slack or conversations — no one remembers why.
- **ADRs too long.** Team stops reading them — too much effort.
- **ADRs written after implementation.** Post-hoc justifications rather than decision records.

## Decision Points
- **ADR vs convention doc?** ADR for individual decisions with rationale. Convention doc for ongoing team practices.

## Performance Considerations
- ADRs are documentation-only. No performance impact.

## Security Considerations
- ADRs should not contain secrets, credentials, or vulnerability details.

## Related Rules
- Rule: Write ADRs Before Implementing The Decision (AEG-06/05-rules.md)
- Rule: Include Rejected Options With Rationale (AEG-06/05-rules.md)
- Rule: Review ADRs As Part Of The Pull Request (AEG-06/05-rules.md)
- Rule: Keep ADRs Short (1-2 Pages) (AEG-06/05-rules.md)
- Rule: Store ADRs In `docs/adr/` (AEG-06/05-rules.md)
- Rule: Document One Decision Per ADR (AEG-06/05-rules.md)
- Rule: Mark Superseded ADRs Clearly (AEG-06/05-rules.md)
- Rule: Never Include Secrets In ADRs (AEG-06/05-rules.md)

## Related Skills
- Document Team Conventions (AEG-07/06-skills.md)
- Apply Code Review Guardrails (AEG-04/06-skills.md)
- Create Onboarding Documentation (AEG-10/06-skills.md)

## Success Criteria
- Every significant architecture decision has an ADR written before implementation begins.
- ADRs include rejected options with clear rationale — not just the chosen option.
- ADRs are stored in `docs/adr/` in the repository, versioned with code, and included in implementation PRs.
- Each ADR is 1-2 pages covering exactly one decision.
- Superseded ADRs are marked with a pointer to the superseding ADR — never deleted.
- No ADR contains credentials, API keys, or security-sensitive information.
