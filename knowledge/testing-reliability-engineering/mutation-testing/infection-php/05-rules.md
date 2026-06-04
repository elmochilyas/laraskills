# Rules — Infection PHP Mutation Testing

## Rule 1: Use Differential Mutation for CI Gates, Full Mutation for Nightly
| Field | Value |
|-------|-------|
| **Name** | Use Differential Mutation for CI Gates, Full Mutation for Nightly |
| **Category** | CI & Strategy |
| **Rule** | Use `vendor/bin/infection --git-diff-filter=AM` for per-PR CI gates. Run full mutation runs (without `--git-diff-filter`) on a nightly or pre-release schedule. |
| **Reason** | Full mutation runs take 10-60 minutes, far too slow for per-PR feedback. Differential mutation only mutates lines changed in the PR, completing in 1-5 minutes. Both are needed: differential for rapid feedback on new code, full for comprehensive quality assessment before releases. |
| **Bad Example** | Running `vendor/bin/infection --min-msi=70` on every PR — 30-minute CI delay for a one-line documentation fix. |
| **Good Example** | PR: `vendor/bin/infection --git-diff-filter=AM --min-msi=80`. Nightly: `vendor/bin/infection --min-msi=70 --min-covered-msi=80`. |
| **Exceptions** | Projects with very small test suites where full mutation completes in <5 minutes. |
| **Consequences Of Violation** | Slow CI pipeline; developers avoid mutation testing; mutation is run rarely or never. |

## Rule 2: Always Use Coverage Optimization
| Field | Value |
|-------|-------|
| **Name** | Always Use Coverage Optimization |
| **Category** | Performance |
| **Rule** | Always run initial coverage collection so Infection uses coverage-guided mutation. Never run Infection without coverage optimization. |
| **Reason** | Without coverage optimization, Infection runs the full test suite for every single mutation. With coverage optimization, Infection only executes tests covering the mutated line — a 10x-50x speedup. Coverage collection adds marginal overhead but makes mutation testing practical. |
| **Bad Example** | `vendor/bin/infection --threads=4` without coverage — runs full suite for each mutation, takes hours. |
| **Good Example** | `vendor/bin/infection --coverage --threads=4` — coverage is collected first, then mutations only run relevant tests. |
| **Exceptions** | None. Coverage optimization is always beneficial. |
| **Consequences Of Violation** | Mutation testing is impractically slow; developers abandon it. |

## Rule 3: Set Achievable MSI Targets — Start at 60-70%
| Field | Value |
|-------|-------|
| **Name** | Set Achievable MSI Targets — Start at 60-70% |
| **Category** | Thresholds & Strategy |
| **Rule** | Set `--min-msi=60` or `--min-msi=70` for initial adoption. Never set `--min-msi=100`. Target 80%+ for critical paths (billing, auth). |
| **Reason** | 100% MSI is practically impossible and encourages gaming the score. A realistic 60-70% target that the team can achieve is better than an unrealistic 100% target that gets ignored. Gradually increase as test quality improves. |
| **Bad Example** | `vendor/bin/infection --min-msi=100` — impossible target; team ignores MSI entirely. |
| **Good Example** | `vendor/bin/infection --min-msi=70 --min-covered-msi=80` — achievable targets with room to grow. |
| **Exceptions** | Projects with extremely high test quality and CI discipline to maintain 90%+ MSI. |
| **Consequences Of Violation** | Team ignores mutation testing; MSI becomes meaningless. |

## Rule 4: Use Infection Baseline for Known Acceptable Survivors
| Field | Value |
|-------|-------|
| **Name** | Use Infection Baseline for Known Acceptable Survivors |
| **Category** | Maintenance & Strategy |
| **Rule** | Generate an Infection baseline with `--generate-baseline` to suppress known acceptable survivors (semantically equivalent mutations). Commit the baseline and review quarterly. |
| **Reason** | Some mutations produce code that is semantically equivalent to the original (e.g., flipping a boolean that has no effect on the outcome). These survivors are noise. A baseline suppresses known acceptable survivors so the team can focus on genuine test gaps. |
| **Bad Example** | No baseline — 20% of survivors are equivalent mutations; team spends time reviewing noise. |
| **Good Example** | `vendor/bin/infection --generate-baseline` after review; baseline committed; focus on genuine survivors. |
| **Exceptions** | Projects where equivalent mutations are rare and the team reviews all survivors. |
| **Consequences Of Violation** | Noise from equivalent mutations obscures genuine test gaps; reduces team engagement with mutation reports. |

## Rule 5: Set Per-Module MSI Targets
| Field | Value |
|-------|-------|
| **Name** | Set Per-Module MSI Targets |
| **Category** | Thresholds & Strategy |
| **Rule** | Configure different MSI targets for different code modules. Critical paths (billing, authentication, authorization) should target 80%+ MSI. Utility modules may accept 50%+. |
| **Reason** | All code is not equally important. A surviving mutation in the auth module is a security risk. A surviving mutation in a utility helper may be acceptable. Variable targets focus improvement effort on the most impactful areas. |
| **Bad Example** | Single 70% MSI target for the entire codebase — auth module at 50% is overlooked. |
| **Good Example** | Billing module: 85% MSI target. Utility module: 50% MSI target. Auth: 90% MSI target. |
| **Exceptions** | Small codebases where module-level configuration adds unnecessary complexity. |
| **Consequences Of Violation** | Critical code paths may have poor test quality while average looks acceptable. |

## Rule 6: Review Surviving Mutations as a Team
| Field | Value |
|-------|-------|
| **Name** | Review Surviving Mutations as a Team |
| **Category** | Process & Culture |
| **Rule** | Schedule regular team reviews of surviving mutations from the latest full mutation run. Review the HTML or JSON output report. |
| **Reason** | Each surviving mutation represents a behavior change that no test detects. Team review determines whether the gap needs a test or the mutation is acceptable. Without review, mutation testing is a metric without action. |
| **Bad Example** | Running mutation, checking MSI ≥ 70%, and never opening the report — survivors go unaddressed. |
| **Good Example** | Monthly team review of `infection.html` — categorize survivors as "needs test" or "acceptable." |
| **Exceptions** | Teams that integrate survivor review into the PR process (addressing survivors as they're introduced). |
| **Consequences Of Violation** | Untested behavior accumulates; mutation testing becomes a vanity metric. |
