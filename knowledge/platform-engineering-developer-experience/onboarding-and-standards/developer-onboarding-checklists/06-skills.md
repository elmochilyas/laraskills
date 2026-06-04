# Skill: Create Developer Onboarding Checklists

## Purpose
Provide a structured, consistent onboarding experience for new Laravel developers with verifiable tasks organized by timebound segments, ensuring faster ramp-up and reducing dependency on the assigned buddy.

## When To Use
- Team is hiring new Laravel developers regularly
- Current onboarding is inconsistent (varies by who helps)
- New developers report confusion or delays during first weeks
- Environment setup takes more than 2 hours
- First PR takes more than 2 weeks to achieve

## When NOT To Use
- Team of 1-2 developers with no plans to grow
- Onboarding happens once every 2+ years
- Team relies on pair programming full-time

## Prerequisites
- Automated environment setup script ready
- Local environment setup documentation written
- CONTRIBUTING.md in place
- Project repository with access configured
- Onboarding buddy assigned

## Inputs
- List of access grants and tools needed
- Environment setup documentation
- Coding standards documentation
- Development workflow documentation
- Team calendar and meeting schedules

## Workflow
1. Create `ONBOARDING.md` or `docs/onboarding/checklist.md` in the repository
2. Organize checklists by timebound segments: Pre-arrival, Day 1, Week 1, Month 1
3. Pre-arrival: hardware, OS setup, admin access grants, tool installations
4. Day 1: introductions, environment setup, team meetings, chat channels
5. Week 1: first PR goal, codebase walkthrough, pair programming sessions
6. Month 1: independent contribution, first deployment, code review participation
7. Add verification steps to every task (not just "do X" but "verify Y works")
8. Include a feedback task asking the new developer to suggest checklist improvements
9. Assign a buddy with structured daily time commitment (1-2 hours/day week 1)
10. Target first PR merged by end of week 1

## Validation Checklist
- [ ] 20-30 items total across all segments (not overwhelming)
- [ ] Each item has a verification step to confirm completion
- [ ] Day 1 focuses on admin, introductions, and environment setup only
- [ ] First PR is explicitly targeted for week 1
- [ ] Human elements included (team lunches, 1:1s, informal chats)
- [ ] Feedback loop asks new developer to improve the checklist
- [ ] Checklist is version-controlled in the repository
- [ ] Buddy has structured time commitment documented

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Checklist items not verifiable | No "Verify:" step | Add verification command to each task |
| Day 1 is overloaded | Too many tasks | Focus on admin, intros, and environment only |
| First PR takes 3+ weeks | No explicit week-1 goal | Target first PR by end of week 1 |
| Checklist becomes stale | No update process | Include feedback task and quarterly review |
| New developer feels isolated | Missing human element | Include team lunches, 1:1s, informal intros |
| Buddy is unavailable | No coverage | Assign backup buddy for coverage |

## Decision Points
- **Checklist location:** Repository markdown file vs wiki vs project management tool
- **Segment length:** 5-8 items per section vs 10-15 items
- **Buddy hours:** 1-2 hours/day week 1 vs full-time pairing
- **First PR timing:** Week 1 vs Week 2 (depends on project complexity)

## Performance/Security Considerations
- Access grant tasks should include security briefings and NDAs
- Checklist should reference security policies (password managers, VPN, 2FA)
- Remove access promptly if onboarding does not complete
- Version control the checklist for audit trail of what was completed

## Related Rules
- ONBOARD-RULE-001 through ONBOARD-RULE-012

## Related Skills
- Create Automated Environment Setup Scripts
- Document Local Environment Setup
- Create CONTRIBUTING.md
- Document Development Workflow
- Create Coding Standards Documentation

## Success Criteria
- New developer has working environment by end of Day 1
- First PR merged by end of Week 1
- Developer is making independent contributions by Month 1
- Onboarding feedback score >4/5 on consistency
- Zero access-related blockers during first week
- Checklist is reviewed and updated quarterly based on feedback
