# Skill: Establish Code Review Standards for Laravel

## Purpose
Define and implement code review standards for Laravel teams covering review depth, turnaround time, communication tone, and automated checks to balance thoroughness with delivery speed.

## When To Use
- Every Laravel team with 2+ developers
- Projects where code quality, security, and maintainability are priorities
- Teams wanting to improve review consistency

## When NOT To Use
- Solo projects where self-review replaces formal process
- Teams not yet doing code reviews

## Prerequisites
- Team agreement on code review importance
- GitHub/GitLab with branch protection

## Inputs
- `CONTRIBUTING.md` — documented review standards
- `.github/CODEOWNERS` — auto-assignment rules

## Workflow

1. **Define Review Depth Levels:** Categorize PRs by depth: Light (bug fix, 5-10min), Standard (feature, 20-30min), Deep (architecture change, 30-60min). Match depth to PR type.

2. **Automate Style and Type Checks:** Use Pint (style) and PHPStan (types) in CI. Focus human review on logic, architecture, and correctness — not formatting.

3. **Set Turnaround Time Target:** Target < 4 hour review turnaround. Fast review teams ship 50% more features.

4. **Enforce PR Size Limit:** Set 400 lines as the maximum PR size. PRs over 400 lines have higher defect rates and are harder to review effectively.

5. **Assign 1-2 Reviewers Max:** Too many reviewers = no one feels responsible. Use CODEOWNERS to auto-assign domain experts based on file paths.

6. **Use Structured Feedback Format:** Issue + Suggestion + Why: describe what's wrong, suggest how to fix, explain why. Prefix non-blocking nits with "nit:".

7. **Define Approval Policy:** 1 approval for standard PRs; 2 for architectural changes. Squash merge for clean main branch history.

## Validation Checklist

- [ ] Review depth levels defined (Light, Standard, Deep)
- [ ] Style and type checks automated in CI
- [ ] PR size limit enforced (400 lines)
- [ ] Review turnaround target set (< 4 hours)
- [ ] 1-2 reviewers assigned per PR
- [ ] CODEOWNERS configured for auto-assignment
- [ ] Approval policy documented

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Too many reviewers | No one feels responsible; limit to 1-2 |
| Slow review turnaround | Pipeline bottlenecks; enforce < 4 hours |
| Reviewing style instead of logic | Automate Pint and PHPStan; focus on architecture |
| Nit comments blocking PRs | Prefix with "nit:"; distinguish from blocking issues |

## Decision Points

- **Use for every team with 2+ developers** — Essential for knowledge sharing and quality
- **Skip for solo projects** where self-review replaces formal process
- **Every PR deserves genuine review** regardless of author seniority

## Performance/Security Considerations

- **Review depth by PR type:** Bug fix (Light, 5-10min), Feature (Standard, 20-30min), Architecture (Deep, 30-60min)
- **Security-sensitive PRs always get Deep review** regardless of size

## Related Rules

- CR-RULE-001: Focus human review on logic, architecture, correctness
- CR-RULE-002: Use Issue + Suggestion + Why format
- CR-RULE-003: Enforce PR size limit (400 lines)
- CR-RULE-004: Target < 4 hour review turnaround
- CR-RULE-005: Prefix non-blocking nits with "nit:"

## Related Skills

- Create PR Template Patterns
- Set Up Automated Testing in CI
- Run Pint in CI

## Success Criteria

- Review turnaround consistently under 4 hours
- Reviews focus on logic and architecture, not style
- PR size stays manageable (under 400 lines)
- Team has consistent, constructive review practices
