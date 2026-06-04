# Skill: Create and Maintain a CONTRIBUTING.md File

## Purpose
Provide a single entry point for contributors that documents setup, coding standards, testing, PR process, and behavioral expectations for the project.

## When To Use
- Public open-source Laravel packages or projects
- Internal projects with multiple contributors not always co-located
- Projects expecting external contributions (community or cross-team)
- Team wants to standardize contribution workflow across multiple repositories

## When NOT To Use
- Private internal project with a single team that communicates directly
- Project is a prototype or experiment with short lifespan
- Repository is archived or read-only

## Prerequisites
- Git repository hosted on GitHub or GitLab
- Coding standards documentation existing or in progress
- PR template configured in the repository
- Development environment setup documented

## Inputs
- Coding standards documentation
- Development environment setup instructions
- PR template and issue templates
- Code of conduct text
- Branch naming and commit message conventions

## Workflow
1. Place `CONTRIBUTING.md` in the project root (GitHub/GitLab auto-detection)
2. Write an Introduction section with project purpose and code of conduct link
3. Under "Getting Started," provide the exact development setup command
4. Under "Development Workflow," document branch naming, commit style, and PR lifecycle
5. Under "Coding Standards," link to `docs/standards.md` instead of duplicating content
6. Under "Pull Request Process," reference the PR template checklist
7. Under "Questions," link to discussion forums, issue tracker, or chat
8. Keep each section under 5 bullet points for scanability
9. Keep the file under 10KB; link to external docs for details
10. Test setup instructions on every release via CI

## Validation Checklist
- [ ] File is in project root for GitHub/GitLab auto-detection
- [ ] Exact test command is provided (`sail pest` or `vendor/bin/pest`)
- [ ] PR template mirrors the CONTRIBUTING.md requirements
- [ ] Each section has 5 bullet points or fewer
- [ ] File size is under 10KB
- [ ] Code of conduct is linked (not embedded)
- [ ] Coding standards are linked (not duplicated)
- [ ] Setup instructions are CI-verified on every release
- [ ] Branching convention is documented and consistent

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| CONTRIBUTING.md is 30+ pages | Including everything in one file | Link to external docs; keep each section short |
| Setup instructions are outdated | No CI verification | CI-verify setup on every release |
| PR template doesn't match CONTRIBUTING.md | No alignment | Create verification loop between guidelines and template |
| Tone is unwelcoming | Legal-style writing | Match Laravel ecosystem's friendly, professional tone |
| Sections are too long to scan | Too many bullet points | Limit to 5 bullets per section; link details |
| No code of conduct | Forgot to include | Link to CODE_OF_CONDUCT.md |

## Decision Points
- **Tone:** Professional vs friendly vs formal (match project culture)
- **Branch convention:** `feature/description` vs `issue/123` vs `username/description`
- **Commit style:** Conventional Commits vs imperative vs free-form
- **Issue templates:** Required vs optional vs none

## Performance/Security Considerations
- Never include real credentials or secrets in CONTRIBUTING.md
- Security vulnerability reporting process should reference a SECURITY.md file
- External links should point to maintained, reputable sources

## Related Rules
- CONTRIB-RULE-001 through CONTRIB-RULE-012

## Related Skills
- Set Up Coding Standards Documentation
- Define PR Template Patterns
- Set Up Developer Onboarding Checklists
- Document Development Workflow

## Success Criteria
- Contributors consistently follow documented workflows
- First-time contributors submit PRs that pass all checks on first attempt
- Setup instructions are verified by CI and always up to date
- PR template checklist items are completed before merge
- File is scannable in under 2 minutes
