# Skill: Write and Maintain Architecture Decision Records

## Purpose
Capture significant architectural decisions with context, options, rationale, and consequences to preserve institutional memory, support onboarding, and prevent repeated discussions.

## When To Use
- Significant architectural decisions with long-term impact
- Package or tool selection with multiple viable options
- Decisions that override or extend framework defaults
- Decisions where you want to prevent repeated discussion
- Decisions new team members will ask "why did we choose this?"

## When NOT To Use
- Trivial choices (tabs vs spaces, variable naming)
- Decisions already enforced by tooling (Pint rules, PHPStan level)
- Personal preferences that don't affect the team
- Situations where documentation overhead outweighs decision impact

## Prerequisites
- Git repository with a `docs/adrs/` directory
- Understanding of Michael Nygard's ADR format
- GitHub/GitLab PR review workflow in place
- Team agreement to follow the ADR process

## Inputs
- Architectural decision to be made
- List of options considered
- Context and constraints for the decision

## Workflow
1. Create a new ADR file at `docs/adrs/XXXX-title.md` using sequential numbering
2. Set the status to "Proposed"
3. Document the context driving the decision
4. List all options considered with their pros and cons
5. State the decision clearly with the chosen option
6. Document the consequences (positive and negative)
7. Open a PR with the ADR for team review
8. Address feedback within the PR discussion
9. Merge the PR with status changing to "Accepted" (or close as "Rejected")
10. Update the ADR status if the decision is later superseded

## Validation Checklist
- [ ] ADR follows Nygard format (Title, Status, Context, Decision, Consequences)
- [ ] Alternatives section documents what was considered and why rejected
- [ ] ADR is 1-2 pages maximum
- [ ] Sequential numbering is used (no gaps for accepted ADRs)
- [ ] PR has at least 1-2 reviewers within 24-hour SLA
- [ ] Superseded ADRs have their status updated and reference the new ADR

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| ADR too long (10+ pages) | Too much detail | Limit to 1-2 pages; longer content belongs in design docs |
| ADR never written | Meeting-based decisions | Enforce ADR requirement in PR review checklist |
| ADR never reviewed | No SLA | Set 24-hour review SLA for ADR PRs |
| Decision reversed but ADR not updated | Forgotten | Include ADR status audit in quarterly reviews |
| Trivial decisions documented | Over-engineering | Apply decision threshold: skip if reversible in <1 day |

## Decision Points
- **Number of reviewers:** 1 for standard ADRs, 2 for infrastructure or architecture changes
- **Review mechanism:** PR-based (forces written rationale) vs meeting-based (verbal discussion)
- **Storage location:** Co-located in repo (`docs/adrs/`) vs external wiki
- **Rejected ADRs:** Keep with Rejected status (prevents re-debate) or delete entirely

## Performance/Security Considerations
- ADRs may contain security-sensitive decisions (encryption choice, authentication method); restrict repo access appropriately
- No sensitive credentials or secrets should be included in ADR content
- ADRs are version-controlled; ensure no commit exposes secrets in the decision history

## Related Rules
- ADR-RULE-001 through ADR-RULE-012

## Related Skills
- Contribute to Projects via CONTRIBUTING.md
- Document Development Workflow
- Set Up Coding Standards Documentation
- Collaborate via Team Patterns

## Success Criteria
- Every significant architectural decision has an ADR with Accepted status
- ADR PRs receive review feedback within 24 hours
- New team members can read ADRs to understand past decisions
- Superseded ADRs are properly updated with cross-references
- Team does not re-debate decisions already recorded in ADRs
