# Skill: Configure Path-Based CI Triggers

## Purpose
Reduce unnecessary CI runs by configuring GitHub Actions path filters to trigger workflows only when relevant files change, optimizing CI resource usage in monorepo and large application contexts.

## When To Use
- In monorepos with multiple applications or packages
- When documentation, config, or asset-only changes should not trigger full test suites
- For large Laravel applications where full CI runs take >15 minutes
- When CI runner minute cost or usage limits are a concern
- For deployment workflows that should only run when deployable code changes

## When NOT To Use
- For small projects where full CI completes in <5 minutes
- On merge to main — always run full CI on merges
- When path filters would create false confidence (missing cross-boundary issues)
- Without a nightly full CI run to catch cross-boundary regressions

## Prerequisites
- GitHub Actions workflow syntax knowledge
- Understanding of glob patterns for file matching
- Defined project directory structure (app/, config/, tests/, etc.)
- Separate workflows for backend, frontend, and deployment

## Inputs
- Workflow for each application domain (backend, frontend, docs)
- Code directory paths for each domain
- Non-code file patterns to ignore (docs, markdown, config examples)
- Workflow file paths (must trigger CI when changed)

## Workflow
1. Create separate workflow files per domain: `backend-ci.yml`, `frontend-ci.yml`, `deploy.yml`
2. For backend: use `paths` to include `app/`, `config/`, `database/`, `routes/`, `tests/`, `composer.*`
3. For all workflows: use `paths-ignore` to exclude `*.md`, `docs/`, `.gitignore`, `.editorconfig`, `LICENSE`
4. Always include `.github/workflows/*` in path filters to validate CI config changes
5. For deployment: add path filters to prevent deploying on documentation changes
6. Run full CI on merge to main (no path filters)
7. Add a nightly scheduled workflow that runs the full suite regardless of paths
8. Test path patterns with a dry-run PR before relying on them for production CI

## Validation Checklist
- [ ] Path filters are used on development branches but not on merge to main
- [ ] Nightly full CI run catches cross-boundary regressions
- [ ] Workflow file changes trigger CI
- [ ] Deployment workflow has path filters to avoid unnecessary deploys
- [ ] Path patterns are documented and reviewed quarterly
- [ ] Path-ignore covers documentation and non-code files
- [ ] Monorepo apps have separate workflows with appropriate path filters
- [ ] Skipped workflow runs are monitored for correctness

## Common Failures
- Overly narrow path filters — important changes skip CI
- Path filters on merge to main — cross-boundary regressions merge undetected
- Not filtering deployment workflows — deploying for a README typo fix
- Not updating path patterns when adding new directories — new code without CI validation
- No scheduled full CI — cross-boundary issues go undetected until deployment
- Not including workflow files in path filters — broken CI config reaches main

## Decision Points
- Workflow-level vs job-level filtering — workflow-level to skip entire workflow, job-level for fine-grained control within a running workflow
- Paths vs paths-ignore — paths for explicit inclusion (more maintainable), paths-ignore for noise reduction
- Monorepo path isolation — per-domain workflows for clear separation

## Performance Considerations
- Path filter evaluation is server-side — zero CI minute cost when workflow is skipped
- Job-level `if` conditions consume workflow setup minutes (~10-20s) even when skipped
- Merge queue: always run full CI regardless of paths
- Monorepo with 10+ apps: path-based triggering keeps each app's CI under 10 minutes

## Security Considerations
- Path filters that skip CI for security-related files may miss critical security validations
- Workflow file changes should always trigger CI — malicious workflow modification could bypass security
- Consider a dedicated security workflow that always runs regardless of path changes
- Deployment path filters prevent unnecessary infrastructure changes

## Related Rules
- [Rule: Always Run Full CI on Merge to Main](./05-rules.md)
- [Rule: Use paths-ignore for Noise Reduction](./05-rules.md)
- [Rule: Include Workflow Files in Path Filters](./05-rules.md)

## Related Skills
- GitHub Actions CI/CD
- CI Pipeline Optimization
- Monorepo CI Strategies

## Success Criteria
- [ ] Backend changes trigger backend CI only (not frontend or docs)
- [ ] Documentation-only changes are skipped in CI
- [ ] Full CI runs on every merge to main
- [ ] Nightly full CI catches cross-boundary regressions
- [ ] Workflow file changes always trigger CI validation
