# Skill: Create PR Template Patterns

## Purpose
Design effective PR templates for Laravel projects that guide contributors to provide complete, consistent information for code reviews, reducing back-and-forth and ensuring quality standards.

## When To Use
- Every Laravel project with multiple contributors
- Open-source projects where external contributors may not know team quality expectations
- Teams wanting to reduce back-and-forth during code review

## When NOT To Use
- Solo projects where single developer controls all PRs
- Teams that don't use PR-based workflows

## Prerequisites
- GitHub or GitLab repository
- Team agreement on PR quality standards

## Inputs
- `.github/PULL_REQUEST_TEMPLATE.md` — main template
- `.github/PULL_REQUEST_TEMPLATE/*.md` — multiple templates (optional)

## Workflow

1. **Create Main Template:** Create `.github/PULL_REQUEST_TEMPLATE.md` with standard sections: Description, Ticket Reference, Type of Change, Testing Checklist, Quality Checklist, Deployment Notes, Screenshots.

2. **Keep It Concise:** Limit template to under 30 lines with clear section headers. Templates over 50 lines cause checkbox fatigue and get ignored.

3. **Include CI-Reminder Checklist:** Add checklist items for what CI enforces: Pint passes, PHPStan passes, Tests added/passing. These serve as reminders for the author before creating the PR.

4. **Add Deployment Notes Section:** Include a section for: migrations, queue restarts, environment variables, cache clears, and any other deployment-impacting changes.

5. **Use Single Template for Most Teams:** A single template with "if applicable" language works for most projects. Use multiple templates (bug_fix.md, feature.md, hotfix.md) for teams with diverse PR types.

6. **Enable Require Template Setting:** In repository settings, enable the "require pull request template" option to prevent blank PR descriptions.

7. **Review and Update Quarterly:** Stale templates reference outdated tools or processes. Schedule quarterly review to keep the template current.

## Validation Checklist

- [ ] PR template under 30 lines with clear headers
- [ ] CI enforcement checklist included (Pint, PHPStan, Tests)
- [ ] Deployment Notes section present
- [ ] "Require template" setting enabled
- [ ] Single template for most teams (multiple for diverse PR types)
- [ ] Template reviewed and updated quarterly
- [ ] Template stored in `.github/PULL_REQUEST_TEMPLATE.md`

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Template too long (50+ lines) | Developer checkbox fatigue; sections ignored |
| No deployment notes section | Migrations or env changes missed in deployment |
| Template not required | PRs created blank; back-and-forth during review |
| Stale template | References outdated tools; update quarterly |

## Decision Points

- **Use for every project with multiple contributors** — Ensures consistent PR quality
- **Skip for solo projects** where single developer controls all PRs
- **Single template for most teams** with "if applicable" language

## Performance/Security Considerations

- **Deployment notes:** Critical for safe deployments; always include
- **Security-related PRs:** Template should prompt for security review flag

## Related Rules

- PRTEMP-RULE-001: Keep template under 30 lines
- PRTEMP-RULE-002: Include checklist items CI enforces
- PRTEMP-RULE-003: Include "Deployment Notes" section
- PRTEMP-RULE-004: Single template for most teams
- PRTEMP-RULE-005: Store in `.github/PULL_REQUEST_TEMPLATE.md`

## Related Skills

- Establish Code Review Standards
- Set Up Automated Testing in CI
- Configure Dependency Update Automation

## Success Criteria

- PRs consistently include description, testing notes, and deployment impact
- Reviewers have the context they need without asking follow-up questions
- Deployment notes prevent missed migrations or env changes
- CI checklist reminds authors to run checks before submitting
