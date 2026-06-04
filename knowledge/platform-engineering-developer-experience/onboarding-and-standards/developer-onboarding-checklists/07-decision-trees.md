# Decision Trees: Developer Onboarding Checklists

## Metadata
- **KU ID:** onboarding-team-standards/developer-onboarding-checklists
- **Phase:** 4 (Experience Curation)
- **Curator:** Phase 4 Standardization Process
- **Date Generated:** 2026-06-03
- **Source:** 04-standardized-knowledge.md

## Decision Inventory

| # | Decision | Typical Options | Context |
|---|----------|----------------|---------|
| 1 | Checklist duration | 1 week / 1 month / 3 months | Balance between thorough coverage and time to independent work |
| 2 | Verification approach | Self-verify / Buddy sign-off / Automated checks | Ensuring tasks are actually completed, not just acknowledged |
| 3 | Buddy allocation | Formal with budget / Informal / Rotating | Consistency of support vs burden on senior developers |
| 4 | Storage location | Repository markdown / Wiki / Tool (Notion) | Versioning, reviewability, and accessibility |
| 5 | Day 1 scope | Admin only / Environment only / Everything | Cognitive load management on the first day |

## Architecture-Level Decision Trees

### Tree 1: Onboarding Checklist Duration and Structure

- **Start:** Designing the onboarding checklist
- **How many new developers join per year?**
  - More than 4 → Comprehensive checklist with 1-month formal program. Invest in detailed documentation, buddy training, and quarterly checklist reviews.
  - 1-3 → Standard checklist with 2-week core + month-1 extension. Keep flexible for different experience levels.
  - Less than 1 → Lightweight checklist focused on environment setup and first PR. Expect the checklist to be stale; test on each use.
- **Team size:**
  - Small (2-5) → Buddy is lead or senior. Checklist focuses on self-sufficiency. Week 1 target: first PR merged.
  - Large (6+) → Dedicated onboarding buddy with time budget. Structured daily check-ins for week 1. Month-long checklist.
- **Structure:** Pre-arrival (admin/access) → Day 1 (environment, intro) → Week 1 (first PR, tools) → Month 1 (independent contribution).

### Tree 2: Verification and Buddy Assignment

- **Start:** Determining how checklist items are verified
- **Is the item automated (script runs, CI passes)?**
  - Yes → Self-verify. Developer runs the verification command and ticks the box. Buddy spot-checks at end of week.
  - No → Continue.
- **Is the item about environment setup?**
  - Yes → Self-verify with buddy sign-off. Developer runs `sail artisan about`, shows buddy. Buddy confirms and signs off.
  - No → Continue.
- **Is the item about team integration (meetings, introductions)?**
  - Yes → Buddy verifies. Buddy introduces to key stakeholders, confirms 1:1s scheduled, ensures developer has attended standup.
  - No → Continue.
- **General items:** Self-verify with buddy spot-check at Day 1 and End of Week 1. Buddy formally signs off both milestones.
- **Buddy allocation:** Formal allocation with documented time budget (1-2 hrs/day week 1, 30 min/day week 2). Backup buddy assigned for coverage. Buddy's sprint commitments reduced during onboarding.

### Tree 3: First PR Timeline

- **Start:** Goal: developer merges first PR within first week
- **Day 1:** Environment setup complete. Developer runs app locally. First migration succeeds. First test passes.
  - Blocked? → Buddy assists immediately. Environment issues are the top blocker for Day 1 success.
- **Day 2-3:** First small ticket assigned. Developer implements, creates PR. Buddy reviews within 4 hours.
  - PR too complex? → Buddy pairs to break down. First PR should be focused (single file change, documentation, or small fix).
- **Day 4-5:** PR feedback addressed. PR merged. Developer experiences the full workflow: ticket → branch → code → test → PR → review → merge.
  - Post-merge: Developer deploys to staging. Sees code in production-like environment.
- **Week 2:** Second PR with less buddy support. Developer independently navigates the workflow.
- **Month 1:** Developer picks up unassigned tickets. Participates in code reviews. First deployment to production (observed).

### Tree 4: Checklist Maintenance and Improvement

- **Start:** Keep checklist from becoming stale
- **Did a new hire just complete onboarding?**
  - Yes → Continue. This is the best time to collect feedback.
  - No → Wait for next hire. Test checklist on each onboarding cycle.
- **Collect feedback:** Include "checklist feedback" as the last checklist item. Ask:
  - Which steps were unclear or outdated?
  - What was missing that you needed?
  - How long did each section actually take?
- **Review feedback:** Schedule 30-min review with buddy and new developer after week 1 and month 1. Update checklist based on feedback.
- **CI verification:** Run the automated setup script referenced in the checklist on every release. Manual steps tested before each new hire's Day 1.
- **Quarterly review:** Full checklist review. Remove stale items. Update tool versions. Adjust time estimates based on actual data.

