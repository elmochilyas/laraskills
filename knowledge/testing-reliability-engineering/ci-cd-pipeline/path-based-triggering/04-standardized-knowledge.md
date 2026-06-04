# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | CI/CD Pipeline Integration |
| Knowledge Unit | Path-Based CI Triggering |
| Difficulty | Advanced |
| Maturity | Mature |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | GitHub Actions workflow syntax, Glob pattern basics |
| Related KUs | Monorepo CI strategies, GitHub Actions CI/CD, CI pipeline optimization |
| Source | domain-analysis.md K042 |

# Overview

Path-based triggering in GitHub Actions runs CI pipelines only when specific file paths are changed, optimizing CI resource usage in monorepo and large application contexts. Instead of running the full test suite on every commit, path filters restrict workflow execution to relevant changes. For Laravel applications, this means backend tests trigger when PHP files change, frontend tests trigger when JS/CSS files change, and deployment workflows trigger only when deployable artifacts change. Path-based triggering reduces CI wait times by 50-90% for focused changes and is essential for monorepo efficiency.

# Core Concepts

- **`on.push.paths` / `on.pull_request.paths`**: GitHub Actions filter restricting workflow triggers to specified path patterns.
- **`on.push.paths-ignore` / `on.pull_request.paths-ignore`**: Ignores triggers when specified paths change (docs, config, non-code changes).
- **Monorepo path isolation**: Separate workflows per application area (frontend-ci.yml, backend-ci.yml, docs-ci.yml).
- **Workflow-level vs job-level filtering**: Workflow-level skips the entire workflow; job-level uses `if:` conditions within a running workflow.

# When To Use

- In monorepos with multiple applications or packages
- When documentation, config, or asset-only changes should not trigger full test suites
- For large Laravel applications where full CI runs take >15 minutes
- When CI runner minute cost or usage limits are a concern
- For deployment workflows that should only run when deployable code changes

# When NOT To Use

- For small projects where full CI runs complete in <5 minutes (optimization not needed)
- On merge to main/default branch — always run full CI on merges
- When path filters would create false confidence (missing cross-boundary issues)
- Without also running full CI on a schedule to catch cross-boundary regressions

# Best Practices (WHY)

- **Always run full CI on merge to main**: Path filters are for development branches where fast feedback matters. Merges to main should always execute the complete test suite to catch cross-boundary issues.
- **Use path-ignore for noise reduction**: Ignore `*.md`, `docs/`, `.gitignore`, `.editorconfig`, `LICENSE`. These changes contain no executable code.
- **Be explicit with path lists**: List all relevant code directories (`app/`, `config/`, `database/`, `routes/`, `tests/`, `composer.json`). Inadvertently narrow filters cause CI to skip important changes.
- **Include workflow files in path filters**: Changes to `.github/workflows/ci.yml` should trigger CI. Without this, workflow modifications bypass CI validation.
- **Run full CI nightly**: A scheduled full CI run catches issues that span path boundaries. A frontend change breaking a backend contract won't be caught by path-filtered per-PR runs.

# Architecture Guidelines

- **Workflow-level vs job-level filtering**: Workflow-level for coarse filtering (entire CI irrelevant). Job-level for fine-grained control (skip deployment if no app code changed).
- **Path-ignore vs inverse path matching**: Path-ignore for well-known non-code locations. Inverse matching (listing all code locations) is more explicit but requires maintenance.
- **Monorepo vs multi-repo**: Path-based triggering makes monorepos practical. Without it, monorepo triggers full suite on every change.
- **Glob pattern testing**: Use `actions/path-filter` output to preview which files match patterns. Test patterns before relying on them for CI gating.

# Performance Considerations

- Path filter evaluation: GitHub evaluates server-side. Zero CI minute cost when workflow is skipped.
- Job-level `if` conditions: Workflow starts, job evaluates condition. If skipped, workflow setup minutes (~10-20s) are consumed.
- Monorepo with 10+ apps: Path-based triggering keeps each app's CI under 10 minutes. Without filtering, full suite could take 1+ hours.
- Merge queue: Always run full CI regardless of paths when merging to main.

# Security Considerations

- Path filters that skip CI for security-related files (`.env.example`, `config/auth.php` changes) may miss critical security validations.
- Workflow file changes should always trigger CI. A malicious workflow modification could bypass security checks without triggering CI.
- Consider adding a dedicated security workflow that always runs regardless of path changes.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Overly narrow path filters | `paths: ['app/Models/**']` | Adding controller in Http/Controllers skips CI entirely | List all code directories explicitly or use broad scope with path-ignore |
| Path filters on merge to main | Same filtering applied to merges | PR touching frontend code may break backend; not caught | Always run full suite on merge to main |
| Not filtering deployment workflows | Deployment runs on every push to main | Deploying for a README typo fix is wasteful and risky | Add path filter to deployment workflow |
| Assuming OR logic is AND logic | Paths interpreted as "must change both" | Team expects CI only when both app and config change | Document that path filters are OR; if AND needed, use job-level conditions |
| Not updating path patterns | Adding new directories without updating filters | New code merged without CI validation | Review path patterns quarterly; include in onboarding checklist |

# Anti-Patterns

- **Path filters on merge to main**: Applying path filters to main branch merges. Instead, always run full CI on merge.
- **No scheduled full CI**: Using path filters without a nightly full CI run. Instead, schedule nightly comprehensive runs.
- **Overly granular per-directory filters**: Creating separate workflows for every subdirectory. Instead, group by logical boundaries (backend, frontend, docs).
- **Ignoring workflow file changes**: Not including `.github/workflows/` in path filters. Instead, always include workflow files.

# Examples

```yaml
# Backend CI - run only when PHP files change
name: Backend CI
on:
  push:
    paths:
      - 'app/**'
      - 'config/**'
      - 'database/**'
      - 'routes/**'
      - 'tests/**'
      - 'composer.json'
      - 'composer.lock'
      - '.github/workflows/backend-ci.yml'
    paths-ignore:
      - '*.md'
      - 'docs/**'

# Deployment workflow
name: Deploy
on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'config/**'
      - 'routes/**'
      - 'resources/views/**'
      - 'public/**'
      - 'composer.json'
      - 'composer.lock'
      - 'deploy.php'

# Scheduled full CI (runs regardless of paths)
name: Nightly Full CI
on:
  schedule:
    - cron: '0 3 * * *'
```

# Related Topics

- **Prerequisites**: GitHub Actions workflow syntax, Glob pattern basics
- **Related**: Monorepo CI strategies, GitHub Actions CI/CD, CI pipeline optimization
- **Advanced**: Composite actions for path filtering, Dynamic CI matrix based on changed paths, Merge queue with change-based gates

# AI Agent Notes

- When setting up path filters, start with a broad pattern and narrow down. It's better to run extra CI runs than to miss important ones.
- For monorepos, group path filters by logical domain, not file type. Example: `billing/**`, `user-management/**`, `shared/**` rather than `app/**`, `resources/**`.
- Use `dorny/paths-filter` for advanced change detection (file count, specific change types, AND/OR logic) when native GitHub Actions path filters are insufficient.
- Always test path patterns with a dry-run PR before relying on them for production CI gating.

# Verification

- [ ] Path filters are used on development branches but not on merge to main
- [ ] Nightly full CI run catches cross-boundary regressions
- [ ] Workflow file changes trigger CI
- [ ] Deployment workflow has path filters to avoid unnecessary deploys
- [ ] Path patterns are documented and reviewed quarterly
- [ ] Path-ignore covers documentation and non-code files
- [ ] Monorepo apps have separate workflows with appropriate path filters
- [ ] Skipped workflow runs are monitored for correctness
