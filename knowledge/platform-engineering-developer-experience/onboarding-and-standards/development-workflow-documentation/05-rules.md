# Rules: Development Workflow Documentation

## Metadata
- **Source KU:** development-workflow-documentation
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- WORKFLOW-RULE-001: **Document the rollback process explicitly** — As detailed as deployment procedure. Tested regularly.
- WORKFLOW-RULE-002: **Define quality gates clearly** — Blocking vs advisory, automated vs manual, who is responsible.
- WORKFLOW-RULE-003: **Establish deployment windows** — Tuesday/Thursday, 10-11 AM. Document hotfix exception process.
- WORKFLOW-RULE-004: **Automate the standard; require approval for the exception** — Standard deployments fully automated; hotfixes require lead sign-off.
- WORKFLOW-RULE-005: **Document environment variable changes** — Every PR that adds config must update .env.example and deployment notes.

## Architecture Rules
- WORKFLOW-RULE-006: **Git workflow:** GitHub Flow for most teams. Git Flow for release-versioned projects.
- WORKFLOW-RULE-007: **Merge strategy:** Squash merge for main (one commit per PR).
- WORKFLOW-RULE-008: **Deployment frequency:** Continuous to staging (auto-deploy), daily to production (scheduled window).
- WORKFLOW-RULE-009: **1 reviewer for standard work; 2 for architectural changes or infrastructure.**

## Decision Rules
- WORKFLOW-RULE-010: **Use for team with 2+ developers** shipping code to production regularly.
- WORKFLOW-RULE-011: **Skip for single developer** with full control over the process.
