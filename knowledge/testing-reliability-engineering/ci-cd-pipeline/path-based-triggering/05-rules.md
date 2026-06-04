# Rules — Path-Based CI Triggering

## Rule 1: Always Run Full CI on Merge to Main — Never Apply Path Filters to Merges
| Field | Value |
|-------|-------|
| **Name** | Always Run Full CI on Merge to Main — Never Apply Path Filters to Merges |
| **Category** | CI & Safety |
| **Rule** | Apply path filters only to development branch (PR) workflows. Always run the full test suite when merging to the main/default branch. Never use path filters on merge-to-main triggers. |
| **Reason** | Path filters on PRs save CI time for focused changes. But cross-boundary issues (a frontend change breaking a backend contract) are common. Running full CI on merge to main catches these cross-boundary failures. A path filter on merge would allow a frontend PR that breaks backend tests to merge undetected. |
| **Bad Example** | Path filters on `push: branches: [main]` — docs-only PR doesn't run full CI; backend tests are never executed. |
| **Good Example** | PR: path-filtered. Merge to main: no filters, full CI always runs. |
| **Exceptions** | None. Full CI must always run on merge to main. |
| **Consequences Of Violation** | Cross-boundary regressions merge to main undetected; production deployments fail. |

## Rule 2: Use `paths-ignore` for Noise Reduction
| Field | Value |
|-------|-------|
| **Name** | Use `paths-ignore` for Noise Reduction |
| **Category** | CI & Efficiency |
| **Rule** | Use `paths-ignore` to skip CI for documentation and non-code files (`*.md`, `docs/`, `.gitignore`, `.editorconfig`, `LICENSE`). Never run the full CI pipeline for changes that contain no executable code. |
| **Reason** | Renaming a file, updating a README, or changing `.gitignore` should not trigger a full CI pipeline. These changes have zero impact on application behavior. Skipping them saves CI minutes and reduces noise in CI status checks. |
| **Bad Example** | CI runs full pipeline for a README typo fix — 10 minutes of CI for no value. |
| **Good Example** | `paths-ignore: ['*.md', 'docs/**', '.gitignore', '.editorconfig', 'LICENSE']` — README changes skip CI. |
| **Exceptions** | Documentation changes that include code examples that should be validated. |
| **Consequences Of Violation** | Wasted CI minutes on non-code changes; CI noise distracts the team. |

## Rule 3: Be Explicit with Path Lists — Include All Code Directories
| Field | Value |
|-------|-------|
| **Name** | Be Explicit with Path Lists — Include All Code Directories |
| **Category** | CI & Safety |
| **Rule** | List all relevant code directories explicitly in path filters (`app/`, `config/`, `database/`, `routes/`, `tests/`, `composer.json`, `.github/workflows/`). Never use overly narrow filters. |
| **Reason** | A filter like `paths: ['app/Http/Controllers/**']` would skip CI when a developer adds a model migration, a new route, or modifies a config file. Overly narrow filters create false confidence — code changes that should trigger CI are silently skipped. Better to run extra CI than to miss important changes. |
| **Bad Example** | `paths: ['app/**']` — adding a `database/migrations/` file doesn't trigger CI; migration breaks tests, but no one knows until deploy. |
| **Good Example** | `paths: ['app/**', 'config/**', 'database/**', 'routes/**', 'tests/**', 'composer.*', '.github/workflows/**']` — comprehensive coverage. |
| **Exceptions** | Monorepo sub-projects where only specific directories are relevant. |
| **Consequences Of Violation** | Code changes silently skip CI; broken tests reach production. |

## Rule 4: Include Workflow Files in Path Filters
| Field | Value |
|-------|-------|
| **Name** | Include Workflow Files in Path Filters |
| **Category** | CI & Safety |
| **Rule** | Always include `.github/workflows/**` or equivalent CI configuration paths in the trigger filters. Changes to CI configuration must trigger CI. |
| **Reason** | A change to the CI workflow file (e.g., adding a new test step, changing the PHP version) should be validated by running CI. Without this, a developer can push a broken CI configuration that passes no checks — the broken config only surfaces when the next PR tries to run CI. |
| **Bad Example** | `.github/workflows/ci.yml` is modified but not in path filters — no CI runs; broken configuration reaches main. |
| **Good Example** | `'.github/workflows/**'` in path filters — CI configuration changes trigger CI validation. |
| **Exceptions** | Workflow files that don't affect test execution (e.g., labeler workflows, housekeeping). |
| **Consequences Of Violation** | Broken CI configuration can reach main without validation; subsequent PRs are blocked. |

## Rule 5: Run Full CI on a Nightly Schedule
| Field | Value |
|-------|-------|
| **Name** | Run Full CI on a Nightly Schedule |
| **Category** | CI & Safety |
| **Rule** | Schedule a nightly full CI run regardless of path changes. This catches cross-boundary regressions that path-filtered per-PR runs miss. |
| **Reason** | Path filters on PRs are a speed optimization, not a coverage strategy. A frontend change breaking a backend contract won't be caught by a path-filtered frontend CI run. Nightly full CI runs catch these cross-boundary issues. If nightly CI fails, the team investigates and fixes before the issues compound. |
| **Bad Example** | Only path-filtered per-PR CI — frontend change breaks backend tests; discovered only during deployment. |
| **Good Example** | Per-PR: path-filtered. Nightly: full suite on `cron: '0 3 * * *'`. Nightly failure triggers investigation. |
| **Exceptions** | Projects so small that path filters are unnecessary (full CI completes in <5 minutes). |
| **Consequences Of Violation** | Cross-boundary regressions go undetected until deployment. |

## Rule 6: Use Job-Level Conditions for Deployment Workflows
| Field | Value |
|-------|-------|
| **Name** | Use Job-Level Conditions for Deployment Workflows |
| **Category** | CI & Safety |
| **Rule** | Apply path filters to deployment jobs within the main CI workflow using `if:` conditions. Never trigger deployment from a separate workflow without path checking. |
| **Reason** | Deployment should only run when deployable code changes (app code, config, views). A README-only change on main should not trigger deployment. Job-level conditions keep deployment logic in the main workflow while preventing unnecessary deployments that waste infrastructure resources and introduce unnecessary risk. |
| **Bad Example** | Deployment runs on every push to main — deploying 10 times a day for documentation and config-only changes. |
| **Good Example** | Deploy job: `if: contains(github.event.head_commit.modified, 'app/') || contains(github.event.head_commit.modified, 'config/')` — deploys only when relevant code changes. |
| **Exceptions** | Projects where every commit to main must be deployed (continuous deployment). |
| **Consequences Of Violation** | Unnecessary deployments; wasted infrastructure resources; increased deployment risk. |
