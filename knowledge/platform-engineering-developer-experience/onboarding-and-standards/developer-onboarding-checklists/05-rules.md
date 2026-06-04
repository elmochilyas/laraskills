# Rules: Developer Onboarding Checklists

## Metadata
- **Source KU:** developer-onboarding-checklists
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- ONBOARD-RULE-001: **Include verification steps** — "Install Docker" must be followed by "Verify: `docker run hello-world` succeeds."
- ONBOARD-RULE-002: **Target first PR in week 1** — Concrete milestone provides accomplishment and proves full workflow navigation.
- ONBOARD-RULE-003: **Keep day 1 light** — Focus on admin, introductions, and successful environment setup. Deep dives later.
- ONBOARD-RULE-004: **Include the human element** — Team lunches, 1:1s with stakeholders, informal chat introductions.
- ONBOARD-RULE-005: **Version control the checklist** — Store in repository as markdown file. Wiki-based checklists diverge.

## Architecture Rules
- ONBOARD-RULE-006: **Format:** Markdown in repository (`ONBOARDING.md` or `docs/onboarding/checklist.md`).
- ONBOARD-RULE-007: **Structure by time:** Pre-arrival, Day 1, Week 1, Month 1. 5-8 items per section.
- ONBOARD-RULE-008: **Buddy allocation:** 1-2 hours/day week 1, 30 min/day week 2. Backup buddy for coverage.
- ONBOARD-RULE-009: **Checklist size:** 20-30 items across first month. Longer lists overwhelm.

## Decision Rules
- ONBOARD-RULE-010: **Use when team hires Laravel developers regularly.**
- ONBOARD-RULE-011: **Use when current onboarding is inconsistent** or first PR takes >2 weeks.
- ONBOARD-RULE-012: **Skip for team of 1-2 with no plans to grow.**
