# Rules — Coverage Reporting & Enforcement

## Rule 1: Use pcov, Never Xdebug, for CI Coverage
| Field | Value |
|-------|-------|
| **Name** | Use pcov, Never Xdebug, for CI Coverage |
| **Category** | Performance |
| **Rule** | Use pcov (not Xdebug) for code coverage computation in CI. Install pcov via `shivammathur/setup-php` with `coverage: pcov`. Reserve Xdebug for local step debugging. |
| **Reason** | pcov adds 20-40% overhead to test time vs Xdebug's 200-500%. For a 5-minute test suite, pcov adds 1-2 minutes while Xdebug adds 10-25 minutes. pcov is purpose-built for coverage and has no debugging features, making it significantly faster. |
| **Bad Example** | Using Xdebug for CI coverage — 10-minute test suite becomes 40 minutes; CI pipeline is unbearably slow. |
| **Good Example** | GitHub Actions step: `uses: shivammathur/setup-php@v2 with: { coverage: pcov }` — 5-minute suite becomes 6.5 minutes. |
| **Exceptions** | Projects that also need step debugging in CI (rare). |
| **Consequences Of Violation** | Unnecessarily slow CI pipeline; wasted runner minutes. |

## Rule 2: Set `--min` at 70-80%, Never 100%
| Field | Value |
|-------|-------|
| **Name** | Set `--min` at 70-80%, Never 100% |
| **Category** | Thresholds & Strategy |
| **Rule** | Set the coverage minimum threshold to 70-80%. Never set `--min=100`. Target 90%+ only for critical paths (payments, auth). |
| **Reason** | 100% coverage is impractical and encourages "assertion-free" tests that run code but verify nothing. Tests for getters, setters, and generated code inflate coverage numbers without improving quality. 80% is a realistic, maintainable target that focuses on meaningful behavior coverage. |
| **Bad Example** | `--min=100` — developers write `test_getName_returns_name() { $this->assertEquals('name', $user->getName()); }` to inflate coverage. |
| **Good Example** | `--min=80` — focuses on business logic coverage; 100% is not expected for generated code or trivial methods. |
| **Exceptions** | Security-critical libraries where every line must be covered (contractual requirement). |
| **Consequences Of Violation** | Test quality suffers; coverage becomes a vanity metric; assertion-free tests multiply. |

## Rule 3: Run Coverage Only in CI, Never Locally During TDD
| Field | Value |
|-------|-------|
| **Name** | Run Coverage Only in CI, Never Locally During TDD |
| **Category** | Workflow & Performance |
| **Rule** | Compute coverage only in CI. Do not run coverage during local test-driven development. |
| **Reason** | Coverage adds 20-40% overhead to test execution. During TDD, tests run frequently (every few seconds). Coverage overhead would slow the development loop significantly. Trust the CI gate to enforce coverage — local feedback focuses on test correctness, not metrics. |
| **Bad Example** | Running `php artisan test --coverage` during TDD — every test run takes 40% longer; development flow is disrupted. |
| **Good Example** | Local: `php artisan test` (fast). CI: `php artisan test --coverage --min=80` (gate enforcement). |
| **Exceptions** | Debugging coverage gaps where local coverage data helps identify untested code. |
| **Consequences Of Violation** | Slower TDD loop; developers are less likely to run tests frequently. |

## Rule 4: Combine Coverage with Mutation Testing for Quality Insight
| Field | Value |
|-------|-------|
| **Name** | Combine Coverage with Mutation Testing for Quality Insight |
| **Category** | Quality Strategy |
| **Rule** | Use coverage (`--min`) in conjunction with mutation testing (`--mutate --min`). Never rely on coverage as the sole quality metric. |
| **Reason** | Coverage measures what code was executed, not whether the assertions verified correctness. High coverage (90%) with low mutation score (40%) means tests run code but don't verify behavior. Mutation testing reveals assertion quality gaps that coverage alone cannot. |
| **Bad Example** | `--min=80` passes but mutation score is 35% — tests run code but don't verify correctness; bugs still reach production. |
| **Good Example** | `--min=80` AND `--mutate --min=70` — code is both executed and behavior is verified. |
| **Exceptions** | Projects just starting quality improvement — establish coverage first, add mutation later. |
| **Consequences Of Violation** | High coverage with weak assertions; bugs slip through despite "good" coverage numbers. |

## Rule 5: Use Baseline for Existing Projects — Raise Threshold Gradually
| Field | Value |
|-------|-------|
| **Name** | Use Baseline for Existing Projects — Raise Threshold Gradually |
| **Category** | Adoption Strategy |
| **Rule** | Compute current coverage on existing projects first. Set `--min` at the current baseline or slightly below. Raise the threshold by 5% per quarter. |
| **Reason** | Setting `--min=80` on a project with 40% coverage causes CI to fail permanently — every single run fails. This encourages the team to disable coverage enforcement entirely. Gradual, achievable targets improve coverage sustainably. |
| **Bad Example** | "Our new policy is 80% coverage" — project at 40%; CI fails on every commit; team disables `--min`. |
| **Good Example** | "Current coverage is 40%. Set `--min=40` this quarter. Raise to 45% next quarter." — sustainable improvement. |
| **Exceptions** | Greenfield projects where 80% is achievable from day one. |
| **Consequences Of Violation** | Coverage enforcement is disabled; no improvement happens. |

## Rule 6: Store Coverage Reports as CI Artifacts
| Field | Value |
|-------|-------|
| **Name** | Store Coverage Reports as CI Artifacts |
| **Category** | Observability & Analysis |
| **Rule** | Generate HTML or Clover coverage reports in CI and upload them as artifacts. Set a retention policy of 30 days. Never expose coverage reports publicly. |
| **Reason** | Coverage reports reveal which code is untested, enabling targeted test improvement. Stored as CI artifacts, they're accessible to the team for review. Public exposure of coverage data reveals code structure and execution paths — a security concern. |
| **Bad Example** | Running `--coverage --min=80` in CI without generating a report — team sees only the pass/fail, not which code is uncovered. |
| **Good Example** | `--coverage-html=coverage-report` → upload as CI artifact with 30-day retention → team reviews uncovered code. |
| **Exceptions** | Projects where compliance requires public coverage reporting (some open-source projects). |
| **Consequences Of Violation** | Team lacks visibility into which code is untested; cannot prioritize test improvement. |
