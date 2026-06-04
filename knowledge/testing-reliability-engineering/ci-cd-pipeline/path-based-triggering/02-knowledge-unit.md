# Metadata
Domain: Testing & Reliability Engineering
Subdomain: CI/CD Pipeline Integration
Knowledge Unit: Path-Based CI Triggering
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Path-based triggering in GitHub Actions runs CI pipelines only when specific file paths are changed, optimizing CI resource usage in monorepo and large application contexts. Instead of running the full test suite on every commit, path filters restrict workflow execution to relevant changes. For Laravel applications, this means models tests trigger when model files change, HTTP tests trigger when controllers/routes change, and deployment workflows trigger only when deployable artifacts change. Path-based triggering reduces CI wait times by 50-90% for focused changes and is essential for monorepo efficiency.

# Core Concepts
- **`on.push.paths` / `on.pull_request.paths`**: GitHub Actions filter that restricts workflow triggers to specified path patterns.
- **`on.push.paths-ignore` / `on.pull_request.paths-ignore`**: Ignores workflow triggers when specified paths change. Used for documentation, config, or non-code changes.
- **Monorepo path isolation**: Separate workflows per application area. `frontend-ci.yml` triggers only on `resources/js/` changes; `backend-ci.yml` triggers only on `app/` changes.
- **Change detection granularity**: Directory level (apps/backend/), file extension level (`*.php`, `*.js`), or specific file level (`composer.json`).
- **Workflow-level vs job-level filtering**: Path filters at the workflow level (entire workflow skips) vs `if:` conditions at the job level (selective job execution within a workflow).

# Mental Models
- **Path filters as CI gates**: Like airport security lanes — only passengers going to specific gates go through specific checkpoints. Documentation changes shouldn't trigger the full test suite.
- **Granularity ladder**: Monorepo root (coarse) → directory (medium) → file pattern (fine). Choose the coarsest filter that provides meaningful optimization.
- **Path-ignore as noise reduction**: Ignore `*.md`, `.gitignore`, `.editorconfig` changes. These files contain no executable code and need no CI verification.
- **Change set awareness**: A single commit may touch multiple paths. If any path matches the filter, the workflow runs. Filters are OR logic within a path list.

# Internal Mechanics
- **GitHub Actions change detection**: GitHub compares the commit's tree against the previous commit's tree (for push) or the base branch (for pull_request). Only changed files are evaluated against path patterns.
- **Glob pattern matching**: Paths use glob patterns. `app/Http/Controllers/**` matches all controllers. `*.md` matches markdown files only at root. `docs/**` matches all files under docs.
- **Workflow-level skip**: If no paths match, GitHub marks the workflow as "skipped" (yellow icon). No CI minutes consumed. The workflow does not run at all.
- **Job-level if condition**: `if: ${{ contains(github.event.head_commit.modified, 'composer.json') }}` evaluates at runtime inside a running workflow. Consumes CI minutes for the workflow setup.
- **Path filter limitations**: GitHub Actions path filters do not support negative patterns (e.g., "match `app/` but not `app/Providers/`"). Workaround: use job-level `if` with path expression.

# Patterns
- **Pattern: Backend-only CI workflow**
  - Purpose: Run Laravel tests only when PHP files change
  - Benefits: Skip CI for frontend-only, docs-only, or config-only changes
  - Tradeoffs: May miss backend issues from frontend changes (unlikely)
  - Implementation: `paths: ['app/**', 'config/**', 'database/**', 'routes/**', 'tests/**', 'composer.json', 'composer.lock']`

- **Pattern: Monorepo separated workflows**
  - Purpose: Independent CI pipelines for each application in a monorepo
  - Benefits: Isolated failure domains; targeted test execution
  - Tradeoffs: Duplicate workflow configuration; shared infrastructure complexity
  - Implementation: Separate workflow files per app, each with its own `paths` filter

- **Pattern: Path-ignore for non-code changes**
  - Purpose: Skip CI for documentation, configuration, and non-code files
  - Benefits: No wasted CI on trivial changes (README, .gitignore, .github)
  - Tradeoffs: May accidentally skip needed CI for config changes in .github/
  - Implementation: `paths-ignore: ['*.md', 'docs/**', '.gitignore', '.editorconfig', 'LICENSE']`

- **Pattern: Smart deployment triggering**
  - Purpose: Deploy only when deployable code changes
  - Benefits: Avoids unnecessary deployments for config-only or env-only changes
  - Tradeoffs: Deployment workflow must detect environment-level changes separately
  - Implementation: Deploy workflow filters on `app/`, `config/`, `routes/`, `resources/views/`, `public/`

# Architectural Decisions
- **Workflow-level vs job-level filtering**: Workflow-level for coarse filtering (entire CI pipeline irrelevant). Job-level for fine-grained control within a workflow (skip deployment job if no app code changed).
- **Path-ignore vs inverse path matching**: Path-ignore for well-known non-code locations. Inverse matching (listing all code locations) is more explicit but requires maintenance when adding new directories.
- **Monorepo vs multi-repo**: Path-based triggering makes monorepos practical. Without it, a monorepo triggers the full suite on every change. Multi-repo needs no path filtering but has cross-repo coordination overhead.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| 50-90% reduction in unnecessary CI runs | Path patterns need maintenance | Review patterns quarterly |
| Monorepo becomes practical | Complex glob pattern syntax | Test glob patterns with dry-run tools |
| Faster feedback for focused changes | May miss cross-boundary issues | Run full suite on merge to main |
| CI cost reduction | Accidental CI skip risk | Always run full suite on schedule |

# Performance Considerations
- Path filter evaluation: GitHub evaluates path filters server-side. Zero CI minute cost when workflow is skipped.
- Job-level `if` conditions: Workflow starts, job evaluates condition. If skipped, workflow setup minutes are consumed (typically 10-20s).
- Monorepo with 10+ apps: Path-based triggering keeps each app's CI under 10 minutes. Without filtering, the full suite could take 1+ hours.
- Merge queue strategy: When merging to main, always run the full CI suite regardless of path filters. Path filters are for development branches only.

# Production Considerations
- **Merge gate exceptions**: Always run full CI on merge to main/default branch. Path filters are for development branches where fast feedback matters.
- **Schedule full runs**: Nightly full CI run (ignoring path filters) catches issues that span path boundaries (e.g., a frontend change that breaks a backend contract).
- **Path pattern documentation**: Document path patterns in the workflow file header or a CONTRIBUTING.md. Developers need to know which paths trigger which workflows.
- **Monitoring and auditing**: Track which workflow runs were skipped due to path filters. If a production incident root cause traces to a skip, adjust patterns.

# Common Mistakes
- **Mistake: Overly narrow path filters**
  - Why: `paths: ['app/Models/**']` only triggers on model changes
  - Why harmful: Adding a new controller in `app/Http/Controllers/` skips CI entirely
  - Better: List all code directories explicitly, or use broad scope with path-ignore for noise

- **Mistake: Path filters on merge to main**
  - Why: Same filtering applied to main branch merges
  - Why harmful: A PR that touches only frontend code may break something on the backend; not caught until production
  - Better: Always run full suite on merge to main; use path filters only on feature branches

- **Mistake: Not filtering deployment workflows**
  - Why: Deployment runs on every push to main
  - Why harmful: Deploying for a README typo fix is wasteful and risky
  - Better: Add path filter to deployment workflow; only deploy when app code changes

- **Mistake: Assuming OR logic is AND logic**
  - Why: `paths: ['app/**', 'config/**']` interpreted as "must change both"
  - Why harmful: Team expects CI to run only when both app and config change
  - Better: Document that path filters are OR; if AND logic needed, use job-level conditions

# Failure Modes
- **Path pattern mismatch**: Glob pattern `app/**` does not match files at `app/` root without subdirectory? Test with `actions/path-filter` output. Use `app/**/*.php` for PHP files only.
- **Skipped workflow for important changes**: Workflow skips because paths don't match, but the change has cross-cutting impact (e.g., changing a shared interface in `app/Contracts/`).
- **New directory not in path list**: Team adds `app/Jobs/` directory but path filter only includes `app/Http/`. Jobs are merged without CI validation.
- **Workflow file itself changes**: Changing `.github/workflows/ci.yml` does not trigger CI by default unless path filter includes `.github/**`. Always include workflow files in path filter.

# Ecosystem Usage
- **Laravel core**: Laravel's own CI uses path filters to skip tests for documentation-only changes. The `tests.yml` workflow filters on PHP changes.
- **Laravel Nova**: Nova's monorepo uses path-based triggering extensively — separate workflows for core, tools, and documentation.
- **Spatie packages**: Most Spatie monorepos use path-based triggers to run tests only for the package that changed, not all packages.
- **AcquaintSoft CI pattern**: The AcquaintSoft Laravel CI pipeline pattern recommends broad path filters (whole `app/`) with path-ignore for docs and config templates.

# Related Knowledge Units
- **Prerequisites**: GitHub Actions workflow syntax, Glob pattern basics
- **Related Topics**: Monorepo CI strategies, GitHub Actions CI/CD, CI pipeline optimization
- **Advanced Follow-up**: Composite actions for path filtering, Dynamic CI matrix based on changed paths, Merge queue with change-based gates

# Research Notes
- GitHub Actions path filters use the `git diff` against the base branch for pull requests and against the previous commit for pushes; the `paths` filter matches any file in the commit's change set
- For monorepos with 5+ applications, path-based triggering is considered essential; without it, CI wait times exceed 30 minutes for trivial changes
- The `dorny/paths-filter` GitHub Action provides more sophisticated change detection (file count, specific patterns, AND/OR logic) than native GitHub path filters
- Laravel monorepo patterns typically group path filters by domain: billing (`app/Domain/Billing/**`), user management (`app/Domain/Users/**`), shared (`app/Domain/Shared/**`)
- Path-based triggering works best when combined with change-type detection (added, modified, deleted) using `dorny/paths-filter` to trigger different workflows based on change type
