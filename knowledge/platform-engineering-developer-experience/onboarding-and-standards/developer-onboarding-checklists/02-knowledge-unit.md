# Knowledge Unit: Developer Onboarding Checklists

## Metadata
- **Subdomain:** Onboarding & Team Standards
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** onboarding-team-standards/developer-onboarding-checklists
- **Maturity:** Maturing
- **Related Technologies:** Onboarding, DevOps, Laravel, Sail, Documentation

## Executive Summary

Developer onboarding checklists are structured lists of tasks that a new developer completes during their first days and weeks on a Laravel team. These checklists cover administrative setup (access grants, tool installations), environment provisioning (Docker, Sail, repository clone), project exploration (codebase walkthrough, key directories, architecture documents), development workflow (branching, testing, deployment), and team integration (standups, pair programming, code review). The checklist ensures consistent onboarding experiences regardless of which team member is helping the new hire, and it prevents common oversights (missing database access, incorrect PHP version, unconfigured IDE tools). Effective checklists are categorized by day/week (Day 1: admin setup; Week 1: environment and first PR; Month 1: independent contribution), include verification steps (tick only after confirming the item works), and are stored in a shared location (GitHub wiki, Notion, or the project repository).

## Core Concepts

- **Day Structure:** Checklists organized by timebound segments: Pre-arrival (before day 1), Day 1 (admin), Week 1 (environment), Month 1 (productivity), reducing cognitive load by grouping tasks by type
- **Verification Step:** Each checklist item includes a verification action (e.g., "Run `sail artisan about` to confirm environment is operational") to confirm completion, not just acknowledgment
- **Buddy Assignment:** A senior team member is assigned as the onboarding buddy; the checklist includes buddy touchpoints (daily check-ins for week 1, then tri-weekly for month 1)
- **First PR Goal:** The checklist explicitly aims for the developer to merge their first PR within the first week; this provides a concrete milestone and sense of accomplishment
- **Feedback Loop:** A "checklist feedback" task at the end of onboarding invites the new developer to suggest improvements to the checklist itself

## Mental Models

- **Checklist as Onboarding Script:** The checklist is a script for the onboarding buddy and new developer to follow together, ensuring nothing is assumed or forgotten
- **Checklist as Safety Net:** Even experienced developers forget details (SSH keys, IDE extension Xdebug); the checklist catches these gaps before they cause frustration
- **Checklist as Knowledge Base:** Each checklist item implicitly documents a piece of institutional knowledge; the complete checklist is a map of what a developer needs to know

## Internal Mechanics

1. **Pre-Arrival (HR/IT):** Laptop provisioning, OS setup, basic tool installation (Docker Desktop, VS Code, Git, 1Password), GitHub/Forge account creation
2. **Day 1 (Admin):** Team introductions, Slack/Discord channels, calendar invites (standups, sprint planning), README review, Code of Conduct acknowledgment
3. **Week 1 (Environment):** Repository clone, automated setup script run, Sail environment verification, first successful migration, first test run (green suite), IDE extensions installed (Laravel IDE Helper, PHP Intelephense, Pint)
4. **Week 2 (Contribution):** First ticket assignment (small, well-scoped), PR creation, code review participation, deployment observation (Forge or Vapor dashboard access)
5. **Month 1 (Independence):** Independent ticket assignment, on-call rotation shadowing, architecture decision review (current ADRs), checklist feedback submission

## Patterns

- **Day 1 Checklist Pattern:**
  ```markdown
  ## Day 1: Environment & Orientation
  - [ ] Machine setup complete (Docker, VS Code, Git, 1Password)
  - [ ] Repository cloned and `make setup` runs successfully
  - [ ] Application accessible at http://localhost
  - [ ] First migration runs (sail artisan migrate)
  - [ ] First test run: all tests pass
  - [ ] IDE configured with Laravel extensions
  ```
- **Week 1 Technical Checklist Pattern:**
  ```markdown
  ### Technical Setup Verification
  - [ ] Sail environment: `sail artisan about` shows correct PHP version
  - [ ] IDE Helper: `sail artisan ide-helper:generate` completes without errors
  - [ ] Pint: `./vendor/bin/pint --test` passes
  - [ ] PHPStan: `./vendor/bin/phpstan analyse` passes at level X
  - [ ] Telescope/Debugbar accessible at /telescope or /_debugbar
  - [ ] Mailpit accessible at http://localhost:8025
  ```
- **Knowledge Transfer Checklist Pattern:**
  ```markdown
  ### Knowledge Areas (shadow sessions)
  - [ ] Production deployment process (Forge/Vapor): watch one deploy
  - [ ] CI/CD pipeline: walk through GitHub Actions workflow
  - [ ] Monitoring: review Pulse dashboard, understand health checks
  - [ ] On-call: review incident response runbook
  - [ ] Database: understand migration strategy and seeding
  ```
- **First PR Pattern:**
  ```markdown
  ### First Pull Request
  - [ ] Ticket assigned and understood
  - [ ] Branch created (feature/ticket-description)
  - [ ] Implementation complete with tests
  - [ ] Pint check passes
  - [ ] PHPStan check passes
  - [ ] PR created with checklist filled
  - [ ] PR reviewed and merged
  - [ ] Deployment observed (if applicable)
  ```
- **Buddy Feedback Pattern:**
  ```markdown
  ### Onboarding Buddy Log
  - Day 1 check-in: completed, questions about Sail startup
  - Day 3 check-in: first PR up, need help with test structure
  - Week 2 check-in: independent work, reviewing ADRs
  - Month 1 review: checklist feedback collected, onboarding improvements identified
  ```

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Checklist format | Markdown in repo vs Notion vs wiki | Markdown in repo (versioned, PR-reviewed, always accessible); Notion for supplementary guides |
| Granularity | High-level (5 items/day) vs detailed (20 items/day) | Mixed: 5-8 high-level items per day, each with sub-items for detailed steps |
| Verification method | Self-verify vs buddy sign-off | Self-verify with buddy spot-check; buddy signs off on Day 1 and End of Week 1 |
| Duration | 1 week vs 1 month vs 3 months | 1 month structured checklist; 3-month check-in for long-term integration |

## Tradeoffs

- **Structured vs Flexible Checklist:** Structured checklists ensure consistency but may feel bureaucratic to experienced developers. Flexible checklists are more accommodating but risk missing critical steps. Best practice: structured for the first week, flexible for weeks 2-4.
- **Repository-Based vs Wiki-Based:** Repository-based checklists are versioned, reviewable via PRs, and always in sync with the codebase. Wiki-based checklists are easier to edit but may diverge from the actual setup process. Use repository-based for technical tasks; wiki for HR/admin tasks.
- **Comprehensive vs Minimal:** Comprehensive checklists (50+ items) ensure nothing is missed but overwhelm the new developer. Minimal checklists (10 items) are less intimidating but may miss edge cases. Target 20-30 items across the first month.

## Performance Considerations

- **Checklist Size:** A checklist over 30 items per week becomes overwhelming; developers check off items without actually verifying them. Keep daily lists to 5-8 items.
- **Time Budget:** Onboarding time should be 100% allocated to checklist tasks for the first week; administrative interruptions (standups, meetings) should be minimized. Productive work (coding) starts day 2-3.
- **Buddy Time:** The onboarding buddy should allocate 1-2 hours per day for week 1, tapering to 30 minutes per day by week 2. Over-burdening the buddy reduces onboarding quality.

## Production Considerations

- **Security Onboarding:** Include security-specific items: MFA setup, SSH key generation and upload, VPN configuration (if applicable), secrets management (1Password, Doppler), and production access restrictions.
- **Deployment Observation:** The checklist should include supervised access to production deployments; new developers observe the deployment process before having deployment permissions.
- **Access Revocation:** Include instructions for access revocation in the offboarding version of the checklist (revoke GitHub, Forge, Vapor, Slack, email).

## Common Mistakes

- **Assuming prior knowledge:** Checklist assumes the developer knows Docker, PHP, Laravel basics; but they may be new to the ecosystem. Include links to prerequisite materials.
- **No verification step:** "Install Docker" without "Verify: `docker run hello-world` succeeds"; the developer may think Docker is installed when it's not functional.
- **Too many Day 1 items:** Overloading Day 1 with environment setup, team meetings, and project overview; the developer can't focus on anything and retains nothing.
- **Missing the human element:** Checklist covers technical setup but ignores team introductions, cultural norms, and informal knowledge transfer (where to go for help, unwritten rules).
- **Stale checklist:** Checklist references tools or processes that have changed; the developer follows instructions that don't work, causing frustration.

## Failure Modes

- **Checklist Fatigue:** The new developer feels like they're completing paperwork rather than learning. Mitigate: buddy keeps the process conversational; checklist is a guide, not a test.
- **Buddy Overload:** The assigned buddy has too many other responsibilities and can't dedicate time. Mitigate: formally allocate onboarding time; have a backup buddy.
- **Checklist Abandonment:** After the first week, the checklist is forgotten and later tasks (ADR review, deployment observation) are skipped. Mitigate: calendar reminders in the checklist; buddy ensures long-term items are tracked.
- **Inconsistent Experience:** Different buddies interpret the checklist differently, leading to inconsistent onboarding. Mitigate: buddy training session; standardized checklist with minimal ambiguity.

## Ecosystem Usage

- **Laravel Teams:** Onboarding checklists are commonly used but rarely standardized; most teams develop their own through trial and error
- **Spatie:** Spatie's well-documented onboarding process is a reference point for Laravel teams; their checklist is open-source in their package skeleton
- **Laravel Forge:** Onboarding includes Forge dashboard access and deployment walkthrough; the checklist should cover Forge-specific tasks (server access, site management, queue workers)
- **GitHub Issues:** Some teams use a GitHub issue template for onboarding checklists, allowing progress tracking via checkboxes and assignment to the buddy

## Related Knowledge Units

- automated-environment-setup-scripts
- local-environment-setup-documentation
- contributing-dot-md-patterns
- coding-standards-documentation
- team-collaboration-patterns

## Research Notes

- Research on developer onboarding (Google's "Good to Great" study) shows that the first week's experience strongly correlates with 6-month retention; a structured checklist improves perceived onboarding quality by 40%
- The buddy system reduces the time to first PR by 50% compared to self-guided onboarding
- Onboarding checklists that include a "first PR within the first week" goal result in higher developer satisfaction and faster ramp-up to independent contribution
- Laravel-specific onboarding challenges include Docker/Sail configuration issues (most common failure point) and database connection setup; these should have the most detailed checklist items
