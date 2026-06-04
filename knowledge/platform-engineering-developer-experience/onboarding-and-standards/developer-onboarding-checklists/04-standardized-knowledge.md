# Experience Curation: Developer Onboarding Checklists

## Metadata
- **KU ID:** onboarding-team-standards/developer-onboarding-checklists
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** automated-environment-setup-scripts, local-environment-setup-documentation, contributing-dot-md-patterns
- **Related Technologies:** Onboarding, DevOps, Laravel, Sail, Documentation
- **Target Audience:** Team leads, onboarding buddies, new developers

## Overview

Developer onboarding checklists are structured lists of tasks that a new developer completes during their first days and weeks on a Laravel team. These checklists cover administrative setup (access grants, tool installations), environment provisioning (Docker, Sail, repository clone), project exploration (codebase walkthrough, key directories, architecture documents), development workflow (branching, testing, deployment), and team integration (standups, pair programming, code review). Effective checklists are categorized by day/week (Day 1: admin setup; Week 1: environment and first PR; Month 1: independent contribution), include verification steps (tick only after confirming the item works), and are stored in a shared location (repository-based, versioned). The goal is to ensure a consistent onboarding experience regardless of which team member is helping the new hire.

## Core Concepts

- **Day Structure:** Checklists organized by timebound segments: Pre-arrival, Day 1 (admin), Week 1 (environment), Month 1 (productivity)
- **Verification Step:** Each checklist item includes a verification action to confirm completion, not just acknowledgment
- **Buddy Assignment:** A senior team member is assigned as the onboarding buddy with daily check-ins
- **First PR Goal:** Explicitly aims for the developer to merge their first PR within the first week
- **Feedback Loop:** A "checklist feedback" task invites the new developer to suggest improvements to the checklist itself
- **Checklist as Safety Net:** Even experienced developers forget details; the checklist catches these gaps

## When To Use

- Team is hiring new Laravel developers regularly
- Current onboarding is inconsistent (varies by who helps the new hire)
- New developers report confusion or delays during their first weeks
- Environment setup takes more than 2 hours
- First PR takes more than 2 weeks to achieve

## When NOT To Use

- Team of 1-2 developers with no plans to grow
- Onboarding happens once every 2+ years (checklist will be stale by next use)
- Team relies on pair programming full-time (implicit onboarding through pairing)
- Organization has a centralized HR onboarding program (checklist exists elsewhere)

## Best Practices (WHY)

1. **Include Verification Steps (Why):** "Install Docker" without "Verify: `docker run hello-world` succeeds" means the developer may think Docker is installed when it's not functional. Each item must have a verifiable outcome to prevent false completions.

2. **Target First PR in Week 1 (Why):** The first PR is a concrete milestone that provides a sense of accomplishment and proves the developer can navigate the full workflow. Research shows this milestone correlates with 6-month retention and 50% faster ramp-up.

3. **Keep Day 1 Light (Why):** Overloading Day 1 with environment setup, team meetings, and project overview leads to cognitive overload. Focus Day 1 on admin, introductions, and a successful environment setup. Technical deep dives come later.

4. **Include the Human Element (Why):** Technical checklists miss team introductions, cultural norms, and informal knowledge transfer (where to go for help, unwritten rules). Include items for team lunches, 1:1s with key stakeholders, and informal chat channel introductions.

5. **Version Control the Checklist (Why):** Store the checklist in the repository as a markdown file. This keeps it versioned, PR-reviewable, and always in sync with the codebase. Wiki-based checklists diverge from the actual process.

## Architecture Guidelines

- **Format:** Markdown in repository (`ONBOARDING.md` or `docs/onboarding/checklist.md`). Versioned and PR-reviewable. Supplementary guides in wiki for HR/admin tasks.
- **Structure:** Organized by time: Pre-arrival, Day 1, Week 1, Month 1. Each section has 5-8 high-level items with sub-items.
- **Verification:** Self-verify with buddy spot-check. Buddy signs off on Day 1 and End of Week 1. Use checkboxes that must be ticked.
- **Duration:** 1-month structured checklist with a 3-month check-in for long-term integration.
- **Buddy Allocation:** Formal allocation with time budget (1-2 hours/day week 1, 30 min/day week 2). Backup buddy for coverage.

## Performance

- **Checklist Size:** 20-30 items across the first month. Daily lists of 5-8 items. Longer lists overwhelm and lead to false completions.
- **Time Budget:** 100% allocated to onboarding for week 1. Minimize administrative interruptions (standups, meetings).
- **Buddy Time:** 1-2 hours/day week 1, tapering to 30 min/day by week 2. Over-burdening the buddy reduces quality.

## Security

- **Security Onboarding:** Include MFA setup, SSH key generation and upload, VPN configuration, secrets management, and production access restrictions.
- **Production Access:** New developers observe production deployments before having deployment permissions. Document the permission escalation process.
- **Access Revocation:** Include offboarding version of checklist (revoke GitHub, Forge, Vapor, Slack, email). Test offboarding annually.

## Common Mistakes

### Mistake 1: Assuming Prior Knowledge
- **Description:** Checklist assumes the developer knows Docker, Sail, Laravel conventions
- **Cause:** Team forgets what it was like to be new
- **Consequence:** Developer gets stuck on assumed knowledge, feels inadequate
- **Better:** Link to prerequisite materials; include "what to read first" section

### Mistake 2: No Verification Step
- **Description:** "Install Docker" without verification command
- **Cause:** Focus on listing tasks, not confirming outcomes
- **Consequence:** Developer thinks setup succeeded when it didn't
- **Better:** Every item ends with a verification command

### Mistake 3: Stale Checklist
- **Description:** Checklist references tools or processes that have changed
- **Cause:** No scheduled review cycle
- **Consequence:** Developer follows instructions that don't work, causes frustration
- **Better:** Test checklist on every new hire; quarterly review cycle

### Mistake 4: Buddy Overload
- **Description:** Buddy has too many other responsibilities to dedicate time
- **Cause:** No formal allocation of onboarding time
- **Consequence:** New developer feels unsupported, onboarding takes longer
- **Better:** Formally allocate buddy time; have a backup buddy; reduce buddy's sprint commitments

## Anti-Patterns

- **The Firehose Checklist:** 50 items on Day 1. Overwhelms the developer. Spread items across weeks with reasonable daily limits.
- **The HR Checklist Only:** Only covers admin tasks (laptop, access cards, benefits). Ignores technical setup and team integration. Must be combined with a technical checklist.
- **The Read-Only Checklist:** Checklist is a PDF emailed to the developer. Can't be updated collaboratively. Use version-controlled markdown.
- **The Forgotten Checklist:** After week 1, nobody checks progress on month 1 items. Schedule calendar reminders tied to checklist items.

## Examples

### Example 1: Day 1 Checklist
```markdown
## Day 1: Environment & Orientation
- [ ] Machine setup complete (Docker, VS Code, Git, 1Password)
- [ ] Repository cloned and `make setup` runs successfully
- [ ] Application accessible at http://localhost
- [ ] First migration runs (`sail artisan migrate`)
- [ ] First test run: all tests pass
- [ ] IDE configured with Laravel extensions
- [ ] Buddy check-in complete: questions answered
```

### Example 2: Week 1 Technical Checklist
```markdown
### Technical Setup Verification
- [ ] Sail environment: `sail artisan about` shows correct PHP version
- [ ] IDE Helper: `sail artisan ide-helper:generate` completes
- [ ] Pint: `./vendor/bin/pint --test` passes
- [ ] PHPStan: `./vendor/bin/phpstan analyse` passes at level X
- [ ] Telescope/Debugbar accessible
- [ ] First small ticket assigned, implemented, and PR created
- [ ] PR reviewed and merged: first contribution complete!
```

## Related Topics

- **automated-environment-setup-scripts:** Automating the setup steps
- **local-environment-setup-documentation:** Detailed setup instructions
- **contributing-dot-md-patterns:** Contribution guidelines reference
- **coding-standards-documentation:** Standards new developers must learn
- **team-collaboration-patterns:** Team interaction norms

## AI Agent Notes

- **Context Requirements:** When advising on onboarding checklists, first understand team size, hiring frequency, current onboarding process (or lack thereof), and common pain points reported by recent hires.
- **Key Decision Points:** Day structure (1 week vs 1 month), verification approach (self vs buddy sign-off), checklist location (repo vs wiki), buddy allocation formality.
- **Common Pitfalls in AI Assist:** Don't recommend overly detailed checklists (50+ items). Always include verification steps. Remember the human element (team introductions, cultural norms).
- **Laravel-Specific Nuances:** Docker/Sail configuration is the most common failure point—checklist items here need the most detail. First-week checklist should include Sail-specific verification steps.

## Verification
- [ ] KU accurately defines developer onboarding checklists
- [ ] Core concepts cover day structure, verification, buddy system
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize verification and first PR goal
- [ ] Architecture guidelines cover format, structure, buddy allocation
- [ ] Performance addresses checklist size and time budget
- [ ] Security covers production access and offboarding
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns include firehose checklist and forgotten checklist
- [ ] Examples show realistic day/week checklist format
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
