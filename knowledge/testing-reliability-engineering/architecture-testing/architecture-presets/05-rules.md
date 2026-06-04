# Rules — Architecture Presets

## Rule 1: Always Combine Presets with Project-Specific Rules
| Field | Value |
|-------|-------|
| **Name** | Always Combine Presets with Project-Specific Rules |
| **Category** | Testing Strategy |
| **Rule** | Always add project-specific architectural expectations on top of built-in presets. Never rely solely on presets for architectural enforcement. |
| **Reason** | Presets cover generic patterns only (debug functions, PHP compatibility, typing). Domain-specific conventions (service interfaces, repository patterns, aggregate boundaries) require custom expectations. Presets are the foundation; custom rules enforce team-specific architecture. |
| **Bad Example** | `arch()->preset()->security()` — only generic security rules, no domain-specific enforcement. |
| **Good Example** | `arch()->preset()->security()->expect('App\Services')->toImplement('App\Contracts\ServiceInterface')`. |
| **Exceptions** | Projects so small that no domain-specific architectural conventions exist yet. |
| **Consequences Of Violation** | Architectural drift in domain-specific conventions; custom rules never codified as tests. |

## Rule 2: Start with `security` + `laravel` Presets for New Projects
| Field | Value |
|-------|-------|
| **Name** | Start with `security` + `laravel` Presets for New Projects |
| **Category** | Adoption Strategy |
| **Rule** | For new Laravel projects, start with `arch()->preset()->security()->preset()->laravel()`. Add `strict` preset gradually as the team matures. |
| **Reason** | The `security` preset catches debug functions (`dd`, `dump`, `var_dump`, `ray`) and dangerous functions (`eval`, `exec`). The `laravel` preset enforces Laravel conventions. Both cover high-impact violations without being overly restrictive. Adding `strict` later avoids overwhelming developers with typing requirements early on. |
| **Bad Example** | Applying `strict` preset to a brand-new project before the team has established coding conventions — developers fight typing rules instead of building features. |
| **Good Example** | `arch()->preset()->security()->preset()->laravel()` — catches the most impactful violations immediately. |
| **Exceptions** | Teams experienced with strict typing that prefer `strict` from day one. |
| **Consequences Of Violation** | Missing debug function detection in production code; architectural violations grow unnoticed. |

## Rule 3: Use `targeting()` for Progressive Adoption on Existing Projects
| Field | Value |
|-------|-------|
| **Name** | Use `targeting()` for Progressive Adoption on Existing Projects |
| **Category** | Adoption Strategy |
| **Rule** | Apply strict presets only to new code directories on existing projects using `targeting()`. Use `relaxed` preset or no preset for legacy paths. |
| **Reason** | Applying `strict` to an entire legacy codebase generates thousands of violations, making architectural tests noise that developers ignore. Progressive adoption allows teams to focus on preventing new violations while gradually migrating legacy code. |
| **Bad Example** | `arch()->preset()->strict()` on a 5-year-old codebase — 2000+ violations; test is never read, never fixed. |
| **Good Example** | `arch()->preset()->strict()->targeting('app/Modules')` — catches violations in new code only. |
| **Exceptions** | Projects with zero legacy code or where management has committed to a full rewrite. |
| **Consequences Of Violation** | Architectural test becomes ignored noise; team loses trust in architecture enforcement. |

## Rule 4: Read Preset Source Before Combining Presets
| Field | Value |
|-------|-------|
| **Name** | Read Preset Source Before Combining Presets |
| **Category** | Configuration & Understanding |
| **Rule** | Review the source code of each preset in `vendor/pestphp/pest/src/ArchPresets/` before combining them. Know which rules each preset enforces. |
| **Reason** | Presets may overlap or have conflicting rules. Combining presets without understanding their coverage can create duplicate expectations, conflicting rules, or enforcement gaps. Reading the source reveals exactly what each preset covers. |
| **Bad Example** | Combining `security` + `laravel` + `php` + `strict` + `relaxed` without knowing what each does — conflicting rules cause unpredictable failures. |
| **Good Example** | Reading `Security.php` preset source: "This blocks `dd`, `dump`, `var_dump`, `ray`, `eval`, `exec`..." — then combining only needed presets. |
| **Exceptions** | Teams that have extensively tested preset combinations and documented the interactions. |
| **Consequences Of Violation** | Duplicate custom rules; conflicting expectations; unexpected CI failures from unknown preset rules. |

## Rule 5: Maintain a Baseline File for Known Violations
| Field | Value |
|-------|-------|
| **Name** | Maintain a Baseline File for Known Violations |
| **Category** | Maintenance & Strategy |
| **Rule** | Use Pest's arch() baseline feature to suppress known architectural violations. Commit the baseline to the repository and review it quarterly. |
| **Reason** | Without a baseline, existing violations cause all presets to fail on legacy codebases. The baseline documents known issues and tracks progress as they're fixed. Quarterly review ensures the baseline shrinks and doesn't become a permanent exemption list. |
| **Bad Example** | No baseline — every existing violation blocks CI, so the team disables arch tests entirely. |
| **Good Example** | Generate baseline: `./vendor/bin/pest --arch --generate-baseline`; commit; review quarterly. |
| **Exceptions** | Greenfield projects with no existing violations. |
| **Consequences Of Violation** | Architectural tests cannot be adopted on existing projects; violations accumulate without tracking. |

## Rule 6: Run Architecture Presets in CI Lint Stage, Not Test Stage
| Field | Value |
|-------|-------|
| **Name** | Run Architecture Presets in CI Lint Stage, Not Test Stage |
| **Category** | CI & Pipeline |
| **Rule** | Run architecture preset tests in the lint/static analysis stage of CI, not in the test stage. They should execute before feature tests. |
| **Reason** | Architecture tests run in milliseconds, have no database dependency, and fail fast (seconds). Running them in the lint stage provides instant feedback without waiting for test infrastructure (database, cache, migrations). |
| **Bad Example** | Including arch tests in the same `php artisan test` command as feature tests — arch violations discovered only after database setup and migration. |
| **Good Example** | Separate CI job: `run: ./vendor/bin/pest --arch` — completes in 1-2 seconds, fails fast. |
| **Exceptions** | CI pipelines where adding a separate job adds unacceptable orchestration complexity. |
| **Consequences Of Violation** | Slow feedback on architectural violations; unnecessary database setup for non-database tests. |
